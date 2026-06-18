/**
 * @file vsCodeConstants.ts
 * @description VS Code specific constants.
 * 
 * @module constants
 */

/** VS Code Shell Integration sequences to remove from output */
export const VSCODE_SEQUENCES = [
    /\u001b\]633;[CE]\u0007/g,
    /\u001b\]633;[CE]\u001b\\/g,
    /\u001b\]633;[CE]/g,
    /\]633;[CE]/g
] as const;

/** TreeView context values */
export const CONTEXT_VALUES = {
    COMMAND_ITEM: 'commandItem',
    OUTPUT_ITEM: 'outputItem'
} as const;

/** VS Code view identifiers */
export const VIEW_IDS = {
    TERMINAL_HISTORY: 'terminalHistoryOutline'
} as const;

/** Status bar icon name */
export const STATUS_BAR_ICON = 'history';

/** Status bar alignment and priority */
export const STATUS_BAR = {
    ALIGNMENT: 'Right' as const,
    PRIORITY: 100
} as const;