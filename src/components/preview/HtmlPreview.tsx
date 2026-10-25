import React, { useMemo, useEffect, useState } from 'react';
import { FileItem, ConsoleMessage } from '../../types';
import { Play, RotateCw, Terminal, AlertTriangle, Info, CheckCircle2, Trash2 } from 'lucide-react';

interface HtmlPreviewProps {
  currentFile: FileItem;
  allFiles: FileItem[];
}

export const HtmlPreview: React.FC<HtmlPreviewProps> = ({ currentFile, allFiles }) => {
  const [key, setKey] = useState(0);
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'preview' | 'console'>('preview');
  const [autoRun, setAutoRun] = useState(true);

  // Clear messages on reload
  const handleReload = () => {
    setKey((prev) => prev + 1);
  };

  const handleClearLogs = () => {
    setConsoleMessages([]);
  };

  // Listen for console logs posted from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.__fromCloudPasteFrame) {
        const { type, message, timestamp } = event.data;
        setConsoleMessages((prev) => [
          ...prev.slice(-199), // keep max 200 logs
          {
            id: `msg_${Date.now()}_${Math.random()}`,
            type: type || 'log',
            message: typeof message === 'string' ? message : JSON.stringify(message, null, 2),
            timestamp: timestamp || new Date().toLocaleTimeString(),
          },
        ]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Build the bundle with relative file resolution & console hook
  const bundledHtml = useMemo(() => {
    let html = currentFile.content;

    // Console hook script to inject into iframe
    const consoleHook = `
<script>
  (function() {
    function sendLog(type, args) {
      try {
        const str = Array.from(args).map(a => {
          if (typeof a === 'object') {
            try { return JSON.stringify(a); } catch(e) { return String(a); }
          }
          return String(a);
        }).join(' ');
        window.parent.postMessage({
          __fromCloudPasteFrame: true,
          type: type,
          message: str,
          timestamp: new Date().toLocaleTimeString()
        }, '*');
      } catch(e) {}
    }
    const origLog = console.log;
    const origWarn = console.warn;
    const origError = console.error;
    const origInfo = console.info;

    console.log = function() { origLog.apply(console, arguments); sendLog('log', arguments); };
    console.warn = function() { origWarn.apply(console, arguments); sendLog('warn', arguments); };
    console.error = function() { origError.apply(console, arguments); sendLog('error', arguments); };
    console.info = function() { origInfo.apply(console, arguments); sendLog('info', arguments); };

    window.onerror = function(msg, url, line) {
      sendLog('error', ['Uncaught error:', msg, 'at line ' + line]);
    };
  })();
</script>
`;

    // 1. Resolve relative CSS links: <link rel="stylesheet" href="style.css">
    allFiles.forEach((file) => {
      if (file.language === 'css') {
        const regex = new RegExp(`<link[^>]+href=["'](\\./)?${escapeRegExp(file.name)}["'][^>]*>`, 'gi');
        if (regex.test(html)) {
          html = html.replace(regex, `<style data-source="${file.name}">\n${file.content}\n</style>`);
        }
      }
    });

    // 2. Resolve relative JS scripts: <script src="app.js"></script>
    allFiles.forEach((file) => {
      if (file.language === 'javascript' || file.language === 'typescript') {
        const regex = new RegExp(`<script[^>]+src=["'](\\./)?${escapeRegExp(file.name)}["'][^>]*>\\s*<\\/script>`, 'gi');
        if (regex.test(html)) {
          html = html.replace(regex, `<script data-source="${file.name}">\n${file.content}\n</script>`);
        }
      }
    });

    // 3. Resolve relative SVGs / images if referenced
    allFiles.forEach((file) => {
      if (file.language === 'svg') {
        const encoded = `data:image/svg+xml;utf8,${encodeURIComponent(file.content)}`;
        const regex = new RegExp(`(["'])(\\./)?${escapeRegExp(file.name)}(["'])`, 'gi');
        html = html.replace(regex, `$1${encoded}$3`);
      }
    });

    // Inject console hook at top of head or body
    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>${consoleHook}`);
    } else if (html.includes('<html>')) {
      html = html.replace('<html>', `<html><head>${consoleHook}</head>`);
    } else {
      html = `${consoleHook}\n${html}`;
    }

    return html;
  }, [currentFile.content, allFiles]);

  const errorCount = consoleMessages.filter((m) => m.type === 'error').length;
  const warnCount = consoleMessages.filter((m) => m.type === 'warn').length;

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-neutral-200">
      {/* Sub-toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'preview'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            实时视窗
          </button>
          <button
            onClick={() => setActiveTab('console')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'console'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>控制台</span>
            {errorCount > 0 && (
              <span className="px-1 py-0.2 bg-red-500/20 text-red-400 rounded text-[10px] font-mono">
                {errorCount}
              </span>
            )}
            {warnCount > 0 && errorCount === 0 && (
              <span className="px-1 py-0.2 bg-amber-500/20 text-amber-400 rounded text-[10px] font-mono">
                {warnCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReload}
            title="重新加载沙箱"
            className="flex items-center gap-1 px-2 py-1 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>重新运行</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden bg-neutral-900">
        {activeTab === 'preview' ? (
          <iframe
            key={key}
            title="Code Preview Sandbox"
            srcDoc={bundledHtml}
            sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
            className="w-full h-full border-0 bg-white"
          />
        ) : (
          <div className="h-full flex flex-col font-mono text-xs bg-neutral-950 text-neutral-300">
            <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800 bg-neutral-900/50">
              <span className="text-neutral-400">Sandbox Console Output ({consoleMessages.length})</span>
              <button
                onClick={handleClearLogs}
                className="flex items-center gap-1 text-neutral-400 hover:text-red-400 text-xs px-2 py-0.5 rounded transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>清空日志</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 selection:bg-neutral-800">
              {consoleMessages.length === 0 ? (
                <div className="text-neutral-500 italic py-8 text-center font-sans">
                  暂无控制台日志输出。代码中的 console.log() 将在此实时捕获。
                </div>
              ) : (
                consoleMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 py-1 px-2 rounded ${
                      msg.type === 'error'
                        ? 'bg-red-950/40 text-red-300 border-l-2 border-red-500'
                        : msg.type === 'warn'
                        ? 'bg-amber-950/40 text-amber-300 border-l-2 border-amber-500'
                        : 'text-neutral-300 hover:bg-neutral-900'
                    }`}
                  >
                    <span className="text-[10px] text-neutral-500 shrink-0 select-none pt-0.5">
                      {msg.timestamp}
                    </span>
                    <span className="shrink-0 select-none pt-0.5">
                      {msg.type === 'error' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      ) : msg.type === 'warn' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Info className="w-3.5 h-3.5 text-sky-400" />
                      )}
                    </span>
                    <pre className="whitespace-pre-wrap break-all flex-1">{msg.message}</pre>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
