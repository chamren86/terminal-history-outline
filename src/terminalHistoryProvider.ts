import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// Helper function to strip ANSI escape codes and VS Code control sequences
function cleanTerminalOutput(str: string): string {
    // Remove VS Code Shell Integration sequences
    // These typically look like: ESC ] 633 ; C BEL or ESC ] 633 ; C ESC \
    let cleaned = str.replace(/\u001b\]633;[^\u001b\u0007]*[\u001b\\\u0007]/g, '');
    
    // Remove OSC (Operating System Command) sequences
    cleaned = cleaned.replace(/\u001b\][0-9]+;[^\u001b\u0007]*[\u001b\\\u0007]/g, '');
    
    // Remove ANSI CSI sequences (colors, cursor movements, etc.)
    // Pattern: ESC [ numbers ; numbers m
    cleaned = cleaned.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '');
    
    // Remove standalone ESC characters
    cleaned = cleaned.replace(/\u001b/g, '');
    
    // Remove BEL characters
    cleaned = cleaned.replace(/\u0007/g, '');
    
    // Remove specific VS Code sequences
    cleaned = cleaned.replace(/\]633;[CE]/g, '');
    cleaned = cleaned.replace(/\]633;[CE]\\/g, '');
    
    // Remove any remaining control characters (except newlines and tabs)
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Trim leading/trailing whitespace and extra spaces
    cleaned = cleaned.trim();
    
    // Replace multiple spaces with single space (but preserve intentional spacing)
    cleaned = cleaned.replace(/[ \t]+/g, ' ');
    
    return cleaned;
}

export class CommandHistoryItem extends vscode.TreeItem {
    private rawOutput: string = '';
    private cleanOutput: string = '';
    
    constructor(
        public readonly commandText: string,
        public readonly terminalName: string,
        public readonly timestamp: Date,
        public readonly cwd: string = '',
        output: string = '',
        public exitCode: number | null = null
    ) {
        super(commandText, vscode.TreeItemCollapsibleState.Collapsed);
        
        // Store and clean output
        this.rawOutput = output;
        this.cleanOutput = cleanTerminalOutput(output);
        
        this.tooltip = `${commandText}\nTerminal: ${terminalName}\nTime: ${timestamp.toLocaleString()}\nCWD: ${cwd || 'unknown'}\n\nOutput:\n${this.cleanOutput.substring(0, 500)}${this.cleanOutput.length > 500 ? '...' : ''}`;
        this.description = this.getDescription();
        this.iconPath = new vscode.ThemeIcon('terminal');
        this.contextValue = 'commandItem';
        
        // Set color based on exit code
        if (exitCode !== null && exitCode !== 0) {
            this.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('errorForeground'));
        }
    }
    
    public get output(): string {
        return this.cleanOutput;
    }
    
    public set output(value: string) {
        this.rawOutput = value;
        this.cleanOutput = cleanTerminalOutput(value);
        // Update tooltip with cleaned output
        this.tooltip = `${this.commandText}\nTerminal: ${this.terminalName}\nTime: ${this.timestamp.toLocaleString()}\nCWD: ${this.cwd || 'unknown'}\n\nOutput:\n${this.cleanOutput.substring(0, 500)}${this.cleanOutput.length > 500 ? '...' : ''}`;
    }
    
    public getRawOutput(): string {
        return this.rawOutput;
    }
    
    private getDescription(): string {
        const timeAgo = this.getTimeAgo();
        const status = this.exitCode === null ? '🔄' : 
                      this.exitCode === 0 ? '✅' : 
                      `❌ (${this.exitCode})`;
        return `${status} ${timeAgo}`;
    }
    
    private getTimeAgo(): string {
        const seconds = Math.floor((new Date().getTime() - this.timestamp.getTime()) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    }
    
    public getOutputItem(): OutputTreeItem {
        return new OutputTreeItem(this.output, this.exitCode, this.commandText);
    }
}

