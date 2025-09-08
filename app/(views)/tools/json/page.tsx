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
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [indentSize, setIndentSize] = useState(2);
  const [error, setError] = useState<string>('');

  /**
   * Handles input text change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);
    
    // Clear error when input changes
    if (error) {
      setError('');
    }
  };

  /**
   * Formats the JSON content
   */
  const handleFormat = () => {
    if (!inputText.trim()) {
      setError('请输入一些文本');
      return;
    }

    try {
      const result = detectJsonInText(inputText);
      
      if (result.valid) {
        const formatted = formatJson(result.jsonString, indentSize);
        setOutputText(formatted);
        setError('');
      } else {
        setError(result.error || '未检测到有效的 JSON');
        setOutputText('');
      }
    } catch (error) {
      setError((error as Error).message);
      setOutputText('');
    }
  };

  /**
   * Minifies the JSON content
   */
  const handleMinify = () => {
    if (!inputText.trim()) {
      setError('请输入一些文本');
      return;
    }

    try {
      const result = detectJsonInText(inputText);
      
      if (result.valid) {
        const minified = minifyJson(result.jsonString);
        setOutputText(minified);
        setError('');
      } else {
        setError(result.error || '未检测到有效的 JSON');
        setOutputText('');
      }
    } catch (error) {
      setError((error as Error).message);
      setOutputText('');
    }
  };


  /**
   * Copies the output to clipboard
   */
  const handleCopy = async () => {
    const textToCopy = outputText || inputText;
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
    setInputText('');
    setOutputText('');
    setError('');
    setCopySuccess(false);
  };

  /**
   * Replaces input with formatted output
   */
  const handleReplaceInput = () => {
    if (outputText) {
      setInputText(outputText);
      setOutputText('');
      setError('');
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            JSON 格式化工具
          </h1>
        </div>

        {/* Toolbar */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4 mb-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleFormat}
                className="px-3 py-1.5 bg-gray-800 text-white rounded text-sm hover:bg-gray-700 transition-colors flex items-center gap-1.5"
              >
                <RiCodeSSlashLine className="w-4 h-4" />
                格式化
              </button>
              <button
                onClick={handleMinify}
                className="px-3 py-1.5 bg-gray-800 text-white rounded text-sm hover:bg-gray-700 transition-colors flex items-center gap-1.5"
              >
                <RiFileReduceLine className="w-4 h-4" />
                压缩
              </button>
              <button
                onClick={handleCopy}
                className={cn(
                  "px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-1.5",
                  copySuccess 
                    ? "bg-green-600 text-white" 
                    : "bg-gray-800 text-white hover:bg-gray-700"
                )}
              >
                {copySuccess ? <RiCheckLine className="w-4 h-4" /> : <RiFileCopyLine className="w-4 h-4" />}
                {copySuccess ? '已复制' : '复制'}
              </button>
              <button
                onClick={handleClear}
                className="px-3 py-1.5 bg-gray-800 text-white rounded text-sm hover:bg-gray-700 transition-colors flex items-center gap-1.5"
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

        {/* Error Display */}
        {error && (
          <div className="rounded-lg p-3 mb-4 flex items-center gap-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
            <RiErrorWarningLine className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Editor Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Input Area */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="p-3 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">输入</h3>
            </div>
            <textarea
              value={inputText}
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

          {/* Output Area */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">输出</h3>
              {outputText && (
                <button
                  onClick={handleReplaceInput}
                  className="px-2 py-1 bg-gray-800 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                >
                  使用此结果
                </button>
              )}
            </div>
            <textarea
              value={outputText}
              onChange={(e) => setOutputText(e.target.value)}
              placeholder="格式化或压缩后的结果将显示在这里"
              className={cn(
                "w-full h-[500px] p-4 font-mono text-sm bg-transparent text-gray-900 dark:text-white",
                "placeholder-gray-400 dark:placeholder-gray-600",
                "focus:outline-none resize-none border-0"
              )}
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}