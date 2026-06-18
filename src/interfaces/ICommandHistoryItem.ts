/**
 * Represents a single command in the history.
 * Used by the TreeView for display and by storage for persistence.
 */
export interface ICommandHistoryItem {
    /** The command text as entered by the user */
    commandText: string;
    /** Name of the terminal where the command was run */
    terminalName: string;
    /** When the command was executed */
    timestamp: Date;
    /** Working directory where the command was run */
    cwd: string;
    /** Cleaned output (ANSI codes removed) */
    output: string;
    /** Raw output (with ANSI codes intact) */
    rawOutput: string;
    /** Exit code from the command (null if still running) */
    exitCode: number | null;
}