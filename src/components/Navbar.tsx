import React from 'react';
import {
  Share2,
  Upload,
  FolderUp,
  Download,
  HelpCircle,
  Globe,
  ChevronDown,
  Database,
  Cloud,
  CheckCircle2,
  Loader2,
  Save,
} from 'lucide-react';
import { ViewMode } from '../types';

interface NavbarProps {
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  onOpenShareModal: () => void;
  onOpenVsCodeModal: () => void;
  onOpenDeployGuide: () => void;
  onOpenDatabaseModal: () => void;
  onSelectSamplePreset: (presetId: string) => void;
  onTriggerFileUpload: () => void;
  onTriggerFolderUpload: () => void;
  onNewEmptySnippet: () => void;
  onExportZip: () => void;
  fileCount: number;
  isSavingToCloud?: boolean;
  cacheStatusText?: string;
  onQuickCloudSave?: () => void;
  projectTitle?: string;
  currentProjectId?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  viewMode,
  onChangeViewMode,
  onOpenShareModal,
  onOpenVsCodeModal,
  onOpenDeployGuide,
  onOpenDatabaseModal,
  onSelectSamplePreset,
  onTriggerFileUpload,
  onTriggerFolderUpload,
  onNewEmptySnippet,
  onExportZip,
  fileCount,
  isSavingToCloud = false,
  cacheStatusText = '草稿已缓存',
  onQuickCloudSave,
  projectTitle = '我的代码工程',
  currentProjectId = null,
}) => {
  const [showPresetsMenu, setShowPresetsMenu] = React.useState(false);
  const [showUploadMenu, setShowUploadMenu] = React.useState(false);

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3 bg-neutral-900 border-b border-neutral-800 text-xs select-none relative z-30">
      {/* Zone 1: Wordmark & Project Name */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            window.location.hash = '';
            window.location.reload();
          }}
          className="text-base font-bold tracking-tight text-white flex items-center gap-2 whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]"></span>
          <span>CloudPaste</span>
        </a>

        {/* Project Name Breadcrumb */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs max-w-[180px] md:max-w-[260px] truncate">
          <span className="text-neutral-600">/</span>
          <span
            className="text-neutral-200 font-medium truncate"
            title={`${projectTitle} ${currentProjectId ? `(ID: ${currentProjectId})` : ''}`}
          >
            {projectTitle}
          </span>
          {currentProjectId && (
            <span className="text-[10px] text-neutral-500 font-mono px-1 py-0.2 bg-neutral-950 border border-neutral-800 rounded shrink-0">
              {currentProjectId}
            </span>
          )}
        </div>

        {/* Local cache indicator */}
        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-neutral-400 font-mono px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>{cacheStatusText}</span>
        </div>
      </div>

      {/* Zone 2: 4-5 clean single-line text navigation links / actions */}
      <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-neutral-300">
        {/* Presets dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowPresetsMenu(!showPresetsMenu);
              setShowUploadMenu(false);
            }}
            className="flex items-center gap-1 hover:text-white transition-colors whitespace-nowrap shrink-0 py-1"
          >
            <span>预设范例</span>
            <ChevronDown className="w-3 h-3 text-neutral-500" />
          </button>

          {showPresetsMenu && (
            <div
              onMouseLeave={() => setShowPresetsMenu(false)}
              className="absolute left-0 top-full mt-1.5 w-60 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl py-1 z-40"
            >
              <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-neutral-500 border-b border-neutral-800">
                选择前端预览范例
              </div>
              <button
                onClick={() => {
                  onSelectSamplePreset('html-modern-app');
                  setShowPresetsMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-neutral-800 flex items-center justify-between text-xs text-neutral-200"
              >
                <span>HTML/JS 动态仪表盘</span>
                <span className="text-[10px] text-orange-400 font-mono">HTML</span>
              </button>
              <button
                onClick={() => {
                  onSelectSamplePreset('svg-badge');
                  setShowPresetsMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-neutral-800 flex items-center justify-between text-xs text-neutral-200"
              >
                <span>SVG 矢量徽章 (支持缩放导出)</span>
                <span className="text-[10px] text-yellow-400 font-mono">SVG</span>
              </button>
              <button
                onClick={() => {
                  onSelectSamplePreset('markdown-doc');
                  setShowPresetsMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-neutral-800 flex items-center justify-between text-xs text-neutral-200"
              >
                <span>Markdown GFM 规范文档</span>
                <span className="text-[10px] text-sky-400 font-mono">MD</span>
              </button>
              <button
                onClick={() => {
                  onSelectSamplePreset('csv-analytics');
                  setShowPresetsMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-neutral-800 flex items-center justify-between text-xs text-neutral-200"
              >
                <span>CSV SaaS 数据表 (可排序过滤)</span>
                <span className="text-[10px] text-emerald-400 font-mono">CSV</span>
              </button>
              <button
                onClick={() => {
                  onSelectSamplePreset('multi-file-web');
                  setShowPresetsMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-neutral-800 flex items-center justify-between text-xs text-neutral-200 border-t border-neutral-800"
              >
                <span>多文件工程 (HTML+CSS+JS)</span>
                <span className="text-[10px] text-amber-400 font-mono">多文件</span>
              </button>
            </div>
          )}
        </div>

        {/* Upload Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUploadMenu(!showUploadMenu);
              setShowPresetsMenu(false);
            }}
            className="flex items-center gap-1 hover:text-white transition-colors whitespace-nowrap shrink-0 py-1"
          >
            <span>上传工程</span>
            <ChevronDown className="w-3 h-3 text-neutral-500" />
          </button>

          {showUploadMenu && (
            <div
              onMouseLeave={() => setShowUploadMenu(false)}
              className="absolute left-0 top-full mt-1.5 w-48 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl py-1 z-40"
            >
              <button
                onClick={() => {
                  onTriggerFileUpload();
                  setShowUploadMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-neutral-800 flex items-center gap-2 text-xs text-neutral-200"
              >
                <Upload className="w-3.5 h-3.5 text-neutral-400" />
                <span>选择单个或多个文件</span>
              </button>
              <button
                onClick={() => {
                  onTriggerFolderUpload();
                  setShowUploadMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-neutral-800 flex items-center gap-2 text-xs text-neutral-200"
              >
                <FolderUp className="w-3.5 h-3.5 text-neutral-400" />
                <span>选择整个工程文件夹</span>
              </button>
            </div>
          )}
        </div>

        {/* Cloudflare Database & Storage Management */}
        <button
          onClick={onOpenDatabaseModal}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <Database className="w-3.5 h-3.5 text-orange-400" />
          <span>Cloudflare 数据库</span>
        </button>

        {/* Question: VS Code Comparison */}
        <button
          onClick={onOpenVsCodeModal}
          className="hover:text-orange-400 text-orange-300/90 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>VS Code 对比</span>
        </button>

        {/* Cloudflare Pages Deployment Guide */}
        <button
          onClick={onOpenDeployGuide}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <Globe className="w-3.5 h-3.5 text-neutral-400" />
          <span>GitHub 部署</span>
        </button>
      </nav>

      {/* Zone 3: Actions (View Layout switch & Primary Share CTA) */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Layout Segmented Control */}
        <div className="hidden sm:flex items-center gap-0.5 p-0.5 bg-neutral-950 border border-neutral-800 rounded-lg">
          <button
            onClick={() => onChangeViewMode('split')}
            className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap ${
              viewMode === 'split' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-white'
            }`}
          >
            分栏视图
          </button>
          <button
            onClick={() => onChangeViewMode('code')}
            className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap ${
              viewMode === 'code' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-white'
            }`}
          >
            仅代码
          </button>
          <button
            onClick={() => onChangeViewMode('preview')}
            className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap ${
              viewMode === 'preview' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-white'
            }`}
          >
            仅视窗
          </button>
        </div>

        {/* Export ZIP */}
        <button
          onClick={onExportZip}
          title="将当前项目打包为 ZIP"
          className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors hidden md:flex items-center gap-1"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Save Button (Ctrl+S) */}
        {onQuickCloudSave && (
          <button
            onClick={onQuickCloudSave}
            disabled={isSavingToCloud}
            title="保存项目至云端数据库 (Ctrl+S)"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors border border-neutral-700 cursor-pointer disabled:opacity-50"
          >
            {isSavingToCloud ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" />
            ) : (
              <Save className="w-3.5 h-3.5 text-orange-400" />
            )}
            <span>{isSavingToCloud ? '保存中...' : '保存'}</span>
          </button>
        )}

        {/* Primary Action Button */}
        <button
          onClick={onOpenShareModal}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>生成永久链接</span>
        </button>
      </div>
    </header>
  );
};
