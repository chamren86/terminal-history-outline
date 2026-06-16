import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { cleanTerminalOutput } from './cleaner.js';

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
        super('', vscode.TreeItemCollapsibleState.Collapsed);
        
        this.rawOutput = output;
        this.cleanOutput = cleanTerminalOutput(output);
        
        this.tooltip = `${commandText}\nTerminal: ${terminalName}\nTime: ${timestamp.toLocaleString()}\nCWD: ${cwd || 'unknown'}\nExit Code: ${exitCode === null ? 'running' : exitCode}\n\nOutput:\n${this.cleanOutput.substring(0, 500)}${this.cleanOutput.length > 500 ? '...' : ''}`;
        
        this.applyStatusStyling();
        this.contextValue = 'commandItem';
    }
    
    private applyStatusStyling() {
        this.iconPath = undefined;
        
        if (this.exitCode === null) {
            this.label = `🟡 ${this.commandText}`;
            this.description = this.getTimeAgo();
        } else if (this.exitCode === 0) {
            this.label = `🟢 ${this.commandText}`;
            this.description = this.getTimeAgo();
        } else {
            this.label = `🔴 ${this.commandText}`;
            this.description = this.getTimeAgo();
        }
    }
    
    public get output(): string {
        return this.cleanOutput;
    }
    
    public set output(value: string) {
        this.rawOutput = value;
        this.cleanOutput = cleanTerminalOutput(value);
        this.tooltip = `${this.commandText}\nTerminal: ${this.terminalName}\nTime: ${this.timestamp.toLocaleString()}\nCWD: ${this.cwd || 'unknown'}\nExit Code: ${this.exitCode === null ? 'running' : this.exitCode}\n\nOutput:\n${this.cleanOutput.substring(0, 500)}${this.cleanOutput.length > 500 ? '...' : ''}`;
        this.applyStatusStyling();
    }
    
    private getTimeAgo(): string {
        const seconds = Math.floor((new Date().getTime() - this.timestamp.getTime()) / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        return `${Math.floor(hours / 24)}d`;
    }
    
    public getOutputItem(): OutputTreeItem {
        return new OutputTreeItem(this.output, this.exitCode, this.commandText);
    }
    
    public getRawOutput(): string {
        return this.rawOutput;
    }
}

class OutputTreeItem extends vscode.TreeItem {
    constructor(output: string, exitCode: number | null, commandText: string) {
        const cleanOutput = cleanTerminalOutput(output);
        const truncated = cleanOutput.length > 1000 
            ? cleanOutput.substring(0, 1000) + '...\n\n(Output truncated, use Copy to get full output)' 
            : (cleanOutput || '(no output captured)');
        
        super(truncated, vscode.TreeItemCollapsibleState.None);
        
        this.tooltip = cleanOutput || 'No output captured';
        this.iconPath = new vscode.ThemeIcon('output');
        this.contextValue = 'outputItem';
        
        if (exitCode !== null && exitCode !== 0) {
            this.description = `Exit code: ${exitCode}`;
        }
        
        this.command = {
            command: 'terminalHistory.copyOutput',
            title: 'Copy Output',
            arguments: [{ output: cleanOutput, command: commandText }]
        };
    }
}

export class TerminalHistoryProvider implements vscode.TreeDataProvider<CommandHistoryItem | OutputTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<CommandHistoryItem | OutputTreeItem | undefined | null | void> = new vscode.EventEmitter<CommandHistoryItem | OutputTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
    
    private history: CommandHistoryItem[] = [];
    private maxHistorySize: number = 100;
    private storagePath: string;
    
    constructor(private context: vscode.ExtensionContext) {
        this.storagePath = path.join(context.globalStorageUri.fsPath, 'history.json');
        this.ensureStorageDir();
        this.loadHistory();
        
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
                    return new CommandHistoryItem(
                        item.commandText,
                        item.terminalName,
                        new Date(item.timestamp),
                        item.cwd,
                        item.rawOutput || item.output || '',
                        item.exitCode
                    );
                });
            }
        } catch (error) {
            // Silently fail - no history to load
        }
    }
    
    private saveHistory() {
        try {
            const data = this.history.map(item => ({
                commandText: item.commandText,
                terminalName: item.terminalName,
                timestamp: item.timestamp.toISOString(),
                cwd: item.cwd,
                rawOutput: item.getRawOutput(),
                output: item.output,
                exitCode: item.exitCode
            }));
            fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));
        } catch (error) {
            // Silently fail - can't save history
        }
    }
    
    public refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }
    
    public addCommand(item: CommandHistoryItem) {
        this.history.unshift(item);
        
        if (this.history.length > this.maxHistorySize) {
            this.history = this.history.slice(0, this.maxHistorySize);
        }
        
        this.saveHistory();
        this.refresh();
    }
    
    public updateCommand(updatedItem: CommandHistoryItem) {
        const index = this.history.findIndex(item => 
            item.commandText === updatedItem.commandText && 
            item.timestamp.getTime() === updatedItem.timestamp.getTime()
        );
        
        if (index !== -1) {
            const newItem = new CommandHistoryItem(
                updatedItem.commandText,
                updatedItem.terminalName,
                updatedItem.timestamp,
                updatedItem.cwd,
                updatedItem.output,
                updatedItem.exitCode
            );
            
            this.history[index] = newItem;
            this.saveHistory();
            this.refresh();
        }
    }
    
    public clearHistory() {
        this.history = [];
        this.saveHistory();
        this.refresh();
    }
    
    public getCommandCount(): number {
        return this.history.length;
    }
    
    public getHistory(): CommandHistoryItem[] {
        return this.history;
    }
    
    getTreeItem(element: CommandHistoryItem | OutputTreeItem): vscode.TreeItem {
        return element;
    }
    
    async getChildren(element?: CommandHistoryItem | OutputTreeItem): Promise<(CommandHistoryItem | OutputTreeItem)[]> {
        if (!element) {
            return this.history;
        }
        
        if (element instanceof CommandHistoryItem) {
            return [element.getOutputItem()];
        }
        
        return [];
    }
}