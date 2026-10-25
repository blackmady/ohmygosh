import React, { useMemo, useState } from 'react';
import { FileItem } from '../../types';
import { marked } from 'marked';
import { List, BookOpen, Copy, Check } from 'lucide-react';

interface MarkdownPreviewProps {
  currentFile: FileItem;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ currentFile }) => {
  const [copied, setCopied] = useState(false);
  const [showToc, setShowToc] = useState(false);

  // Parse markdown into HTML safely with marked
  const { html, toc } = useMemo(() => {
    try {
      marked.setOptions({
        gfm: true,
        breaks: true,
      });

      const parsedHtml = marked.parse(currentFile.content) as string;

      // Extract TOC headings
      const headingRegex = /<h([1-3])[^>]*>(.*?)<\/h\1>/gi;
      const extractedToc: Array<{ level: number; text: string; id: string }> = [];
      let match;

      while ((match = headingRegex.exec(parsedHtml)) !== null) {
        const text = match[2].replace(/<[^>]+>/g, '');
        const id = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-');
        extractedToc.push({
          level: parseInt(match[1], 10),
          text,
          id,
        });
      }

      return { html: parsedHtml, toc: extractedToc };
    } catch (err) {
      console.error('Markdown parse error:', err);
      return { html: '<p>无法解析 Markdown 内容</p>', toc: [] };
    }
  }, [currentFile.content]);

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-neutral-200">
      {/* Markdown topbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-neutral-300 font-medium">
            <BookOpen className="w-3.5 h-3.5 text-orange-400" />
            <span>Markdown 预览文档</span>
          </span>
          {toc.length > 0 && (
            <button
              onClick={() => setShowToc(!showToc)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors ${
                showToc ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>大纲 ({toc.length})</span>
            </button>
          )}
        </div>

        <button
          onClick={handleCopyRaw}
          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? '已复制原文' : '复制原文'}</span>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Outline sidebar if toggled */}
        {showToc && toc.length > 0 && (
          <div className="w-56 shrink-0 border-r border-neutral-800 bg-neutral-900/60 p-3 overflow-y-auto text-xs">
            <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-2">
              目录大纲
            </div>
            <div className="space-y-1">
              {toc.map((item, idx) => (
                <div
                  key={idx}
                  style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
                  className="truncate text-neutral-400 hover:text-orange-400 cursor-pointer py-1 transition-colors"
                >
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Markdown Render Body */}
        <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
          <div
            className="prose prose-invert prose-neutral max-w-none 
              prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-neutral-100
              prose-h1:text-2xl prose-h1:border-b prose-h1:border-neutral-800 prose-h1:pb-3
              prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3
              prose-h3:text-lg prose-h3:mt-5 prose-h3:mb-2
              prose-p:text-neutral-300 prose-p:leading-relaxed prose-p:text-sm
              prose-a:text-orange-400 prose-a:underline hover:prose-a:text-orange-300
              prose-blockquote:border-l-4 prose-blockquote:border-orange-500 prose-blockquote:bg-neutral-900/70 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r prose-blockquote:text-neutral-300 prose-blockquote:text-sm
              prose-code:text-orange-300 prose-code:bg-neutral-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-xs
              prose-pre:bg-neutral-900 prose-pre:border prose-pre:border-neutral-800 prose-pre:p-4 prose-pre:rounded-lg
              prose-table:w-full prose-table:border-collapse prose-table:text-xs prose-table:my-4
              prose-th:bg-neutral-900 prose-th:p-2.5 prose-th:border prose-th:border-neutral-800 prose-th:text-left prose-th:text-neutral-300
              prose-td:p-2.5 prose-td:border prose-td:border-neutral-800/80 prose-td:text-neutral-300
              prose-ul:list-disc prose-ul:pl-5 prose-ul:space-y-1 prose-ul:text-sm
              prose-ol:list-decimal prose-ol:pl-5 prose-ol:space-y-1 prose-ol:text-sm
              prose-hr:border-neutral-800 prose-hr:my-6
            "
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  );
};
