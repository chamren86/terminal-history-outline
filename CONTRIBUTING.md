# Contributing to Terminal Velocity

Thank you for your interest in contributing! This guide will help you get started.

## Prerequisites

- Node.js 18+
- npm
- VS Code

## Development Setup

### 1. Clone the repository

git clone https://github.com/chamren86/terminal-velocity.git
cd terminal-velocity

### 2. Install dependencies

npm install

### 3. Build the extension

npm run compile

### 4. Test the extension

# Run all tests
npm test

# Run quick tests
npm run test:unit

# Run pre-commit checks
npm run precommit

### 5. Package the extension

# Package the VSIX
npm run package

# Or manually
vsce package

### 6. Install locally

# Install the VSIX
code --install-extension terminal-history-outline*.vsix --force

## Project Structure

src/
├── constants/          # Constants and configuration
├── enums/              # TypeScript enums
├── interfaces/         # TypeScript interfaces
├── test/               # Unit tests
├── cleaner.ts          # ANSI cleaning
├── extension.ts        # Extension activation
├── privacyCommands.ts  # Privacy dashboard
├── security.ts         # Security module
└── terminalHistoryProvider.ts # Tree provider

## Common Issues

### "Cannot find package 'strip-ansi'"

Make sure you've run npm install and that strip-ansi is in dependencies in package.json.

### "No data provider registered"

This usually means the constants folder wasn't included. Run npm run compile then vsce package to rebuild.

### Tests failing

Make sure you're using the correct Node.js version (18+) and have installed all dependencies.

## Making Changes

1. Create a feature branch: git checkout -b feature/your-feature
2. Make your changes
3. Run tests: npm test
4. Run pre-commit checks: npm run precommit
5. Commit: git commit -m "Description of changes"
6. Push: git push origin feature/your-feature
7. Create a Pull Request

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Build: npm run compile
4. Package: vsce package
5. Create tag: git tag -a vX.X.X -m "Release vX.X.X"
6. Create release: gh release create vX.X.X --title "vX.X.X" --notes-file RELEASE-NOTES.md terminal-history-outline-X.X.X.vsix

## License

MIT
