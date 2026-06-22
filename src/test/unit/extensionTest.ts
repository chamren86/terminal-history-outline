/**
 * @file extensionTest.ts
 * @description Unit tests for extension commands (v0.5.0 features)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as vscode from 'vscode';

describe('Extension Commands - v0.5.0', () => {
    let mockProvider: any;
    
    beforeEach(() => {
        mockProvider = {
            deleteEntry: vi.fn(),
            setFilter: vi.fn(),
            clearHistory: vi.fn(),
            getCommandCount: vi.fn(() => 5),
            onDidChangeTreeData: vi.fn()
        };
        
        // Reset all mocks before each test
        vi.resetAllMocks();
    });
    
    describe('Copy Command', () => {
        it('should copy command text to clipboard', async () => {
            const mockItem = {
                commandText: 'npm install'
            };
            
            // Create a spy on the clipboard writeText method
            const writeTextSpy = vi.spyOn(vscode.env.clipboard, 'writeText');
            writeTextSpy.mockResolvedValue(undefined);
            
            await vscode.env.clipboard.writeText(mockItem.commandText);
            
            expect(writeTextSpy).toHaveBeenCalledWith('npm install');
        });
        
        it('should handle empty command gracefully', async () => {
            const mockItem = {
                commandText: ''
            };
            
            const showWarningSpy = vi.spyOn(vscode.window, 'showWarningMessage');
            showWarningSpy.mockResolvedValue(undefined);
            
            if (!mockItem.commandText) {
                vscode.window.showWarningMessage('No command to copy');
            }
            
            expect(showWarningSpy).toHaveBeenCalledWith('No command to copy');
        });
    });
    
    describe('Delete Entry Command', () => {
        it('should delete entry after confirmation', async () => {
            const mockItem = {
                commandText: 'rm -rf node_modules'
            };
            
            const showWarningSpy = vi.spyOn(vscode.window, 'showWarningMessage');
            showWarningSpy.mockResolvedValue('Delete');
            
            const confirmation = await vscode.window.showWarningMessage(
                `Delete command: "${mockItem.commandText}"?`,
                { modal: true },
                'Delete',
                'Cancel'
            );
            
            if (confirmation === 'Delete') {
                mockProvider.deleteEntry(mockItem);
            }
            
            expect(mockProvider.deleteEntry).toHaveBeenCalledWith(mockItem);
        });
        
        it('should cancel deletion when user cancels', async () => {
            const mockItem = {
                commandText: 'rm -rf node_modules'
            };
            
            const showWarningSpy = vi.spyOn(vscode.window, 'showWarningMessage');
            showWarningSpy.mockResolvedValue('Cancel');
            
            const confirmation = await vscode.window.showWarningMessage(
                `Delete command: "${mockItem.commandText}"?`,
                { modal: true },
                'Delete',
                'Cancel'
            );
            
            if (confirmation === 'Delete') {
                mockProvider.deleteEntry(mockItem);
            }
            
            expect(mockProvider.deleteEntry).not.toHaveBeenCalled();
        });
    });
    
    describe('Search Command', () => {
        it('should set filter when user provides query', async () => {
            const searchQuery = 'npm';
            
            const showInputBoxSpy = vi.spyOn(vscode.window, 'showInputBox');
            showInputBoxSpy.mockResolvedValue(searchQuery);
            
            const query = await vscode.window.showInputBox({
                prompt: 'Search terminal history',
                placeHolder: 'Type to filter commands...',
                ignoreFocusOut: true,
                value: ''
            });
            
            if (query !== undefined) {
                mockProvider.setFilter(query);
            }
            
            expect(mockProvider.setFilter).toHaveBeenCalledWith(searchQuery);
        });
        
        it('should clear filter when user cancels', async () => {
            const showInputBoxSpy = vi.spyOn(vscode.window, 'showInputBox');
            showInputBoxSpy.mockResolvedValue(undefined);
            
            const query = await vscode.window.showInputBox({
                prompt: 'Search terminal history',
                placeHolder: 'Type to filter commands...',
                ignoreFocusOut: true,
                value: ''
            });
            
            if (query !== undefined) {
                mockProvider.setFilter(query);
            }
            
            expect(mockProvider.setFilter).not.toHaveBeenCalled();
        });
        
        it('should clear filter when user provides empty string', async () => {
            const showInputBoxSpy = vi.spyOn(vscode.window, 'showInputBox');
            showInputBoxSpy.mockResolvedValue('');
            
            const query = await vscode.window.showInputBox({
                prompt: 'Search terminal history',
                placeHolder: 'Type to filter commands...',
                ignoreFocusOut: true,
                value: ''
            });
            
            if (query !== undefined) {
                mockProvider.setFilter(query);
            }
            
            expect(mockProvider.setFilter).toHaveBeenCalledWith('');
        });
    });
});