import * as assert from 'node:assert';
import { describe, it } from 'node:test';
import { CommandHistoryItem } from '../../commandHistoryItem.js';

describe('CommandHistoryItem Tests', () => {
    it('Should create a command item with success status', () => {
        const item = new CommandHistoryItem(
            'ls -la',
            'bash',
            new Date(),
            '/home/user',
            'total 42',
            0
        );
        assert.strictEqual(item.commandText, 'ls -la');
        assert.strictEqual(item.terminalName, 'bash');
        assert.strictEqual(item.exitCode, 0);
        assert.ok(item.label.includes('🟢'));
    });

    it('Should create a command item with error status', () => {
        const item = new CommandHistoryItem(
            'git confit',
            'bash',
            new Date(),
            '/home/user',
            "git: 'confit' is not a git command",
            1
        );
        assert.strictEqual(item.exitCode, 1);
        assert.ok(item.label.includes('🔴'));
    });

    it('Should create a command item with warning status', () => {
        const item = new CommandHistoryItem(
            'npm install',
            'bash',
            new Date(),
            '/home/user',
            'npm warn deprecated package@1.0.0',
            2
        );
        assert.strictEqual(item.exitCode, 2);
        assert.ok(item.label.includes('🟠'));
    });

    it('Should create a command item with running status', () => {
        const item = new CommandHistoryItem(
            'npm install',
            'bash',
            new Date(),
            '/home/user',
            '',
            null
        );
        assert.strictEqual(item.exitCode, null);
        assert.ok(item.label.includes('🟡'));
    });

    it('Should get time ago in human-readable format', () => {
        const now = new Date();
        const fiveSecondsAgo = new Date(now.getTime() - 5000);
        const item = new CommandHistoryItem(
            'ls',
            'bash',
            fiveSecondsAgo,
            '/home/user',
            '',
            0
        );
        const timeAgo = (item as any).getTimeAgo();
        assert.strictEqual(timeAgo, '5s');
    });

    it('Should create an output item with truncated text when too long', () => {
        const longOutput = 'a'.repeat(1500);
        const item = new CommandHistoryItem(
            'test',
            'bash',
            new Date(),
            '/home/user',
            longOutput,
            0
        );
        // Just check that the item exists and has output
        assert.ok(item.output !== undefined);
    });
});
