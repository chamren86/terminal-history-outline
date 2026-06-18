/**
 * @file extension.ts
 * @description Main entry point for the Terminal History Outline VS Code extension.
 * 
 * This file handles:
 * - Extension activation and deactivation lifecycle management
 * - Registration of VS Code commands (clear, rerun, copy output, privacy dashboard)
 * - Terminal command capture using VS Code's Shell Integration API
 * - Security checks for sensitive data in commands
 * - Status bar integration showing command count
 * - Privacy dashboard command registration
 * 
 * @module extension
 */

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
    createErrorRegex,
    CONTEXT_VALUES,
    VIEW_IDS,
    STATUS_BAR_ICON,
    STATUS_BAR,
    MAX_COMMAND_DISPLAY_LENGTH,
    RERUN_TERMINAL_PREFIX
} from './constants/index.js';

let currentHistoryProvider: TerminalHistoryProvider | undefined;

/**
 * Called when the extension is activated by VS Code.
 * 
 * @param context - The VS Code extension context that provides lifecycle management.
 * 
 * @returns {void}
 * 
 * @description
 * This function:
 * 1. Loads security configuration from VS Code settings
 * 2. Listens for configuration changes to reload security settings
 * 3. Initializes the extension components
 */
export function activate(context: vscode.ExtensionContext) {
    loadConfigFromVSCode();
    
    vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('terminalHistory.security')) {
            loadConfigFromVSCode();
        }
    });
    
    initializeExtension(context);
}

/**
 * Initializes the extension by setting up all components and subscriptions.
 * 
 * @param context - The VS Code extension context for registering subscriptions.
 * 
 * @returns {void}
 */
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
    
    // Listen for terminal commands and capture output with security checks
    const startDisposable = vscode.window.onDidStartTerminalShellExecution((event) => {
        let commandLine = event.execution.commandLine.value;
        const terminalName = event.terminal.name;
        const timestamp = new Date();
        
        // Clean the command using constants
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
            
            // Use the error detection regex from constants
            const hasError = createErrorRegex().test(fullOutput);
            historyItem.exitCode = hasError ? 1 : 0;
            
            if (currentHistoryProvider) {
                currentHistoryProvider.updateCommand(historyItem);
            }
        });
    });
    
    context.subscriptions.push(startDisposable);
    
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