import React, { useMemo, useState, useRef, useEffect } from 'react';
import { FileItem } from '../../types';
import { marked, Renderer } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import {
  List,
  BookOpen,
  Copy,
  Check,
  Clock,
  FileText,
  Sun,
  Moon,
} from 'lucide-react';

interface MarkdownPreviewProps {
  currentFile: FileItem;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ currentFile }) => {
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [showToc, setShowToc] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');
  const contentContainerRef = useRef<HTMLDivElement>(null);

  // Compute stats
  const stats = useMemo(() => {
    const text = currentFile.content.replace(/[#*`_~[\]()]/g, ' ').trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = text.length;
    const minutes = Math.max(1, Math.ceil(words / 220));
    return { words, chars, minutes };
  }, [currentFile.content]);

  // Configure custom marked renderer
  const { html, toc } = useMemo(() => {
    try {
      const extractedToc: Array<{ level: number; text: string; id: string }> = [];
      const renderer = new Renderer();

      // Heading custom renderer with slug IDs and anchor links
      renderer.heading = ({ text, depth }) => {
        const plainText = text.replace(/<[^>]+>/g, '').trim();
        const id =
          plainText
            .toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
            .replace(/^-+|-+$/g, '') || `sec-${extractedToc.length + 1}`;

        if (depth <= 3) {
          extractedToc.push({ level: depth, text: plainText, id });
        }

        const sizeClasses: Record<number, string> = {
          1: 'text-2xl font-bold tracking-tight text-white mt-8 mb-4 pb-3 border-b border-neutral-800 flex items-center gap-2 group',
          2: 'text-xl font-semibold tracking-tight text-neutral-100 mt-7 mb-3 pb-2 border-b border-neutral-800/60 flex items-center gap-2 group',
          3: 'text-lg font-semibold text-neutral-200 mt-6 mb-2 flex items-center gap-2 group',
          4: 'text-base font-medium text-neutral-200 mt-5 mb-2',
          5: 'text-sm font-medium text-neutral-300 mt-4 mb-1',
          6: 'text-xs font-semibold text-neutral-400 uppercase tracking-wider mt-3 mb-1',
        };

        const currentClass = sizeClasses[depth] || sizeClasses[3];

        return `
          <h${depth} id="${id}" class="${currentClass} scroll-mt-6">
            <span>${text}</span>
            <a href="#${id}" class="opacity-0 group-hover:opacity-100 text-orange-400/80 hover:text-orange-300 transition-opacity ml-1.5" title="点击定位锚点">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            </a>
          </h${depth}>
        `;
      };

      // Code block renderer with syntax highlighting & header bar
      renderer.code = ({ text, lang }) => {
        const cleanLang = (lang || '').trim().toLowerCase();
        let highlighted = '';

        try {
          if (cleanLang && hljs.getLanguage(cleanLang)) {
            highlighted = hljs.highlight(text, { language: cleanLang, ignoreIllegals: true }).value;
          } else {
            highlighted = hljs.highlightAuto(text).value;
          }
        } catch {
          highlighted = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        }

        const encodedCode = encodeURIComponent(text);
        const displayLang = cleanLang ? cleanLang.toUpperCase() : 'CODE';

        return `
          <div class="code-block-container my-5 rounded-xl border border-neutral-800 bg-neutral-900/90 overflow-hidden shadow-lg">
            <div class="flex items-center justify-between px-4 py-2 border-b border-neutral-800/80 bg-neutral-950/60 text-xs font-mono text-neutral-400 select-none">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-orange-500/80"></span>
                <span class="text-[11px] font-semibold text-neutral-300 tracking-wider">${displayLang}</span>
              </div>
              <button 
                onclick="window.__cloudPasteCopyCode(this, '${encodedCode}')" 
                class="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                <span>复制代码</span>
              </button>
            </div>
            <pre class="p-4 m-0 overflow-x-auto text-[13px] leading-6 font-mono text-neutral-200 bg-transparent"><code class="hljs !bg-transparent !p-0 font-mono">${highlighted}</code></pre>
          </div>
        `;
      };

      // Inline code
      renderer.codespan = ({ text }) => {
        return `<code class="px-1.5 py-0.5 rounded-md bg-neutral-800/90 text-orange-300 font-mono text-xs border border-neutral-700/60 mx-0.5">${text}</code>`;
      };

      // Links with external security
      renderer.link = ({ href, text, title }) => {
        const isExternal = href.startsWith('http');
        const target = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${href}" ${target} title="${title || ''}" class="text-orange-400 hover:text-orange-300 underline underline-offset-2 transition-colors font-medium">${text}</a>`;
      };

      // Checkbox list
      renderer.checkbox = ({ checked }) => {
        return checked
          ? `<span class="inline-flex items-center justify-center w-4 h-4 rounded bg-orange-600 text-white mr-2 align-middle text-[10px] select-none font-bold">✓</span>`
          : `<span class="inline-flex items-center justify-center w-4 h-4 rounded border border-neutral-600 bg-neutral-900 mr-2 align-middle select-none"></span>`;
      };

      marked.use({ renderer });
      let parsed = marked.parse(currentFile.content, { gfm: true, breaks: true }) as string;

      // Transform GitHub style Callouts [!NOTE], [!TIP], [!WARNING] in blockquotes
      parsed = parsed.replace(
        /<blockquote>\s*<p>\s*\[!(NOTE|INFO)\]\s*(?:<br\s*\/?>)?([\s\S]*?)<\/p>\s*<\/blockquote>/gi,
        (_, __, body) => `
          <div class="my-5 p-4 rounded-xl border border-sky-800/50 bg-sky-950/30 text-sky-200 shadow-sm">
            <div class="flex items-center gap-2 font-semibold text-sky-400 text-xs mb-1.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              <span>NOTE / 重点提示</span>
            </div>
            <div class="text-xs text-sky-200/90 leading-relaxed">${body}</div>
          </div>
        `
      );

      parsed = parsed.replace(
        /<blockquote>\s*<p>\s*\[!TIP\]\s*(?:<br\s*\/?>)?([\s\S]*?)<\/p>\s*<\/blockquote>/gi,
        (_, body) => `
          <div class="my-5 p-4 rounded-xl border border-emerald-800/50 bg-emerald-950/30 text-emerald-200 shadow-sm">
            <div class="flex items-center gap-2 font-semibold text-emerald-400 text-xs mb-1.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path><path d="M9 18h6"></path><path d="M10 22h4"></path></svg>
              <span>TIP / 诀窍与建议</span>
            </div>
            <div class="text-xs text-emerald-200/90 leading-relaxed">${body}</div>
          </div>
        `
      );

      parsed = parsed.replace(
        /<blockquote>\s*<p>\s*\[!(WARNING|CAUTION)\]\s*(?:<br\s*\/?>)?([\s\S]*?)<\/p>\s*<\/blockquote>/gi,
        (_, __, body) => `
          <div class="my-5 p-4 rounded-xl border border-amber-800/50 bg-amber-950/30 text-amber-200 shadow-sm">
            <div class="flex items-center gap-2 font-semibold text-amber-400 text-xs mb-1.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              <span>WARNING / 注意事项</span>
            </div>
            <div class="text-xs text-amber-200/90 leading-relaxed">${body}</div>
          </div>
        `
      );

      return { html: parsed, toc: extractedToc };
    } catch (err) {
      console.error('Markdown parse error:', err);
      return { html: '<p class="text-red-400">无法解析 Markdown 内容</p>', toc: [] };
    }
  }, [currentFile.content]);

  // Global helper for code block copy
  useEffect(() => {
    (window as any).__cloudPasteCopyCode = (btnEl: HTMLElement, encoded: string) => {
      try {
        const raw = decodeURIComponent(encoded);
        navigator.clipboard.writeText(raw);
        const originalText = btnEl.innerHTML;
        btnEl.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span style="color: #22c55e">已复制</span>
        `;
        setTimeout(() => {
          btnEl.innerHTML = originalText;
        }, 2000);
      } catch (e) {
        console.error(e);
      }
    };
  }, []);

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const scrollToHeading = (id: string) => {
    setActiveHeadingId(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const isLight = theme === 'light';

  return (
    <div
      className={`flex flex-col h-full transition-colors duration-200 ${
        isLight ? 'bg-neutral-50 text-neutral-900' : 'bg-neutral-950 text-neutral-200'
      }`}
    >
      {/* Markdown Topbar */}
      <div
        className={`flex items-center justify-between px-4 py-2 border-b text-xs select-none ${
          isLight ? 'bg-white border-neutral-200' : 'bg-neutral-900 border-neutral-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold">
            <BookOpen className="w-4 h-4 text-orange-500" />
            <span className={isLight ? 'text-neutral-800' : 'text-neutral-200'}>
              {currentFile.name}
            </span>
          </div>

          <div
            className={`hidden sm:flex items-center gap-2.5 text-[11px] ${
              isLight ? 'text-neutral-500' : 'text-neutral-400'
            }`}
          >
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 opacity-60" />
              <span>{stats.words.toLocaleString()} 词</span>
            </span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 opacity-60" />
              <span>约 {stats.minutes} 分钟阅读</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* TOC Toggle button */}
          {toc.length > 0 && (
            <button
              onClick={() => setShowToc(!showToc)}
              title="切换目录大纲"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                showToc
                  ? isLight
                    ? 'bg-neutral-200 text-neutral-900'
                    : 'bg-neutral-800 text-white'
                  : isLight
                  ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <List className="w-3.5 h-3.5 text-orange-400" />
              <span>目录大纲 ({toc.length})</span>
            </button>
          )}

          {/* Theme switcher */}
          <button
            onClick={() => setTheme(isLight ? 'dark' : 'light')}
            title={isLight ? '切换为深色模式' : '切换为浅色阅读模式'}
            className={`p-1.5 rounded-md transition-colors ${
              isLight
                ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          </button>

          {/* Copy raw */}
          <button
            onClick={handleCopyRaw}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              isLight
                ? 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
            }`}
          >
            {copiedRaw ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copiedRaw ? '已复制' : '复制原文'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout with optional TOC sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Table of Contents Drawer */}
        {showToc && toc.length > 0 && (
          <aside
            className={`w-64 shrink-0 border-r overflow-y-auto p-4 text-xs transition-colors select-none ${
              isLight ? 'bg-neutral-100/70 border-neutral-200' : 'bg-neutral-900/50 border-neutral-800'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-[11px] mb-3 text-neutral-400">
              <List className="w-3.5 h-3.5 text-orange-500" />
              <span>本文目录大纲</span>
            </div>
            <nav className="space-y-1">
              {toc.map((item, idx) => {
                const isActive = activeHeadingId === item.id;
                return (
                  <button
                    key={idx}
                    onClick={() => scrollToHeading(item.id)}
                    style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
                    className={`w-full text-left py-1.5 pr-2 rounded-lg text-xs truncate transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-orange-500/10 text-orange-400 font-medium'
                        : isLight
                        ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                    }`}
                  >
                    <span
                      className={`w-1 h-1 rounded-full ${
                        isActive ? 'bg-orange-500' : 'bg-neutral-600'
                      }`}
                    />
                    <span className="truncate">{item.text}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        )}

        {/* Beautiful Markdown Body Container */}
        <div
          ref={contentContainerRef}
          className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-10"
        >
          <div
            className={`max-w-3xl mx-auto markdown-rendered-content ${
              isLight ? 'theme-light' : 'theme-dark'
            }`}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  );
};
