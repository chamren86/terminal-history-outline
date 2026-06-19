import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { CommandHistoryItem } from './commandHistoryItem.js';
import { cleanTerminalOutput } from './cleaner.js';
import {
    CONTEXT_VALUES,
    MAX_OUTPUT_PREVIEW_LENGTH,
    MAX_OUTPUT_DISPLAY_LENGTH,
    MAX_HISTORY_SIZE
} from './constants/index.js';

// OutputTreeItem remains here since it only uses vscode
class OutputTreeItem extends vscode.TreeItem {
    constructor(output: string, exitCode: number | null, commandText: string) {
        const cleanOutput = cleanTerminalOutput(output);
        const truncated = cleanOutput.length > MAX_OUTPUT_DISPLAY_LENGTH 
            ? cleanOutput.substring(0, MAX_OUTPUT_DISPLAY_LENGTH) + '...\n\n(Output truncated, use Copy to get full output)' 
            : (cleanOutput || '(no output captured)');
        
        super(truncated, vscode.TreeItemCollapsibleState.None);
        
        this.tooltip = cleanOutput || 'No output captured';
        this.iconPath = new vscode.ThemeIcon('output');
        this.contextValue = CONTEXT_VALUES.OUTPUT_ITEM;
        
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

// Extend CommandHistoryItem to work with vscode.TreeItem
export class VSCodeCommandHistoryItem extends vscode.TreeItem {
    private _item: CommandHistoryItem;
    
    constructor(item: CommandHistoryItem) {
        super(item.label, vscode.TreeItemCollapsibleState.Collapsed);
        this._item = item;
        this.tooltip = item.tooltip;
        this.iconPath = item.iconPath;
        this.contextValue = item.contextValue;
        this.description = item.description;
        this.label = item.label;
    }
    
    get commandText(): string { return this._item.commandText; }
    get terminalName(): string { return this._item.terminalName; }
    get timestamp(): Date { return this._item.timestamp; }
    get cwd(): string { return this._item.cwd; }
    get output(): string { return this._item.output; }
    set output(value: string) { this._item.output = value; }
    get exitCode(): number | null { return this._item.exitCode; }
    set exitCode(value: number | null) { this._item.exitCode = value; }
    getRawOutput(): string { return this._item.getRawOutput(); }
    getOutputItem(): OutputTreeItem {
        return new OutputTreeItem(this.output, this.exitCode, this.commandText);
    }
}

export { CommandHistoryItem };

export class TerminalHistoryProvider implements vscode.TreeDataProvider<VSCodeCommandHistoryItem | OutputTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<VSCodeCommandHistoryItem | OutputTreeItem | undefined | null | void> = new vscode.EventEmitter<VSCodeCommandHistoryItem | OutputTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
    
    private history: CommandHistoryItem[] = [];
    private maxHistorySize: number = MAX_HISTORY_SIZE;
    private storagePath: string;
    
    constructor(private context: vscode.ExtensionContext) {
        this.storagePath = path.join(context.globalStorageUri.fsPath, 'history.json');
        this.ensureStorageDir();
        this.loadHistory();
        
        const config = vscode.workspace.getConfiguration('terminalHistory');
        this.maxHistorySize = config.get('maxHistorySize', MAX_HISTORY_SIZE);
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
    
    getTreeItem(element: VSCodeCommandHistoryItem | OutputTreeItem): vscode.TreeItem {
        if (element instanceof VSCodeCommandHistoryItem) {
            return element;
        }
        return element;
    }
    
    async getChildren(element?: VSCodeCommandHistoryItem | OutputTreeItem): Promise<(VSCodeCommandHistoryItem | OutputTreeItem)[]> {
        if (!element) {
            // Return all commands as VSCodeCommandHistoryItem
            return this.history.map(item => new VSCodeCommandHistoryItem(item));
        }
        
        if (element instanceof VSCodeCommandHistoryItem) {
            return [element.getOutputItem()];
        }
        
        return [];
    }
}
