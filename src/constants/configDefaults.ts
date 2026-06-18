/**
 * @file configDefaults.ts
 * @description Default configuration values.
 * 
 * @module constants
 */

import { RedactionLevel } from '../enums/index.js';
import { ISecurityConfig } from '../interfaces/index.js';

/** Default security configuration */
export const DEFAULT_SECURITY_CONFIG: ISecurityConfig = {
    detectionEnabled: true,
    redactionLevel: RedactionLevel.WARN,
    customPatterns: [],
    excludedCommands: [],
    warnOnDetection: true
};

/** Default maximum history size */
export const DEFAULT_MAX_HISTORY_SIZE = 100;

/** Default output cache size */
export const DEFAULT_OUTPUT_CACHE_SIZE = 1000;