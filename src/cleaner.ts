import stripAnsi from 'strip-ansi';
import { CLEANER_PATTERNS } from './constants/index.js';

/**
 * Clean terminal output by removing ANSI color codes and VS Code control sequences.
 * This function has no VS Code dependencies and can be tested easily.
 * 
 * @param str - The raw terminal output string containing ANSI codes
 * @returns The cleaned output string with all ANSI codes removed
 * 
 * @example
 * ```typescript
 * const rawOutput = '\u001b[32mgreen text\u001b[0m';
 * const cleaned = cleanTerminalOutput(rawOutput); // 'green text'
 * ```
 */
export function cleanTerminalOutput(str: string): string {
    if (!str) return '';
    
    // Step 1: Use strip-ansi for reliable ANSI removal
    let cleaned = stripAnsi(str);
    
    // Step 2: Remove VS Code specific sequences using constants
    for (const pattern of CLEANER_PATTERNS.VSCODE_SEQUENCES) {
        cleaned = cleaned.replace(pattern, '');
    }
    
    // Step 3: Remove any remaining control characters
    cleaned = cleaned.replace(CLEANER_PATTERNS.CONTROL_CHARS, '');
    
    // Step 4: Normalize whitespace (but preserve structure)
    cleaned = cleaned.replace(CLEANER_PATTERNS.MULTIPLE_WHITESPACE, ' ');
    
    // Step 5: Remove empty lines and trim
    cleaned = cleaned.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join(' ');
    
    return cleaned.trim();
}