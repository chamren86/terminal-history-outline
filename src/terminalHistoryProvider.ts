/**
 * @file terminalHistoryProvider.ts
 * @description Tree data provider for the Terminal History view in VS Code Explorer.
 * 
 * This module handles:
 * - Storing and retrieving command history
 * - Providing data to the VS Code TreeView
 * - Filtering/search functionality
 * - Deleting individual entries
 * - Persisting history to disk
 * - Creating tree items with proper icons and status indicators
 * 
 * @module terminalHistoryProvider
 * @version 1.0.0
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { CommandHistoryItem } from './commandHistoryItem.js';
import { cleanTerminalOutput } from './cleaner.js';
import {
    CONTEXT_VALUES,
    MAX_OUTPUT_DISPLAY_LENGTH,
    MAX_HISTORY_SIZE
} from './constants/index.js';

/**
 * Tree item representing the output of a command.
 * Displayed as a child of a command item when expanded.
 * 
 * @class OutputTreeItem
 * @extends vscode.TreeItem
 */
class OutputTreeItem extends vscode.TreeItem {
    /**
     * Creates an output tree item for display
     * 
     * @param output - The raw command output to display
     * @param exitCode - The exit code of the command (for status display)
     * @param commandText - The command text (for reference in copy action)
     */
    constructor(output: string, exitCode: number | null, commandText: string) {
        const cleanOutput = cleanTerminalOutput(output);
        const truncated = cleanOutput.length > MAX_OUTPUT_DISPLAY_LENGTH 
            ? cleanOutput.substring(0, MAX_OUTPUT_DISPLAY_LENGTH) + '...\n\n(Output truncated, use Copy to get full output)' 
            : (cleanOutput || '(no output captured)');
        
        super(truncated, vscode.TreeItemCollapsibleState.None);
        
        // Set tooltip with full output
        this.tooltip = cleanOutput || 'No output captured';
        
        // Use output icon
        this.iconPath = new vscode.ThemeIcon('output');
        
        // Set context for menu contributions
        this.contextValue = CONTEXT_VALUES.OUTPUT_ITEM;
        
        // Show exit code if non-zero
        if (exitCode !== null && exitCode !== 0) {
            this.description = `Exit code: ${exitCode}`;
        }
        
        // Clicking on output item copies it to clipboard
        this.command = {
            command: 'terminalHistory.copyOutput',
            title: 'Copy Output',
            arguments: [{ output: cleanOutput, command: commandText }]
        };
    }
}

/**
 * Wraps CommandHistoryItem to work with VS Code's TreeItem interface.
 * Acts as a bridge between the data model and the view.
 * 
 * @class VSCodeCommandHistoryItem
 * @extends vscode.TreeItem
 */
export class VSCodeCommandHistoryItem extends vscode.TreeItem {
    /** The wrapped command history item */
    private _item: CommandHistoryItem;
    
    /**
     * Creates a VSCodeCommandHistoryItem from a CommandHistoryItem
     * 
     * @param item - The command history data item to wrap
     */
    constructor(item: CommandHistoryItem) {
        super(item.label, vscode.TreeItemCollapsibleState.Collapsed);
        this._item = item;
        
        // Copy properties from the wrapped item
        this.tooltip = item.tooltip;
        this.iconPath = item.iconPath;
        this.contextValue = CONTEXT_VALUES.HISTORY_ITEM;
        this.description = item.description;
        this.label = item.label;
        
        // Set primary action: Click to copy command & output
        this.command = {
            command: 'terminalHistory.copyCommandAndOutput',
            title: 'Copy Command & Output',
            arguments: [item]
        };
    }
    
    // Property accessors for the wrapped item
    get commandText(): string { return this._item.commandText; }
    get terminalName(): string { return this._item.terminalName; }
    get timestamp(): Date { return this._item.timestamp; }
    get cwd(): string { return this._item.cwd; }
    get output(): string { return this._item.output; }
    set output(value: string) { this._item.output = value; }
    get exitCode(): number | null { return this._item.exitCode; }
    set exitCode(value: number | null) { this._item.exitCode = value; }
    getRawOutput(): string { return this._item.getRawOutput(); }
    
    /**
     * Gets the output tree item for this command
     * 
     * @returns An OutputTreeItem representing the command output
     */
    getOutputItem(): OutputTreeItem {
        return new OutputTreeItem(this.output, this.exitCode, this.commandText);
    }
}

export { CommandHistoryItem };

/**
 * Tree data provider for the Terminal History view.
 * 
 * Implements vscode.TreeDataProvider to supply hierarchical data
 * to VS Code's TreeView. Manages the command history list with
 * support for filtering, adding, updating, and deleting entries.
 * 
 * @class TerminalHistoryProvider
 * @implements {vscode.TreeDataProvider<VSCodeCommandHistoryItem | OutputTreeItem>}
 */
