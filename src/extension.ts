/**
 * @file extension.ts
 * @description Main entry point for the Terminal History Outline VS Code extension.
 * 
 * This extension captures terminal command history and displays it in a VS Code
 * Explorer view, providing quick access to rerun commands, copy outputs, and
 * manage command history with security features.
 * 
 * @module extension
 * 
 * @version 1.0.0
 * @author chamren86
 * @license MIT
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
    VIEW_IDS,
    STATUS_BAR_ICON,
    STATUS_BAR,
    MAX_COMMAND_DISPLAY_LENGTH,
    RERUN_TERMINAL_PREFIX
} from './constants/index.js';

/**
 * Global reference to the TerminalHistoryProvider instance.
 * Used to access history data from commands and status bar updates.
 */
let currentHistoryProvider: TerminalHistoryProvider | undefined;

/**
 * Called when the extension is activated by VS Code.
 * 
 * This is the entry point for the extension. It sets up the configuration,
 * initializes all components, and registers commands and event listeners.
 * 
 * @param context - The VS Code extension context that provides lifecycle management
 * 
 * @description
 * The activation process:
 * 1. Loads security configuration from VS Code settings
 * 2. Sets up a listener for configuration changes
 * 3. Initializes the main extension components
 */
export function activate(context: vscode.ExtensionContext) {
    // Load security configuration from VS Code settings
    loadConfigFromVSCode();
    
    // Listen for configuration changes to reload security settings
    vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('terminalHistory.security')) {
            loadConfigFromVSCode();
        }
    });
    
    // Initialize the extension
    initializeExtension(context);
}

/**
 * Initializes the extension by setting up all components and subscriptions.
 * 
 * This function creates the main provider, registers all commands, sets up
 * terminal capture, and configures the status bar.
 * 
 * @param context - The VS Code extension context for registering subscriptions
 * 
 * @description
 * The initialization process:
 * 1. Creates the TerminalHistoryProvider and registers the TreeView
 * 2. Registers all VS Code commands (clear, rerun, copy, delete, search, privacy)
 * 3. Sets up terminal command capture with security checks
 * 4. Manages the status bar item showing command count
 * 5. Configures command execution handlers
 * 
 * @see TerminalHistoryProvider
 * @see registerPrivacyCommands
 */
