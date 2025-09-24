'use client';

import { useState } from 'react';
import { 
  detectJsonInText, 
  formatJson, 
  minifyJson
} from '@/app/utils/jsonTools';
import { 
  RiFileCopyLine, 
  RiDeleteBinLine, 
  RiCheckLine, 
  RiErrorWarningLine,
  RiCodeSSlashLine,
  RiFileReduceLine
} from 'react-icons/ri';
import cn from 'classnames';

/**
 * JSON Formatter Tool Page
 * Supports smart detection of JSON in garbage text, formatting, minification, and validation
 */
export default function JsonFormatterPage() {
  const [jsonText, setJsonText] = useState('');
  // const [outputText, setOutputText] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [indentSize, setIndentSize] = useState(2);
  const [error, setError] = useState<string>('');

  /**
   * Handles input text change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setJsonText(text);
    
    // Clear error when input changes
    if (error) {
      setError('');
    }
  };

  /**
   * Formats the JSON content
   */
  const handleFormat = () => {
    if (!jsonText.trim()) {
      setError('请输入一些文本');
      return;
    }

    try {
      const result = detectJsonInText(jsonText);
      
      if (result.valid) {
        const formatted = formatJson(result.jsonString, indentSize);
        setJsonText(formatted);
        setError('');
      } else {
        setError(result.error || '未检测到有效的 JSON');
      }
    } catch (error) {
      setError((error as Error).message);
    }
  };

  /**
   * Minifies the JSON content
   */
  const handleMinify = () => {
    if (!jsonText.trim()) {
      setError('请输入一些文本');
      return;
    }

    try {
      const result = detectJsonInText(jsonText);
      
      if (result.valid) {
        const minified = minifyJson(result.jsonString);
        setJsonText(minified);
        setError('');
      } else {
        setError(result.error || '未检测到有效的 JSON');
      }
    } catch (error) {
      setError((error as Error).message);
    }
  };


  /**
   * Copies the output to clipboard
   */
  const handleCopy = async () => {
    const textToCopy = jsonText;
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  /**
   * Clears all input and output
   */
  const handleClear = () => {
    setJsonText('');
    setError('');
    setCopySuccess(false);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            JSON 格式化
          </h1>
        </div>

        {/* Toolbar */}
        <div className="bg-gray-50 dark:bg-zinc-950 rounded-t-lg shadow-sm border-t border-x border-gray-200 dark:border-gray-800 px-4 py-2">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleFormat}
                className="px-3 py-1.5 rounded text-sm hover:bg-gray-700 transition-colors flex items-center gap-1.5"
              >
                <RiCodeSSlashLine className="w-4 h-4" />
                格式化
              </button>
              <button
                onClick={handleMinify}
                className="px-3 py-1.5 rounded text-sm hover:bg-gray-700 transition-colors flex items-center gap-1.5"
              >
                <RiFileReduceLine className="w-4 h-4" />
                压缩
              </button>
              <button
                onClick={handleCopy}
                className={cn(
                  "px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-1.5",
                  copySuccess 
                    ? "" 
                    : "hover:bg-gray-700"
                )}
              >
                {copySuccess ? <RiCheckLine className="w-4 h-4" /> : <RiFileCopyLine className="w-4 h-4" />}
                {copySuccess ? '已复制' : '复制'}
              </button>
              <button
                onClick={handleClear}
                className="px-3 py-1.5 rounded text-sm hover:bg-gray-700 transition-colors flex items-center gap-1.5"
              >
                <RiDeleteBinLine className="w-4 h-4" />
                清空
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={indentSize}
                onChange={(e) => setIndentSize(Number(e.target.value))}
                className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-zinc-800 text-gray-900 dark:text-white text-sm"
              >
                <option value={2}>2 空格</option>
                <option value={4}>4 空格</option>
                <option value={8}>Tab</option>
              </select>
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="bg-gray-50 dark:bg-zinc-950 rounded-b-lg shadow-sm border border-gray-200 dark:border-gray-800">
          <textarea
            value={jsonText}
            onChange={handleInputChange}
            placeholder="在此粘贴包含 JSON 的文本，点击格式化或压缩按钮处理"
            className={cn(
              "w-full h-[500px] p-4 font-mono text-sm bg-transparent text-gray-900 dark:text-white",
              "placeholder-gray-400 dark:placeholder-gray-600",
              "focus:outline-none resize-none border-0"
            )}
            spellCheck={false}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-lg p-3 mb-4 flex items-center gap-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
            <RiErrorWarningLine className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}