import * as vscode from 'vscode';
import { TerminalHistoryProvider, CommandHistoryItem } from './terminalHistoryProvider.js';
import { 
    detectSensitiveData, 
    redactSensitiveData, 
    isExcludedCommand, 
    handleSensitiveCommand,
    shouldRedactOrBlock,
    loadConfigFromVSCode,
    getSecurityConfig
} from './security.js';
import { registerPrivacyCommands } from './privacyCommands.js';
import { RedactionAction } from './enums/index.js';
import {
    COMMAND_CLEAN_PATTERNS,
    CONTEXT_VALUES,
    VIEW_IDS,
    STATUS_BAR_ICON,
    STATUS_BAR,
    MAX_COMMAND_DISPLAY_LENGTH,
    RERUN_TERMINAL_PREFIX
} from './constants/index.js';

let currentHistoryProvider: TerminalHistoryProvider | undefined;

export function activate(context: vscode.ExtensionContext) {
    loadConfigFromVSCode();
    
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
    
    const treeView = vscode.window.createTreeView(VIEW_IDS.TERMINAL_HISTORY, {
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
        const terminal = vscode.window.createTerminal(`${RERUN_TERMINAL_PREFIX}${item.commandText.substring(0, MAX_COMMAND_DISPLAY_LENGTH)}`);
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
    
    // Store running commands to match with exit codes
    const runningCommands = new Map<string, CommandHistoryItem>();
    
    // Listen for command start to capture output
    const startDisposable = vscode.window.onDidStartTerminalShellExecution((event) => {
        let commandLine = event.execution.commandLine.value;
        const terminalName = event.terminal.name;
        const timestamp = new Date();
        
        // Clean the command
        for (const pattern of COMMAND_CLEAN_PATTERNS) {
            commandLine = commandLine.replace(pattern, '');
        }
        
        // SECURITY: Check if command should be excluded
        if (isExcludedCommand(commandLine)) {
            vscode.window.showInformationMessage(`🔒 Command excluded by security settings: ${commandLine.substring(0, MAX_COMMAND_DISPLAY_LENGTH)}...`);
            return;
        }
        
        // SECURITY: Check for sensitive data
        const sensitivePatterns = detectSensitiveData(commandLine);
        const config = getSecurityConfig();
        
        // Handle sensitive data based on configuration
        let processedCommand = commandLine;
        let shouldSave = true;
        
        if (sensitivePatterns.length > 0 && config.detectionEnabled) {
            const autoResult = shouldRedactOrBlock(commandLine);
            
            if (autoResult.action === RedactionAction.BLOCK) {
                vscode.window.showWarningMessage(`🔒 Command blocked: ${autoResult.reason}`);
                return;
            } else if (autoResult.action === RedactionAction.REDACT) {
                processedCommand = redactSensitiveData(commandLine);
                vscode.window.showInformationMessage(`🔒 Sensitive data redacted from command`);
            } else {
                handleSensitiveCommand(commandLine, sensitivePatterns).then((action) => {
                    if (action === RedactionAction.BLOCK) {
                        shouldSave = false;
                        vscode.window.showWarningMessage('🔒 Command blocked by user');
                        return;
                    } else if (action === RedactionAction.REDACT) {
                        processedCommand = redactSensitiveData(commandLine);
                        vscode.window.showInformationMessage('🔒 Sensitive data redacted from command');
                        if (currentHistoryProvider) {
                            const history = currentHistoryProvider.getHistory();
                            const latestItem = history.find(item => 
                                item.commandText === commandLine && 
                                item.exitCode === null
                            );
                            if (latestItem) {
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
                });
            }
        }
        
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
        
        // Store in running commands map
        const commandId = `${terminalName}-${timestamp.getTime()}`;
        runningCommands.set(commandId, historyItem);
        
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
            if (currentHistoryProvider) {
                currentHistoryProvider.updateCommand(historyItem);
            }
        });
    });
    
    context.subscriptions.push(startDisposable);
    
    // Listen for command end to capture exit codes
    const endDisposable = vscode.window.onDidEndTerminalShellExecution((event) => {
        const commandLine = event.execution.commandLine.value;
        const exitCode = (event.execution as any).exitCode;
        
        console.log(`🏁 Command ended: ${commandLine} with exit code: ${exitCode}`);
        
        if (currentHistoryProvider) {
            const history = currentHistoryProvider.getHistory();
            
            // Find the most recent command with the same name that has null exit code
            const matchingItem = history.find(item => 
                item.commandText === commandLine && 
                item.exitCode === null
            );
            
            if (matchingItem) {
                // If exitCode is undefined, try to infer from output
                if (exitCode === undefined) {
                    // Check if the output contains error indicators
                    const hasError = /error|fail|exception|not found|permission denied|No such file|command not found|EACCES|ENOENT/i.test(matchingItem.output);
                    // Check for success indicators in test output
                    const hasTestSuccess = /passing|✓|ok/.test(matchingItem.output);
                    const hasTestFailure = /failing|✖|not ok/.test(matchingItem.output);
                    
                    if (hasTestSuccess && !hasTestFailure) {
                        // This looks like a test run that passed
                        matchingItem.exitCode = 0;
                    } else if (hasError) {
                        matchingItem.exitCode = 1;
                    } else {
                        // Default to success for commands without errors
                        matchingItem.exitCode = 0;
                    }
                } else {
                    matchingItem.exitCode = exitCode;
                }
                
                currentHistoryProvider.updateCommand(matchingItem);
                console.log(`✅ Updated exit code for ${commandLine} to ${matchingItem.exitCode}`);
            }
        }
    });
    
    context.subscriptions.push(endDisposable);
    
    // Status bar item
    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment[STATUS_BAR.ALIGNMENT],
        STATUS_BAR.PRIORITY
    );
    const updateStatusBar = () => {
        if (currentHistoryProvider) {
            statusBarItem.text = `$(${STATUS_BAR_ICON}) ${currentHistoryProvider.getCommandCount()}`;
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
