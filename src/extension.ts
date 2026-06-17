import * as vscode from 'vscode';
import { TerminalHistoryProvider, CommandHistoryItem } from './terminalHistoryProvider.js';
import { 
    detectSensitiveData, 
    redactSensitiveData, 
    isExcludedCommand, 
    handleSensitiveCommand,
    shouldRedactOrBlock,
    loadConfigFromVSCode,
    getSecurityConfig,
    setSecurityConfig
} from './security.js';
import { registerPrivacyCommands } from './privacyCommands.js';

let currentHistoryProvider: TerminalHistoryProvider | undefined;

export function activate(context: vscode.ExtensionContext) {
    // Load security config from vscode settings
    loadConfigFromVSCode();
    
    // Listen for config changes
    vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('terminalHistory.security')) {
            loadConfigFromVSCode();
        }
    });
    
    initializeExtension(context);
}

function initializeExtension(context: vscode.ExtensionContext) {
    if (currentHistoryProvider) {
        currentHistoryProvider.clearHistory();
    }
    
    currentHistoryProvider = new TerminalHistoryProvider(context);
    
    const treeView = vscode.window.createTreeView('terminalHistoryOutline', {
        treeDataProvider: currentHistoryProvider,
        showCollapseAll: true
    });
    
    context.subscriptions.push(treeView);
    
    // Register commands
    const clearCommand = vscode.commands.registerCommand('terminalHistory.clear', () => {
        if (currentHistoryProvider) {
            currentHistoryProvider.clearHistory();
            vscode.window.showInformationMessage('Terminal history cleared');
        }
    });
    
    const rerunCommand = vscode.commands.registerCommand('terminalHistory.rerun', (item: CommandHistoryItem) => {
        const terminal = vscode.window.createTerminal(`History: ${item.commandText.substring(0, 30)}`);
        terminal.show();
        terminal.sendText(item.commandText);
    });
    
    const copyOutputCommand = vscode.commands.registerCommand('terminalHistory.copyOutput', (args: { output: string, command: string }) => {
        if (args.output) {
            vscode.env.clipboard.writeText(args.output);
            vscode.window.showInformationMessage('Command output copied to clipboard');
        } else {
            vscode.window.showWarningMessage('No output captured for this command');
        }
    });
    
    context.subscriptions.push(clearCommand, rerunCommand, copyOutputCommand);
    
    // Register privacy commands
    if (currentHistoryProvider) {
        registerPrivacyCommands(context, currentHistoryProvider);
    }
    
    // Listen for terminal commands and capture output with security checks
    const startDisposable = vscode.window.onDidStartTerminalShellExecution((event) => {
        let commandLine = event.execution.commandLine.value;
        const terminalName = event.terminal.name;
        const timestamp = new Date();
        
        // Clean the command
        commandLine = commandLine.replace(/ --color=auto/g, '');
        commandLine = commandLine.replace(/ --color/g, '');
        
        // SECURITY: Check if command should be excluded
        if (isExcludedCommand(commandLine)) {
            vscode.window.showInformationMessage(`🔒 Command excluded by security settings: ${commandLine.substring(0, 50)}...`);
            return;
        }
        
        // SECURITY: Check for sensitive data
        const sensitivePatterns = detectSensitiveData(commandLine);
        const config = getSecurityConfig();
        
        // Handle sensitive data based on configuration
        let processedCommand = commandLine;
        let shouldSave = true;
        
        // If there are sensitive patterns and detection is enabled
        if (sensitivePatterns.length > 0 && config.detectionEnabled) {
            // First check if we should automatically handle it
            const autoResult = shouldRedactOrBlock(commandLine);
            
            if (autoResult.action === 'block') {
                vscode.window.showWarningMessage(`🔒 Command blocked: ${autoResult.reason}`);
                return;
            } else if (autoResult.action === 'redact') {
                processedCommand = redactSensitiveData(commandLine);
                vscode.window.showInformationMessage(`🔒 Sensitive data redacted from command`);
            } else {
                // User interaction needed - show warning and handle asynchronously
                handleSensitiveCommand(commandLine, sensitivePatterns).then((action) => {
                    if (action === 'block') {
                        shouldSave = false;
                        vscode.window.showWarningMessage('🔒 Command blocked by user');
                        return;
                    } else if (action === 'redact') {
                        processedCommand = redactSensitiveData(commandLine);
                        vscode.window.showInformationMessage('🔒 Sensitive data redacted from command');
                        // Update the command in history if it was already added
                        if (currentHistoryProvider) {
                            const history = currentHistoryProvider.getHistory();
                            const latestItem = history.find(item => 
                                item.commandText === commandLine && 
                                item.exitCode === null
                            );
                            if (latestItem) {
                                // We need to recreate the item with the redacted command
                                const newItem = new CommandHistoryItem(
                                    processedCommand,
                                    latestItem.terminalName,
                                    latestItem.timestamp,
                                    latestItem.cwd,
                                    latestItem.output,
                                    latestItem.exitCode
                                );
                                currentHistoryProvider.updateCommand(newItem);
                            }
                        }
                    }
                    // 'proceed' - save as-is
                });
            }
        }
        
        // Only proceed if not blocked
        if (!shouldSave) {
            return;
        }
        
        // Get working directory
        let cwd = '';
        try {
            const shellIntegration = event.terminal as any;
            if (shellIntegration.shellIntegration && shellIntegration.shellIntegration.cwd) {
                cwd = shellIntegration.shellIntegration.cwd.fsPath;
            }
        } catch (error) {
            // CWD not available
        }
        
        // Create history item with processed command
        const historyItem = new CommandHistoryItem(processedCommand, terminalName, timestamp, cwd);
        
        if (currentHistoryProvider) {
            currentHistoryProvider.addCommand(historyItem);
        }
        
        // Capture output asynchronously
        const outputPromise = new Promise<string>(async (resolve) => {
            let output = '';
            try {
                for await (const data of event.execution.read()) {
                    output += data;
                }
                resolve(output);
            } catch (error) {
                resolve(`[Error capturing output: ${error}]`);
            }
        });
        
        outputPromise.then((fullOutput) => {
            historyItem.output = fullOutput;
            
            const hasError = /error|fail|exception|not found|permission denied|No such file|command not found|EACCES|ENOENT/i.test(fullOutput);
            historyItem.exitCode = hasError ? 1 : 0;
            
            if (currentHistoryProvider) {
                currentHistoryProvider.updateCommand(historyItem);
            }
        });
    });
    
    context.subscriptions.push(startDisposable);
    
    // Status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    const updateStatusBar = () => {
        if (currentHistoryProvider) {
            statusBarItem.text = `$(history) ${currentHistoryProvider.getCommandCount()}`;
        }
    };
    statusBarItem.tooltip = 'Terminal History Outline';
    statusBarItem.show();
    updateStatusBar();
    context.subscriptions.push(statusBarItem);
    
    if (currentHistoryProvider) {
        currentHistoryProvider.onDidChangeTreeData(updateStatusBar);
    }
}

export function deactivate() {}