class OutputTreeItem extends vscode.TreeItem {
    constructor(output: string, exitCode: number | null, commandText: string) {
        // Clean the output again just to be safe
        const cleanOutput = cleanTerminalOutput(output);
        
        // Truncate if too long (but show more - 1000 chars)
        const displayOutput = cleanOutput.length > 1000 
            ? cleanOutput.substring(0, 1000) + '...\n\n(Output truncated, use Copy to get full output)' 
            : (cleanOutput || '(no output captured)');
        
        super(displayOutput, vscode.TreeItemCollapsibleState.None);
        
        this.tooltip = cleanOutput || 'No output captured';
        this.iconPath = new vscode.ThemeIcon('output');
        this.contextValue = 'outputItem';
        
        if (exitCode !== null && exitCode !== 0) {
            this.description = `Exit code: ${exitCode}`;
        }
        
        // Add copy command
        this.command = {
            command: 'terminalHistory.copyOutput',
            title: 'Copy Output',
            arguments: [{ output: cleanOutput, command: commandText }]
        };
    }
}

export class TerminalHistoryProvider implements vscode.TreeDataProvider<CommandHistoryItem | OutputTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<CommandHistoryItem | OutputTreeItem | undefined | null | void> = new vscode.EventEmitter<CommandHistoryItem | OutputTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<CommandHistoryItem | OutputTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
    
    private history: CommandHistoryItem[] = [];
    private maxHistorySize: number = 100;
    private storagePath: string;
    private closedTerminals: Set<string> = new Set();
    
    constructor(private context: vscode.ExtensionContext) {
        this.storagePath = path.join(context.globalStorageUri.fsPath, 'history.json');
        this.ensureStorageDir();
        this.loadHistory();
        
        // Load configuration
        const config = vscode.workspace.getConfiguration('terminalHistory');
        this.maxHistorySize = config.get('maxHistorySize', 100);
    }
    
    private ensureStorageDir() {
        const dir = path.dirname(this.storagePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    
    private loadHistory() {
        try {
            if (fs.existsSync(this.storagePath)) {
                const data = JSON.parse(fs.readFileSync(this.storagePath, 'utf-8'));
                this.history = data.map((item: any) => {
                    const cmd = new CommandHistoryItem(
                        item.commandText,
                        item.terminalName,
                        new Date(item.timestamp),
                        item.cwd,
                        item.rawOutput || item.output || '', // Try rawOutput first for backward compatibility
                        item.exitCode
                    );
                    return cmd;
                });
            }
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    }
    
    private saveHistory() {
        try {
            const data = this.history.map(item => ({
                commandText: item.commandText,
                terminalName: item.terminalName,
                timestamp: item.timestamp.toISOString(),
                cwd: item.cwd,
                rawOutput: item.getRawOutput(), // Save the raw output for future reference
                output: item.output, // Save cleaned version too
                exitCode: item.exitCode
            }));
            fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Failed to save history:', error);
        }
    }
    
    public addCommand(item: CommandHistoryItem) {
        this.history.unshift(item); // Add to beginning (most recent first)
        
        // Trim history if needed
        if (this.history.length > this.maxHistorySize) {
            this.history = this.history.slice(0, this.maxHistorySize);
        }
        
        this.saveHistory();
        this._onDidChangeTreeData.fire();
    }
    
    public updateCommand(updatedItem: CommandHistoryItem) {
        const index = this.history.findIndex(item => 
            item.commandText === updatedItem.commandText && 
            item.timestamp.getTime() === updatedItem.timestamp.getTime()
        );
        
        if (index !== -1) {
            this.history[index] = updatedItem;
            this.saveHistory();
            this._onDidChangeTreeData.fire();
        }
    }
    
    public clearHistory() {
        this.history = [];
        this.saveHistory();
        this._onDidChangeTreeData.fire();
    }
    
    public markTerminalClosed(terminalName: string) {
        this.closedTerminals.add(terminalName);
        this._onDidChangeTreeData.fire();
    }
    
    public getCommandCount(): number {
        return this.history.length;
    }
    
    getTreeItem(element: CommandHistoryItem | OutputTreeItem): vscode.TreeItem {
        return element;
    }
    
    async getChildren(element?: CommandHistoryItem | OutputTreeItem): Promise<(CommandHistoryItem | OutputTreeItem)[]> {
        if (!element) {
            // Root: return all commands
            return this.history;
        }
        
        if (element instanceof CommandHistoryItem) {
            // Return output as child
            return [element.getOutputItem()];
        }
        
        return [];
    }
}