import { ISecurityConfig } from './ISecurityConfig.js';

/**
 * Statistics displayed on the Privacy Dashboard
 */
export interface IPrivacyDashboardStats {
    /** Total number of stored commands */
    totalCommands: number;
    /** Current security configuration */
    config: ISecurityConfig;
    /** Display-friendly redaction level name */
    redactionLevelDisplay: string;
}