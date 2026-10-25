import React, { useState, useMemo } from 'react';
import { FileItem } from '../../types';
import { Check, Copy, Minimize2, Maximize2, AlertCircle, Search } from 'lucide-react';
import { useFloatingFullscreen } from '../../utils/useFloatingFullscreen';

interface JsonPreviewProps {
  currentFile: FileItem;
  isFullscreen?: boolean;
  onExitFullscreen?: () => void;
}

export const JsonPreview: React.FC<JsonPreviewProps> = ({
  currentFile,
  isFullscreen = false,
  onExitFullscreen = () => {},
}) => {
  const [copied, setCopied] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(new Set());

  const {
    showFloatingBar,
    showHint,
    handleTopTriggerEnter,
    handleTopTriggerLeave,
    handleBarMouseEnter,
    handleBarMouseLeave,
  } = useFloatingFullscreen(isFullscreen, onExitFullscreen);

  // Parse JSON
  const { parsedData, error } = useMemo(() => {
    try {
      const data = JSON.parse(currentFile.content);
      return { parsedData: data, error: null };
    } catch (err) {
      return { parsedData: null, error: String(err) };
    }
  }, [currentFile.content]);

  const handleCopy = () => {
    try {
      const formatted = JSON.stringify(parsedData || currentFile.content, null, 2);
      navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      navigator.clipboard.writeText(currentFile.content);
    }
  };

  const toggleCollapse = (path: string) => {
    setCollapsedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const expandAll = () => setCollapsedPaths(new Set());
  const collapseAll = () => {
    if (parsedData && typeof parsedData === 'object') {
      const paths = new Set<string>();
      Object.keys(parsedData).forEach((k) => paths.add(k));
      setCollapsedPaths(paths);
    }
  };

  const toolbarControls = (
    <>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2 top-2" />
          <input
            type="text"
            placeholder="过滤 JSON 键或值..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="pl-7 pr-3 py-1 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-orange-500 w-44"
          />
        </div>

        <div className="flex items-center gap-1 bg-neutral-800/80 rounded p-0.5 border border-neutral-700/60">
          <button
            onClick={expandAll}
            title="全部展开"
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={collapseAll}
            title="折叠一级节点"
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? '已复制格式化 JSON' : '复制 JSON'}</span>
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
    </>
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
            <div className="flex items-center gap-3">
              <span className="font-semibold text-white truncate max-w-[160px]">
                {currentFile.name}
              </span>
              <span className="text-[10px] text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded font-mono">
                JSON
              </span>
              <div className="h-4 w-px bg-neutral-800" />
              {toolbarControls}
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 text-xs">
          {toolbarControls}
        </div>
      )}

      {/* JSON Body */}
      <div className="flex-1 overflow-auto p-4 font-mono text-xs w-full h-full">
        {error ? (
          <div className="p-4 bg-red-950/40 border border-red-800/80 rounded-lg text-red-300">
            <div className="flex items-center gap-2 font-semibold mb-1 text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>JSON 解析失败</span>
            </div>
            <div className="text-xs text-red-400 font-mono mt-1">{error}</div>
            <pre className="mt-4 p-3 bg-neutral-900 rounded text-neutral-400 whitespace-pre-wrap">
              {currentFile.content}
            </pre>
          </div>
        ) : (
          <div className="space-y-0.5 select-text">
            <JsonTreeNode
              data={parsedData}
              path="root"
              name=""
              filter={filterQuery.toLowerCase()}
              collapsedPaths={collapsedPaths}
              onToggle={toggleCollapse}
            />
          </div>
        )}
      </div>
    </div>
  );
};

interface JsonTreeNodeProps {
  data: any;
  path: string;
  name: string;
  filter: string;
  collapsedPaths: Set<string>;
  onToggle: (path: string) => void;
  isLast?: boolean;
}

const JsonTreeNode: React.FC<JsonTreeNodeProps> = ({
  data,
  path,
  name,
  filter,
  collapsedPaths,
  onToggle,
  isLast = true,
}) => {
  const isObject = data !== null && typeof data === 'object';
  const isArray = Array.isArray(data);
  const isCollapsed = collapsedPaths.has(path);

  const matchesFilter = (val: any): boolean => {
    if (!filter) return true;
    if (name && name.toLowerCase().includes(filter)) return true;
    if (typeof val === 'string' && val.toLowerCase().includes(filter)) return true;
    if (typeof val === 'number' && String(val).includes(filter)) return true;
    if (typeof val === 'boolean' && String(val).includes(filter)) return true;
    if (isObject && val) {
      return Object.entries(val).some(([k, v]) => k.toLowerCase().includes(filter) || matchesFilter(v));
    }
    return false;
  };

  if (filter && !matchesFilter(data)) {
    return null;
  }

  if (!isObject) {
    let valueElement = <span className="text-neutral-400">null</span>;
    if (typeof data === 'string') {
      valueElement = <span className="text-emerald-400">"{data}"</span>;
    } else if (typeof data === 'number') {
      valueElement = <span className="text-orange-400 font-semibold">{data}</span>;
    } else if (typeof data === 'boolean') {
      valueElement = <span className="text-purple-400 font-semibold">{String(data)}</span>;
    }

    return (
      <div className="py-0.5 hover:bg-neutral-900/50 rounded px-1 flex items-baseline">
        {name && <span className="text-sky-300 mr-1.5">"{name}":</span>}
        {valueElement}
        {!isLast && <span className="text-neutral-600">,</span>}
      </div>
    );
  }

  const keys = Object.keys(data);
  const brackets = isArray ? ['[', ']'] : ['{', '}'];

  return (
    <div className="py-0.5">
      <div
        onClick={() => onToggle(path)}
        className="cursor-pointer hover:bg-neutral-900/60 rounded px-1 inline-flex items-center gap-1 select-none text-neutral-300"
      >
        <span className="text-[10px] text-neutral-500 w-3 text-center">
          {isCollapsed ? '▶' : '▼'}
        </span>
        {name && <span className="text-sky-300">"{name}":</span>}
        <span className="text-neutral-400 font-bold">{brackets[0]}</span>
        {isCollapsed && (
          <span className="text-neutral-500 text-[11px] px-1 bg-neutral-900 rounded border border-neutral-800">
            {isArray ? `${keys.length} items` : `${keys.length} keys`}
          </span>
        )}
        {isCollapsed && <span className="text-neutral-400 font-bold">{brackets[1]}</span>}
        {isCollapsed && !isLast && <span className="text-neutral-600">,</span>}
      </div>

      {!isCollapsed && (
        <div className="pl-4 border-l border-neutral-800/80 ml-2 mt-0.5 space-y-0.5">
          {keys.map((k, idx) => (
            <JsonTreeNode
              key={k}
              data={data[k]}
              path={`${path}.${k}`}
              name={isArray ? '' : k}
              filter={filter}
              collapsedPaths={collapsedPaths}
              onToggle={onToggle}
              isLast={idx === keys.length - 1}
            />
          ))}
          <div className="text-neutral-400 font-bold pt-0.5">
            {brackets[1]}
            {!isLast && <span className="text-neutral-600">,</span>}
          </div>
        </div>
      )}
    </div>
  );
};
