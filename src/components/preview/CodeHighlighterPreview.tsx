import React, { useState, useMemo } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

import { FileItem } from '../../types';
import { getHljsLanguage } from '../../utils/language';
import { Copy, Check, Code2, Minimize2 } from 'lucide-react';
import { useFloatingFullscreen } from '../../utils/useFloatingFullscreen';

interface CodeHighlighterPreviewProps {
  currentFile: FileItem;
  isFullscreen?: boolean;
  onExitFullscreen?: () => void;
}

export const CodeHighlighterPreview: React.FC<CodeHighlighterPreviewProps> = ({
  currentFile,
  isFullscreen = false,
  onExitFullscreen = () => {},
}) => {
  const [copied, setCopied] = useState(false);

  const {
    showFloatingBar,
    showHint,
    handleTopTriggerEnter,
    handleTopTriggerLeave,
    handleBarMouseEnter,
    handleBarMouseLeave,
  } = useFloatingFullscreen(isFullscreen, onExitFullscreen);

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

  const toolbarControls = (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCopy}
        className="flex items-center gap-1 px-2.5 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        <span>{copied ? '已复制代码' : '复制代码'}</span>
      </button>

      {isFullscreen && (
        <button
          onClick={onExitFullscreen}
          className="flex items-center gap-1 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded text-xs font-medium transition-colors ml-2 border border-neutral-700"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>退出全屏 (ESC)</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full bg-neutral-950 text-neutral-200 relative overflow-hidden">
      {/* Fullscreen Floating Toolbar System */}
      {isFullscreen ? (
        <>
          <div
            onMouseEnter={handleTopTriggerEnter}
            onMouseLeave={handleTopTriggerLeave}
            className="fixed top-0 left-0 right-0 h-8 z-50 pointer-events-auto"
          />

          <div
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 bg-neutral-900/90 border border-neutral-700/80 rounded-full text-xs text-neutral-200 shadow-xl pointer-events-none transition-all duration-500 flex items-center gap-2 ${
              showHint ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span>已进入全屏 · 鼠标移至顶部显示工具栏 · 按 ESC 退出</span>
          </div>

          <div
            onMouseEnter={handleBarMouseEnter}
            onMouseLeave={handleBarMouseLeave}
            className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 bg-neutral-950/90 backdrop-blur-xl border-b border-neutral-800 shadow-2xl flex items-center justify-between text-xs transition-all duration-300 transform ${
              showFloatingBar
                ? 'translate-y-0 opacity-100 pointer-events-auto'
                : '-translate-y-full opacity-0 pointer-events-none'
            }`}
          >
            <div className="flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5 text-orange-400" />
              <span className="font-semibold text-neutral-200">{currentFile.name}</span>
              <span className="text-[10px] text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded font-mono">
                {currentFile.language.toUpperCase()}
              </span>
            </div>

            {toolbarControls}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 text-xs">
          <div className="flex items-center gap-2">
            <Code2 className="w-3.5 h-3.5 text-orange-400" />
            <span className="font-semibold text-neutral-200">{currentFile.name}</span>
            <span className="text-[10px] text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded font-mono">
              {currentFile.language.toUpperCase()}
            </span>
          </div>

          {toolbarControls}
        </div>
      )}

      {/* Code body (full height in fullscreen) */}
      <div className="flex-1 flex overflow-auto font-mono text-[13px] leading-6 bg-neutral-950 w-full h-full">
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
