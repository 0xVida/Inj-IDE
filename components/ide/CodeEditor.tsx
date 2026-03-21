"use client";

import Editor from "@monaco-editor/react";
import { useEffect, useRef } from "react";

interface CodeEditorProps {
  content: string;
  language?: string;
  fileName?: string;
  onChange?: (content: string) => void;
  onCursorChange?: (line: number, col: number) => void;
  onSave?: () => void;
}

export function CodeEditor({
  content,
  language = "rust",
  fileName,
  onChange,
  onCursorChange,
  onSave,
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);
  const onSaveRef = useRef(onSave);

  // Update ref when onSave prop changes
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  function handleEditorDidMount(editor: any, monaco: any) {
    editorRef.current = editor;

    // Handle cursor change
    editor.onDidChangeCursorPosition((e: any) => {
      onCursorChange?.(e.position.lineNumber, e.position.column);
    });

    // Handle save (Ctrl+S / Cmd+S)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSaveRef.current?.();
    });
  }

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {fileName && (
        <div className="shrink-0 bg-[#1e1e1e] border-b border-border px-4 py-1.5 text-xs text-muted-foreground font-mono">
          {fileName}
        </div>
      )}
      <div className="flex-1 relative overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage={language === "rust" ? "rust" : language}
          language={language === "rust" ? "rust" : language}
          value={content}
          theme="vs-dark"
          onMount={handleEditorDidMount}
          onChange={(value) => onChange?.(value || "")}
          loading={
            <div className="h-full w-full flex flex-col items-center justify-center bg-[#1e1e1e] text-muted-foreground gap-3">
              <div className="flex items-center gap-2 text-xs font-mono animate-pulse">
                <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                Loading Editor...
              </div>
            </div>
          }
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            automaticLayout: true,
            padding: { top: 8, bottom: 8 },
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            renderLineHighlight: "all",
          }}
        />
      </div>
    </div>
  );
}
