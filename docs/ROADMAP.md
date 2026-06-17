# Terminal History Outline - Public Roadmap

## Current Status
**Version**: 0.3.0
**Release Date**: 2026-06-16
**Focus**: Testing infrastructure and code quality

---

## ✅ Completed Releases

### v0.3.0 - Testing Infrastructure (2026-06-16)
**Focus**: Establish solid testing foundation

- ✅ Mocha test framework with BDD interface
- ✅ 12 unit tests for ANSI cleaning
- ✅ `cleaner.ts` - Pure function module (no VS Code dependencies)
- ✅ Test fixtures for ANSI and security testing
- ✅ Separation of concerns for better testability

### v0.2.0 - Stable Release (2026-06-15)
**Focus**: Core functionality and visual indicators

- ✅ Command capture from VS Code terminals
- ✅ Full command output capture with streaming
- ✅ Hierarchical display in Explorer outline view
- ✅ 🟢/🔴/🟡 Status indicators
- ✅ Rerun commands and copy output
- ✅ Persistent history across sessions
- ✅ ANSI color code stripping

### v0.1.0 - Initial Prototype (2026-06-14)
- ✅ Basic command capture
- ✅ Tree view integration

---

## 🚀 Upcoming Releases

### v0.4.0 - Security & Privacy
**Status**: Planning
**Priority**: High

**Goal**: Protect sensitive data in command history

**Planned Features**:
- Sensitive data detection (passwords, API keys, tokens)
- Warning notifications when sensitive data is detected
- Automatic redaction with `[REDACTED]` placeholder
- Command exclusion patterns (regex-based)
- Privacy dashboard

**Configuration Options**:
- Detection enable/disable
- Redaction level: off/warn/redact/block
- Custom regex patterns
- Command exclusion list

---

### v0.5.0 - Improved Output Cleaning
**Status**: Planning
**Priority**: High

**Goal**: Replace brittle regex-based cleaning with robust solution

**Planned Improvements**:
- Replace custom regex with `strip-ansi` library
- Shell type detection (bash, zsh, fish, PowerShell)
- Shell-specific prompt removal
- Preserve intentional formatting (newlines, indentation)
- Intelligent truncation for long outputs

**Dependencies**:
- `strip-ansi` ^7.1.0

---

### v0.6.0 - Search & Filter
**Status**: Planning
**Priority**: Medium

**Goal**: Help users find specific commands in their history

**Planned Features**:
- Search box above tree view
- Filter by command text (substring match)
- Filter by output content
- Filter by status (success/error/running)
- Filter by terminal
- Filter by date range

---

### v0.7.0 - Grouping & Organization
**Status**: Planning
**Priority**: Medium

**Goal**: Better organize commands similar to Outline view

**Planned Features**:
- Group by day (Today, Yesterday, Older)
- Group by working directory
- Pin/favorite commands
- Keyboard shortcuts (Ctrl+R, Ctrl+Shift+C)

---

### v0.8.0 - Export & Import
**Status**: Planning
**Priority**: Low

**Goal**: Share and backup command history

**Planned Features**:
- Export to JSON (full history with metadata)
- Export to CSV (for analysis in Excel)
- Copy command as JSON

---

### v0.9.0 - Analytics & Insights
**Status**: Planning
**Priority**: Low

**Goal**: Provide useful statistics about terminal usage

**Planned Features**:
- Command frequency analysis
- Success rate by command
- Session statistics

---

### v1.0.0 - Production Stable Release
**Status**: Planning
**Priority**: Low

**Goal**: Optimize for large histories and production readiness

**Planned Features**:
- Stream processing for large outputs
- Database backend (SQLite) for better performance
- Compression for large outputs
- Virtual scrolling for 1000+ commands
- Configurable retention policy

---

## 🐛 Known Issues Timeline

| Issue | Fixed In |
|-------|----------|
| Exit codes inferred from output (some false positives) | v0.5.0 |
| Regex-based ANSI cleaning is brittle | v0.5.0 |
| Sensitive data stored in plain text | v0.4.0 |
| Poor performance with >10MB outputs | v1.0.0 |

