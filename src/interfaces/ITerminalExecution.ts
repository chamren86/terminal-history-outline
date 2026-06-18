/**
 * Represents a terminal execution event.
 * Used when capturing commands from VS Code's Shell Integration API.
 */
export interface ITerminalExecution {
    /** The command line that was run */
    commandLine: string;
    /** The name of the terminal */
    terminalName: string;
    /** When the command started */
    timestamp: Date;
    /** Working directory */
    cwd: string;
    /** The full output from the command */
    output: string;
    /** Exit code (if available) */
    exitCode?: number;
}