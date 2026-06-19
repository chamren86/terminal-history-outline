/**
 * @file commandPatterns.ts
 * @description Command cleaning and error detection patterns.
 */

export const COMMAND_CLEAN_PATTERNS = [
    / --color=auto/g,
    / --color/g
];

export const ERROR_DETECTION_PATTERNS = [
    'error',
    'fail',
    'exception',
    'not found',
    'permission denied',
    'No such file',
    'command not found',
    'EACCES',
    'ENOENT',
    'is not a git command',
    'is not a valid command',
    'fatal:',
    'usage:',
    'try "git --help"',
    'did you mean',
    'no such file or directory',
    'cannot find',
    'unable to',
    'invalid',
    'missing script',
    'unknown command',
    'not recognized'
];

export const WARNING_DETECTION_PATTERNS = [
    'deprecationwarning',
    'deprecated',
    'is deprecated',
    'npm warn',
    'npm warning',
    'warning:',
    'potential security issue',
    'found vulnerabilities',
    '⚠️',
    'appears to have',
    'may not be',
    'not recommended',
    'skipping',
    'could not',
    'ts error',
    'has no exported member',
    'deprecated package',
    'npm warn deprecated'
];

export function createErrorRegex(): RegExp {
    return new RegExp(ERROR_DETECTION_PATTERNS.join('|'), 'i');
}

export function createWarningRegex(): RegExp {
    return new RegExp(WARNING_DETECTION_PATTERNS.join('|'), 'i');
}

export function hasErrorOutput(output: string): boolean {
    if (!output || output.trim().length === 0) {
        return false;
    }
    
    // Special case: Node.js warnings are not errors
    if (output.includes('ExperimentalWarning') || 
        output.includes('DeprecationWarning') || 
        output.includes('--experimental-loader') ||
        output.includes('url.parse()') ||
        output.includes('fs.Stats constructor is deprecated')) {
        return false;
    }
    
    // Special case: npm test output with passing tests should not be an error
    if (output.includes('npm test') && 
        (output.includes('passing') || output.includes('✓') || output.includes('ok')) && 
        !output.includes('failing') && 
        !output.includes('✖') && 
        !output.includes('not ok')) {
        return false;
    }
    
    const errorRegex = createErrorRegex();
    if (errorRegex.test(output)) {
        return true;
    }
    
    const errorFormatting = ['\u001b[31m', '\u001b[91m', '❌'];
    for (const fmt of errorFormatting) {
        if (output.includes(fmt)) {
            return true;
        }
    }
    
    return false;
}

export function hasWarningOutput(output: string): boolean {
    if (!output || output.trim().length === 0) {
        return false;
    }
    
    // If it's an error, it shouldn't be counted as just a warning
    if (hasErrorOutput(output)) {
        return false;
    }
    
    const warningRegex = createWarningRegex();
    if (warningRegex.test(output)) {
        return true;
    }
    
    const warningFormatting = ['\u001b[33m', '\u001b[93m', '⚠️', '🟡'];
    for (const fmt of warningFormatting) {
        if (output.includes(fmt)) {
            return true;
        }
    }
    
    return false;
}
