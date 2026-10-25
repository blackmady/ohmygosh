import React, { useState, useMemo } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

import { FileItem } from '../../types';
import { getHljsLanguage } from '../../utils/language';
import { Copy, Check, FileCode, Code2 } from 'lucide-react';

interface CodeHighlighterPreviewProps {
  currentFile: FileItem;
}

export const CodeHighlighterPreview: React.FC<CodeHighlighterPreviewProps> = ({ currentFile }) => {
  const [copied, setCopied] = useState(false);

  const highlightedCode = useMemo(() => {
    try {
      const hljsLang = getHljsLanguage(currentFile.language);
      if (hljs.getLanguage(hljsLang)) {
        return hljs.highlight(currentFile.content, { language: hljsLang, ignoreIllegals: true }).value;
      }
      return hljs.highlightAuto(currentFile.content).value;
    } catch {
      return currentFile.content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
  }, [currentFile.content, currentFile.language]);

  const lines = useMemo(() => {
    return currentFile.content.split('\n');
  }, [currentFile.content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-neutral-200">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 text-xs">
        <div className="flex items-center gap-2">
          <Code2 className="w-3.5 h-3.5 text-orange-400" />
          <span className="font-semibold text-neutral-200">{currentFile.name}</span>
          <span className="text-[10px] text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded font-mono">
            {currentFile.language.toUpperCase()}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? '已复制代码' : '复制代码'}</span>
        </button>
      </div>

      {/* Code body */}
      <div className="flex-1 flex overflow-auto font-mono text-[13px] leading-6 bg-neutral-950">
        {/* Line numbers */}
        <div className="w-12 shrink-0 py-4 text-right pr-3 select-none text-neutral-600 bg-neutral-950/80 border-r border-neutral-900 overflow-hidden text-xs tabular-nums">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Code Content */}
        <pre className="flex-1 p-4 overflow-auto m-0 !bg-transparent text-neutral-200 select-text">
          <code
            className="hljs !bg-transparent !p-0 font-mono"
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        </pre>
      </div>

      {/* Info footer */}
      <div className="px-3 py-1 bg-neutral-900 border-t border-neutral-800 text-[11px] text-neutral-400 flex items-center gap-3 font-mono tabular-nums">
        <span>{lines.length} 行代码</span>
        <span aria-hidden="true" className="text-neutral-700">·</span>
        <span>{(currentFile.size / 1024).toFixed(1)} KB</span>
        <span aria-hidden="true" className="text-neutral-700">·</span>
        <span>语法高亮模式</span>
      </div>
    </div>
  );
};
