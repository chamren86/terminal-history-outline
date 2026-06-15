import * as vscode from 'vscode';
import { TerminalHistoryProvider, CommandHistoryItem } from './terminalHistoryProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Terminal History Outline extension is now active!');

    // Create the tree data provider
    const historyProvider = new TerminalHistoryProvider(context);
    
    // Register the tree view
    const treeView = vscode.window.createTreeView('terminalHistoryOutline', {
        treeDataProvider: historyProvider,
        showCollapseAll: true
    });
    
    context.subscriptions.push(treeView);
    
    // Register commands
    const clearCommand = vscode.commands.registerCommand('terminalHistory.clear', () => {
        historyProvider.clearHistory();
        vscode.window.showInformationMessage('Terminal history cleared');
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
    
    // Listen for terminal commands and outputs
    const startDisposable = vscode.window.onDidStartTerminalShellExecution(async (event) => {
        const commandLine = event.execution.commandLine.value;
        const terminalName = event.terminal.name;
        const timestamp = new Date();
        
        // Get current working directory if available
        let cwd = '';
        try {
            const shellIntegration = event.terminal as any;
            if (shellIntegration.shellIntegration && shellIntegration.shellIntegration.cwd) {
                cwd = shellIntegration.shellIntegration.cwd.fsPath;
            }
        } catch (error) {
            // CWD not available
        }
        
        // Create new history item
        const historyItem = new CommandHistoryItem(
            commandLine,
            terminalName,
            timestamp,
            cwd
        );
        
        // Add to provider immediately (shows as running)
        historyProvider.addCommand(historyItem);
        
        // Capture the output
        let fullOutput = '';
        try {
            for await (const data of event.execution.read()) {
                fullOutput += data;
            }
            historyItem.output = fullOutput;
            // Note: exitCode might not be available in all VS Code versions
            if ((event.execution as any).exitCode !== undefined) {
                historyItem.exitCode = (event.execution as any).exitCode;
            }
            historyProvider.updateCommand(historyItem);
        } catch (error) {
            console.error('Failed to capture command output:', error);
            historyItem.output = `[Error capturing output: ${error}]`;
            historyProvider.updateCommand(historyItem);
        }
    });
    
    // Listen for terminal closures to mark sessions as ended
    const closeDisposable = vscode.window.onDidCloseTerminal((terminal) => {
        historyProvider.markTerminalClosed(terminal.name);
    });
    
    context.subscriptions.push(startDisposable, closeDisposable);
    
    // Add status bar item showing command count
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    const updateStatusBar = () => {
        statusBarItem.text = `$(history) ${historyProvider.getCommandCount()}`;
    };
    statusBarItem.tooltip = 'Terminal History Outline';
    statusBarItem.show();
    updateStatusBar();
    context.subscriptions.push(statusBarItem);
    
    // Update status bar when history changes
    historyProvider.onDidChangeTreeData(updateStatusBar);
}

export function deactivate() {}