/**
 * @file ansiCleanerTest.ts
 * @description Unit tests for ANSI cleaner functionality
 */

import { describe, it, expect } from 'vitest';
import { cleanTerminalOutput, hasAnsiCodes } from '../../cleaner.js';

describe('ANSI Cleaner', () => {
    it('should remove basic ANSI color codes', () => {
        const input = '\x1b[32mgreen text\x1b[0m';
        const result = cleanTerminalOutput(input);
        expect(result).toBe('green text');
    });

    it('should remove VS Code shell integration sequences', () => {
        const input = '\x1b]0;terminal-title\x07command output';
        const result = cleanTerminalOutput(input);
        expect(result).toBe('command output');
    });

    it('should handle ls output with colors', () => {
        const input = '\x1b[36mfile.txt\x1b[0m  \x1b[32mfile2.txt\x1b[0m';
        const result = cleanTerminalOutput(input);
        expect(result).toBe('file.txt file2.txt');
    });

    it('should handle mixed content with colors', () => {
        const input = 'Error: \x1b[31mFile not found\x1b[0m at line 5';
        const result = cleanTerminalOutput(input);
        expect(result).toBe('Error: File not found at line 5');
    });

    it('should detect ANSI codes in output', () => {
        const input = '\x1b[32mcolored text\x1b[0m';
        expect(hasAnsiCodes(input)).toBe(true);
        
        const clean = cleanTerminalOutput(input);
        expect(hasAnsiCodes(clean)).toBe(false);
    });

    it('should handle empty string', () => {
        expect(cleanTerminalOutput('')).toBe('');
    });

    it('should handle very long outputs', () => {
        const longInput = '\x1b[32m' + 'a'.repeat(10000) + '\x1b[0m';
        const result = cleanTerminalOutput(longInput);
        expect(result).toBe('a'.repeat(10000));
        expect(result.length).toBe(10000);
    });
});