export class TerminalHistoryProvider implements vscode.TreeDataProvider<VSCodeCommandHistoryItem | OutputTreeItem> {
    /**
     * Event emitter for tree data changes
     * Fired when the tree data needs to be refreshed
     */
    private _onDidChangeTreeData: vscode.EventEmitter<VSCodeCommandHistoryItem | OutputTreeItem | undefined | null | void> = 
        new vscode.EventEmitter<VSCodeCommandHistoryItem | OutputTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
    
    /** Full history of all commands */
    private history: CommandHistoryItem[] = [];
    
    /** Filtered history (subset based on search query) */
    private filteredHistory: CommandHistoryItem[] = [];
    
    /** Current filter/search text */
    private filterText: string = '';
    
    /** Maximum number of commands to store */
    private maxHistorySize: number = MAX_HISTORY_SIZE;
    
    /** Path to the storage file */
    private storagePath: string;
    
    /**
     * Creates a new TerminalHistoryProvider
     * 
     * @param context - VS Code extension context for storage access
     */
    constructor(private context: vscode.ExtensionContext) {
        this.storagePath = path.join(context.globalStorageUri.fsPath, 'history.json');
        this.ensureStorageDir();
        this.loadHistory();
        
        const config = vscode.workspace.getConfiguration('terminalHistory');
        this.maxHistorySize = config.get('maxHistorySize', MAX_HISTORY_SIZE);
    }
    
    /**
     * Ensures the storage directory exists
     * Creates it if it doesn't exist
     * 
     * @private
     */
    private ensureStorageDir() {
        const dir = path.dirname(this.storagePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    
    /**
     * Loads history from the storage file
     * Handles missing or corrupted files gracefully
     * 
     * @private
     */
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
            console.warn('Failed to load terminal history:', error);
        }
    }
    
    /**
     * Saves history to the storage file
     * 
     * @private
     */
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
            console.warn('Failed to save terminal history:', error);
        }
    }
    
    /**
     * Applies the current filter to the history
     * Updates filteredHistory with matching items
     * 
     * @private
     */
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
    
    /**
     * Notifies the view that data has changed
     * Triggers a refresh of the tree view
     */
    public refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }
    
    /**
     * Adds a new command to history
     * 
     * @param item - The command history item to add
     */
    public addCommand(item: CommandHistoryItem) {
        this.history.unshift(item);
        
        if (this.history.length > this.maxHistorySize) {
            this.history = this.history.slice(0, this.maxHistorySize);
        }
        
        this.saveHistory();
        this.applyFilter();
    }
    
    /**
     * Updates an existing command in history
     * 
     * @param updatedItem - The updated command history item
     */
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
    
    /**
     * Deletes a single entry from history
     * 
     * @param item - The command history item to delete
     */
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
    
    /**
     * Clears all history
     * Removes all commands from the history list
     */
    public clearHistory() {
        this.history = [];
        this.saveHistory();
        this.applyFilter();
    }
    
    /**
     * Sets the filter text for the history view
     * 
     * @param filter - The text to filter by (empty string clears filter)
     */
    public setFilter(filter: string) {
        this.filterText = filter.trim();
        this.applyFilter();
        
        if (this.filterText) {
            vscode.window.showInformationMessage(`Filtering: "${this.filterText}" (${this.filteredHistory.length} commands)`);
        } else {
            vscode.window.showInformationMessage('Filter cleared');
        }
    }
    
    /**
     * Gets the number of commands in history
     * 
     * @returns The total command count
     */
    public getCommandCount(): number {
        return this.history.length;
    }
    
    /**
     * Gets the full history list
     * 
     * @returns Array of all CommandHistoryItems
     */
    public getHistory(): CommandHistoryItem[] {
        return this.history;
    }
    
    /**
     * Gets the tree item representation for a history item
     * 
     * @param element - The history or output item to display
     * @returns A vscode.TreeItem for display
     */
    getTreeItem(element: VSCodeCommandHistoryItem | OutputTreeItem): vscode.TreeItem {
        if (element instanceof VSCodeCommandHistoryItem) {
            return element;
        }
        return element;
    }
    
    /**
     * Gets the children of a tree item
     * 
     * @param element - The parent element (undefined for root)
     * @returns Array of child tree items
     */
    async getChildren(element?: VSCodeCommandHistoryItem | OutputTreeItem): Promise<(VSCodeCommandHistoryItem | OutputTreeItem)[]> {
        if (!element) {
            // Return all history items at root level
            return this.filteredHistory.map(item => new VSCodeCommandHistoryItem(item));
        }
        
        if (element instanceof VSCodeCommandHistoryItem) {
            // Return output item when a command is expanded
            return [element.getOutputItem()];
        }
        
        return [];
    }
}