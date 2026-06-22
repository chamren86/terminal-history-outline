/**
 * @file terminalHistoryProviderTest.ts
 * @description Unit tests for TerminalHistoryProvider with v0.5.0 features
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode'; // This will use the mock via alias
import { TerminalHistoryProvider, CommandHistoryItem, VSCodeCommandHistoryItem } from '../../terminalHistoryProvider.js';

// Mock the vscode module - this is needed because the alias might not work in all environments
vi.mock('vscode', () => ({
    TreeItem: class {
        label: string;
        collapsibleState: any;
        tooltip?: string;
        iconPath?: any;
        contextValue?: string;
        description?: string;
        command?: any;
        constructor(label: string, collapsibleState?: any) {
            this.label = label;
            this.collapsibleState = collapsibleState;
        }
    },
    ThemeIcon: class {
        id: string;
        color: any;
        constructor(id: string, color?: any) {
            this.id = id;
            this.color = color;
        }
    },
    ThemeColor: class {
        id: string;
        constructor(id: string) {
            this.id = id;
        }
    },
    EventEmitter: class {
        event = vi.fn(() => ({ dispose: vi.fn() }));
        fire = vi.fn();
    },
    TreeItemCollapsibleState: {
        Collapsed: 1,
        Expanded: 2,
        None: 0
    },
    window: {
        showInformationMessage: vi.fn(() => Promise.resolve()),
        showWarningMessage: vi.fn(() => Promise.resolve()),
        showErrorMessage: vi.fn(() => Promise.resolve())
    },
    workspace: {
        getConfiguration: vi.fn(() => ({
            get: vi.fn((key: string, defaultValue: any) => defaultValue)
        }))
    }
}));

describe('TerminalHistoryProvider - v0.5.0 Features', () => {
    let provider: TerminalHistoryProvider;
    let mockContext: vscode.ExtensionContext;
    let testStoragePath: string;
    
    beforeEach(() => {
        testStoragePath = path.join('/tmp', `terminal-history-test-${Date.now()}`);
        
        mockContext = {
            globalStorageUri: {
                fsPath: testStoragePath
            },
            subscriptions: []
        } as any;
        
        if (fs.existsSync(testStoragePath)) {
            fs.rmSync(testStoragePath, { recursive: true, force: true });
        }
        
        provider = new TerminalHistoryProvider(mockContext);
    });
    
    afterEach(() => {
        if (fs.existsSync(testStoragePath)) {
            fs.rmSync(testStoragePath, { recursive: true, force: true });
        }
    });
    
    describe('Adding Commands', () => {
        it('should add a command to history', () => {
            const item = new CommandHistoryItem('echo "hello"', 'test-terminal', new Date(), '/test/cwd');
            provider.addCommand(item);
            
            expect(provider.getCommandCount()).toBe(1);
            expect(provider.getHistory()[0].commandText).toBe('echo "hello"');
        });
        
        it('should add multiple commands in reverse chronological order', () => {
            const now = new Date();
            const item1 = new CommandHistoryItem('cmd1', 'terminal1', new Date(now.getTime() - 1000), '/cwd');
            const item2 = new CommandHistoryItem('cmd2', 'terminal1', now, '/cwd');
            
            provider.addCommand(item1);
            provider.addCommand(item2);
            
            expect(provider.getCommandCount()).toBe(2);
            expect(provider.getHistory()[0].commandText).toBe('cmd2');
            expect(provider.getHistory()[1].commandText).toBe('cmd1');
        });
        
        it('should respect max history size', () => {
            const maxSize = 5;
            (provider as any).maxHistorySize = maxSize;
            
            for (let i = 0; i < maxSize + 5; i++) {
                const item = new CommandHistoryItem(`cmd${i}`, 'terminal', new Date(), '/cwd');
                provider.addCommand(item);
            }
            
            expect(provider.getCommandCount()).toBe(maxSize);
            expect(provider.getHistory()[0].commandText).toBe(`cmd${maxSize + 4}`);
        });
    });
    
    describe('Filtering/Search', () => {
        beforeEach(() => {
            const cmds = [
                'npm install',
                'npm run build',
                'git status',
                'git push origin main',
                'echo "hello world"',
                'python script.py',
                'docker-compose up'
            ];
            
            cmds.forEach((cmd, i) => {
                const item = new CommandHistoryItem(cmd, 'test-terminal', new Date(Date.now() + i * 1000), '/test');
                provider.addCommand(item);
            });
        });
        
        it('should filter commands by text', async () => {
            provider.setFilter('npm');
            const children = await provider.getChildren();
            const filtered = children as VSCodeCommandHistoryItem[];
            expect(filtered.length).toBe(2);
            expect(filtered[0].commandText).toContain('npm');
            expect(filtered[1].commandText).toContain('npm');
        });
        
        it('should filter commands case-insensitively', async () => {
            provider.setFilter('GIT');
            const children = await provider.getChildren();
            const filtered = children as VSCodeCommandHistoryItem[];
            expect(filtered.length).toBe(2);
            expect(filtered[0].commandText).toContain('git');
            expect(filtered[1].commandText).toContain('git');
        });
        
        it('should clear filter when empty string is provided', async () => {
            const initialCount = provider.getCommandCount();
            
            provider.setFilter('npm');
            let children = await provider.getChildren();
            expect((children as VSCodeCommandHistoryItem[]).length).toBe(2);
            
            provider.setFilter('');
            children = await provider.getChildren();
            expect((children as VSCodeCommandHistoryItem[]).length).toBe(initialCount);
        });
    });
    
    describe('Deleting Entries', () => {
        beforeEach(() => {
            const cmds = ['cmd1', 'cmd2', 'cmd3'];
            cmds.forEach((cmd, i) => {
                const item = new CommandHistoryItem(cmd, 'terminal', new Date(Date.now() + i * 1000), '/cwd');
                provider.addCommand(item);
            });
        });
        
        it('should delete a specific entry by object reference', () => {
            const history = provider.getHistory();
            const itemToDelete = history[1];
            
            provider.deleteEntry(itemToDelete);
            
            expect(provider.getCommandCount()).toBe(2);
            const remaining = provider.getHistory();
            expect(remaining.some(item => item.commandText === 'cmd2')).toBe(false);
            expect(remaining.map(item => item.commandText)).toEqual(['cmd3', 'cmd1']);
        });
        
        it('should handle deletion of the first entry', () => {
            const history = provider.getHistory();
            const itemToDelete = history[0];
            
            provider.deleteEntry(itemToDelete);
            
            expect(provider.getCommandCount()).toBe(2);
            const remaining = provider.getHistory();
            expect(remaining.map(item => item.commandText)).toEqual(['cmd2', 'cmd1']);
        });
        
        it('should handle deletion of the last entry', () => {
            const history = provider.getHistory();
            const itemToDelete = history[history.length - 1];
            
            provider.deleteEntry(itemToDelete);
            
            expect(provider.getCommandCount()).toBe(2);
            const remaining = provider.getHistory();
            expect(remaining.map(item => item.commandText)).toEqual(['cmd3', 'cmd2']);
        });
        
        it('should update filtered view after deletion', () => {
            provider.setFilter('cmd');
            const itemToDelete = provider.getHistory()[1];
            provider.deleteEntry(itemToDelete);
            
            const remaining = provider.getHistory();
            expect(remaining.length).toBe(2);
            expect(remaining.map(item => item.commandText)).toEqual(['cmd3', 'cmd1']);
        });
    });
    
    describe('Clear History', () => {
        it('should clear all history', () => {
            const cmds = ['cmd1', 'cmd2', 'cmd3'];
            cmds.forEach(cmd => {
                const item = new CommandHistoryItem(cmd, 'terminal', new Date(), '/cwd');
                provider.addCommand(item);
            });
            
            expect(provider.getCommandCount()).toBe(3);
            
            provider.clearHistory();
            
            expect(provider.getCommandCount()).toBe(0);
            expect(provider.getHistory()).toEqual([]);
        });
    });
    
    describe('Storage', () => {
        it('should persist history to storage', () => {
            const item = new CommandHistoryItem('test command', 'terminal', new Date(), '/cwd', 'test output', 0);
            provider.addCommand(item);
            
            const storageFile = path.join(testStoragePath, 'history.json');
            expect(fs.existsSync(storageFile)).toBe(true);
            
            const data = JSON.parse(fs.readFileSync(storageFile, 'utf-8'));
            expect(data).toHaveLength(1);
            expect(data[0].commandText).toBe('test command');
            expect(data[0].exitCode).toBe(0);
        });
        
        it('should load history from storage on initialization', () => {
            const provider1 = new TerminalHistoryProvider(mockContext);
            const item = new CommandHistoryItem('persistent command', 'terminal', new Date(), '/cwd', 'output', 0);
            provider1.addCommand(item);
            
            const provider2 = new TerminalHistoryProvider(mockContext);
            expect(provider2.getCommandCount()).toBe(1);
            expect(provider2.getHistory()[0].commandText).toBe('persistent command');
        });
    });
    
    describe('Tree View Integration', () => {
        it('should create tree items for history entries', async () => {
            const item = new CommandHistoryItem('test command', 'terminal', new Date(), '/cwd', 'output', 0);
            provider.addCommand(item);
            
            const children = await provider.getChildren();
            expect(children).toHaveLength(1);
            const treeItem = children[0];
            expect(treeItem instanceof VSCodeCommandHistoryItem).toBe(true);
            
            const vscodeItem = treeItem as VSCodeCommandHistoryItem;
            expect(vscodeItem.commandText).toBe('test command');
            expect(vscodeItem.contextValue).toBe('historyItem');
        });
        
        it('should create output tree item when expanding command', async () => {
            const item = new CommandHistoryItem('ls', 'terminal', new Date(), '/cwd', 'file1\nfile2', 0);
            provider.addCommand(item);
            
            const children = await provider.getChildren();
            expect(children).toHaveLength(1);
            const commandItem = children[0];
            
            const outputChildren = await provider.getChildren(commandItem);
            expect(outputChildren).toHaveLength(1);
            const outputItem = outputChildren[0];
            expect(outputItem.contextValue).toBe('outputItem');
        });
    });
});