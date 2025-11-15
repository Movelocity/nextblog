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
import cn from 'classnames';

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
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
   * Shows a notification message
   */
  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  /**
   * Adds a new editor box
   */
  const handleAddBox = useCallback(() => {
    const newBox: EditorBoxType = {
      id: generateId(),
      type: 'textarea',
      language: 'json',
      content: '',
      label: `Box ${boxes.length + 1}`,
    };
    setBoxes([...boxes, newBox]);
    showNotification('success', 'Box added');
  }, [boxes, showNotification]);

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
   * Deletes a box
   */
  const handleDeleteBox = useCallback((id: string) => {
    if (boxes.length === 1) {
      showNotification('error', 'Cannot delete the last box');
      return;
    }
    setBoxes(prev => prev.filter(box => box.id !== id));
    showNotification('success', 'Box deleted');
  }, [boxes.length, showNotification]);

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
      showNotification('success', 'Operation applied');
    } catch (error) {
      showNotification('error', (error as Error).message);
    }
  }, [boxes, handleContentChange, showNotification]);

  /**
   * Executes a custom script on a box
   */
  const handleExecuteScript = useCallback(async (boxId: string, script: string) => {
    const box = boxes.find(b => b.id === boxId);
    if (!box) return;

    const result = await executeUserScript(script, box.content);
    
    if (result.success && result.output) {
      handleContentChange(boxId, result.output);
      showNotification('success', `Script executed in ${result.executionTime?.toFixed(0)}ms`);
    } else {
      showNotification('error', result.error || 'Script execution failed');
    }
  }, [boxes, handleContentChange, showNotification]);

  /**
   * Saves a custom script
   */
  const handleSaveScript = useCallback(() => {
    if (!scriptName.trim() || !currentScript.trim()) {
      showNotification('error', 'Script name and code are required');
      return;
    }

    const newScript: CustomScript = {
      id: generateId(),
      name: scriptName,
      code: currentScript,
      description: scriptDescription,
    };

    setCustomScripts(prev => [...prev, newScript]);
    setShowScriptModal(false);
    setScriptName('');
    setScriptDescription('');
    setCurrentScript('');
    showNotification('success', 'Script saved');
  }, [scriptName, currentScript, scriptDescription, showNotification]);

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
    showNotification('success', 'State exported');
  }, [boxes, customScripts, showNotification]);

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
            showNotification('success', 'State imported');
          } else {
            throw new Error('Invalid file format');
          }
        } catch (error) {
          showNotification('error', 'Failed to import: ' + (error as Error).message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [showNotification]);

  /**
   * Resets to default state
   */
  const handleReset = useCallback(() => {
    if (confirm('Are you sure you want to reset? All boxes and scripts will be cleared.')) {
      const defaultBox: EditorBoxType = {
        id: generateId(),
        type: 'textarea',
        language: 'json',
        content: '',
        label: 'Box 1',
      };
      setBoxes([defaultBox]);
      setCustomScripts([]);
      localStorage.removeItem(STORAGE_KEY);
      showNotification('success', 'Reset to default');
    }
  }, [showNotification]);

  return (
    <div className="min-h-screen py-6">
      <div className="max-w-[1600px] mx-auto px-2">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            JSON Editor & Text Processor
          </h1>
          <p className="text-sm text-muted-foreground">
            Multi-box editor with syntax highlighting, text operations, and custom scripts
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
                Add Box
              </button>
              <button
                onClick={() => setShowScriptModal(true)}
                className="px-3 py-1.5 rounded text-sm bg-background hover:bg-accent hover:text-white transition-colors flex items-center gap-1.5 border border-border"
              >
                <RiTerminalBoxLine className="w-4 h-4" />
                Custom Script
              </button>
              <button
                onClick={handleImport}
                className="px-3 py-1.5 rounded text-sm bg-background hover:bg-muted transition-colors flex items-center gap-1.5 border border-border"
              >
                <RiUploadLine className="w-4 h-4" />
                Import
              </button>
              <button
                onClick={handleExport}
                className="px-3 py-1.5 rounded text-sm bg-background hover:bg-muted transition-colors flex items-center gap-1.5 border border-border"
              >
                <RiSaveLine className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded text-sm bg-background hover:bg-red-50 dark:hover:bg-red-900 transition-colors flex items-center gap-1.5 border border-border"
              >
                <RiRefreshLine className="w-4 h-4" />
                Reset
              </button>
            </div>
            
            <div className="text-xs text-muted-foreground">
              {boxes.length} box{boxes.length !== 1 ? 'es' : ''} • {customScripts.length} script{customScripts.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div
            className={cn(
              "mb-4 px-4 py-3 rounded-lg text-sm border",
              notification.type === 'success'
                ? "bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800"
            )}
          >
            {notification.message}
          </div>
        )}

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
            />
          ))}
        </div>

        {/* Custom Script Modal */}
        {showScriptModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-background border border-border rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-xl font-bold text-foreground">Custom Script</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Write JavaScript to transform text. Use 'input' for the content and 'return' the result.
                </p>
              </div>

              <div className="flex-1 overflow-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Script Name</label>
                  <input
                    type="text"
                    value={scriptName}
                    onChange={(e) => setScriptName(e.target.value)}
                    placeholder="My Custom Script"
                    className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Description (optional)</label>
                  <input
                    type="text"
                    value={scriptDescription}
                    onChange={(e) => setScriptDescription(e.target.value)}
                    placeholder="What does this script do?"
                    className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Script Code</label>
                  <textarea
                    value={currentScript}
                    onChange={(e) => setCurrentScript(e.target.value)}
                    placeholder="return input.toUpperCase();"
                    className="w-full h-64 px-3 py-2 font-mono text-sm border border-border rounded bg-background text-foreground resize-none"
                    spellCheck={false}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Templates</label>
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
                  onClick={() => setShowScriptModal(false)}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveScript}
                  className="px-4 py-2 text-sm bg-accent text-white rounded hover:bg-opacity-90 transition-colors"
                >
                  Save Script
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
