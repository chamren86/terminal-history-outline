/**
 * @file commandPatterns.ts
 * @description Constants for command cleaning and error detection.
 * 
 * @module constants
 */

/** Patterns to remove from command strings for cleaner display */
export const COMMAND_CLEAN_PATTERNS = [
    / --color=auto/g,
    / --color/g
] as const;

/** Patterns to detect errors in command output */
export const ERROR_DETECTION_PATTERNS = [
    'error',
    'fail',
    'exception',
    'not found',
    'permission denied',
    'No such file',
    'command not found',
    'EACCES',
    'ENOENT'
] as const;

/** Creates a RegExp for error detection from the pattern list */
export function createErrorRegex(): RegExp {
    return new RegExp(ERROR_DETECTION_PATTERNS.join('|'), 'i');
}