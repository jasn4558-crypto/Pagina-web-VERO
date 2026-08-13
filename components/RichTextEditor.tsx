"use client";

import { useEffect, useRef } from "react";
import { Bold, Italic, Underline, List, Eraser } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Update contentEditable when value changes externally (e.g. initial load)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    editorRef.current?.focus();
    handleInput();
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-stone-200 bg-stone-50 p-2">
        <button
          type="button"
          onClick={() => execCommand("bold")}
          className="p-1.5 hover:bg-stone-200 rounded text-stone-700 transition-colors"
          title="Negrita"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand("italic")}
          className="p-1.5 hover:bg-stone-200 rounded text-stone-700 transition-colors"
          title="Cursiva"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand("underline")}
          className="p-1.5 hover:bg-stone-200 rounded text-stone-700 transition-colors"
          title="Subrayado"
        >
          <Underline className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-stone-300 mx-1" />
        <button
          type="button"
          onClick={() => execCommand("insertUnorderedList")}
          className="p-1.5 hover:bg-stone-200 rounded text-stone-700 transition-colors"
          title="Viñetas"
        >
          <List className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-stone-300 mx-1" />
        <button
          type="button"
          onClick={() => execCommand("removeFormat")}
          className="p-1.5 hover:bg-stone-200 rounded text-stone-700 transition-colors"
          title="Limpiar Formato"
        >
          <Eraser className="w-4 h-4" />
        </button>
      </div>
      
      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        className="p-3 min-h-[120px] max-h-[300px] overflow-y-auto text-sm text-stone-900 outline-none [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:my-1 [&>p]:mb-1"
        style={{ WebkitUserModify: "read-write" }}
      />
      
      {/* Placeholder simulado si esta vacio */}
      {(!value || value === "<br>") && placeholder && (
        <div className="pointer-events-none absolute mt-[52px] ml-3 text-sm text-stone-400">
          {placeholder}
        </div>
      )}
    </div>
  );
}
