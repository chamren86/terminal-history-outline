# Terminal History Outline

[![Version](https://img.shields.io/badge/version-0.4.0-blue.svg)](https://github.com/chamren86/terminal-history-outline)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.93%2B-blue.svg)](https://code.visualstudio.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

View and manage your terminal command history directly in the VS Code Explorer outline view.

## Features

- 📝 **Command History** - Automatically captures every command and its output
- 🟢/🔴/🟡 **Status Indicators** - Shows success, failure, or running status
- 🔧 **Actions** - Rerun commands, copy output, clear history
- 🔒 **Security** - Detects and redacts passwords, API keys, and tokens (v0.4.0)
- 🎨 **Clean Display** - Strips ANSI codes and shows clean output
- 💾 **Persistent** - History survives VS Code restarts

## Installation

From VS Code: Search for "Terminal History Outline" in the Extensions view (Ctrl+Shift+X).

Or from source:

`git clone https://github.com/chamren86/terminal-history-outline.git`
`cd terminal-history-outline`
`npm install`
`npm run compile`

Press F5 to launch the extension in a development window.

## Usage

1. Open a terminal (`` Ctrl+` ``)
2. Run any command - it appears in the Terminal History view (Explorer sidebar)
3. Click a command to see its output
4. Right-click for actions: Rerun, Copy Output

### Commands

| Command | Description |
|---------|-------------|
| `Clear Terminal History` | Clear all saved commands |
| `Rerun Command` | Re-run the selected command |
| `Copy Output` | Copy command output to clipboard |
| `Privacy Dashboard` | View and manage security settings |

## Configuration

VS Code settings (`Ctrl+,`):

`terminalHistory.maxHistorySize`: 100
`terminalHistory.security.detectionEnabled`: true
`terminalHistory.security.redactionLevel`: "warn"
`terminalHistory.security.excludedCommands`: []

## Development

`npm install` - Install dependencies
`npm run watch` - Compile in watch mode
`npm test` - Run tests
`npm run test:unit` - Quick tests
`npm run precommit` - Test before committing
`npm run prepush` - Full validation before pushing

### Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all unit tests |
| `npm run test:unit` | Quick tests (fast) |
| `npm run test:full` | Full suite with clean install |
| `npm run precommit` | Test uncommitted changes |
| `npm run prepush` | Full validation |

### Project Structure

src/
├── cleaner.ts              # ANSI cleaning
├── extension.ts            # Extension activation
├── security.ts             # Security module
├── terminalHistoryProvider.ts # Tree provider
└── test/                   # Unit tests

## Requirements

- VS Code 1.93+
- Shell Integration enabled (default: on)

## Roadmap

**v0.4.0** (Current) - Security & Privacy ✅
**v0.5.0** - Improved Output Cleaning
**v0.6.0** - Search & Filter
**v1.0.0** - Production Release

[Full Roadmap](docs/FEATURES.md)

## Release Notes

### v0.4.0 - Security & Privacy
- 🔒 Sensitive data detection (passwords, API keys, tokens)
- 🔒 Auto-redaction with `[REDACTED]`
- 📊 Privacy dashboard
- ✅ 49 passing tests

### v0.3.0 - Testing Infrastructure
- ✅ Mocha test framework with 49 tests
- ✅ Cleaner module with no VS Code dependencies

### v0.2.0 - Stable Release
- 🟢 Colored status indicators
- 📝 Command output capture
- 🔄 Rerun and copy actions

[Full Release Notes](RELEASE-NOTES.md)

## License

MIT © [chamren86](https://github.com/chamren86)

---

**Enjoy tracking your terminal history!** 🚀