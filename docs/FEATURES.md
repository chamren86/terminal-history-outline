# Terminal History Outline - Feature Roadmap

## Current Status
- **Version**: 0.4.0
- **Status**: ✅ Stable - Security features implemented

## Completed Features

### v0.4.0 - Security & Privacy
- ✅ Sensitive data detection (passwords, API keys, tokens)
- ✅ Auto-redaction with `[REDACTED]`
- ✅ Command exclusion patterns
- ✅ Privacy dashboard
- ✅ 37 security tests (49 total passing)
- ✅ Configuration settings for all security features

### v0.3.0 - Testing Infrastructure
- ✅ Mocha test framework with 49 tests
- ✅ `cleaner.ts` - Pure function module
- ✅ Test fixtures for ANSI and security testing
- ✅ Fast test execution (~4ms for 12 tests)

### v0.2.0 - Core Functionality
- ✅ Command capture from VS Code terminals
- ✅ Full command output capture with streaming
- ✅ 🟢/🔴/🟡 Status indicators
- ✅ Rerun commands and copy output
- ✅ Persistent history across sessions
- ✅ ANSI color code stripping

## Planned Features

### v0.5.0 - Improved Output Cleaning
- Replace regex-based cleaning with `strip-ansi`
- Shell type detection (bash, zsh, fish, PowerShell)
- Shell-specific prompt removal
- Preserve intentional formatting

### v0.6.0 - Search & Filter
- Search commands and output
- Filter by status, terminal, date range
- Real-time filtering

### v1.0.0 - Production Release
- Export/import functionality
- Analytics dashboard
- Performance optimizations

## Known Issues
- Exit codes inferred from output (some false positives)
- Regex-based ANSI cleaning is brittle (fix in v0.5.0)
- Very large outputs (>10MB) may cause performance issues