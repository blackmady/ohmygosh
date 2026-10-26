import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

import { FileItem, SupportedLanguage } from '../types';
import { LANGUAGE_LIST, getHljsLanguage } from '../utils/language';
import {
  Copy,
  Check,
  WrapText,
  Wand2,
  Search,
  X,
  Sparkles,
  ArrowRight,
  Code2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

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
  const [fontSize, setFontSize] = useState<number>(13);
  const [isHighlightEnabled, setIsHighlightEnabled] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1, selected: 0 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Line height corresponding to font size
  const lineHeight = fontSize === 12 ? 20 : fontSize === 13 ? 22 : 24;

  // Split lines
  const lines = useMemo(() => {
    return file.content.split('\n');
  }, [file.content]);

  // Syntax highlighted HTML via highlight.js
  const highlightedCode = useMemo(() => {
    if (!file.content) return '';
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

  // Append trailing newline character so <pre> does not collapse empty trailing lines
  const highlightedCodeWithEndingNewline = useMemo(() => {
    if (!file.content) return '';
    if (file.content.endsWith('\n')) {
      return highlightedCode + '\n ';
    }
    return highlightedCode;
  }, [highlightedCode, file.content]);

  // Track cursor position (Line, Column, Selected length)
  const updateCursorPos = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;
    const before = value.substring(0, selectionStart);
    const line = before.split('\n').length;
    const lastNl = before.lastIndexOf('\n');
    const col = selectionStart - lastNl;
    const selected = Math.abs(selectionEnd - selectionStart);
    setCursorPos({ line, col, selected });
  }, []);

  // Sync scroll from container to line numbers column
  const handleContainerScroll = () => {
    if (scrollContainerRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = scrollContainerRef.current.scrollTop;
    }
  };

  // Find all match start positions in file.content
  const matches = useMemo(() => {
    if (!searchQuery) return [];
    const lowerContent = file.content.toLowerCase();
    const lowerQuery = searchQuery.toLowerCase();
    const result: number[] = [];
    let start = 0;
    while (start < lowerContent.length) {
      const idx = lowerContent.indexOf(lowerQuery, start);
      if (idx === -1) break;
      result.push(idx);
      start = idx + Math.max(1, lowerQuery.length);
    }
    return result;
  }, [file.content, searchQuery]);

  const [hasJumped, setHasJumped] = useState(false);

  // Jump to specific match index
  const jumpToMatch = useCallback(
    (targetIdx: number, matchArray: number[] = matches, keepSearchFocus = true) => {
      if (!matchArray || matchArray.length === 0) return;
      const normalizedIdx = (targetIdx + matchArray.length) % matchArray.length;
      setCurrentMatchIndex(normalizedIdx);

      const startPos = matchArray[normalizedIdx];
      const endPos = startPos + searchQuery.length;

      const textarea = textareaRef.current;
      if (textarea) {
        textarea.setSelectionRange(startPos, endPos);

        // Scroll to matching line
        const before = file.content.substring(0, startPos);
        const lineIdx = before.split('\n').length - 1;
        if (scrollContainerRef.current) {
          const targetScrollTop = Math.max(0, lineIdx * lineHeight - 100);
          scrollContainerRef.current.scrollTop = targetScrollTop;
        }
        updateCursorPos();

        if (keepSearchFocus && searchInputRef.current) {
          searchInputRef.current.focus();
        } else {
          textarea.focus();
        }
      }
    },
    [matches, searchQuery, file.content, lineHeight, updateCursorPos]
  );

  // Reset match index and jump flag when searchQuery changes (NO focus stealing while typing!)
  useEffect(() => {
    setCurrentMatchIndex(0);
    setHasJumped(false);
  }, [searchQuery]);

  const handleNextMatch = () => {
    if (matches.length === 0) return;
    if (!hasJumped) {
      setHasJumped(true);
      jumpToMatch(0, matches, true);
    } else {
      const nextIdx = (currentMatchIndex + 1) % matches.length;
      jumpToMatch(nextIdx, matches, true);
    }
  };

  const handlePrevMatch = () => {
    if (matches.length === 0) return;
    if (!hasJumped) {
      setHasJumped(true);
      jumpToMatch(matches.length - 1, matches, true);
    } else {
      const prevIdx = (currentMatchIndex - 1 + matches.length) % matches.length;
      jumpToMatch(prevIdx, matches, true);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrevMatch();
      } else {
        handleNextMatch();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowSearch(false);
      textareaRef.current?.focus();
    }
  };

  // Jump cursor to line when clicking line number
  const handleJumpToLine = (targetLineIdx: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    let charOffset = 0;
    for (let i = 0; i < targetLineIdx && i < lines.length; i++) {
      charOffset += lines[i].length + 1;
    }
    textarea.focus();
    textarea.setSelectionRange(charOffset, charOffset);
    updateCursorPos();
  };

  // Advanced keyboard handlers: Tab, Shift+Tab, Smart Enter, Bracket Auto-close
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;

    // 1. Tab / Shift+Tab handling
    if (e.key === 'Tab') {
      e.preventDefault();
      if (selectionStart !== selectionEnd) {
        // Multi-line indent or unindent
        const before = value.substring(0, selectionStart);
        const startLineIdx = before.lastIndexOf('\n') + 1;
        const endLineIdx = value.indexOf('\n', selectionEnd);
        const finishIdx = endLineIdx === -1 ? value.length : endLineIdx;
        const targetChunk = value.substring(startLineIdx, finishIdx);
        const chunkLines = targetChunk.split('\n');

        if (e.shiftKey) {
          // Unindent 2 spaces
          const unindented = chunkLines
            .map((line) => (line.startsWith('  ') ? line.substring(2) : line.startsWith(' ') ? line.substring(1) : line))
            .join('\n');
          const newContent = value.substring(0, startLineIdx) + unindented + value.substring(finishIdx);
          onChangeContent(newContent);
          setTimeout(() => {
            textarea.setSelectionRange(startLineIdx, startLineIdx + unindented.length);
            updateCursorPos();
          }, 0);
        } else {
          // Indent 2 spaces
          const indented = chunkLines.map((line) => '  ' + line).join('\n');
          const newContent = value.substring(0, startLineIdx) + indented + value.substring(finishIdx);
          onChangeContent(newContent);
          setTimeout(() => {
            textarea.setSelectionRange(startLineIdx, startLineIdx + indented.length);
            updateCursorPos();
          }, 0);
        }
      } else {
        // Single cursor: insert 2 spaces
        const newContent = value.substring(0, selectionStart) + '  ' + value.substring(selectionEnd);
        onChangeContent(newContent);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + 2;
          updateCursorPos();
        }, 0);
      }
      return;
    }

    // 2. Smart Enter: Auto-preserve indentation & indent after block start
    if (e.key === 'Enter') {
      if (selectionStart !== selectionEnd) return;
      const lastNewLine = value.lastIndexOf('\n', selectionStart - 1);
      const currentLine = value.substring(lastNewLine + 1, selectionStart);
      const indentMatch = currentLine.match(/^(\s+)/);
      let indent = indentMatch ? indentMatch[1] : '';

      const trimmed = currentLine.trim();
      if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(') || trimmed.endsWith(':')) {
        indent += '  ';
      }

      if (indent.length > 0) {
        e.preventDefault();
        const newContent = value.substring(0, selectionStart) + '\n' + indent + value.substring(selectionEnd);
        onChangeContent(newContent);
        const newPos = selectionStart + 1 + indent.length;
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = newPos;
          updateCursorPos();
        }, 0);
        return;
      }
    }

    // 3. Auto-close pairs: (), [], {}, "", '', ``
    const pairs: Record<string, string> = {
      '(': ')',
      '[': ']',
      '{': '}',
      '"': '"',
      "'": "'",
      '`': '`',
    };

    if (pairs[e.key]) {
      const closePair = pairs[e.key];
      e.preventDefault();
      if (selectionStart !== selectionEnd) {
        // Wrap selected text
        const selectedText = value.substring(selectionStart, selectionEnd);
        const newContent =
          value.substring(0, selectionStart) + e.key + selectedText + closePair + value.substring(selectionEnd);
        onChangeContent(newContent);
        setTimeout(() => {
          textarea.setSelectionRange(selectionStart + 1, selectionEnd + 1);
          updateCursorPos();
        }, 0);
      } else {
        // If typing quote or backtick and next char is already that char, skip over it
        if (value[selectionStart] === e.key && (e.key === '"' || e.key === "'" || e.key === '`')) {
          textarea.setSelectionRange(selectionStart + 1, selectionStart + 1);
          updateCursorPos();
          return;
        }
        const newContent = value.substring(0, selectionStart) + e.key + closePair + value.substring(selectionEnd);
        onChangeContent(newContent);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
          updateCursorPos();
        }, 0);
      }
      return;
    }

    // 4. Skip closing bracket if already present
    if (e.key === ')' || e.key === ']' || e.key === '}') {
      if (value[selectionStart] === e.key) {
        e.preventDefault();
        textarea.setSelectionRange(selectionStart + 1, selectionStart + 1);
        updateCursorPos();
        return;
      }
    }

    // 5. Backspace between empty pairs
    if (e.key === 'Backspace' && selectionStart === selectionEnd && selectionStart > 0) {
      const prevChar = value[selectionStart - 1];
      const nextChar = value[selectionStart];
      if (
        (prevChar === '(' && nextChar === ')') ||
        (prevChar === '[' && nextChar === ']') ||
        (prevChar === '{' && nextChar === '}') ||
        (prevChar === '"' && nextChar === '"') ||
        (prevChar === "'" && nextChar === "'") ||
        (prevChar === '`' && nextChar === '`')
      ) {
        e.preventDefault();
        const newContent = value.substring(0, selectionStart - 1) + value.substring(selectionStart + 1);
        onChangeContent(newContent);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart - 1;
          updateCursorPos();
        }, 0);
        return;
      }
    }

    // 6. Ctrl+F / Cmd+F shortcut
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      setShowSearch((prev) => {
        const next = !prev;
        if (next) {
          setTimeout(() => searchInputRef.current?.focus(), 50);
        }
        return next;
      });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Formatter for JSON / HTML / SVG
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
    if (!searchQuery || matches.length === 0) return;
    const newContent = file.content.split(searchQuery).join(replaceQuery);
    onChangeContent(newContent);
  };

  // Keep cursor telemetry updated on file change
  useEffect(() => {
    updateCursorPos();
  }, [file.id, updateCursorPos]);

  // Standard shared typography styles between pre and textarea
  const typographyStyle: React.CSSProperties = {
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: `${fontSize}px`,
    lineHeight: `${lineHeight}px`,
    letterSpacing: '0px',
    tabSize: 2,
    whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
    wordBreak: wordWrap ? 'break-all' : 'normal',
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-neutral-100">
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 text-xs select-none">
        <div className="flex items-center gap-2">
          {/* Active File Name & Language Selector */}
          <span className="font-mono text-neutral-300 font-medium text-xs truncate max-w-[150px]">
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

          {/* Fused Status Badge */}
          <button
            onClick={() => setIsHighlightEnabled(!isHighlightEnabled)}
            title={isHighlightEnabled ? '已开启实时高亮融合模式（点击切换纯净文本模式）' : '已关闭高亮（点击开启实时高亮融合模式）'}
            className={`hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] transition-colors border ${
              isHighlightEnabled
                ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 font-medium'
                : 'bg-neutral-800 border-neutral-700 text-neutral-400'
            }`}
          >
            <Sparkles className="w-3 h-3 text-orange-400" />
            <span>{isHighlightEnabled ? '实时高亮编辑中' : '纯净模式'}</span>
          </button>
        </div>

        {/* Quick Tools */}
        <div className="flex items-center gap-1.5">
          {/* Font Size controls */}
          <div className="flex items-center bg-neutral-800 border border-neutral-700/60 rounded px-1 py-0.5 text-[10px] text-neutral-400">
            <button
              onClick={() => setFontSize((s) => Math.max(12, s - 1))}
              disabled={fontSize <= 12}
              title="缩小字体"
              className="px-1 hover:text-white disabled:opacity-30"
            >
              A-
            </button>
            <span className="text-neutral-300 px-1 font-mono">{fontSize}</span>
            <button
              onClick={() => setFontSize((s) => Math.min(15, s + 1))}
              disabled={fontSize >= 15}
              title="放大字体"
              className="px-1 hover:text-white disabled:opacity-30"
            >
              A+
            </button>
          </div>

          {/* Search Toggle */}
          <button
            onClick={() => {
              setShowSearch((prev) => {
                const next = !prev;
                if (next) {
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }
                return next;
              });
            }}
            title="查找 / 替换 (Ctrl+F)"
            className={`p-1.5 rounded transition-colors ${
              showSearch ? 'bg-orange-500/20 text-orange-400' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Formatter */}
          {(file.language === 'json' || file.language === 'html' || file.language === 'svg') && (
            <button
              onClick={handleFormat}
              title="整理并格式化代码"
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            >
              <Wand2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Word Wrap */}
          <button
            onClick={() => setWordWrap(!wordWrap)}
            title={wordWrap ? '禁用自动折行' : '启用自动折行'}
            className={`p-1.5 rounded transition-colors ${
              wordWrap ? 'bg-orange-500/20 text-orange-400' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <WrapText className="w-3.5 h-3.5" />
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded transition-colors ml-0.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '已复制' : '复制'}</span>
          </button>
        </div>
      </div>

      {/* Search / Replace Panel with Enter Navigation */}
      {showSearch && (
        <div className="flex flex-wrap items-center gap-2 p-2 bg-neutral-900 border-b border-neutral-800 text-xs animate-fade-in select-none">
          <div className="relative flex items-center">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="查找文本 (Enter 下一个)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="px-2 py-1 pr-16 bg-neutral-950 border border-neutral-700 rounded text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-orange-500 w-48 font-mono"
              autoFocus
            />
            {searchQuery ? (
              <span className="absolute right-2 text-[10px] text-orange-400/90 font-mono select-none">
                {matches.length === 0
                  ? '未找到'
                  : hasJumped
                  ? `${currentMatchIndex + 1}/${matches.length}`
                  : `共 ${matches.length} 处`}
              </span>
            ) : null}
          </div>

          <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded p-0.5">
            <button
              type="button"
              onClick={handlePrevMatch}
              disabled={matches.length === 0}
              title="上一个匹配 (Shift+Enter)"
              className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 rounded transition-colors"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNextMatch}
              disabled={matches.length === 0}
              title="下一个匹配 (Enter)"
              className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 rounded transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <ArrowRight className="w-3 h-3 text-neutral-500 shrink-0" />
            <input
              type="text"
              placeholder="替换为..."
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleReplaceAll();
                }
              }}
              className="px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-orange-500 w-32 font-mono"
            />
          </div>

          <button
            type="button"
            onClick={handleReplaceAll}
            disabled={!searchQuery || matches.length === 0}
            className="px-2.5 py-1 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white rounded text-xs transition-colors font-medium cursor-pointer"
          >
            全部替换
          </button>

          <button
            type="button"
            onClick={() => {
              setShowSearch(false);
              textareaRef.current?.focus();
            }}
            className="p-1 text-neutral-400 hover:text-white ml-auto"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Editor Body: Line Numbers + Fused Interactive Code Area */}
      <div className="flex-1 flex overflow-hidden relative bg-neutral-950">
        {/* Line Numbers Column */}
        <div
          ref={lineNumbersRef}
          aria-hidden="true"
          className="w-12 shrink-0 py-3 text-right pr-2.5 select-none text-neutral-600 bg-neutral-950 border-r border-neutral-900 overflow-hidden font-mono tabular-nums select-none"
        >
          {lines.map((_, i) => {
            const isCurrentLine = i === cursorPos.line - 1;
            return (
              <div
                key={i}
                onClick={() => handleJumpToLine(i)}
                style={{
                  height: `${lineHeight}px`,
                  lineHeight: `${lineHeight}px`,
                  fontSize: `${fontSize}px`,
                }}
                className={`cursor-pointer transition-colors ${
                  isCurrentLine
                    ? 'text-orange-400 font-bold bg-neutral-900/60 rounded-l'
                    : 'hover:text-neutral-400'
                }`}
                title={`跳转到第 ${i + 1} 行`}
              >
                {i + 1}
              </div>
            );
          })}
        </div>

        {/* Fused Scrolling Container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleContainerScroll}
          className="flex-1 relative overflow-auto h-full bg-neutral-950"
        >
          <div className="relative min-w-full inline-block" style={{ minHeight: '100%' }}>
            {/* Underneath Layer: Live Syntax Highlighted Output */}
            {isHighlightEnabled && (
              <pre
                aria-hidden="true"
                className="m-0 p-3 select-none pointer-events-none hljs !bg-transparent"
                style={{
                  ...typographyStyle,
                }}
              >
                <code
                  className="hljs !bg-transparent !p-0"
                  style={{
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    lineHeight: 'inherit',
                  }}
                  dangerouslySetInnerHTML={{ __html: highlightedCodeWithEndingNewline }}
                />
              </pre>
            )}

            {/* Top Interactive Layer: Transparent Textarea */}
            <textarea
              ref={textareaRef}
              value={file.content}
              onChange={(e) => {
                onChangeContent(e.target.value);
                updateCursorPos();
              }}
              onKeyDown={handleKeyDown}
              onKeyUp={updateCursorPos}
              onClick={updateCursorPos}
              onSelect={updateCursorPos}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              placeholder="在此粘贴或输入任何格式的代码/文本..."
              style={{
                ...typographyStyle,
              }}
              className={`absolute inset-0 w-full h-full p-3 resize-none overflow-hidden outline-none border-0 select-text ${
                isHighlightEnabled
                  ? 'fused-code-editor-textarea'
                  : 'text-neutral-200 bg-transparent'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Editor Status Bar */}
      <div className="px-3 py-1 bg-neutral-900 border-t border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between font-mono tabular-nums">
        <div className="flex items-center gap-3">
          <span className="text-neutral-300 font-medium">
            行 {cursorPos.line}, 列 {cursorPos.col}
          </span>
          {cursorPos.selected > 0 && (
            <>
              <span aria-hidden="true" className="text-neutral-700">·</span>
              <span className="text-orange-400">已选 {cursorPos.selected} 字符</span>
            </>
          )}
          <span aria-hidden="true" className="text-neutral-700">·</span>
          <span>共 {lines.length} 行</span>
          <span aria-hidden="true" className="text-neutral-700">·</span>
          <span>{(file.size / 1024).toFixed(1)} KB</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
            实时融合
          </span>
          <span aria-hidden="true" className="text-neutral-700">·</span>
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
