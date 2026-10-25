import React, { useState } from 'react';
import { FileItem, DeviceViewport, ViewMode } from '../types';
import { isLanguagePreviewable } from '../utils/language';
import { HtmlPreview } from './preview/HtmlPreview';
import { SvgPreview } from './preview/SvgPreview';
import { MarkdownPreview } from './preview/MarkdownPreview';
import { CsvPreview } from './preview/CsvPreview';
import { JsonPreview } from './preview/JsonPreview';
import {
  Monitor,
  Tablet,
  Smartphone,
  Maximize2,
  Minimize2,
  Code2,
  ExternalLink,
  Eye,
} from 'lucide-react';

interface PreviewPanelProps {
  currentFile: FileItem;
  allFiles: FileItem[];
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  currentFile,
  allFiles,
  viewMode,
  onChangeViewMode,
}) => {
  const [device, setDevice] = useState<DeviceViewport>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isPreviewable = isLanguagePreviewable(currentFile.language);

  // Device width wrapper
  const getDeviceWidth = () => {
    if (device === 'mobile') return 'max-w-[390px] shadow-2xl my-4 rounded-xl border border-neutral-700 overflow-hidden';
    if (device === 'tablet') return 'max-w-[768px] shadow-2xl my-4 rounded-xl border border-neutral-700 overflow-hidden';
    return 'w-full h-full';
  };

  const renderContent = () => {
    switch (currentFile.language) {
      case 'html':
        return <HtmlPreview currentFile={currentFile} allFiles={allFiles} />;
      case 'svg':
        return <SvgPreview currentFile={currentFile} />;
      case 'markdown':
        return <MarkdownPreview currentFile={currentFile} />;
      case 'csv':
      case 'tsv':
        return <CsvPreview currentFile={currentFile} />;
      case 'json':
        return <JsonPreview currentFile={currentFile} />;
      default:
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-neutral-950 text-neutral-400">
            <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4 text-orange-400">
              <Code2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-neutral-200 mb-2">
              {currentFile.language.toUpperCase()} 源码模式
            </h3>
            <p className="text-xs text-neutral-400 max-w-md leading-relaxed mb-6">
              当前文件为代码源码格式。前端视窗（HTML、SVG、Markdown、CSV、JSON）支持即时渲染，其他格式可在左侧完整编辑并通过永久链接与压缩包快速分享。
            </p>
            <button
              onClick={() => onChangeViewMode('code')}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors"
            >
              切换至纯代码视窗
            </button>
          </div>
        );
    }
  };

  return (
    <div
      className={`flex flex-col h-full bg-neutral-950 text-neutral-100 ${
        isFullscreen ? 'fixed inset-0 z-50' : 'relative'
      }`}
    >
      {/* Panel Topbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
            <Eye className="w-3.5 h-3.5 text-orange-400" />
            <span>实时视窗渲染</span>
          </div>

          <span className="text-[10px] text-neutral-500 bg-neutral-800/80 px-2 py-0.5 rounded font-mono">
            {currentFile.language.toUpperCase()}
          </span>
        </div>

        {/* Viewport switch & Fullscreen */}
        <div className="flex items-center gap-1.5">
          {/* Device Switcher (only relevant for HTML) */}
          {currentFile.language === 'html' && (
            <div className="flex items-center bg-neutral-800/80 rounded p-0.5 mr-1">
              <button
                onClick={() => setDevice('desktop')}
                title="桌面视图 (100%)"
                className={`p-1 rounded ${
                  device === 'desktop' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDevice('tablet')}
                title="平板视图 (768px)"
                className={`p-1 rounded ${
                  device === 'tablet' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDevice('mobile')}
                title="手机视图 (390px)"
                className={`p-1 rounded ${
                  device === 'mobile' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? '退出全屏' : '全屏展示'}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Preview Container with device wrapper */}
      <div className="flex-1 overflow-auto bg-neutral-900/60 flex items-center justify-center">
        <div className={`${getDeviceWidth()} h-full flex flex-col transition-all duration-200`}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
