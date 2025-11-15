'use client';

import { useState, useEffect, useCallback } from 'react';
import { EditorBox as EditorBoxType, EditorType, EditorLanguage, PersistedState, CustomScript } from '@/app/components/JsonEditor/types';
import EditorBox from '@/app/components/JsonEditor/EditorBox';
import { 
  formatJson,
  minifyJson,
  unescapeString,
  removeNewlines,
  removeTabs,
  removeQuotes,
  detectJsonInText
} from '@/app/utils/jsonTools';
import { executeUserScript, scriptTemplates } from '@/app/utils/scriptRunner';
import { 
  RiAddLine,
  RiSaveLine,
  RiUploadLine,
  RiRefreshLine,
  RiTerminalBoxLine,
  RiPlayLine
} from 'react-icons/ri';
import { useToast } from '@/app/components/layout/ToastHook';

const STORAGE_KEY = 'json-editor-state';
const STORAGE_VERSION = 1;

/**
 * Enhanced JSON Editor with multi-box support and advanced text processing
 */
export default function JsonEditorPage() {
  const [boxes, setBoxes] = useState<EditorBoxType[]>([]);
  const [customScripts, setCustomScripts] = useState<CustomScript[]>([]);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [currentScript, setCurrentScript] = useState('');
  const [scriptName, setScriptName] = useState('');
  const [scriptDescription, setScriptDescription] = useState('');
  const [scriptOutputMode, setScriptOutputMode] = useState<'inplace' | 'newBlock'>('inplace');
  const { showToast } = useToast();

  /**
   * Initializes editor with default box or loads from localStorage
   */
  useEffect(() => {
    const savedState = loadState();
    if (savedState && savedState.boxes.length > 0) {
      setBoxes(savedState.boxes);
      setCustomScripts(savedState.customScripts || []);
    } else {
      // Initialize with one default box
      const defaultBox: EditorBoxType = {
        id: generateId(),
        type: 'textarea',
        language: 'json',
        content: '',
        label: 'Box 1',
      };
      setBoxes([defaultBox]);
    }
  }, []);

  /**
   * Auto-saves state to localStorage (debounced)
   */
  useEffect(() => {
    if (boxes.length === 0) return;

    const timeoutId = setTimeout(() => {
      saveState({ version: STORAGE_VERSION, boxes, customScripts });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [boxes, customScripts]);

  /**
   * Generates a unique ID for boxes
   */
  const generateId = (): string => {
    return `box-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };


  /**
   * Adds a new editor box
   */
  const handleAddBox = useCallback(() => {
    const newBox: EditorBoxType = {
      id: generateId(),
      type: 'textarea',
      language: 'json',
      content: '',
      label: `编辑框 ${boxes.length + 1}`,
    };
    setBoxes([...boxes, newBox]);
    showToast('编辑框已添加', 'success');
  }, [boxes, showToast]);

  /**
   * Handles box content change
   */
  const handleContentChange = useCallback((id: string, content: string) => {
    setBoxes(prev => prev.map(box => box.id === id ? { ...box, content } : box));
  }, []);

  /**
   * Handles box type change
   */
  const handleTypeChange = useCallback((id: string, type: EditorType) => {
    setBoxes(prev => prev.map(box => box.id === id ? { ...box, type } : box));
  }, []);

  /**
   * Handles box language change
   */
  const handleLanguageChange = useCallback((id: string, language: EditorLanguage) => {
    setBoxes(prev => prev.map(box => box.id === id ? { ...box, language } : box));
  }, []);

  /**
   * Handles box label change
   */
  const handleLabelChange = useCallback((id: string, label: string) => {
    setBoxes(prev => prev.map(box => box.id === id ? { ...box, label } : box));
  }, []);

  /**
   * Handles box size change
   */
  const handleSizeChange = useCallback((id: string, width: number, height: number) => {
    setBoxes(prev => prev.map(box => box.id === id ? { ...box, width, height } : box));
  }, []);

  /**
   * Deletes a box
   */
  const handleDeleteBox = useCallback((id: string) => {
    if (boxes.length === 1) {
      showToast('无法删除最后一个编辑框', 'error');
      return;
    }
    setBoxes(prev => prev.filter(box => box.id !== id));
    showToast('编辑框已删除', 'success');
  }, [boxes.length, showToast]);

  /**
   * Applies a text operation to a box
   */
  const handleApplyOperation = useCallback((id: string, operation: string) => {
    const box = boxes.find(b => b.id === id);
    if (!box) return;

    try {
      let result: string;
      
      switch (operation) {
        case 'format':
          const formatDetect = detectJsonInText(box.content);
          if (formatDetect.valid) {
            result = formatJson(formatDetect.jsonString, 2);
          } else {
            throw new Error(formatDetect.error || 'Invalid JSON');
          }
          break;
        
        case 'minify':
          const minifyDetect = detectJsonInText(box.content);
          if (minifyDetect.valid) {
            result = minifyJson(minifyDetect.jsonString);
          } else {
            throw new Error(minifyDetect.error || 'Invalid JSON');
          }
          break;
        
        case 'unescape':
          result = unescapeString(box.content, 1);
          break;
        
        case 'remove-newlines':
          result = removeNewlines(box.content);
          break;
        
        case 'remove-tabs':
          result = removeTabs(box.content);
          break;
        
        case 'remove-quotes':
          result = removeQuotes(box.content);
          break;
        
        default:
          throw new Error('Unknown operation');
      }

      handleContentChange(id, result);
      showToast('操作已应用', 'success');
    } catch (error) {
      showToast((error as Error).message, 'error');
    }
  }, [boxes, handleContentChange, showToast]);

  /**
   * Executes a custom script on a box
   */
  const handleExecuteScript = useCallback(async (boxId: string, scriptId: string) => {
    const box = boxes.find(b => b.id === boxId);
    const script = customScripts.find(s => s.id === scriptId);
    if (!box || !script) return;

    const result = await executeUserScript(script.code, box.content);
    
    if (result.success && result.output) {
      if (script.outputMode === 'newBlock') {
        // Create a new box with the result
        const newBox: EditorBoxType = {
          id: generateId(),
          type: box.type,
          language: box.language,
          content: result.output,
          label: `${box.label || '编辑框'} - 脚本结果`,
        };
        setBoxes(prev => [...prev, newBox]);
        showToast(`脚本已执行，结果已创建新编辑框 (${result.executionTime?.toFixed(0)}ms)`, 'success');
      } else {
        // Replace content in the current box (inplace)
        handleContentChange(boxId, result.output);
        showToast(`脚本已执行 (${result.executionTime?.toFixed(0)}ms)`, 'success');
      }
    } else {
      showToast(result.error || '脚本执行失败', 'error');
    }
  }, [boxes, customScripts, handleContentChange, showToast]);

  /**
   * Saves a custom script
   */
  const handleSaveScript = useCallback(() => {
    if (!scriptName.trim() || !currentScript.trim()) {
      showToast('脚本名称和代码为必填项', 'error');
      return;
    }

    const newScript: CustomScript = {
      id: generateId(),
      name: scriptName,
      code: currentScript,
      description: scriptDescription,
      outputMode: scriptOutputMode,
    };

    setCustomScripts(prev => [...prev, newScript]);
    setShowScriptModal(false);
    setScriptName('');
    setScriptDescription('');
    setCurrentScript('');
    setScriptOutputMode('inplace');
    showToast('脚本已保存', 'success');
  }, [scriptName, currentScript, scriptDescription, scriptOutputMode, showToast]);

  /**
   * Loads a script template
   */
  const handleLoadTemplate = useCallback((templateKey: string) => {
    const template = scriptTemplates[templateKey as keyof typeof scriptTemplates];
    if (template) {
      setScriptName(template.name);
      setScriptDescription(template.description);
      setCurrentScript(template.code);
    }
  }, []);

  /**
   * Exports current state as JSON
   */
  const handleExport = useCallback(() => {
    const state: PersistedState = { version: STORAGE_VERSION, boxes, customScripts };
    const dataStr = JSON.stringify(state, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `json-editor-export-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('状态已导出', 'success');
  }, [boxes, customScripts, showToast]);

  /**
   * Imports state from JSON file
   */
  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string) as PersistedState;
          if (imported.boxes && Array.isArray(imported.boxes)) {
            setBoxes(imported.boxes);
            setCustomScripts(imported.customScripts || []);
            showToast('状态已导入', 'success');
          } else {
            throw new Error('无效的文件格式');
          }
        } catch (error) {
          showToast('导入失败: ' + (error as Error).message, 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [showToast]);

  /**
   * Resets to default state
   */
  const handleReset = useCallback(() => {
    if (confirm('确定要重置吗？所有编辑框和脚本将被清空。')) {
      const defaultBox: EditorBoxType = {
        id: generateId(),
        type: 'textarea',
        language: 'json',
        content: '',
        label: '编辑框 1',
      };
      setBoxes([defaultBox]);
      setCustomScripts([]);
      localStorage.removeItem(STORAGE_KEY);
      showToast('已重置为默认状态', 'success');
    }
  }, [showToast]);

  return (
    <div className="min-h-screen py-6">
      <div className="max-w-[1600px] mx-auto px-2">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            JSON 编辑器 & 文本处理器
          </h1>
          <p className="text-sm text-muted-foreground">
            多编辑框编辑器，支持语法高亮、文本操作和自定义脚本
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="bg-muted rounded-lg shadow-sm border border-border px-4 py-3 mb-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleAddBox}
                className="px-3 py-1.5 rounded text-sm bg-background hover:bg-accent hover:text-white transition-colors flex items-center gap-1.5 border border-border"
              >
                <RiAddLine className="w-4 h-4" />
                添加编辑框
              </button>
              <button
                onClick={() => setShowScriptModal(true)}
                className="px-3 py-1.5 rounded text-sm bg-background hover:bg-accent hover:text-white transition-colors flex items-center gap-1.5 border border-border"
              >
                <RiTerminalBoxLine className="w-4 h-4" />
                自定义脚本
              </button>
              <button
                onClick={handleImport}
                className="px-3 py-1.5 rounded text-sm bg-background hover:bg-muted transition-colors flex items-center gap-1.5 border border-border"
              >
                <RiUploadLine className="w-4 h-4" />
                导入
              </button>
              <button
                onClick={handleExport}
                className="px-3 py-1.5 rounded text-sm bg-background hover:bg-muted transition-colors flex items-center gap-1.5 border border-border"
              >
                <RiSaveLine className="w-4 h-4" />
                导出
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded text-sm bg-background hover:bg-red-50 dark:hover:bg-red-900 transition-colors flex items-center gap-1.5 border border-border"
              >
                <RiRefreshLine className="w-4 h-4" />
                重置
              </button>
            </div>
            
            <div className="text-xs text-muted-foreground">
              {boxes.length} 个编辑框 • {customScripts.length} 个脚本
            </div>
          </div>
        </div>

        {/* Editor Boxes Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {boxes.map((box) => (
            <EditorBox
              key={box.id}
              box={box}
              onContentChange={handleContentChange}
              onTypeChange={handleTypeChange}
              onLanguageChange={handleLanguageChange}
              onLabelChange={handleLabelChange}
              onDelete={handleDeleteBox}
              onApplyOperation={handleApplyOperation}
              onSizeChange={handleSizeChange}
              customScripts={customScripts}
              onExecuteScript={handleExecuteScript}
            />
          ))}
        </div>

        {/* Custom Script Modal */}
        {showScriptModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-background border border-border rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-xl font-bold text-foreground">自定义脚本</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  编写 JavaScript 代码来转换文本。使用 'input' 获取内容，用 'return' 返回结果。
                </p>
              </div>

              <div className="flex-1 overflow-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">脚本名称</label>
                  <input
                    type="text"
                    value={scriptName}
                    onChange={(e) => setScriptName(e.target.value)}
                    placeholder="我的自定义脚本"
                    className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">描述（可选）</label>
                  <input
                    type="text"
                    value={scriptDescription}
                    onChange={(e) => setScriptDescription(e.target.value)}
                    placeholder="这个脚本做什么？"
                    className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">脚本代码</label>
                  <textarea
                    value={currentScript}
                    onChange={(e) => setCurrentScript(e.target.value)}
                    placeholder="return input.toUpperCase();"
                    className="w-full h-64 px-3 py-2 font-mono text-sm border border-border rounded bg-background text-foreground resize-none"
                    spellCheck={false}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">输出模式</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="outputMode"
                        value="inplace"
                        checked={scriptOutputMode === 'inplace'}
                        onChange={(e) => setScriptOutputMode(e.target.value as 'inplace' | 'newBlock')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-foreground">原地替换</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="outputMode"
                        value="newBlock"
                        checked={scriptOutputMode === 'newBlock'}
                        onChange={(e) => setScriptOutputMode(e.target.value as 'inplace' | 'newBlock')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-foreground">新建编辑框</span>
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    原地替换：结果会替换当前编辑框内容；新建编辑框：结果会创建一个新的编辑框
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">模板</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(scriptTemplates).map(([key, template]) => (
                      <button
                        key={key}
                        onClick={() => handleLoadTemplate(key)}
                        className="px-3 py-2 text-left text-sm bg-muted hover:bg-accent hover:text-white transition-colors rounded border border-border"
                      >
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-border px-6 py-4 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowScriptModal(false);
                    setScriptOutputMode('inplace');
                  }}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveScript}
                  className="px-4 py-2 text-sm bg-accent text-white rounded hover:bg-opacity-90 transition-colors"
                >
                  保存脚本
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Saves state to localStorage
 */
function saveState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save state:', error);
  }
}

/**
 * Loads state from localStorage
 */
function loadState(): PersistedState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as PersistedState;
  } catch (error) {
    console.error('Failed to load state:', error);
    return null;
  }
}


