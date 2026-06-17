// Mock vscode module for testing (CommonJS)
module.exports = {
    TreeItem: class TreeItem {
        constructor(label, collapsibleState) {
            this.label = label;
            this.collapsibleState = collapsibleState;
        }
    },
    ThemeIcon: class ThemeIcon {
        constructor(id, color) {
            this.id = id;
            this.color = color;
        }
    },
    ThemeColor: class ThemeColor {
        constructor(id) {
            this.id = id;
        }
    },
    TreeItemCollapsibleState: {
        Collapsed: 1,
        Expanded: 2,
        None: 0
    },
    window: {
        createTreeView: () => ({}),
        showInformationMessage: () => Promise.resolve(),
        showWarningMessage: () => Promise.resolve(),
        showErrorMessage: () => Promise.resolve()
    },
    commands: {
        registerCommand: () => ({ dispose: () => {} })
    },
    workspace: {
        getConfiguration: () => ({
            get: (key, defaultValue) => {
                const defaults = {
                    'security.detectionEnabled': true,
                    'security.redactionLevel': 'warn',
                    'security.customPatterns': [],
                    'security.excludedCommands': [],
                    'security.warnOnDetection': true
                };
                return defaults[key] !== undefined ? defaults[key] : defaultValue;
            }
        }),
        onDidChangeConfiguration: () => ({ dispose: () => {} })
    },
    env: {
        clipboard: {
            writeText: () => Promise.resolve()
        }
    },
    Uri: {
        file: (path) => ({ fsPath: path, toString: () => path })
    }
};