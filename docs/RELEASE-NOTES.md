
## `RELEASE-NOTES.md`

```markdown
# Release Notes

## v1.0.0 - Production Release 🚀

### 🎉 Welcome to the first stable release!

After months of development and testing, Terminal History Outline is now production-ready.

### ✨ Key Features

- 📝 **Command History** - Automatically captures every command and its output
- 🟢🔴🟡 **Status Indicators** - Visual status (Success/Error/Running)
- 🔧 **Action Buttons** - Rerun, Copy, Delete directly on each entry
- 📋 **Copy Options** - Copy command, output, or both
- 🔒 **Security Redaction** - Detects and redacts sensitive data
- 📊 **Privacy Dashboard** - View and manage security settings
- 🎨 **Clean Display** - Strips ANSI codes for readable output
- 💾 **Persistent** - History survives VS Code restarts
- ⏱️ **Time Display** - Shows time since command execution

### 🧪 Quality Assurance

- ✅ **57 Passing Tests** - Comprehensive test coverage
- ✅ **ESM Support** - Modern module system
- ✅ **Clean Packaging** - No security warnings
- ✅ **Full Documentation** - Complete JSDoc comments

### 📦 Installation

**From VS Code Marketplace:**
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Terminal History Outline"
4. Click Install

**From VSIX:**
1. Download the `.vsix` file from the release assets
2. In VS Code, go to Extensions → "..." → Install from VSIX
3. Select the downloaded file

### 🔜 Roadmap

- **v1.1.0** - Groups & Organization
- **v1.2.0** - AI & Agent Integration
- **v1.3.0** - Export & Save
- **v1.4.0** - Customization & UX

## v0.4.3 - Constants Extraction & Comprehensive Documentation (2026-06-18)

### Added
- 📁 New `src/constants/` directory with 6 organized constant files
- 📚 Full JSDoc documentation for all classes and functions
- 🔍 All magic numbers and strings replaced with named constants

### Changed
- 🔄 Refactored entire codebase to use centralized constants
- 🔄 Better separation of data, constants, and logic
- 🔄 Improved code organization and maintainability

### Developer Experience
- 📖 Clearer documentation for contributors
- 🔧 Easier to maintain and extend
- 🎯 Single source of truth for all constants

## v0.4.2 - Type Safety Refactor (2026-06-18)

### Added
- 📁 `src/enums/` - Type-safe constants for actions and levels
- 📁 `src/interfaces/` - Centralized type definitions
- 🛡️ Improved TypeScript type safety throughout the codebase

### Changed
- 🔄 Refactored `security.ts` to use imported enums and interfaces
- 🔄 Better separation of concerns (types vs logic)

### Developer Experience
- 📚 Clearer code structure for contributors
- ✅ Better IDE autocomplete and type checking
- 🔧 Easier to maintain and extend

## v0.4.1 - Testing Infrastructure & Pre-commit (2026-06-17)

### Added
- 🛠️ Pre-commit validation script (`npm run precommit`)
- 🛠️ Pre-push validation script (`npm run prepush`)
- ⚡ Quick unit test script (`npm run test:unit`)
- 🔬 Full test suite script (`npm run test:full`)
- 🐳 `act` integration for local GitHub Actions testing
- 📚 Comprehensive test documentation
- 📦 VSIX packaging support

### Changed
- 🔄 Migrated from mocha to vitest (faster, better ESM support)
- 🔄 Improved security module logic
- 🔄 Updated test scripts and configuration
- 🔄 Improved `.vscodeignore` for cleaner VSIX packaging

### Fixed
- 🐛 Security test edge cases
- 🐛 shouldRedactOrBlock function logic
- 🐛 Docker detection in precommit script
- 🐛 VSIX packaging security warnings

## v0.4.0 - Security & Privacy (2026-06-17)

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

## v0.3.0 - Testing Infrastructure (2026-06-16)

### Added
- ✅ Mocha test framework with BDD interface
- ✅ 49 unit tests (12 ANSI + 37 security)
- ✅ `cleaner.ts` - Pure function module
- ✅ Test fixtures for ANSI and security testing
- ✅ `npm test` script for running tests

### Changed
- 🔄 Separated ANSI cleaning logic into `cleaner.ts`
- 🔄 Updated `terminalHistoryProvider.ts` to import cleaner module

## v0.2.0 - Stable Release (2026-06-15)

### Added
- 🟢 Colored emoji status indicators
- 📝 Command output capture and cleaning
- 🔄 Command rerun functionality
- 📋 Copy output to clipboard
- 💾 Persistent history storage
- 🎨 ANSI code stripping

## v0.1.0 - Initial Prototype (2026-06-14)

### Added
- 🎉 First working prototype
- Basic command capture
- Tree view integration