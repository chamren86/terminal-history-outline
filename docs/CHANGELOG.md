# Changelog

All notable changes to the "terminal-history-outline" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## v0.5.0 - Usability & Productivity

### 🚀 New Features

- 📋 **Copy Command** - Copy the command text to clipboard
- 📋 **Copy Command & Output** - Copy both the command and its output together
- 🗑️ **Delete Entry** - Remove individual commands from history
- 🔘 **Inline Action Buttons** - Quick access to actions directly on each entry

### 🎨 Improvements

- 🟢 **Colored Status Indicators** - 🟢 Success, 🔴 Error, 🟡 Running
- ⏱️ **Time Ago Display** - Shows time since command execution (e.g., "2s", "5m", "3h")
- 🔒 **Security Redaction** - Automatically detects and redacts sensitive data
- 📊 **Privacy Dashboard** - View and manage security settings
- 🧪 **57 Passing Tests** - Full test coverage for all features

### 🏗️ Technical Changes

- 🔄 **ESM Support** - Switched to modern ES modules
- 📦 **Clean Packaging** - No security warnings in VSIX
- 🔧 **Build Scripts** - Updated build and packaging process

### 🔜 Future

- 🔍 **Search/Filter** - Coming in a future update
- 📁 **Groups & Organization** - Planned for v1.1.0
- 🤖 **AI Integration** - Planned for v1.2.0

## v0.4.4 - Improved Exit Code Detection (2026-06-19)

### Added
- 🔍 **Multi-layer exit code detection**
  - Layer 1: Exit code from terminal event
  - Layer 2: Exit status from terminal object
  - Layer 3: Output analysis as fallback

### Changed
- 🔄 **Status indicators** - More accurate command status display
  - 🟢 Green for successful commands (exit code 0)
  - 🔴 Red for failed commands (non-zero exit code)
  - 🟡 Yellow for running commands
  - 🟠 Orange for warning state

## [0.4.3] - 2026-06-18

### Added
- 📁 `src/constants/` - Centralized constants directory
  - `sensitivePatterns.ts` - Predefined regex patterns for sensitive data detection
  - `commandPatterns.ts` - Command cleaning and error detection patterns
  - `vsCodeConstants.ts` - VS Code context values and API constants
  - `displayConstants.ts` - UI strings, lengths, and formatting
  - `regexPatterns.ts` - VS Code sequence patterns for cleaner.ts
  - `configDefaults.ts` - Default configuration values
- 📚 Comprehensive JSDoc documentation for all major classes and functions
  - `extension.ts` - File-level and function-level documentation
  - `security.ts` - Full documentation with examples
  - `terminalHistoryProvider.ts` - Complete class and method documentation
  - `privacyCommands.ts` - Dashboard command documentation

### Changed
- 🔄 Refactored `security.ts` to import patterns and defaults from constants
- 🔄 Refactored `cleaner.ts` to use constants for regex patterns
- 🔄 Refactored `extension.ts` to use constants for command cleaning and error detection
- 🔄 Refactored `terminalHistoryProvider.ts` to use constants for display limits
- 🔄 Refactored `privacyCommands.ts` to use constants for UI strings
- 🔄 Better separation of data, constants, and logic
- 🔄 Improved code organization and maintainability

### Developer Experience
- 📖 Clearer documentation for contributors
- 🔧 Easier to maintain and extend
- 🎯 Better separation of concerns
- 🚀 Single source of truth for constants

## [0.4.2] - 2026-06-18

### Added
- Enum directory for type-safe constants (`src/enums/`)
  - `RedactionAction` - proceed, redact, block actions
  - `RedactionLevel` - off, warn, redact, block levels
- Interface directory for type definitions (`src/interfaces/`)
  - `ISecurityConfig` - Security configuration interface
  - `ISensitivePattern` - Sensitive pattern interface
  - `ICommandHistoryItem` - Command history item interface
  - `IOutputTreeItem` - Output tree item interface
  - `ITerminalExecution` - Terminal execution interface
  - `IPrivacyDashboardStats` - Privacy dashboard statistics interface

### Changed
- Refactored `security.ts` to use enum and interface imports
- Improved type safety across the codebase
- Separated interfaces from logic for better maintainability

### Fixed
- Type consistency in tests
- Import paths for new enum and interface directories

## [0.4.1] - 2026-06-17

### Added
- Pre-commit validation script (`npm run precommit`)
- Pre-push validation script (`npm run prepush`)
- Unit test script (`npm run test:unit`)
- Full test script (`npm run test:full`)
- `act` integration for local GitHub Actions testing
- VSIX packaging support with `.vscodeignore`
- Test documentation

### Changed
- Migrated from mocha to vitest for better ESM support
- Improved security module logic in `shouldRedactOrBlock`
- Updated test scripts to use vitest
- Improved Docker detection in precommit script
- Cleaner VSIX packaging

### Fixed
- Security test failures related to SSH key redaction
- shouldRedactOrBlock function logic order
- Detection disabled test case
- VSIX packaging security warnings

## [0.4.0] - 2026-06-17

### Added
- 🔒 Sensitive data detection (passwords, API keys, tokens)
- 🔒 Auto-redaction with `[REDACTED]` placeholder
- 🔒 Command exclusion patterns
- 📊 Privacy dashboard
- ✅ 37 security tests (49 total passing)
- ⚙️ Configuration settings for all security features

### Changed
- 🔄 Security module decoupled from VS Code for testability
- 🔄 Improved error handling in config loading

### Fixed
- Security test edge cases and pattern matching

## [0.3.0] - 2026-06-16

### Added
- Testing infrastructure with mocha
- 49 unit tests (12 ANSI + 37 security)
- `cleaner.ts` - Pure function module
- Test fixtures for ANSI and security testing
- `npm test` script for running tests

### Changed
- Separated ANSI cleaning logic into `cleaner.ts`
- Updated `terminalHistoryProvider.ts` to import cleaner module

## [0.2.0] - 2026-06-15

### Added
- 🟢 Colored emoji status indicators
- 📝 Command output capture and cleaning
- 🔄 Command rerun functionality
- 📋 Copy output to clipboard
- 💾 Persistent history storage
- 🎨 ANSI code stripping

## [0.1.0] - 2026-06-14

### Added
- 🎉 First working prototype
- Basic command capture
- Tree view integration