import React, { useState, useRef, useMemo } from 'react';
import { FileItem } from '../../types';
import { ZoomIn, ZoomOut, RotateCcw, Download, Image, Grid, Sun, Moon, Minimize2 } from 'lucide-react';
import { useFloatingFullscreen } from '../../utils/useFloatingFullscreen';

interface SvgPreviewProps {
  currentFile: FileItem;
  isFullscreen?: boolean;
  onExitFullscreen?: () => void;
}

export const SvgPreview: React.FC<SvgPreviewProps> = ({
  currentFile,
  isFullscreen = false,
  onExitFullscreen = () => {},
}) => {
  const [zoom, setZoom] = useState(1);
  const [bgMode, setBgMode] = useState<'checker' | 'dark' | 'light'>('checker');
  const [exporting, setExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    showFloatingBar,
    showHint,
    handleTopTriggerEnter,
    handleTopTriggerLeave,
    handleBarMouseEnter,
    handleBarMouseLeave,
  } = useFloatingFullscreen(isFullscreen, onExitFullscreen);

  // Parse SVG stats from content
  const svgMeta = useMemo(() => {
    const raw = currentFile.content;
    const viewBoxMatch = raw.match(/viewBox=["']([^"']+)["']/i);
    const widthMatch = raw.match(/width=["']([^"']+)["']/i);
    const heightMatch = raw.match(/height=["']([^"']+)["']/i);
    const pathCount = (raw.match(/<path/gi) || []).length;
    const gCount = (raw.match(/<g/gi) || []).length;
    const circleCount = (raw.match(/<circle/gi) || []).length;
    const rectCount = (raw.match(/<rect/gi) || []).length;

    return {
      viewBox: viewBoxMatch ? viewBoxMatch[1] : 'auto',
      width: widthMatch ? widthMatch[1] : '100%',
      height: heightMatch ? heightMatch[1] : '100%',
      elements: pathCount + gCount + circleCount + rectCount,
    };
  }, [currentFile.content]);

  const handleDownloadSvg = () => {
    const blob = new Blob([currentFile.content], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name.endsWith('.svg') ? currentFile.name : `${currentFile.name}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = () => {
    setExporting(true);
    try {
      const img = new window.Image();
      const svgBlob = new Blob([currentFile.content], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = 2;
        const width = img.width || 800;
        const height = img.height || 800;
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0, width, height);
          const pngUrl = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = `${currentFile.name.replace(/\.svg$/i, '')}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        URL.revokeObjectURL(url);
        setExporting(false);
      };

      img.onerror = () => {
        alert('无法将当前 SVG 转为 PNG 格式');
        setExporting(false);
      };

      img.src = url;
    } catch (err) {
      console.error('PNG export failed:', err);
      setExporting(false);
    }
  };

  const bgStyle =
    bgMode === 'checker'
      ? {
          backgroundImage: `
            linear-gradient(45deg, #1e293b 25%, transparent 25%),
            linear-gradient(-45deg, #1e293b 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #1e293b 75%),
            linear-gradient(-45deg, transparent 75%, #1e293b 75%)
          `,
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
          backgroundColor: '#0f172a',
        }
      : bgMode === 'dark'
      ? { backgroundColor: '#090d16' }
      : { backgroundColor: '#f8fafc' };

  const controlsContent = (
    <>
      <div className="flex items-center gap-2">
        {/* Zoom controls */}
        <div className="flex items-center bg-neutral-800/80 rounded p-0.5 border border-neutral-700/60">
          <button
            onClick={() => setZoom((z) => Math.max(0.2, z - 0.2))}
            title="缩小"
            className="p-1 text-neutral-400 hover:text-white rounded"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-1.5 text-[11px] font-mono text-neutral-300 tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(4, z + 0.2))}
            title="放大"
            className="p-1 text-neutral-400 hover:text-white rounded"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(1)}
            title="重置缩放"
            className="p-1 text-neutral-400 hover:text-white rounded ml-0.5 border-l border-neutral-700"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        {/* Background switcher */}
        <div className="flex items-center bg-neutral-800/80 rounded p-0.5 border border-neutral-700/60">
          <button
            onClick={() => setBgMode('checker')}
            title="棋盘格背景（透明检测）"
            className={`p-1 rounded ${
              bgMode === 'checker' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setBgMode('dark')}
            title="纯黑背景"
            className={`p-1 rounded ${
              bgMode === 'dark' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setBgMode('light')}
            title="纯白背景"
            className={`p-1 rounded ${
              bgMode === 'light' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Action downloads */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleDownloadSvg}
          className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>导出 SVG</span>
        </button>
        <button
          onClick={handleDownloadPng}
          disabled={exporting}
          className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs transition-colors"
        >
          <Image className="w-3.5 h-3.5" />
          <span>{exporting ? '转换中...' : '导出 PNG'}</span>
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
                SVG
              </span>
              <div className="h-4 w-px bg-neutral-800" />
              {controlsContent}
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 text-xs">
          {controlsContent}
        </div>
      )}

      {/* SVG Canvas Area (takes full height in fullscreen) */}
      <div
        ref={containerRef}
        style={bgStyle}
        className="flex-1 overflow-auto flex items-center justify-center p-8 transition-colors select-none w-full h-full"
      >
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.15s ease-out' }}
          className="max-w-full max-h-full flex items-center justify-center drop-shadow-md"
          dangerouslySetInnerHTML={{ __html: currentFile.content }}
        />
      </div>

      {/* Info footer */}
      <div className="px-3 py-1 bg-neutral-900 border-t border-neutral-800 text-[11px] text-neutral-400 flex items-center gap-4 font-mono tabular-nums">
        <span>viewBox: {svgMeta.viewBox}</span>
        <span aria-hidden="true" className="text-neutral-700">·</span>
        <span>SVG 元素节点: {svgMeta.elements}</span>
        <span aria-hidden="true" className="text-neutral-700">·</span>
        <span>文件大小: {(currentFile.size / 1024).toFixed(1)} KB</span>
      </div>
    </div>
  );
};
