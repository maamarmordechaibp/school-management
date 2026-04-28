import React, { useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Bold, Italic, Underline, List, ListOrdered, AlignRight, AlignCenter,
  AlignLeft, Link as LinkIcon, Heading1, Heading2, Eraser
} from 'lucide-react';

/**
 * Lightweight contentEditable rich-text editor.
 * Uses document.execCommand (no dependencies).
 * Supports RTL by default for Yiddish/Hebrew templates.
 */
const RichTextEditor = ({ value, onChange, dir = 'rtl', placeholder = '' }) => {
  const ref = useRef(null);
  const isInternal = useRef(false);

  // Sync external value changes only when not from internal typing
  useEffect(() => {
    if (!ref.current) return;
    if (isInternal.current) {
      isInternal.current = false;
      return;
    }
    if (ref.current.innerHTML !== (value || '')) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  const exec = useCallback((cmd, arg = null) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    isInternal.current = true;
    onChange?.(ref.current?.innerHTML || '');
  }, [onChange]);

  const handleInput = () => {
    isInternal.current = true;
    onChange?.(ref.current?.innerHTML || '');
  };

  const insertHtml = useCallback((html) => {
    ref.current?.focus();
    document.execCommand('insertHTML', false, html);
    isInternal.current = true;
    onChange?.(ref.current?.innerHTML || '');
  }, [onChange]);

  const insertLink = () => {
    const url = prompt('Link URL:');
    if (!url) return;
    exec('createLink', url);
  };

  const Btn = ({ onClick, title, children }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="h-8 w-8 rounded hover:bg-slate-100 flex items-center justify-center text-slate-700"
    >
      {children}
    </button>
  );

  return (
    <div className="border rounded-md overflow-hidden bg-white">
      <div className="flex items-center gap-0.5 flex-wrap border-b bg-slate-50 p-1">
        <Btn onClick={() => exec('bold')} title="Bold (Ctrl+B)"><Bold size={15} /></Btn>
        <Btn onClick={() => exec('italic')} title="Italic"><Italic size={15} /></Btn>
        <Btn onClick={() => exec('underline')} title="Underline"><Underline size={15} /></Btn>
        <div className="w-px h-5 bg-slate-300 mx-1" />
        <Btn onClick={() => exec('formatBlock', 'H2')} title="Big heading"><Heading1 size={15} /></Btn>
        <Btn onClick={() => exec('formatBlock', 'H3')} title="Subheading"><Heading2 size={15} /></Btn>
        <Btn onClick={() => exec('formatBlock', 'P')} title="Paragraph"><span className="text-xs font-bold">¶</span></Btn>
        <div className="w-px h-5 bg-slate-300 mx-1" />
        <Btn onClick={() => exec('insertUnorderedList')} title="Bullet list"><List size={15} /></Btn>
        <Btn onClick={() => exec('insertOrderedList')} title="Numbered list"><ListOrdered size={15} /></Btn>
        <div className="w-px h-5 bg-slate-300 mx-1" />
        <Btn onClick={() => exec('justifyRight')} title="Align right"><AlignRight size={15} /></Btn>
        <Btn onClick={() => exec('justifyCenter')} title="Align center"><AlignCenter size={15} /></Btn>
        <Btn onClick={() => exec('justifyLeft')} title="Align left"><AlignLeft size={15} /></Btn>
        <div className="w-px h-5 bg-slate-300 mx-1" />
        <Btn onClick={insertLink} title="Add link"><LinkIcon size={15} /></Btn>
        <Btn onClick={() => exec('removeFormat')} title="Clear formatting"><Eraser size={15} /></Btn>
      </div>
      <div
        ref={ref}
        dir={dir}
        contentEditable
        onInput={handleInput}
        suppressContentEditableWarning
        className="min-h-[260px] p-4 outline-none text-base leading-7 prose prose-sm max-w-none"
        style={{ direction: dir }}
        data-placeholder={placeholder}
      />
      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
        }
        [contenteditable] h2 { font-size: 1.4em; font-weight: 700; margin: 0.4em 0; }
        [contenteditable] h3 { font-size: 1.15em; font-weight: 700; margin: 0.4em 0; }
        [contenteditable] ul { list-style: disc; padding-inline-start: 1.5em; margin: 0.4em 0; }
        [contenteditable] ol { list-style: decimal; padding-inline-start: 1.5em; margin: 0.4em 0; }
        [contenteditable] p { margin: 0.4em 0; }
        [contenteditable] a { color: #2563eb; text-decoration: underline; }
      `}</style>
    </div>
  );
};

// Expose a helper that callers can use to insert HTML at the current selection
RichTextEditor.insertAtSelection = (html) => {
  document.execCommand('insertHTML', false, html);
};

export default RichTextEditor;
