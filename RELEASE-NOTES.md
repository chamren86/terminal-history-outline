# Release Notes

## v0.3.0 - Testing Infrastructure (2026-06-16)

### Added
- ✅ Mocha test framework with BDD interface (describe/it)
- ✅ 12 unit tests for ANSI cleaning functionality
- ✅ `cleaner.ts` - Pure function module with no VS Code dependencies
- ✅ Test fixtures for ANSI and security testing
- ✅ `npm test` script for running tests

### Changed
- 🔄 Separated ANSI cleaning logic into `cleaner.ts` for better testability
- 🔄 Updated `terminalHistoryProvider.ts` to import cleaner module

### Developer Experience
- 🛠️ Fast test execution (~4ms for 12 tests)
- 🛠️ Easy to add new tests
- 🛠️ Clear separation of concerns

### Files Added
- `src/cleaner.ts`
- `src/test/unit/ansiCleanerTest.ts`
- `src/test/fixtures/sampleOutputs.ts`
- `src/test/suite/index.ts`
- `src/test/runTest.ts`

---

## v0.2.0 - Stable Release (2026-06-15)

### Added
- 🟢 Colored emoji status indicators (green/red/yellow)
- 📝 Command output capture and cleaning
- 🔄 Command rerun functionality
- 📋 Copy output to clipboard
- 💾 Persistent history storage
- 🎨 ANSI code stripping

---

## v0.1.0 - Initial Prototype (2026-06-14)

### Added
- 🎉 First working prototype
- Basic command capture
- Tree view integration