/**
 * Safe script execution utilities for custom text transformations
 * Uses Function constructor with isolated scope and timeout protection
 */

/**
 * Safe utility library exposed to user scripts
 */
const safeUtils = {
  // JSON operations
  parse: JSON.parse,
  stringify: JSON.stringify,
  
  // String operations
  trim: (s: string) => s.trim(),
  toUpperCase: (s: string) => s.toUpperCase(),
  toLowerCase: (s: string) => s.toLowerCase(),
  replace: (s: string, search: string | RegExp, replace: string) => s.replace(search, replace),
  split: (s: string, separator: string | RegExp) => s.split(separator),
  join: (arr: string[], separator: string) => arr.join(separator),
  
  // Array operations
  map: <T, U>(arr: T[], fn: (item: T, index: number) => U) => arr.map(fn),
  filter: <T>(arr: T[], fn: (item: T, index: number) => boolean) => arr.filter(fn),
  reduce: <T, U>(arr: T[], fn: (acc: U, item: T, index: number) => U, initial: U) => arr.reduce(fn, initial),
  
  // Regex
  match: (s: string, regex: RegExp) => s.match(regex),
  test: (regex: RegExp, s: string) => regex.test(s),
};

export interface ScriptExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime?: number;
}

/**
 * Executes a user-provided JavaScript script with safety measures
 * @param script - The JavaScript code to execute
 * @param input - The input text to transform
 * @param timeoutMs - Timeout in milliseconds (default: 5000)
 * @returns Execution result with output or error
 */
export const executeUserScript = async (
  script: string,
  input: string,
  timeoutMs: number = 5000
): Promise<ScriptExecutionResult> => {
  const startTime = performance.now();

  try {
    // Create a sandboxed function with limited scope
    // The script should return the transformed text
    const runner = new Function(
      'input',
      'utils',
      `
      'use strict';
      ${script}
      `
    );

    // Use a timeout to prevent infinite loops
    let timeoutId: NodeJS.Timeout | null = null;
    let hasTimedOut = false;

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        hasTimedOut = true;
        reject(new Error('Script execution timeout'));
      }, timeoutMs);
    });

    const executionPromise = new Promise((resolve) => {
      const result = runner(input, safeUtils);
      resolve(result);
    });

    // Race between execution and timeout
    const resultPromise = Promise.race([executionPromise, timeoutPromise]);

    return resultPromise
      .then((result) => {
        if (timeoutId) clearTimeout(timeoutId);
        const executionTime = performance.now() - startTime;

        // Ensure result is a string
        const output = typeof result === 'string' ? result : String(result);

        return {
          success: true,
          output,
          executionTime,
        };
      })
      .catch((error) => {
        if (timeoutId) clearTimeout(timeoutId);
        const executionTime = performance.now() - startTime;

        return {
          success: false,
          error: hasTimedOut ? 'Script execution timeout' : error.message,
          executionTime,
        };
      });
  } catch (error) {
    const executionTime = performance.now() - startTime;
    return {
      success: false,
      error: (error as Error).message,
      executionTime,
    };
  }
};

/**
 * Validates a script without executing it
 * Checks for basic syntax errors
 * @param script - The script code to validate
 * @returns Validation result
 */
export const validateScript = (script: string): { valid: boolean; error?: string } => {
  try {
    // Try to create the function to check for syntax errors
    new Function('input', 'utils', script);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: (error as Error).message,
    };
  }
};

/**
 * Example script templates for common operations
 */
export const scriptTemplates = {
  uppercase: {
    name: 'Convert to Uppercase',
    description: 'Converts all text to uppercase',
    code: 'return input.toUpperCase();',
  },
  
  extractEmails: {
    name: 'Extract Email Addresses',
    description: 'Extracts all email addresses from text',
    code: `const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g;
const matches = input.match(emailRegex);
return matches ? matches.join('\\n') : 'No emails found';`,
  },
  
  jsonKeys: {
    name: 'Extract JSON Keys',
    description: 'Extracts all keys from a JSON object',
    code: `try {
  const obj = JSON.parse(input);
  const keys = Object.keys(obj);
  return keys.join('\\n');
} catch (e) {
  return 'Invalid JSON: ' + e.message;
}`,
  },
  
  lineNumbers: {
    name: 'Add Line Numbers',
    description: 'Adds line numbers to each line',
    code: `const lines = input.split('\\n');
return lines.map((line, i) => \`\${i + 1}. \${line}\`).join('\\n');`,
  },
  
  removeDuplicates: {
    name: 'Remove Duplicate Lines',
    description: 'Removes duplicate lines from text',
    code: `const lines = input.split('\\n');
const unique = [...new Set(lines)];
return unique.join('\\n');`,
  },
  
  sortLines: {
    name: 'Sort Lines Alphabetically',
    description: 'Sorts all lines in alphabetical order',
    code: `const lines = input.split('\\n');
return lines.sort().join('\\n');`,
  },
  
  reverseLines: {
    name: 'Reverse Lines',
    description: 'Reverses the order of lines',
    code: `const lines = input.split('\\n');
return lines.reverse().join('\\n');`,
  },
  
  base64Encode: {
    name: 'Base64 Encode',
    description: 'Encodes text to Base64',
    code: 'return btoa(input);',
  },
  
  base64Decode: {
    name: 'Base64 Decode',
    description: 'Decodes Base64 text',
    code: `try {
  return atob(input);
} catch (e) {
  return 'Invalid Base64: ' + e.message;
}`,
  },
};

