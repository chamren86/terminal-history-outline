/**
 * @file displayConstants.ts
 * @description Display and formatting constants.
 * 
 * @module constants
 */

/** Maximum length for output preview in tooltips */
export const MAX_OUTPUT_PREVIEW_LENGTH = 500;

/** Maximum length for output display in tree view */
export const MAX_OUTPUT_DISPLAY_LENGTH = 1000;

/** Maximum command length for display */
export const MAX_COMMAND_DISPLAY_LENGTH = 50;

/** Maximum history entries */
export const MAX_HISTORY_SIZE = 100;

/** Privacy dashboard title */
export const DASHBOARD_TITLE = 'Terminal History - Privacy Dashboard';

/** Security notice text */
export const SECURITY_NOTICE = '⚠️ Security Notice: Commands are stored locally on your machine. Sensitive data (passwords, API keys) may be stored unless redaction is enabled.';

/** Terminal name prefix for rerun */
export const RERUN_TERMINAL_PREFIX = 'History: ';