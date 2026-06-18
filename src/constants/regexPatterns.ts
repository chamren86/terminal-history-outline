/**
 * @file regexPatterns.ts
 * @description Regular expression patterns for various cleaning operations.
 * 
 * @module constants
 */

/**
 * Patterns for ANSI escape codes and control sequences.
 * Used by cleaner.ts to remove terminal formatting.
 */
export const CLEANER_PATTERNS = {
    /** VS Code Shell Integration sequences */
    VSCODE_SEQUENCES: [
        /\u001b\]633;[CE]\u0007/g,
        /\u001b\]633;[CE]\u001b\\/g,
        /\u001b\]633;[CE]/g,
        /\]633;[CE]/g
    ],
    
    /** Control characters to remove */
    CONTROL_CHARS: /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,
    
    /** Multiple whitespace to collapse */
    MULTIPLE_WHITESPACE: /[ \t]+/g
} as const;