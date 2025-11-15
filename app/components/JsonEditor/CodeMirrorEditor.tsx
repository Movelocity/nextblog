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
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    // Dynamically import CodeMirror only when needed
    const initCodeMirror = async () => {
      const { EditorView, basicSetup } = await import('codemirror');
      const { EditorState, Compartment } = await import('@codemirror/state');
      const { javascript } = await import('@codemirror/lang-javascript');
      const { json } = await import('@codemirror/lang-json');
      const { markdown } = await import('@codemirror/lang-markdown');
      const { StreamLanguage } = await import('@codemirror/language');
      const { shell } = await import('@codemirror/legacy-modes/mode/shell');
      const { oneDark } = await import('@codemirror/theme-one-dark');

      if (!editorRef.current || viewRef.current) return;

      // Create language compartment for dynamic updates
      const languageCompartment = new Compartment();

      // Determine language extension
      const getLangExtension = (lang: EditorLanguage) => {
        switch (lang) {
          case 'json':
            return json();
          case 'javascript':
            return javascript();
          case 'markdown':
            return markdown();
          case 'bash':
            return StreamLanguage.define(shell);
          default:
            return [];
        }
      };

      // Check if dark mode is active
      const isDark = document.documentElement.classList.contains('dark');

      // Create editor state
      const startState = EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          languageCompartment.of(getLangExtension(language)),
          ...(isDark ? [oneDark] : []),
          EditorView.updateListener.of((update) => {
            if (update.docChanged && !isUpdatingRef.current) {
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
      (viewRef.current as any).languageCompartment = languageCompartment;
      (viewRef.current as any).getLangExtension = getLangExtension;
    };

    initCodeMirror();

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, []); // Only initialize once

  // Update language when it changes
  useEffect(() => {
    if (viewRef.current && (viewRef.current as any).languageCompartment) {
      const getLangExtension = (viewRef.current as any).getLangExtension;
      viewRef.current.dispatch({
        effects: (viewRef.current as any).languageCompartment.reconfigure(getLangExtension(language))
      });
    }
  }, [language]);

  // Update content when value prop changes (but not from internal updates)
  useEffect(() => {
    if (viewRef.current && viewRef.current.state.doc.toString() !== value) {
      isUpdatingRef.current = true;
      const transaction = viewRef.current.state.update({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: value,
        },
      });
      viewRef.current.dispatch(transaction);
      isUpdatingRef.current = false;
    }
  }, [value]);

  return <div ref={editorRef} className="h-full w-full" />;
};

export default CodeMirrorEditor;

