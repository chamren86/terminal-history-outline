/**
 * @file extension.ts
 * @description Main entry point for the Terminal History Outline VS Code extension.
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
    ERROR_DETECTION_PATTERNS,
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
    
    // === v0.5.0 Commands ===
    
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
    
    const copyCommand = vscode.commands.registerCommand('terminalHistory.copyCommand', async (item: CommandHistoryItem) => {
        if (!item || !item.commandText) {
            vscode.window.showWarningMessage('No command to copy');
            return;
        }
        
        try {
            await vscode.env.clipboard.writeText(item.commandText);
            const preview = item.commandText.length > 50 
                ? item.commandText.substring(0, 50) + '...' 
                : item.commandText;
            vscode.window.showInformationMessage(`✓ Command copied: ${preview}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to copy command: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });
    
    const copyOutputCommand = vscode.commands.registerCommand('terminalHistory.copyOutput', (args: { output: string, command: string }) => {
        if (args.output) {
            vscode.env.clipboard.writeText(args.output);
            vscode.window.showInformationMessage('Command output copied to clipboard');
        } else {
            vscode.window.showWarningMessage('No output captured for this command');
        }
    });

    // Register copy command and output
    const copyCommandAndOutput = vscode.commands.registerCommand(
        'terminalHistory.copyCommandAndOutput',
        async (item: CommandHistoryItem) => {
            if (!item) {
                vscode.window.showWarningMessage('No command to copy');
                return;
            }
            
            try {
                const commandText = item.commandText || '';
                const outputText = item.output || '(no output captured)';
                const combinedText = `Command: ${commandText}\n\nOutput:\n${outputText}`;
                
                await vscode.env.clipboard.writeText(combinedText);
                
                const preview = combinedText.length > 100 
                    ? combinedText.substring(0, 100) + '...' 
                    : combinedText;
                vscode.window.showInformationMessage(`✓ Command & output copied: ${preview}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to copy: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    );
    
    const deleteEntryCommand = vscode.commands.registerCommand('terminalHistory.deleteEntry', async (item: CommandHistoryItem) => {
        if (!item || !currentHistoryProvider) {
            return;
        }
        
        const confirmation = await vscode.window.showWarningMessage(
            `Delete command: "${item.commandText}"?`,
            { modal: true },
            'Delete',
            'Cancel'
        );
        
        if (confirmation === 'Delete') {
            currentHistoryProvider.deleteEntry(item);
            vscode.window.showInformationMessage('Command deleted from history');
        }
    });
    
    const searchCommand = vscode.commands.registerCommand('terminalHistory.searchHistory', async () => {
        if (!currentHistoryProvider) {
            return;
        }
        
        const query = await vscode.window.showInputBox({
            prompt: 'Search terminal history',
            placeHolder: 'Type to filter commands...',
            ignoreFocusOut: true,
            value: ''
        });
        
        if (query !== undefined) {
            currentHistoryProvider.setFilter(query);
        }
    });
    
    context.subscriptions.push(
        clearCommand, 
        rerunCommand, 
        copyCommand, 
        copyOutputCommand,
        copyCommandAndOutput,
        deleteEntryCommand,
        searchCommand
    );
    
    if (currentHistoryProvider) {
        registerPrivacyCommands(context, currentHistoryProvider);
    }
    
    const startDisposable = vscode.window.onDidStartTerminalShellExecution((event) => {
        let commandLine = event.execution.commandLine.value;
        const terminalName = event.terminal.name;
        const timestamp = new Date();
        
        for (const pattern of COMMAND_CLEAN_PATTERNS) {
            commandLine = commandLine.replace(pattern, '');
        }
        
        if (isExcludedCommand(commandLine)) {
            return;
        }
        
        const sensitivePatterns = detectSensitiveData(commandLine);
        const config = getSecurityConfig();
        let processedCommand = commandLine;
        let shouldSave = true;
        
        if (sensitivePatterns.length > 0 && config.detectionEnabled) {
            const autoResult = shouldRedactOrBlock(commandLine);
            if (autoResult.action === RedactionAction.BLOCK) {
                return;
            } else if (autoResult.action === RedactionAction.REDACT) {
                processedCommand = redactSensitiveData(commandLine);
            } else {
                handleSensitiveCommand(commandLine, sensitivePatterns).then((action) => {
                    if (action === RedactionAction.BLOCK) {
                        shouldSave = false;
                        return;
                    } else if (action === RedactionAction.REDACT) {
                        processedCommand = redactSensitiveData(commandLine);
                    }
                });
            }
        }
        
        if (!shouldSave) {
            return;
        }
        
        let cwd = '';
        try {
            const shellIntegration = event.terminal as any;
            if (shellIntegration.shellIntegration && shellIntegration.shellIntegration.cwd) {
                cwd = shellIntegration.shellIntegration.cwd.fsPath;
            }
        } catch (error) {
            // CWD not available
        }
        
        const historyItem = new CommandHistoryItem(processedCommand, terminalName, timestamp, cwd);
        
        if (currentHistoryProvider) {
            currentHistoryProvider.addCommand(historyItem);
        }
        
        const outputPromise = new Promise<string>(async (resolve) => {
            let output = '';
            try {
                for await (const data of event.execution.read()) {
                    output += data;
                }
                resolve(output);
            } catch (error) {
                resolve(output || `[Error capturing output: ${error}]`);
            }
        });
        
        outputPromise.then((fullOutput) => {
            historyItem.output = fullOutput;
            
            let exitCode: number | null = null;
            try {
                const terminalAny = event.terminal as any;
                if (terminalAny.exitStatus !== undefined && terminalAny.exitStatus !== null) {
                    exitCode = terminalAny.exitStatus;
                }
            } catch (e) {
                // Ignore
            }
            
            if (exitCode === null) {
                const errorRegex = new RegExp(ERROR_DETECTION_PATTERNS.join('|'), 'i');
                exitCode = errorRegex.test(fullOutput) ? 1 : 0;
            }
            
            historyItem.exitCode = exitCode;
            
            if (currentHistoryProvider) {
                currentHistoryProvider.updateCommand(historyItem);
            }
        });
    });
    
    context.subscriptions.push(startDisposable);
    
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