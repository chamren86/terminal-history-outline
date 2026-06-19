// Mock vscode module for testing
export class TreeItem {
    label: string;
    collapsibleState: any;
    
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

export const TreeItemCollapsibleState = {
    Collapsed: 1,
    Expanded: 2,
    None: 0
};

export const window = {
    createTreeView: () => ({}),
    showInformationMessage: () => Promise.resolve(),
    showWarningMessage: () => Promise.resolve(),
    showErrorMessage: () => Promise.resolve()
};

export const commands = {
    registerCommand: () => ({ dispose: () => {} })
};

export const workspace = {
    getConfiguration: () => ({
        get: (key: string, defaultValue: any) => defaultValue
    })
};

export const env = {
    clipboard: {
        writeText: () => Promise.resolve()
    }
};

export const Uri = {
    file: (path: string) => ({ fsPath: path, toString: () => path })
};
