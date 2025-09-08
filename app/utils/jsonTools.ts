/**
 * JSON Tools utilities for parsing, validation and formatting
 */

export interface JsonDetectionResult {
  valid: boolean;
  startIndex: number;
  endIndex: number;
  jsonString: string;
  formattedJson?: string;
  error?: string;
}

/**
 * Detects and extracts the first valid JSON object or array from a text string
 * Supports detection of JSON embedded in garbage text
 * @param text - The input text that may contain JSON
 * @returns JsonDetectionResult with the detected JSON information
 */
export const detectJsonInText = (text: string): JsonDetectionResult => {
  if (!text || text.trim() === '') {
    return {
      valid: false,
      startIndex: -1,
      endIndex: -1,
      jsonString: '',
      error: 'Empty input'
    };
  }

  // Try to find JSON object {...} or array [...]
  const patterns = [
    { start: '{', end: '}', type: 'object' },
    { start: '[', end: ']', type: 'array' }
  ];

  for (const pattern of patterns) {
    const result = findJsonPattern(text, pattern.start, pattern.end);
    if (result.valid) {
      return result;
    }
  }

  // If no valid JSON found, try to parse the entire text
  try {
    const parsed = JSON.parse(text.trim());
    return {
      valid: true,
      startIndex: 0,
      endIndex: text.length - 1,
      jsonString: text.trim(),
      formattedJson: JSON.stringify(parsed, null, 2)
    };
  } catch (error) {
    return {
      valid: false,
      startIndex: -1,
      endIndex: -1,
      jsonString: '',
      error: 'No valid JSON found in the text'
    };
  }
};

/**
 * Finds the first valid JSON pattern (object or array) in the text
 * @param text - The input text
 * @param startChar - The opening character ('{' or '[')
 * @param endChar - The closing character ('}' or ']')
 * @returns JsonDetectionResult with the found JSON
 */
const findJsonPattern = (text: string, startChar: string, endChar: string): JsonDetectionResult => {
  let startIndex = text.indexOf(startChar);
  
  while (startIndex !== -1) {
    let depth = 0;
    let inString = false;
    let escapeNext = false;
    let endIndex = -1;

    for (let i = startIndex; i < text.length; i++) {
      const char = text[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === startChar) {
          depth++;
        } else if (char === endChar) {
          depth--;
          if (depth === 0) {
            endIndex = i;
            break;
          }
        }
      }
    }

    if (endIndex !== -1) {
      const jsonString = text.substring(startIndex, endIndex + 1);
      try {
        const parsed = JSON.parse(jsonString);
        return {
          valid: true,
          startIndex,
          endIndex,
          jsonString,
          formattedJson: JSON.stringify(parsed, null, 2)
        };
      } catch (error) {
        // This pattern didn't parse, try the next occurrence
      }
    }

    // Look for the next occurrence of the start character
    startIndex = text.indexOf(startChar, startIndex + 1);
  }

  return {
    valid: false,
    startIndex: -1,
    endIndex: -1,
    jsonString: '',
    error: `No valid JSON ${startChar === '{' ? 'object' : 'array'} found`
  };
};

/**
 * Formats JSON string with proper indentation
 * @param jsonString - The JSON string to format
 * @param indent - Number of spaces for indentation (default: 2)
 * @returns Formatted JSON string or error message
 */
export const formatJson = (jsonString: string, indent: number = 2): string => {
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, indent);
  } catch (error) {
    throw new Error('Invalid JSON: ' + (error as Error).message);
  }
};

/**
 * Minifies JSON by removing unnecessary whitespace
 * @param jsonString - The JSON string to minify
 * @returns Minified JSON string
 */
export const minifyJson = (jsonString: string): string => {
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed);
  } catch (error) {
    throw new Error('Invalid JSON: ' + (error as Error).message);
  }
};

/**
 * Validates JSON string and returns validation result
 * @param jsonString - The JSON string to validate
 * @returns Validation result with error details if invalid
 */
export const validateJson = (jsonString: string): { valid: boolean; error?: string; line?: number; column?: number } => {
  try {
    JSON.parse(jsonString);
    return { valid: true };
  } catch (error) {
    const errorMessage = (error as Error).message;
    
    // Try to extract line and column from error message
    const match = errorMessage.match(/at position (\d+)/);
    if (match) {
      const position = parseInt(match[1]);
      const lines = jsonString.substring(0, position).split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length + 1;
      
      return {
        valid: false,
        error: errorMessage,
        line,
        column
      };
    }

    return {
      valid: false,
      error: errorMessage
    };
  }
};

/**
 * Escapes a string for use in JSON
 * @param str - The string to escape
 * @returns Escaped string
 */
export const escapeJsonString = (str: string): string => {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\f/g, '\\f')
    .replace(/\b/g, '\\b');
};

/**
 * Unescapes a JSON string
 * @param str - The escaped string
 * @returns Unescaped string
 */
export const unescapeJsonString = (str: string): string => {
  return str
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\f/g, '\f')
    .replace(/\\b/g, '\b')
    .replace(/\\\\/g, '\\');
};

/**
 * Converts JSON to a pretty-printed string with syntax highlighting HTML
 * @param json - The JSON object or string
 * @returns HTML string with syntax highlighting
 */
export const jsonToHtml = (json: any): string => {
  const jsonString = typeof json === 'string' ? json : JSON.stringify(json, null, 2);
  
  return jsonString
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
    .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
    .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
    .replace(/: (null)/g, ': <span class="json-null">$1</span>');
};
