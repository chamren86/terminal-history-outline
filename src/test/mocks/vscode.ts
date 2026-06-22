/**
 * @file vscode.ts
 * @description Comprehensive mock of the VS Code API for testing
 */

// Type declarations for VS Code API
export interface ExtensionContext {
    subscriptions: any[];
    extensionPath: string;
    globalStoragePath: string;
    workspaceState: {
        get: (key: string) => any;
        update: (key: string, value: any) => Promise<void>;
        keys: () => string[];
    };
    globalState: {
        get: (key: string) => any;
        update: (key: string, value: any) => Promise<void>;
        keys: () => string[];
    };
    extensionUri: Uri;
    globalStorageUri: Uri;
    logPath: string;
    storagePath: string;
}

export interface TreeDataProvider<T> {
    onDidChangeTreeData?: any;
    getChildren(element?: T): T[] | Promise<T[]>;
    getTreeItem(element: T): TreeItem | Promise<TreeItem>;
    getParent?(element: T): T | undefined;
}

export interface EventEmitter<T> {
    event: any;
    fire: (data?: T) => void;
}

export interface Uri {
    fsPath: string;
    toString(): string;
    path: string;
    scheme: string;
}

export interface TreeItem {
    label: string;
    collapsibleState: any;
    tooltip?: string;
    iconPath?: any;
    contextValue?: string;
    description?: string;
    command?: any;
}

// Implementation classes
export class TreeItem implements TreeItem {
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
}

export class ThemeIcon {
    id: string;
    color: any;
    
    constructor(id: string, color?: any) {
        this.id = id;
        this.color = color;
    }
}

export class ThemeColor {
    id: string;
    
    constructor(id: string) {
        this.id = id;
    }
}

export class EventEmitter<T> implements EventEmitter<T> {
    event: any = () => ({ dispose: () => {} });
    fire: (data?: T) => void = () => {};
}

// Enums
export const TreeItemCollapsibleState = {
    Collapsed: 1,
    Expanded: 2,
    None: 0
};

export const StatusBarAlignment = {
    Left: 1,
    Right: 2
};

export const ViewColumn = {
    One: 1,
    Two: 2,
    Three: 3
};

// Mock objects with comprehensive API support
export const window: any = {
    createTreeView: (viewId: string, options: any) => ({
        dispose: () => {},
        onDidChangeVisibility: () => ({ dispose: () => {} }),
        reveal: () => Promise.resolve()
    }),
    showInformationMessage: (message: string, ...items: any[]) => Promise.resolve(items[0] || undefined),
    showWarningMessage: (message: string, ...items: any[]) => Promise.resolve(items[0] || undefined),
    showErrorMessage: (message: string, ...items: any[]) => Promise.resolve(items[0] || undefined),
    showInputBox: (options?: any) => Promise.resolve(undefined),
    createTerminal: (name?: string) => ({
        show: () => {},
        sendText: (text: string) => {},
        dispose: () => {},
        onDidWriteData: () => ({ dispose: () => {} }),
        onDidCloseTerminal: () => ({ dispose: () => {} })
    }),
    createWebviewPanel: (viewType: string, title: string, showOptions: any, options?: any) => ({
        webview: {
            html: '',
            onDidReceiveMessage: (callback: any) => ({ dispose: () => {} }),
            postMessage: () => Promise.resolve()
        },
        onDidDispose: (callback: any) => ({ dispose: () => {} }),
        dispose: () => {},
        reveal: () => {}
    }),
    createStatusBarItem: (alignment?: number, priority?: number) => ({
        text: '',
        tooltip: '',
        show: () => {},
        hide: () => {},
        dispose: () => {}
    }),
    onDidStartTerminalShellExecution: (callback: any) => ({
        dispose: () => {}
    }),
    onDidEndTerminalShellExecution: (callback: any) => ({
        dispose: () => {}
    }),
    onDidCloseTerminal: (callback: any) => ({
        dispose: () => {}
    }),
    onDidChangeTerminalState: (callback: any) => ({
        dispose: () => {}
    }),
    activeTerminal: null,
    terminals: []
};

export const workspace: any = {
    getConfiguration: (section?: string) => ({
        get: (key: string, defaultValue: any) => {
            const defaults: Record<string, any> = {
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
        has: (key: string) => false
    }),
    onDidChangeConfiguration: (callback: any) => ({
        dispose: () => {}
    }),
    workspaceFolders: [],
    onDidCreateFiles: () => ({ dispose: () => {} }),
    onDidDeleteFiles: () => ({ dispose: () => {} })
};

export const commands: any = {
    registerCommand: (commandId: string, callback: any) => ({
        dispose: () => {}
    }),
    executeCommand: (commandId: string, ...args: any[]) => Promise.resolve()
};

export const env: any = {
    clipboard: {
        writeText: (text: string) => Promise.resolve(),
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

export const Uri: any = {
    file: (path: string) => ({
        fsPath: path,
        toString: () => path,
        path: path,
        scheme: 'file'
    }),
    parse: (uri: string) => ({
        fsPath: uri,
        toString: () => uri,
        path: uri,
        scheme: 'file'
    })
};

// ExtensionContext implementation
export const ExtensionContext: any = class {
    subscriptions: any[] = [];
    extensionPath: string = '/mock/path';
    globalStoragePath: string = '/mock/global-storage';
    workspaceState = {
        get: (key: string) => undefined,
        update: (key: string, value: any) => Promise.resolve(),
        keys: () => []
    };
    globalState = {
        get: (key: string) => undefined,
        update: (key: string, value: any) => Promise.resolve(),
        keys: () => []
    };
    extensionUri = Uri.file('/mock/extension/path');
    globalStorageUri = Uri.file('/mock/global-storage');
    logPath = '/mock/logs';
    storagePath = '/mock/storage';
};

// Default export for the module
const vscode = {
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
    TreeDataProvider: undefined as any,
    l10n: { t: (message: string) => message },
    RelativePattern: class {
        base: string;
        pattern: string;
        constructor(base: string, pattern: string) {
            this.base = base;
            this.pattern = pattern;
        }
    },
    Disposable: { from: (disposables: any[]) => ({ dispose: () => {} }) }
};

export default vscode;