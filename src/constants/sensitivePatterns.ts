/**
 * @file sensitivePatterns.ts
 * @description Predefined patterns for detecting sensitive data in commands.
 * 
 * This file contains all the regex patterns used by the security module
 * to detect passwords, API keys, tokens, and other sensitive information.
 * 
 * @module constants
 */

import { ISensitivePattern } from '../interfaces/index.js';

/**
 * Array of predefined sensitive data patterns for detection.
 * Each pattern includes a regex for matching, a name, and a description.
 * 
 * @constant
 * @type {ISensitivePattern[]}
 */
export const SENSITIVE_PATTERNS: ISensitivePattern[] = [
    {
        regex: /password[=:]\s*\S+/gi,
        name: 'password',
        description: 'Password in command'
    },
    {
        regex: /pass[=:]\s*\S+/gi,
        name: 'password',
        description: 'Password in command'
    },
    {
        regex: /-p\s*\S+(?!\w)/g,
        name: 'password',
        description: 'Password parameter'
    },
    {
        regex: /--password[=:]\s*\S+/gi,
        name: 'password',
        description: 'Password parameter'
    },
    {
        regex: /Bearer\s+[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_.+/=]*/g,
        name: 'jwt-token',
        description: 'JWT token'
    },
    {
        regex: /sk-[A-Za-z0-9]{10,}/g,
        name: 'api-key',
        description: 'API key (OpenAI style)'
    },
    {
        regex: /(?:AKIA|ASIA)[0-9A-Z]{16}/g,
        name: 'aws-key',
        description: 'AWS access key'
    },
    {
        regex: /-----BEGIN (?:RSA|DSA|EC|OPENSSH) PRIVATE KEY-----[\s\S]*?-----END (?:RSA|DSA|EC|OPENSSH) PRIVATE KEY-----/g,
        name: 'ssh-key',
        description: 'SSH private key'
    },
    {
        regex: /gh[ps]_[A-Za-z0-9]{36,}/g,
        name: 'github-token',
        description: 'GitHub personal access token'
    },
    {
        regex: /xox[baprs]-[0-9A-Za-z\-]+/g,
        name: 'slack-token',
        description: 'Slack token'
    }
];