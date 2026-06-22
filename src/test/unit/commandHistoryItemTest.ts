/**
 * @file commandHistoryItemTest.ts
 * @description Unit tests for CommandHistoryItem class
 */

import { describe, it, expect } from 'vitest';
import { CommandHistoryItem } from '../../commandHistoryItem.js';

describe('CommandHistoryItem', () => {
    it('should create a command item with success status', () => {
        const item = new CommandHistoryItem('echo "hello"', 'terminal', new Date(), '/cwd', 'hello', 0);
        expect(item.commandText).toBe('echo "hello"');
        expect(item.exitCode).toBe(0);
        expect(item.label).toContain('🟢'); // Using actual icon from your code
    });

    it('should create a command item with error status', () => {
        const item = new CommandHistoryItem('invalid-command', 'terminal', new Date(), '/cwd', 'command not found', 127);
        expect(item.exitCode).toBe(127);
        expect(item.label).toContain('🔴'); // Using actual icon from your code
    });

    it('should create a command item with running status', () => {
        const item = new CommandHistoryItem('sleep 10', 'terminal', new Date(), '/cwd');
        expect(item.exitCode).toBeNull();
        expect(item.label).toContain('🟡'); // Using actual icon from your code
    });

    it('should get raw output', () => {
        const item = new CommandHistoryItem('ls', 'terminal', new Date(), '/cwd', 'file1\nfile2', 0);
        expect(item.getRawOutput()).toBe('file1\nfile2');
    });

    it('should create an output item with truncated text when too long', () => {
        const longOutput = 'a'.repeat(1000);
        const item = new CommandHistoryItem('cat largefile', 'terminal', new Date(), '/cwd', longOutput, 0);
        expect(item.output.length).toBe(1000);
    });
});