/**
 * @file index.ts
 * @description Barrel file for constants.
 */

export { SENSITIVE_PATTERNS } from './sensitivePatterns.js';
export {
    COMMAND_CLEAN_PATTERNS,
    ERROR_DETECTION_PATTERNS,
    WARNING_DETECTION_PATTERNS,
    createErrorRegex,
    createWarningRegex,
    hasErrorOutput,
    hasWarningOutput
} from './commandPatterns.js';
export {
    VSCODE_SEQUENCES,
    CONTEXT_VALUES,
    VIEW_IDS,
    STATUS_BAR_ICON,
    STATUS_BAR
} from './vsCodeConstants.js';
export {
    MAX_OUTPUT_PREVIEW_LENGTH,
    MAX_OUTPUT_DISPLAY_LENGTH,
    MAX_COMMAND_DISPLAY_LENGTH,
    MAX_HISTORY_SIZE,
    DASHBOARD_TITLE,
    SECURITY_NOTICE,
    RERUN_TERMINAL_PREFIX
} from './displayConstants.js';
export { CLEANER_PATTERNS } from './regexPatterns.js';
export { DEFAULT_SECURITY_CONFIG } from './configDefaults.js';