"use client";

import { useState, useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql, PostgreSQL } from "@codemirror/lang-sql";
import { EditorView } from "@codemirror/view";

interface EditorProps {
  onExecute: (sql: string) => void;
  initialValue?: string;
  disabled?: boolean;
}

export function Editor({ onExecute, initialValue = "", disabled = false }: EditorProps) {
  const [value, setValue] = useState(initialValue);

  const handleExecute = useCallback(() => {
    if (value.trim() && !disabled) {
      onExecute(value);
    }
  }, [value, onExecute, disabled]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden border border-border rounded-md">
        <CodeMirror
          value={value}
          height="100%"
          extensions={[
            sql({ dialect: PostgreSQL }),
            EditorView.lineWrapping,
          ]}
          onChange={(val) => setValue(val)}
          theme="dark"
          className="h-full"
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            history: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            searchKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
        />
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button
          onClick={() => setValue("")}
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          disabled={disabled || !value}
        >
          Clear
        </button>
        <button
          onClick={handleExecute}
          disabled={disabled || !value.trim()}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Run Query
        </button>
      </div>
    </div>
  );
}