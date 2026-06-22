/**
 * @file vsCodeConstants.ts
 * @description Constants specific to VS Code integration.
 * 
 * This file contains:
 * - VSCODE_SEQUENCES: Shell Integration sequences to remove from output
 * - CONTEXT_VALUES: TreeView context values for command/out
 * - VIEW_IDS: VS Code view identifiers
 * - STATUS_BAR_ICON: Status bar icon name
 * - STATUS_BAR: Status bar alignment and priority
 * 
 * @module constants/vsCodeConstants
 */

export const VSCODE_SEQUENCES = [
    /\u001b\]633;[CE]\u0007/g,
    /\u001b\]633;[CE]\u001b\\/g,
    /\u001b\]633;[CE]/g,
    /\]633;[CE]/g
];

export const CONTEXT_VALUES = {
    HISTORY_ITEM: 'historyItem',
    OUTPUT_ITEM: 'outputItem'
};

export const VIEW_IDS = {
    TERMINAL_HISTORY: 'terminalHistory'
};

export const STATUS_BAR_ICON = 'history';

export const STATUS_BAR = {
    ALIGNMENT: 'Right' as const,
    PRIORITY: 100
};