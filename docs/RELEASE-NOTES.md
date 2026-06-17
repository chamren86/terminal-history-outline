# Release Notes

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