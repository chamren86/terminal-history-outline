/**
 * @file commandHistoryItem.ts
 * @description Command history item class for the Terminal History Outline extension.
 */

import { cleanTerminalOutput } from './cleaner.js';
import { CONTEXT_VALUES, MAX_OUTPUT_PREVIEW_LENGTH, MAX_OUTPUT_DISPLAY_LENGTH } from './constants/index.js';

export class CommandHistoryItem {
    private rawOutput: string = '';
    private cleanOutput: string = '';
    public label: string;
    public description: string | undefined;
    public tooltip: string | undefined;
    public iconPath: any;
    public contextValue: string | undefined;
    public collapsibleState: any;
    public command: any;
    
    constructor(
        public readonly commandText: string,
        public readonly terminalName: string,
        public readonly timestamp: Date,
        public readonly cwd: string = '',
        output: string = '',
        public exitCode: number | null = null
    ) {
        this.rawOutput = output;
        this.cleanOutput = cleanTerminalOutput(output);
        
        const outputPreview = this.cleanOutput.substring(0, MAX_OUTPUT_PREVIEW_LENGTH);
        const isTruncated = this.cleanOutput.length > MAX_OUTPUT_PREVIEW_LENGTH;
        
        this.tooltip = `${commandText}\nTerminal: ${terminalName}\nTime: ${timestamp.toLocaleString()}\nCWD: ${cwd || 'unknown'}\nExit Code: ${exitCode === null ? 'running' : exitCode}\n\nOutput:\n${outputPreview}${isTruncated ? '...' : ''}`;
        
        this.applyStatusStyling();
        this.contextValue = CONTEXT_VALUES.HISTORY_ITEM; // Changed from COMMAND_ITEM to HISTORY_ITEM
        this.collapsibleState = 1; // Collapsed
    }
    
    private applyStatusStyling() {
        // No icon path - we use emojis in the label
        this.iconPath = undefined;
        
        if (this.exitCode === null) {
            this.label = `🟡 ${this.commandText}`;
            this.description = this.getTimeAgo();
        } else if (this.exitCode === 0) {
            this.label = `🟢 ${this.commandText}`;
            this.description = this.getTimeAgo();
        } else if (this.exitCode === 2) {
            // Warning state (exit code 2)
            this.label = `🟠 ${this.commandText}`;
            this.description = `⚠️ ${this.getTimeAgo()}`;
        } else {
            // Error state (exit code 1 or other non-zero)
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
        
        const outputPreview = this.cleanOutput.substring(0, MAX_OUTPUT_PREVIEW_LENGTH);
        const isTruncated = this.cleanOutput.length > MAX_OUTPUT_PREVIEW_LENGTH;
        
        this.tooltip = `${this.commandText}\nTerminal: ${this.terminalName}\nTime: ${this.timestamp.toLocaleString()}\nCWD: ${this.cwd || 'unknown'}\nExit Code: ${this.exitCode === null ? 'running' : this.exitCode}\n\nOutput:\n${outputPreview}${isTruncated ? '...' : ''}`;
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
    
    public getRawOutput(): string {
        return this.rawOutput;
    }
}