function initializeExtension(context: vscode.ExtensionContext) {
    // Clear any existing history provider
    if (currentHistoryProvider) {
        currentHistoryProvider.clearHistory();
    }
    
    // Create the main provider
    currentHistoryProvider = new TerminalHistoryProvider(context);
    
    // Register the TreeView in the Explorer sidebar
    const treeView = vscode.window.createTreeView(VIEW_IDS.TERMINAL_HISTORY, {
        treeDataProvider: currentHistoryProvider,
        showCollapseAll: true
    });
    context.subscriptions.push(treeView);
    
    /**
     * Clear Terminal History
     * Removes all commands from history after confirmation
     * 
     * Triggered from: View title button
     */
    const clearCommand = vscode.commands.registerCommand('terminalHistory.clear', () => {
        if (currentHistoryProvider) {
            currentHistoryProvider.clearHistory();
            vscode.window.showInformationMessage('Terminal history cleared');
        }
    });
    
    /**
     * Rerun Command
     * Executes the selected command again in a new terminal
     * 
     * Triggered from: Inline button or right-click context menu
     * @param item - The command history item to rerun
     */
    const rerunCommand = vscode.commands.registerCommand('terminalHistory.rerun', (item: CommandHistoryItem) => {
        const terminal = vscode.window.createTerminal(`${RERUN_TERMINAL_PREFIX}${item.commandText.substring(0, MAX_COMMAND_DISPLAY_LENGTH)}`);
        terminal.show();
        terminal.sendText(item.commandText);
    });
    
    /**
     * Copy Command
     * Copies the command text to the system clipboard
     * 
     * Triggered from: Inline button or right-click context menu
     * @param item - The command history item to copy
     */
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
    
    /**
     * Copy Output
     * Copies the command output to the system clipboard
     * 
     * Triggered from: Inline button or right-click context menu
     * @param args - Object containing output and command text
     */
    const copyOutputCommand = vscode.commands.registerCommand('terminalHistory.copyOutput', (args: { output: string, command: string }) => {
        if (args.output) {
            vscode.env.clipboard.writeText(args.output);
            vscode.window.showInformationMessage('Command output copied to clipboard');
        } else {
            vscode.window.showWarningMessage('No output captured for this command');
        }
    });
    
    /**
     * Copy Command & Output
     * Copies both the command and its output to the clipboard
     * 
     * Triggered from: Inline button or right-click context menu
     * @param item - The command history item to copy
     */
    const copyCommandAndOutput = vscode.commands.registerCommand('terminalHistory.copyCommandAndOutput', async (item: CommandHistoryItem) => {
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
    });
    
    /**
     * Delete Entry
     * Removes a single command from history
     * 
     * Triggered from: Inline button or right-click context menu
     * @param item - The command history item to delete
     */
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
    
    /**
     * Search History
     * Opens an input box for filtering the history
     */
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
    
    // Register all commands with the extension context
    context.subscriptions.push(
        clearCommand,
        rerunCommand,
        copyCommand,
        copyOutputCommand,
        copyCommandAndOutput,
        deleteEntryCommand,
        searchCommand
    );
    
    // Register privacy dashboard commands
    if (currentHistoryProvider) {
        registerPrivacyCommands(context, currentHistoryProvider);
    }
    
    /**
     * Listens for terminal command execution events
     * Captures commands, output, and exit codes
     * 
     * Uses VS Code's Shell Integration API for reliable command tracking:
     * - onDidStartTerminalShellExecution: Fires when a command starts
     * - execution.read(): Reads the command output as it streams
     * - terminal.exitStatus: Gets the exit code after command completes
     * 
     * Security features:
     * - Detects and redacts sensitive data (passwords, API keys, tokens)
     * - Excludes commands based on user-configured patterns
     * - Shows warnings for sensitive commands
     */
    const startDisposable = vscode.window.onDidStartTerminalShellExecution((event) => {
        let commandLine = event.execution.commandLine.value;
        const terminalName = event.terminal.name;
        const timestamp = new Date();
        
        // Clean the command by removing common shell flags
        for (const pattern of COMMAND_CLEAN_PATTERNS) {
            commandLine = commandLine.replace(pattern, '');
        }
        
        // SECURITY: Check if command should be excluded by user settings
        if (isExcludedCommand(commandLine)) {
            return;
        }
        
        // SECURITY: Check for sensitive data (passwords, API keys, etc.)
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
                // Handle interactive user prompt for sensitive commands
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
        
        // Get working directory from shell integration
        let cwd = '';
        try {
            const shellIntegration = event.terminal as any;
            if (shellIntegration.shellIntegration && shellIntegration.shellIntegration.cwd) {
                cwd = shellIntegration.shellIntegration.cwd.fsPath;
            }
        } catch (error) {
            // CWD not available - use empty string
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
                resolve(output || `[Error capturing output: ${error}]`);
            }
        });
        
        /**
         * Update the history item with output and exit code
         * 
         * Exit code detection:
         * 1. Try to get exitStatus from the terminal
         * 2. If unavailable, analyze output for error patterns
         * 3. Default to 0 (success) if no errors detected
         */
        outputPromise.then((fullOutput) => {
            historyItem.output = fullOutput;
            
            let exitCode: number | null = null;
            try {
                const terminalAny = event.terminal as any;
                if (terminalAny.exitStatus !== undefined && terminalAny.exitStatus !== null) {
                    exitCode = terminalAny.exitStatus;
                }
            } catch (e) {
                // Ignore - fallback to output analysis
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

    /**
     * Status bar item showing the number of commands in history
     * Updates automatically when history changes
     */
    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment[STATUS_BAR.ALIGNMENT],
        STATUS_BAR.PRIORITY
    );
    
    /**
     * Updates the status bar with the current command count
     */
    const updateStatusBar = () => {
        if (currentHistoryProvider) {
            statusBarItem.text = `$(${STATUS_BAR_ICON}) ${currentHistoryProvider.getCommandCount()}`;
        }
    };
    
    statusBarItem.tooltip = 'Terminal History Outline';
    statusBarItem.show();
    updateStatusBar();
    context.subscriptions.push(statusBarItem);
    
    // Update status bar when tree data changes
    if (currentHistoryProvider) {
        currentHistoryProvider.onDidChangeTreeData(updateStatusBar);
    }
}

/**
 * Called when the extension is deactivated by VS Code.
 * 
 * @returns {void}
 * 
 * @description
 * This function is called when VS Code is shutting down or the extension is being disabled.
 * Cleanup of resources is handled automatically through VS Code's subscription system,
 * so no explicit cleanup is required in this function.
 */
export function deactivate() {}