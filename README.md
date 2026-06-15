# Terminal History Outline

[![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)](https://github.com/chamren86/terminal-history-outline)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.93%2B-blue.svg)](https://code.visualstudio.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

View and manage your terminal command history directly in the VS Code Explorer outline view. Never lose track of what commands you've run or their outputs again!

## Features

### 📝 Command History
- Automatically captures every command you run in VS Code terminals
- Stores both commands and their full output
- Persists history across VS Code sessions
- Configurable history size (default: 100 commands)

### 🎯 Visual Status Indicators
- 🟢 **Green** - Command succeeded (exit code 0)
- 🔴 **Red** - Command failed (non-zero exit code)
- 🟡 **Yellow** - Command is currently running

### 🔧 Actions
- **Rerun** any command with one click
- **Copy** command output to clipboard
- **Clear** entire history
- **Expand** any command to view its full output

### 🎨 Clean Display
- Automatically strips ANSI color codes
- Removes VS Code shell integration sequences
- Shows clean, readable command output
- Displays relative timestamps (e.g., "5s ago", "2m ago")

## Installation

### From VS Code Marketplace (Coming Soon)
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Terminal History Outline"
4. Click Install

### Manual Installation
1. Download the `.vsix` file from [Releases](https://github.com/chamren86/terminal-history-outline/releases)
2. In VS Code, go to Extensions (Ctrl+Shift+X)
3. Click the `...` menu → "Install from VSIX..."
4. Select the downloaded file

### From Source
```bash
git clone https://github.com/chamren86/terminal-history-outline.git
cd terminal-history-outline
npm install
npm run compile
# Press F5 to launch extension development host