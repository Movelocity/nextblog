'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  detectJsonInText, 
  formatJson, 
  minifyJson, 
  validateJson 
} from '@/app/utils/jsonTools';
import { 
  RiFileCopyLine, 
  RiDeleteBinLine, 
  RiCheckLine, 
  RiErrorWarningLine,
  RiCodeSSlashLine,
  RiFileReduceLine,
  RiSearchEyeLine,
  RiInformationLine
} from 'react-icons/ri';
import cn from 'classnames';

/**
 * JSON Formatter Tool Page
 * Supports smart detection of JSON in garbage text, formatting, minification, and validation
 */
export default function JsonFormatterPage() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [detectionResult, setDetectionResult] = useState<{
    valid: boolean;
    startIndex: number;
    endIndex: number;
    error?: string;
  } | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [mode, setMode] = useState<'format' | 'minify'>('format');
  const [indentSize, setIndentSize] = useState(2);
  const [showHighlight, setShowHighlight] = useState(true);

  /**
   * Handles input text change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);
    
    // Clear output when input changes
    if (text !== outputText) {
      setOutputText('');
      setDetectionResult(null);
    }
  };

  /**
   * Detects and processes JSON from the input text
   */
  const handleDetectAndFormat = useCallback(() => {
    if (!inputText.trim()) {
      setDetectionResult({
        valid: false,
        startIndex: -1,
        endIndex: -1,
        error: 'Please enter some text'
      });
      return;
    }

    const result = detectJsonInText(inputText);
    
    if (result.valid) {
      try {
        const formatted = mode === 'format' 
          ? formatJson(result.jsonString, indentSize)
          : minifyJson(result.jsonString);
        
        setOutputText(formatted);
        setDetectionResult({
          valid: true,
          startIndex: result.startIndex,
          endIndex: result.endIndex
        });
      } catch (error) {
        setDetectionResult({
          valid: false,
          startIndex: -1,
          endIndex: -1,
          error: (error as Error).message
        });
      }
    } else {
      setDetectionResult({
        valid: false,
        startIndex: -1,
        endIndex: -1,
        error: result.error || 'No valid JSON detected'
      });
      setOutputText('');
    }
  }, [inputText, mode, indentSize]);

  /**
   * Formats the JSON with pretty printing
   */
  const handleFormat = () => {
    setMode('format');
    handleDetectAndFormat();
  };

  /**
   * Minifies the JSON
   */
  const handleMinify = () => {
    setMode('minify');
    handleDetectAndFormat();
  };

  /**
   * Validates the JSON
   */
  const handleValidate = () => {
    if (!inputText.trim()) {
      setDetectionResult({
        valid: false,
        startIndex: -1,
        endIndex: -1,
        error: 'Please enter some text'
      });
      return;
    }

    const result = detectJsonInText(inputText);
    if (result.valid) {
      const validation = validateJson(result.jsonString);
      setDetectionResult({
        valid: validation.valid,
        startIndex: result.startIndex,
        endIndex: result.endIndex,
        error: validation.error
      });
      
      if (validation.valid) {
        setOutputText(result.jsonString);
      }
    } else {
      setDetectionResult({
        valid: false,
        startIndex: -1,
        endIndex: -1,
        error: result.error || 'Invalid JSON'
      });
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
    setDetectionResult(null);
    setCopySuccess(false);
  };

  /**
   * Replaces input with formatted output
   */
  const handleReplaceInput = () => {
    if (outputText) {
      setInputText(outputText);
      setOutputText('');
      setDetectionResult(null);
    }
  };

  /**
   * Gets highlighted text with detected JSON range
   */
  const getHighlightedText = () => {
    if (!showHighlight || !detectionResult || !detectionResult.valid || !inputText) {
      return inputText;
    }

    const { startIndex, endIndex } = detectionResult;
    const before = inputText.substring(0, startIndex);
    const json = inputText.substring(startIndex, endIndex + 1);
    const after = inputText.substring(endIndex + 1);

    return (
      <>
        <span className="text-gray-500">{before}</span>
        <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
          {json}
        </span>
        <span className="text-gray-500">{after}</span>
      </>
    );
  };

  // Auto-detect JSON when input changes
  useEffect(() => {
    if (inputText && !outputText) {
      const result = detectJsonInText(inputText);
      if (result.valid) {
        setDetectionResult({
          valid: true,
          startIndex: result.startIndex,
          endIndex: result.endIndex
        });
      }
    }
  }, [inputText, outputText]);

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
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <RiCodeSSlashLine />
                格式化
              </button>
              <button
                onClick={handleMinify}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
              >
                <RiFileReduceLine />
                压缩
              </button>
              <button
                onClick={handleValidate}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <RiSearchEyeLine />
                验证
              </button>
              <button
                onClick={handleCopy}
                className={cn(
                  "px-4 py-2 rounded-lg transition-colors flex items-center gap-2",
                  copySuccess 
                    ? "bg-green-500 text-white" 
                    : "bg-gray-500 text-white hover:bg-gray-600"
                )}
              >
                {copySuccess ? <RiCheckLine /> : <RiFileCopyLine />}
                {copySuccess ? '已复制' : '复制'}
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <RiDeleteBinLine />
                清空
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={showHighlight}
                  onChange={(e) => setShowHighlight(e.target.checked)}
                  className="rounded"
                />
                高亮 JSON
              </label>
              <select
                value={indentSize}
                onChange={(e) => setIndentSize(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white text-sm"
              >
                <option value={2}>2 空格</option>
                <option value={4}>4 空格</option>
                <option value={8}>Tab</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        {detectionResult && (
          <div className={cn(
            "rounded-lg p-3 mb-4 flex items-center gap-2",
            detectionResult.valid 
              ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
              : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
          )}>
            {detectionResult.valid ? (
              <>
                <RiCheckLine className="w-5 h-5" />
                <span>
                  检测到有效的 JSON（位置：{detectionResult.startIndex} - {detectionResult.endIndex}）
                </span>
              </>
            ) : (
              <>
                <RiErrorWarningLine className="w-5 h-5" />
                <span>{detectionResult.error}</span>
              </>
            )}
          </div>
        )}

        {/* Editor Area */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="relative">
            <textarea
              value={outputText || inputText}
              onChange={handleInputChange}
              placeholder="在此粘贴包含 JSON 的文本，工具会自动检测 {...} 或 [...] 格式的 JSON 数据"
              className={cn(
                "w-full h-[500px] p-4 font-mono text-sm bg-transparent text-gray-900 dark:text-white",
                "placeholder-gray-400 dark:placeholder-gray-600",
                "focus:outline-none resize-none"
              )}
              spellCheck={false}
            />
            
            {/* Highlighted overlay (only show when there's detected JSON and no output) */}
            {showHighlight && detectionResult?.valid && !outputText && inputText && (
              <div className="absolute inset-0 p-4 pointer-events-none">
                <pre className="font-mono text-sm whitespace-pre-wrap break-words">
                  {getHighlightedText()}
                </pre>
              </div>
            )}

            {/* Replace button when there's output */}
            {outputText && (
              <button
                onClick={handleReplaceInput}
                className="absolute top-4 right-4 px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
              >
                使用格式化结果
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}