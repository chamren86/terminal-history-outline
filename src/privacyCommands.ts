/**
 * @file privacyCommands.ts
 * @description Privacy dashboard commands for the Terminal History Outline extension.
 * 
 * This file handles:
 * - Registering the privacy dashboard command
 * - Creating and managing the privacy dashboard webview
 * - Displaying security statistics and settings
 * - Handling user actions from the dashboard (clear history, open settings)
 * 
 * @module privacyCommands
 */

import * as vscode from 'vscode';
import { TerminalHistoryProvider } from './terminalHistoryProvider.js';
import { getSecurityConfig } from './security.js';
import { RedactionLevel } from './enums/index.js';
import {
    DASHBOARD_TITLE,
    SECURITY_NOTICE
} from './constants/index.js';

/**
 * Registers all privacy-related commands for the extension.
 * 
 * @param context - The VS Code extension context for registering subscriptions.
 * @param historyProvider - The terminal history provider instance for accessing history data.
 * @returns {void}
 * 
 * @description
 * This function registers:
 * - `terminalHistory.privacyDashboard` - Opens the privacy dashboard webview
 * - `terminalHistory.clearSensitive` - Placeholder for clearing sensitive commands
 */
export function registerPrivacyCommands(
    context: vscode.ExtensionContext,
    historyProvider: TerminalHistoryProvider
) {
    // Privacy dashboard command
    const privacyDashboardCommand = vscode.commands.registerCommand(
        'terminalHistory.privacyDashboard',
        async () => {
            const panel = vscode.window.createWebviewPanel(
                'terminalHistoryPrivacy',
                DASHBOARD_TITLE,
                vscode.ViewColumn.One,
                { enableScripts: true }
            );
            
            const history = historyProvider.getHistory();
            const totalCommands = history.length;
            const config = getSecurityConfig();
            
            // Map enum to display string
            const redactionLevelDisplay = {
                [RedactionLevel.OFF]: 'Off',
                [RedactionLevel.WARN]: 'Warn',
                [RedactionLevel.REDACT]: 'Redact',
                [RedactionLevel.BLOCK]: 'Block'
            }[config.redactionLevel] || 'Unknown';
            
            panel.webview.html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${DASHBOARD_TITLE}</title>
                    <style>
                        body { padding: 20px; font-family: var(--vscode-font-family); color: var(--vscode-foreground); }
                        .stats { display: flex; gap: 20px; margin-bottom: 30px; }
                        .stat-card { background: var(--vscode-editor-background); padding: 15px; border-radius: 5px; flex: 1; border: 1px solid var(--vscode-panel-border); }
                        .stat-number { font-size: 2em; font-weight: bold; }
                        .stat-label { color: var(--vscode-descriptionForeground); }
                        .actions { margin: 20px 0; display: flex; gap: 10px; flex-wrap: wrap; }
                        .button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); 
                                  padding: 8px 16px; border: none; cursor: pointer; margin: 5px; border-radius: 2px; }
                        .button:hover { background: var(--vscode-button-hoverBackground); }
                        .button.danger { background: var(--vscode-errorForeground); }
                        .button.danger:hover { opacity: 0.8; }
                        .warning { color: var(--vscode-errorForeground); margin: 10px 0; }
                        .security-status { background: var(--vscode-input-background); padding: 15px; border-radius: 5px; margin: 20px 0; }
                        .setting { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--vscode-panel-border); }
                        .setting-value { color: var(--vscode-descriptionForeground); }
                    </style>
                </head>
                <body>
                    <h1>🛡️ Privacy Dashboard</h1>
                    
                    <div class="stats">
                        <div class="stat-card">
                            <div class="stat-number">${totalCommands}</div>
                            <div class="stat-label">Total Commands Stored</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${config.detectionEnabled ? '✅' : '❌'}</div>
                            <div class="stat-label">Security Detection</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${redactionLevelDisplay}</div>
                            <div class="stat-label">Redaction Level</div>
                        </div>
                    </div>
                    
                    <div class="security-status">
                        <h3>Current Security Settings</h3>
                        <div class="setting">
                            <span>Detection Enabled</span>
                            <span class="setting-value">${config.detectionEnabled ? 'Yes' : 'No'}</span>
                        </div>
                        <div class="setting">
                            <span>Redaction Level</span>
                            <span class="setting-value">${redactionLevelDisplay}</span>
                        </div>
                        <div class="setting">
                            <span>Excluded Commands</span>
                            <span class="setting-value">${config.excludedCommands.length || 'None'}</span>
                        </div>
                        <div class="setting">
                            <span>Custom Patterns</span>
                            <span class="setting-value">${config.customPatterns.length || 'None'}</span>
                        </div>
                    </div>
                    
                    <h2>Actions</h2>
                    <div class="actions">
                        <button class="button" onclick="clearHistory()">🗑️ Clear All History</button>
                        <button class="button" onclick="openSettings()">⚙️ Open Security Settings</button>
                        <button class="button" onclick="exportHistory()">📤 Export History</button>
                        <button class="button danger" onclick="clearSensitive()">🔴 Clear Sensitive Only</button>
                    </div>
                    
                    <div class="warning">
                        <p>${SECURITY_NOTICE}</p>
                    </div>
                    
                    <script>
                        const vscode = acquireVsCodeApi();
                        function clearHistory() { vscode.postMessage({ command: 'clearHistory' }); }
                        function clearSensitive() { vscode.postMessage({ command: 'clearSensitive' }); }
                        function exportHistory() { vscode.postMessage({ command: 'exportHistory' }); }
                        function openSettings() { vscode.postMessage({ command: 'openSettings' }); }
                    </script>
                </body>
                </html>
            `;
            
            panel.webview.onDidReceiveMessage(async (message) => {
                switch (message.command) {
                    case 'clearHistory':
                        await historyProvider.clearHistory();
                        vscode.window.showInformationMessage('History cleared');
                        panel.dispose();
                        break;
                    case 'openSettings':
                        vscode.commands.executeCommand('workbench.action.openSettings', 'terminalHistory.security');
                        break;
                }
            });
        }
    );
    
    // Clear sensitive commands (placeholder for future implementation)
    const clearSensitiveCommand = vscode.commands.registerCommand(
        'terminalHistory.clearSensitive',
        async () => {
            vscode.window.showInformationMessage('Clear sensitive commands - Feature coming soon!');
        }
    );
    
    context.subscriptions.push(privacyDashboardCommand, clearSensitiveCommand);
}