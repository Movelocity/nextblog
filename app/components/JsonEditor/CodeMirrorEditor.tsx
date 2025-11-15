'use client';

import { useEffect, useRef } from 'react';
import { EditorLanguage } from './types';

interface CodeMirrorEditorProps {
  value: string;
  language: EditorLanguage;
  onChange: (value: string) => void;
}

/**
 * CodeMirror editor component with syntax highlighting
 * Lazy-loaded for better initial load performance
 */
const CodeMirrorEditor = ({ value, language, onChange }: CodeMirrorEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<any>(null);

  useEffect(() => {
    // Dynamically import CodeMirror only when needed
    const initCodeMirror = async () => {
      const { EditorView, basicSetup } = await import('codemirror');
      const { EditorState } = await import('@codemirror/state');
      const { javascript } = await import('@codemirror/lang-javascript');
      const { json } = await import('@codemirror/lang-json');
      const { markdown } = await import('@codemirror/lang-markdown');
      const { oneDark } = await import('@codemirror/theme-one-dark');

      if (!editorRef.current) return;

      // Determine language extension
      let langExtension;
      switch (language) {
        case 'json':
          langExtension = json();
          break;
        case 'javascript':
          langExtension = javascript();
          break;
        case 'markdown':
          langExtension = markdown();
          break;
        default:
          langExtension = [];
      }

      // Check if dark mode is active
      const isDark = document.documentElement.classList.contains('dark');

      // Create editor state
      const startState = EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          langExtension,
          ...(isDark ? [oneDark] : []),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChange(update.state.doc.toString());
            }
          }),
          EditorView.theme({
            '&': {
              height: '100%',
              fontSize: '14px',
            },
            '.cm-scroller': {
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            },
          }),
        ],
      });

      // Create editor view
      const view = new EditorView({
        state: startState,
        parent: editorRef.current,
      });

      viewRef.current = view;

      return () => {
        view.destroy();
      };
    };

    initCodeMirror();
  }, [language]); // Reinitialize when language changes

  // Update content when value prop changes (but not from internal updates)
  useEffect(() => {
    if (viewRef.current && viewRef.current.state.doc.toString() !== value) {
      const transaction = viewRef.current.state.update({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: value,
        },
      });
      viewRef.current.dispatch(transaction);
    }
  }, [value]);

  return <div ref={editorRef} className="h-full w-full" />;
};

export default CodeMirrorEditor;

