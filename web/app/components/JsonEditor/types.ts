/**
 * Type definitions for the JSON Editor multi-box system
 */

export type EditorType = 'textarea' | 'codemirror' | 'markdown';
export type EditorLanguage = 'json' | 'javascript' | 'markdown' | 'plaintext' | 'bash';
export type ScriptOutputMode = 'inplace' | 'newBlock';

/**
 * Configuration for a single editor box
 */
export interface EditorBox {
  id: string;
  type: EditorType;
  language: EditorLanguage;
  content: string;
  label?: string;
  width?: number;
  height?: number;
}

/**
 * Persisted state structure for localStorage
 */
export interface PersistedState {
  version: number;
  boxes: EditorBox[];
  customScripts: CustomScript[];
}

/**
 * Custom script definition
 */
export interface CustomScript {
  id: string;
  name: string;
  code: string;
  description?: string;
  outputMode?: ScriptOutputMode;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Text processing operation
 */
export interface TextOperation {
  id: string;
  label: string;
  action: (text: string) => string;
  description?: string;
}

