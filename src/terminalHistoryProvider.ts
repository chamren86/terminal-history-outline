/**
 * @file terminalHistoryProvider.ts
 * @description Tree data provider for the Terminal History view in VS Code Explorer.
 */

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
        this.contextValue = CONTEXT_VALUES.HISTORY_ITEM;
        this.description = item.description;
        this.label = item.label;
        
        // Primary action: Click to copy output
        // This will show a copy icon on the item
        this.command = {
            command: 'terminalHistory.copyOutput',
            title: 'Copy Output',
            arguments: [{ 
                output: item.output, 
                command: item.commandText 
            }]
        };
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
    private filteredHistory: CommandHistoryItem[] = [];
    private filterText: string = '';
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
                this.applyFilter();
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
    
    private applyFilter() {
        if (!this.filterText) {
            this.filteredHistory = [...this.history];
        } else {
            const lowerFilter = this.filterText.toLowerCase();
            this.filteredHistory = this.history.filter(item => 
                item.commandText.toLowerCase().includes(lowerFilter) ||
                (item.output && item.output.toLowerCase().includes(lowerFilter))
            );
        }
        this.refresh();
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
        this.applyFilter();
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
            this.applyFilter();
        }
    }
    
    public deleteEntry(item: CommandHistoryItem) {
        const index = this.history.findIndex(h => 
            h.commandText === item.commandText && 
            h.timestamp.getTime() === item.timestamp.getTime()
        );
        
        if (index !== -1) {
            this.history.splice(index, 1);
            this.saveHistory();
            this.applyFilter();
        }
    }
    
    public clearHistory() {
        this.history = [];
        this.saveHistory();
        this.applyFilter();
    }
    
    public setFilter(filter: string) {
        this.filterText = filter.trim();
        this.applyFilter();
        
        if (this.filterText) {
            vscode.window.showInformationMessage(`Filtering: "${this.filterText}" (${this.filteredHistory.length} commands)`);
        } else {
            vscode.window.showInformationMessage('Filter cleared');
        }
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
            return this.filteredHistory.map(item => new VSCodeCommandHistoryItem(item));
        }
        
        if (element instanceof VSCodeCommandHistoryItem) {
            return [element.getOutputItem()];
        }
        
        return [];
    }
}