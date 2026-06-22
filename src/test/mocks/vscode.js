/**
 * @file vscode.js
 * @description Comprehensive mock of the VS Code API for testing (CommonJS)
 * With TypeScript type declarations
 */

// Mock classes
class TreeItem {
    constructor(label, collapsibleState) {
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.tooltip = undefined;
        this.iconPath = undefined;
        this.contextValue = undefined;
        this.description = undefined;
        this.command = undefined;
    }
}

class ThemeIcon {
    constructor(id, color) {
        this.id = id;
        this.color = color;
    }
}

class ThemeColor {
    constructor(id) {
        this.id = id;
    }
}

class EventEmitter {
    constructor() {
        this.event = () => ({ dispose: () => {} });
        this.fire = () => {};
    }
}

// Enums
const TreeItemCollapsibleState = {
    Collapsed: 1,
    Expanded: 2,
    None: 0
};

const StatusBarAlignment = {
    Left: 1,
    Right: 2
};

const ViewColumn = {
    One: 1,
    Two: 2,
    Three: 3
};

// Mock objects
const window = {
    createTreeView: (viewId, options) => ({
        dispose: () => {},
        onDidChangeVisibility: () => ({ dispose: () => {} }),
        reveal: () => Promise.resolve()
    }),
    showInformationMessage: (message, ...items) => Promise.resolve(items[0] || undefined),
    showWarningMessage: (message, ...items) => Promise.resolve(items[0] || undefined),
    showErrorMessage: (message, ...items) => Promise.resolve(items[0] || undefined),
    showInputBox: (options) => Promise.resolve(undefined),
    createTerminal: (name) => ({
        show: () => {},
        sendText: (text) => {},
        dispose: () => {},
        onDidWriteData: () => ({ dispose: () => {} }),
        onDidCloseTerminal: () => ({ dispose: () => {} })
    }),
    createWebviewPanel: (viewType, title, showOptions, options) => ({
        webview: {
            html: '',
            onDidReceiveMessage: (callback) => ({ dispose: () => {} }),
            postMessage: () => Promise.resolve()
        },
        onDidDispose: (callback) => ({ dispose: () => {} }),
        dispose: () => {},
        reveal: () => {}
    }),
    createStatusBarItem: (alignment, priority) => ({
        text: '',
        tooltip: '',
        show: () => {},
        hide: () => {},
        dispose: () => {}
    }),
    onDidStartTerminalShellExecution: (callback) => ({
        dispose: () => {}
    }),
    onDidEndTerminalShellExecution: (callback) => ({
        dispose: () => {}
    }),
    onDidCloseTerminal: (callback) => ({
        dispose: () => {}
    }),
    onDidChangeTerminalState: (callback) => ({
        dispose: () => {}
    }),
    activeTerminal: null,
    terminals: []
};

const workspace = {
    getConfiguration: (section) => ({
        get: (key, defaultValue) => {
            const defaults = {
                'terminalHistory.maxHistorySize': 100,
                'terminalHistory.security.detectionEnabled': true,
                'terminalHistory.security.redactionLevel': 'warn',
                'terminalHistory.security.customPatterns': [],
                'terminalHistory.security.excludedCommands': [],
                'terminalHistory.security.warnOnDetection': true
            };
            return defaults[key] !== undefined ? defaults[key] : defaultValue;
        },
        update: () => Promise.resolve(),
        has: (key) => false
    }),
    onDidChangeConfiguration: (callback) => ({
        dispose: () => {}
    }),
    workspaceFolders: [],
    onDidCreateFiles: () => ({ dispose: () => {} }),
    onDidDeleteFiles: () => ({ dispose: () => {} })
};

const commands = {
    registerCommand: (commandId, callback) => ({
        dispose: () => {}
    }),
    executeCommand: (commandId, ...args) => Promise.resolve()
};

const env = {
    clipboard: {
        writeText: (text) => Promise.resolve(),
        readText: () => Promise.resolve('')
    },
    appName: 'mock-vscode',
    appRoot: '/mock',
    language: 'en',
    machineId: 'mock',
    sessionId: 'mock',
    shell: '/bin/bash',
    uriScheme: 'vscode'
};

const Uri = {
    file: (path) => ({
        fsPath: path,
        toString: () => path,
        path: path,
        scheme: 'file'
    }),
    parse: (uri) => ({
        fsPath: uri,
        toString: () => uri,
        path: uri,
        scheme: 'file'
    })
};

// ExtensionContext implementation
class ExtensionContext {
    constructor() {
        this.subscriptions = [];
        this.extensionPath = '/mock/path';
        this.globalStoragePath = '/mock/global-storage';
        this.workspaceState = {
            get: (key) => undefined,
            update: (key, value) => Promise.resolve(),
            keys: () => []
        };
        this.globalState = {
            get: (key) => undefined,
            update: (key, value) => Promise.resolve(),
            keys: () => []
        };
        this.extensionUri = Uri.file('/mock/extension/path');
        this.globalStorageUri = Uri.file('/mock/global-storage');
        this.logPath = '/mock/logs';
        this.storagePath = '/mock/storage';
    }
}

// Export the mock
module.exports = {
    TreeItem,
    ThemeIcon,
    ThemeColor,
    EventEmitter,
    TreeItemCollapsibleState,
    StatusBarAlignment,
    ViewColumn,
    window,
    workspace,
    commands,
    env,
    Uri,
    ExtensionContext,
    TreeDataProvider: undefined,
    l10n: { t: (message) => message },
    RelativePattern: class {
        constructor(base, pattern) {
            this.base = base;
            this.pattern = pattern;
        }
    },
    Disposable: { from: (disposables) => ({ dispose: () => {} }) }
};