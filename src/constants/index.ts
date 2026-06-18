/**
 * @file index.ts
 * @description Barrel file for constants.
 * 
 * Exports all constants from the constants directory.
 * 
 * @module constants
 */

// Sensitive patterns
export { SENSITIVE_PATTERNS } from './sensitivePatterns.js';

// Command patterns
export {
    COMMAND_CLEAN_PATTERNS,
    ERROR_DETECTION_PATTERNS,
    createErrorRegex
} from './commandPatterns.js';

// VS Code constants
export {
    VSCODE_SEQUENCES,
    CONTEXT_VALUES,
    VIEW_IDS,
    STATUS_BAR_ICON,
    STATUS_BAR
} from './vsCodeConstants.js';

// Display constants
export {
    MAX_OUTPUT_PREVIEW_LENGTH,
    MAX_OUTPUT_DISPLAY_LENGTH,
    MAX_COMMAND_DISPLAY_LENGTH,
    MAX_HISTORY_SIZE,
    DASHBOARD_TITLE,
    SECURITY_NOTICE,
    RERUN_TERMINAL_PREFIX
} from './displayConstants.js';

// Regex patterns
export { CLEANER_PATTERNS } from './regexPatterns.js';

// Config defaults
export { DEFAULT_SECURITY_CONFIG } from './configDefaults.js';