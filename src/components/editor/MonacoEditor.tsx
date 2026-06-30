'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Editor, { useMonaco, EditorProps } from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { useLayout } from '@/contexts/LayoutContext';

interface MonacoEditorProps {
  value: string;
  path: string;
  onChange: (value: string | undefined) => void;
  onSave: () => void;
  onMount?: (editor: any, monaco: any) => void;
}

// Keep track of view states for different files
const viewStates = new Map<string, any>();

export const MonacoEditor = React.memo(({ value, path, onChange, onSave, onMount }: MonacoEditorProps) => {
  const monaco = useMonaco();
  const { theme } = useTheme();
  const { isMobile } = useLayout();
  const editorRef = useRef<any>(null);

  // Define custom theme when monaco loads
  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme('vaelox-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          // match vaelox-panel roughly or a deep dark
          { token: '', background: '0f0f13' },
          { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
          { token: 'keyword', foreground: 'a855f7' }, // purple
          { token: 'string', foreground: '10b981' }, // emerald
          { token: 'variable', foreground: 'e5e7eb' },
          { token: 'number', foreground: 'f59e0b' },
          { token: 'type', foreground: '3b82f6' },
        ],
        colors: {
          'editor.background': '#00000000', // Transparent to let container show
          'editor.foreground': '#e5e7eb',
          'editorCursor.foreground': '#a855f7', // brand purple
          'editor.lineHighlightBackground': '#1f293730',
          'editorLineNumber.foreground': '#4b5563',
          'editorIndentGuide.background': '#1f293750',
          'editorIndentGuide.activeBackground': '#374151',
          'editor.selectionBackground': '#a855f740',
        }
      });
      monaco.editor.setTheme(theme === 'dark' ? 'vaelox-dark' : 'vs');
    }
  }, [monaco, theme]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Restore view state if exists
    const state = viewStates.get(path);
    if (state) {
      editor.restoreViewState(state);
    }

    // Add save shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave();
    });

    // Save on blur
    editor.onDidBlurEditorText(() => {
      onSave();
    });

    // --- CODE INTELLIGENCE FOUNDATION ---
    // The following registers providers to show that the architecture
    // is ready for AI/Language Server integration.
    
    // 1. Hover Provider
    monaco.languages.registerHoverProvider('*', {
      provideHover: (model: any, position: any) => {
        // Return hover info here when implemented
        return null; 
      }
    });

    // 2. Completion Item Provider (IntelliSense)
    monaco.languages.registerCompletionItemProvider('*', {
      provideCompletionItems: (model: any, position: any) => {
        return { suggestions: [] };
      }
    });

    // 3. Code Action Provider (Quick Fixes)
    monaco.languages.registerCodeActionProvider('*', {
      provideCodeActions: (model: any, range: any, context: any, token: any) => {
        return { actions: [], dispose: () => {} };
      }
    });

    // 4. Rename Provider
    monaco.languages.registerRenameProvider('*', {
      provideRenameEdits: (model: any, position: any, newName: string, token: any) => {
        return null;
      },
      resolveRenameLocation: (model: any, position: any, token: any) => {
        return null;
      }
    });

    // Note: Diagnostics (Markers) are usually set via:
    // monaco.editor.setModelMarkers(model, 'owner', [...markers]);

    if (onMount) {
      onMount(editor, monaco);
    }
  };

  // Save view state when unmounting or changing path
  useEffect(() => {
    const editor = editorRef.current;
    return () => {
      if (editor) {
        viewStates.set(path, editor.saveViewState());
      }
    };
  }, [path]);

  // Determine language based on extension
  const language = useMemo(() => {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx': return 'typescript';
      case 'js':
      case 'jsx': return 'javascript';
      case 'json': return 'json';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'md': return 'markdown';
      default: return 'plaintext';
    }
  }, [path]);

  // Editor options based on mobile/desktop
  const options: EditorProps['options'] = useMemo(() => {
    const baseOptions: any = {
      automaticLayout: true,
      fontFamily: 'var(--font-mono), monospace',
      fontSize: isMobile ? 14 : 13,
      padding: { top: 16, bottom: 16 },
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      formatOnPaste: true,
      suggest: {
        showIcons: true,
        showStatusBar: true,
      }
    };

    if (isMobile) {
      return {
        ...baseOptions,
        minimap: { enabled: false },
        glyphMargin: false,
        folding: true,
        wordWrap: 'on',
        lineNumbersMinChars: 3,
        scrollbar: {
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
        },
        contextmenu: false, // Mobile might use custom toolbar
      };
    }

    return {
      ...baseOptions,
      minimap: { enabled: true, scale: 0.75 },
      glyphMargin: true,
      folding: true,
      wordWrap: 'off',
      scrollbar: {
        verticalScrollbarSize: 14,
        horizontalScrollbarSize: 14,
      },
    };
  }, [isMobile]);

  return (
    <Editor
      height="100%"
      width="100%"
      language={language}
      value={value}
      theme={theme === 'dark' ? 'vaelox-dark' : 'vs'}
      options={options}
      onChange={(val) => onChange(val)}
      onMount={handleEditorDidMount}
      loading={
        <div className="flex items-center justify-center h-full text-vaelox-muted font-mono text-xs">
          Loading Editor...
        </div>
      }
    />
  );
});
MonacoEditor.displayName = 'MonacoEditor';
