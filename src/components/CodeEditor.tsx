import React, { useState, useRef, useMemo } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

import { FileItem, SupportedLanguage } from '../types';
import { LANGUAGE_LIST, getHljsLanguage } from '../utils/language';
import { Copy, Check, WrapText, Wand2, Search, X, Eye, Edit3 } from 'lucide-react';

interface CodeEditorProps {
  file: FileItem;
  onChangeContent: (content: string) => void;
  onChangeLanguage: (lang: SupportedLanguage) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  file,
  onChangeContent,
  onChangeLanguage,
}) => {
  const [copied, setCopied] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [editorMode, setEditorMode] = useState<'edit' | 'highlight'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Compute line count
  const lines = useMemo(() => {
    return file.content.split('\n');
  }, [file.content]);

  // Syntax highlighted HTML via highlight.js
  const highlightedCode = useMemo(() => {
    try {
      const hljsLang = getHljsLanguage(file.language);
      if (hljs.getLanguage(hljsLang)) {
        return hljs.highlight(file.content, { language: hljsLang, ignoreIllegals: true }).value;
      }
      return hljs.highlightAuto(file.content).value;
    } catch {
      return file.content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
  }, [file.content, file.language]);

  // Handle Tab key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newContent =
        file.content.substring(0, start) + '  ' + file.content.substring(end);
      onChangeContent(newContent);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  // Sync scroll between textarea and line numbers
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Basic formatter for JSON / HTML / JS
  const handleFormat = () => {
    try {
      if (file.language === 'json') {
        const formatted = JSON.stringify(JSON.parse(file.content), null, 2);
        onChangeContent(formatted);
      } else if (file.language === 'html' || file.language === 'svg') {
        const formatted = formatHtml(file.content);
        onChangeContent(formatted);
      }
    } catch {
      // ignore parse errors
    }
  };

  // Perform search / replace
  const handleReplaceAll = () => {
    if (!searchQuery) return;
    const newContent = file.content.split(searchQuery).join(replaceQuery);
    onChangeContent(newContent);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-neutral-100 select-none">
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 text-xs">
        <div className="flex items-center gap-2">
          {/* Active File Name & Language Selector */}
          <span className="font-mono text-neutral-300 font-medium text-xs truncate max-w-[160px]">
            {file.name}
          </span>

          <select
            value={file.language}
            onChange={(e) => onChangeLanguage(e.target.value as SupportedLanguage)}
            className="bg-neutral-800 border border-neutral-700 text-neutral-300 rounded px-2 py-0.5 text-xs focus:outline-none hover:border-neutral-500 transition-colors"
          >
            {LANGUAGE_LIST.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Tools */}
        <div className="flex items-center gap-1.5">
          {/* Toggle between Edit mode and Syntax View mode */}
          <div className="flex items-center bg-neutral-800 rounded p-0.5">
            <button
              onClick={() => setEditorMode('edit')}
              title="编辑模式"
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-colors ${
                editorMode === 'edit'
                  ? 'bg-neutral-700 text-white shadow-sm font-medium'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>编辑</span>
            </button>
            <button
              onClick={() => setEditorMode('highlight')}
              title="高亮视图"
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-colors ${
                editorMode === 'highlight'
                  ? 'bg-neutral-700 text-white shadow-sm font-medium'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>高亮</span>
            </button>
          </div>

          <button
            onClick={() => setShowSearch(!showSearch)}
            title="查找 / 替换"
            className={`p-1.5 rounded transition-colors ${
              showSearch ? 'bg-neutral-800 text-orange-400' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {(file.language === 'json' || file.language === 'html' || file.language === 'svg') && (
            <button
              onClick={handleFormat}
              title="代码格式化整理"
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            >
              <Wand2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setWordWrap(!wordWrap)}
            title={wordWrap ? '禁用自动折行' : '启用自动折行'}
            className={`p-1.5 rounded transition-colors ${
              wordWrap ? 'bg-neutral-800 text-orange-400' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <WrapText className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded transition-colors ml-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '已复制' : '复制'}</span>
          </button>
        </div>
      </div>

      {/* Optional Search / Replace Dropdown */}
      {showSearch && (
        <div className="flex items-center gap-2 p-2 bg-neutral-900/90 border-b border-neutral-800 text-xs">
          <input
            type="text"
            placeholder="查找内容..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-orange-500 w-36"
          />
          <input
            type="text"
            placeholder="替换为..."
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            className="px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-orange-500 w-36"
          />
          <button
            onClick={handleReplaceAll}
            disabled={!searchQuery}
            className="px-2.5 py-1 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white rounded text-xs transition-colors"
          >
            全部替换
          </button>
          <button
            onClick={() => setShowSearch(false)}
            className="p-1 text-neutral-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Editor Body with Line Numbers */}
      <div className="flex-1 flex overflow-hidden relative font-mono text-[13px] bg-neutral-950">
        {/* Line Numbers Column */}
        <div
          ref={lineNumbersRef}
          aria-hidden="true"
          className="w-12 shrink-0 py-3 text-right pr-3 select-none text-neutral-600 bg-neutral-950 border-r border-neutral-900 overflow-hidden leading-6 font-mono text-xs tabular-nums"
        >
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Content area: Edit Mode or Highlight Mode */}
        <div className="flex-1 relative overflow-hidden h-full">
          {editorMode === 'edit' ? (
            <textarea
              ref={textareaRef}
              value={file.content}
              onChange={(e) => onChangeContent(e.target.value)}
              onKeyDown={handleKeyDown}
              onScroll={handleScroll}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              placeholder="在此粘贴或输入任何格式的代码/文本..."
              style={{
                tabSize: 2,
                whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
                wordBreak: wordWrap ? 'break-all' : 'normal',
              }}
              className="w-full h-full p-3 font-mono text-[13px] leading-6 bg-transparent text-neutral-200 outline-none resize-none overflow-auto border-0 select-text"
            />
          ) : (
            <div
              className="w-full h-full p-3 font-mono text-[13px] leading-6 overflow-auto select-text"
              style={{
                whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
                wordBreak: wordWrap ? 'break-all' : 'normal',
              }}
            >
              <code
                className="hljs !bg-transparent !p-0"
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-3 py-1 bg-neutral-900 border-t border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between font-mono tabular-nums">
        <div className="flex items-center gap-3">
          <span>行数: {lines.length}</span>
          <span aria-hidden="true" className="text-neutral-700">·</span>
          <span>字符数: {file.content.length.toLocaleString()}</span>
          <span aria-hidden="true" className="text-neutral-700">·</span>
          <span>大小: {(file.size / 1024).toFixed(1)} KB</span>
        </div>

        <div className="flex items-center gap-3">
          <span>UTF-8</span>
          <span aria-hidden="true" className="text-neutral-700">·</span>
          <span>Tab: 2 空格</span>
        </div>
      </div>
    </div>
  );
};

function formatHtml(html: string): string {
  let formatted = '';
  let indent = 0;
  const tab = '  ';
  html.split(/>\s*</).forEach((element) => {
    if (element.match(/^\/\w/)) {
      indent = Math.max(0, indent - 1);
    }
    formatted += tab.repeat(indent) + '<' + element + '>\n';
    if (
      element.match(/^<?\w[^>]*[^\/]$/) &&
      !element.startsWith('input') &&
      !element.startsWith('img') &&
      !element.startsWith('br') &&
      !element.startsWith('hr')
    ) {
      indent++;
    }
  });
  return formatted.substring(1, formatted.length - 2);
}
