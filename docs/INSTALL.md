# Installation Guide

## Method 1: VSIX File (Recommended for Beta Testing)

### Step 1: Download the VSIX
Download the latest `.vsix` file from:
- [GitHub Releases](https://github.com/chamren86/terminal-velocity/releases)

### Step 2: Install in VS Code

**Option A: VS Code UI**
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Click the `...` menu in the top-right
4. Select "Install from VSIX..."
5. Choose the downloaded `.vsix` file

**Option B: Command Line**

code --install-extension terminal-history-outline-1.0.1.vsix

**Option C: Drag and Drop**
1. Open VS Code
2. Drag the `.vsix` file into the Extensions panel

### Step 3: Verify Installation
1. Go to Extensions (Ctrl+Shift+X)
2. Search for "@installed"
3. Look for "Terminal Velocity"

## Method 2: From Source (For Development)

git clone https://github.com/chamren86/terminal-velocity.git
cd terminal-velocity
npm install
npm run compile

Press F5 in VS Code to launch the extension in a development window.

## Troubleshooting

### Command not captured?
Ensure Shell Integration is enabled:
1. Open VS Code Settings (Ctrl+,)
2. Search for "shell integration enabled"
3. Check `Terminal > Integrated > Shell Integration: Enabled`

### Extension not showing?
1. Reload VS Code: `Ctrl+Shift+P` → `Developer: Reload Window`
2. Check the Explorer panel for "Terminal History" section

### Feedback
Please report issues at: https://github.com/chamren86/terminal-velocity/issues