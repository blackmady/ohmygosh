import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FileItem, DeviceViewport, ViewMode } from '../types';
import { HtmlPreview } from './preview/HtmlPreview';
import { SvgPreview } from './preview/SvgPreview';
import { MarkdownPreview } from './preview/MarkdownPreview';
import { CsvPreview } from './preview/CsvPreview';
import { JsonPreview } from './preview/JsonPreview';
import { CodeHighlighterPreview } from './preview/CodeHighlighterPreview';
import {
  Monitor,
  Tablet,
  Smartphone,
  Maximize2,
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

  // Device width wrapper (used for HTML responsive mode)
  const getDeviceWidth = (isFull: boolean) => {
    if (device === 'mobile') {
      return isFull
        ? 'max-w-[390px] h-[92vh] shadow-2xl my-auto mx-auto rounded-2xl border border-neutral-700 overflow-hidden'
        : 'max-w-[390px] shadow-2xl my-4 rounded-xl border border-neutral-700 overflow-hidden';
    }
    if (device === 'tablet') {
      return isFull
        ? 'max-w-[768px] h-[92vh] shadow-2xl my-auto mx-auto rounded-2xl border border-neutral-700 overflow-hidden'
        : 'max-w-[768px] shadow-2xl my-4 rounded-xl border border-neutral-700 overflow-hidden';
    }
    return 'w-full h-full';
  };

  const deviceSwitcher = currentFile.language === 'html' ? (
    <div className="flex items-center bg-neutral-800/80 rounded p-0.5 border border-neutral-700/60">
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
  ) : null;

  const renderContent = (isFull: boolean) => {
    const commonProps = {
      currentFile,
      isFullscreen: isFull,
      onExitFullscreen: () => setIsFullscreen(false),
    };

    switch (currentFile.language) {
      case 'html':
        return (
          <HtmlPreview
            {...commonProps}
            allFiles={allFiles}
            deviceSwitcher={deviceSwitcher}
          />
        );
      case 'svg':
        return <SvgPreview {...commonProps} />;
      case 'markdown':
        return <MarkdownPreview {...commonProps} />;
      case 'csv':
      case 'tsv':
        return <CsvPreview {...commonProps} />;
      case 'json':
        return <JsonPreview {...commonProps} />;
      default:
        return <CodeHighlighterPreview {...commonProps} />;
    }
  };

  // When Fullscreen: rendered via React Portal directly into document.body
  // Completely eliminates DOM nesting, stacking context traps, and outer toolbar redundancy!
  if (isFullscreen && typeof document !== 'undefined') {
    return createPortal(
      <div className="fixed inset-0 w-screen h-screen z-[9999] bg-neutral-950 text-neutral-100 overflow-hidden flex flex-col">
        <div className={`${getDeviceWidth(true)} flex flex-col transition-all duration-200`}>
          {renderContent(true)}
        </div>
      </div>,
      document.body
    );
  }

  // Standard Embedded Mode (Split view / Normal view)
  return (
    <div className="flex flex-col h-full bg-neutral-950 text-neutral-100 relative">
      {/* Panel Topbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 text-xs select-none">
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
          {deviceSwitcher}

          <button
            onClick={() => setIsFullscreen(true)}
            title="全屏展示 (ESC 退出)"
            className="flex items-center gap-1 px-2 py-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors text-xs"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>全屏</span>
          </button>
        </div>
      </div>

      {/* Main Preview Container with device wrapper */}
      <div className="flex-1 overflow-auto bg-neutral-900/60 flex items-center justify-center select-text">
        <div className={`${getDeviceWidth(false)} h-full flex flex-col transition-all duration-200`}>
          {renderContent(false)}
        </div>
      </div>
    </div>
  );
};
