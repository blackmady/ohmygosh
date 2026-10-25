/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FileItem, SupportedLanguage, ViewMode } from './types';
import { SAMPLE_PRESETS } from './utils/samples';
import { detectLanguage } from './utils/language';
import { decodeSharePayload } from './utils/compression';
import { exportFilesAsZip, extractZipToFiles } from './utils/zip';
import {
  saveWorkspaceToLocal,
  loadWorkspaceFromLocal,
  clearLocalWorkspaceCache,
} from './utils/storage';
import {
  saveSnippetToCloud,
  loadSnippetFromCloud,
  getUrlSnippetId,
} from './utils/cloudApi';
import { Navbar } from './components/Navbar';
import { FileTree } from './components/FileTree';
import { CodeEditor } from './components/CodeEditor';
import { PreviewPanel } from './components/PreviewPanel';
import { ShareModal } from './components/ShareModal';
import { VsCodeComparisonModal } from './components/VsCodeComparisonModal';
import { CloudflareGuideModal } from './components/CloudflareGuideModal';
import { CloudDatabaseModal } from './components/CloudDatabaseModal';
import { SaveProjectModal } from './components/SaveProjectModal';
import {
  UploadCloud,
  Link as LinkIcon,
  CheckCircle2,
  Database,
  Cloud,
} from 'lucide-react';

// Coherent initial workspace state resolver
function getInitialWorkspace(): {
  files: FileItem[];
  activeFileId: string;
  sharedInfo: { title: string; createdAt: number; source: 'cloud' | 'hash' } | null;
} {
  // 1. First priority: URL share payload (#data=..., ?data=..., #d=...)
  const shared = decodeSharePayload();
  if (shared && shared.files.length > 0) {
    const mapped: FileItem[] = shared.files.map((f, idx) => ({
      id: `shared_file_${idx}_${Date.now()}`,
      name: f.name,
      path: f.path || f.name,
      content: f.content,
      language: f.language || detectLanguage(f.name, f.content),
      size: f.content.length,
      lastModified: shared.createdAt,
    }));
    const match = mapped.find((f) => f.path === shared.activePath || f.name === shared.activePath);
    return {
      files: mapped,
      activeFileId: match ? match.id : mapped[0].id,
      sharedInfo: { title: shared.title, createdAt: shared.createdAt, source: 'hash' },
    };
  }

  // 2. Second priority: LocalStorage cached draft (Persistence)
  const localCached = loadWorkspaceFromLocal();
  if (localCached && localCached.files.length > 0) {
    return {
      files: localCached.files,
      activeFileId: localCached.activeFileId || localCached.files[0]?.id || '',
      sharedInfo: null,
    };
  }

  // 3. Fallback: default preset
  const defaultFiles = SAMPLE_PRESETS[0].files;
  return {
    files: defaultFiles,
    activeFileId: defaultFiles[0]?.id || '',
    sharedInfo: null,
  };
}

export default function App() {
  const initialWorkspace = useMemo(() => getInitialWorkspace(), []);

  const [files, setFiles] = useState<FileItem[]>(initialWorkspace.files);
  const [activeFileId, setActiveFileId] = useState<string>(initialWorkspace.activeFileId);
  const [sharedInfo, setSharedInfo] = useState<{ title: string; createdAt: number; source: 'cloud' | 'hash' } | null>(
    initialWorkspace.sharedInfo
  );

  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isDragOver, setIsDragOver] = useState(false);
  const [cacheStatusText, setCacheStatusText] = useState('本地已缓存');
  const [isSavingToCloud, setIsSavingToCloud] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Project identity (single version per project)
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(() => getUrlSnippetId());
  const [projectTitle, setProjectTitle] = useState<string>(() => {
    const initial = getInitialWorkspace();
    return initial.sharedInfo?.title || '我的代码工程';
  });

  // Modals
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showVsCodeModal, setShowVsCodeModal] = useState(false);
  const [showDeployGuide, setShowDeployGuide] = useState(false);
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);

  // Input refs for file & folder uploads
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<number | null>(null);

  const showNotification = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }, []);

  // Dedicated loader for URL share payloads and Cloudflare snippet IDs
  const loadFromUrl = useCallback(async () => {
    // 1. Try Cloudflare Database snippet (#id=cp_xxx, ?id=cp_xxx)
    const snippetId = getUrlSnippetId();
    if (snippetId) {
      showNotification(`正在从 Cloudflare 数据库载入项目 (ID: ${snippetId})...`);
      const data = await loadSnippetFromCloud(snippetId);
      if (data && data.files.length > 0) {
        setFiles(data.files);
        const match = data.files.find((f) => f.path === data.activePath || f.name === data.activePath);
        setActiveFileId(match ? match.id : data.files[0].id);
        setCurrentProjectId(snippetId);
        setProjectTitle(data.title || '代码工程');
        setSharedInfo({ title: data.title, createdAt: data.createdAt, source: 'cloud' });
        showNotification(`已成功载入云端项目: ${data.title} (ID: ${snippetId})`);
        return true;
      } else {
        showNotification(`提示：未在云端数据库检索到项目 ID: ${snippetId}（请确认已在 Cloudflare Pages 绑定 D1）`);
        return false;
      }
    }

    // 2. Backward compatibility for legacy URL payload (#data=..., ?data=..., #d=...)
    const shared = decodeSharePayload();
    if (shared && shared.files.length > 0) {
      const mappedFiles: FileItem[] = shared.files.map((f, idx) => ({
        id: `shared_file_${idx}_${Date.now()}`,
        name: f.name,
        path: f.path || f.name,
        content: f.content,
        language: f.language || detectLanguage(f.name, f.content),
        size: f.content.length,
        lastModified: shared.createdAt,
      }));
      setFiles(mappedFiles);
      const match = mappedFiles.find((f) => f.path === shared.activePath || f.name === shared.activePath);
      setActiveFileId(match ? match.id : mappedFiles[0].id);
      setProjectTitle(shared.title || '代码工程');
      setSharedInfo({ title: shared.title, createdAt: shared.createdAt, source: 'hash' });
      showNotification(`已载入工程: ${shared.title}`);
      return true;
    }

    return false;
  }, [showNotification]);

  // Handle URL change dynamically without page reload
  useEffect(() => {
    const snippetId = getUrlSnippetId();
    if (snippetId) {
      loadFromUrl();
    }

    const handleUrlChange = () => {
      loadFromUrl();
    };

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [loadFromUrl]);

  // Debounced auto-save to localStorage on every change
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
    }

    setCacheStatusText('正在缓存...');
    autoSaveTimerRef.current = window.setTimeout(() => {
      saveWorkspaceToLocal(files, activeFileId, true);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setCacheStatusText(`已缓存 (${timeStr})`);
    }, 600);

    return () => {
      if (autoSaveTimerRef.current) window.clearTimeout(autoSaveTimerRef.current);
    };
  }, [files, activeFileId]);

  // Sync active file if current file was deleted
  useEffect(() => {
    if (!files.some((f) => f.id === activeFileId) && files.length > 0) {
      setActiveFileId(files[0].id);
    }
  }, [files, activeFileId]);

  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  // Open Save Project Modal (Ctrl+S / Cmd+S or button click)
  const handleQuickCloudSave = () => {
    setShowSaveModal(true);
  };

  // Confirm save from modal with project naming and single-version enforcement
  const handleConfirmSaveProject = async (name: string, asNew: boolean) => {
    if (!activeFile) return;
    setIsSavingToCloud(true);
    const targetId = asNew ? null : currentProjectId;
    try {
      const res = await saveSnippetToCloud(name, files, activeFile, targetId);
      if (res.success && res.id) {
        setCurrentProjectId(res.id);
        setProjectTitle(name);
        window.location.hash = `#id=${res.id}`;
        showNotification(
          targetId
            ? `✓ 项目「${name}」已更新 (ID: ${res.id}) · 单一最新版本已同步`
            : `✓ 项目「${name}」已保存 (ID: ${res.id}) · 已分配专属短链`
        );
        setShowSaveModal(false);
      } else {
        showNotification(`⚠️ 未能存入数据库: ${res.error || 'D1 数据库未绑定'}`);
        setShowSaveModal(false);
        setShowDatabaseModal(true);
      }
    } catch (err: any) {
      console.error(err);
      showNotification(`⚠️ 保存出错: ${err.message || err}`);
    } finally {
      setIsSavingToCloud(false);
    }
  };

  // Global Ctrl+S keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setShowSaveModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update file content
  const handleContentChange = (newContent: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === activeFileId
          ? { ...f, content: newContent, size: newContent.length, lastModified: Date.now() }
          : f
      )
    );
  };

  // Update file language
  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFileId ? { ...f, language: newLang } : f))
    );
  };

  // Add new file
  const handleAddFile = (fileName: string, content = '') => {
    const lang = detectLanguage(fileName, content);
    const newFile: FileItem = {
      id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: fileName,
      path: fileName,
      content,
      language: lang,
      size: content.length,
      lastModified: Date.now(),
    };
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
  };

  // Delete file
  const handleDeleteFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // Rename file
  const handleRenameFile = (fileId: string, newName: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f;
        const newLang = detectLanguage(newName, f.content);
        return {
          ...f,
          name: newName,
          path: newName,
          language: newLang,
        };
      })
    );
  };

  // Select Sample Preset
  const handleSelectPreset = (presetId: string) => {
    const preset = SAMPLE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setSharedInfo(null);
    setCurrentProjectId(null);
    setProjectTitle(preset.title);
    setFiles(preset.files);
    const targetFile = preset.files.find((f) => f.path === preset.activePath) || preset.files[0];
    if (targetFile) {
      setActiveFileId(targetFile.id);
    }
    showNotification(`已载入示例工程: ${preset.title}`);
  };

  // Restore snapshot from database modal
  const handleRestoreSnapshot = (restoredFiles: FileItem[], activePath: string, title?: string, id?: string) => {
    setFiles(restoredFiles);
    const target = restoredFiles.find((f) => f.path === activePath || f.name === activePath);
    setActiveFileId(target ? target.id : restoredFiles[0]?.id || '');
    if (title) setProjectTitle(title);
    if (id) setCurrentProjectId(id);
    showNotification(`已恢复项目: ${title || '代码工程'} (${restoredFiles.length} 个文件)`);
  };

  // New Empty Snippet
  const handleNewSnippet = () => {
    setSharedInfo(null);
    setCurrentProjectId(null);
    setProjectTitle('新代码工程');
    window.location.hash = '';
    clearLocalWorkspaceCache();
    const emptyFile: FileItem = {
      id: `file_${Date.now()}`,
      name: 'index.html',
      path: 'index.html',
      content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>新代码预览</title>
  <style>
    body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0f172a; color: white; }
    h1 { font-size: 24px; color: #f97316; }
  </style>
</head>
<body>
  <div>
    <h1>欢迎使用 CloudPaste！</h1>
    <p>在此编写前端代码或在左侧粘贴任意代码格式。</p>
  </div>
</body>
</html>`,
      language: 'html',
      size: 400,
      lastModified: Date.now(),
    };
    setFiles([emptyFile]);
    setActiveFileId(emptyFile.id);
  };

  // Process uploaded files
  const processUploadedFileList = async (fileList: FileList) => {
    const newItems: FileItem[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];

      if (file.name.endsWith('.zip')) {
        try {
          const zipFiles = await extractZipToFiles(file);
          newItems.push(...zipFiles);
          continue;
        } catch (err) {
          console.error('Failed to unpack zip:', err);
        }
      }

      try {
        const text = await file.text();
        const relPath = file.webkitRelativePath || file.name;
        const name = relPath.split('/').pop() || file.name;
        const lang = detectLanguage(name, text);

        newItems.push({
          id: `file_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          name,
          path: relPath,
          content: text,
          language: lang,
          size: file.size,
          lastModified: file.lastModified,
        });
      } catch (err) {
        console.warn(`Could not read file ${file.name} as text:`, err);
      }
    }

    if (newItems.length > 0) {
      setFiles((prev) => {
        const filteredPrev = prev.filter((p) => !p.id.startsWith('sample_'));
        return [...filteredPrev, ...newItems];
      });
      const indexFile = newItems.find(
        (f) => f.name.toLowerCase() === 'index.html' || f.name.toLowerCase().endsWith('.html')
      );
      setActiveFileId(indexFile ? indexFile.id : newItems[0].id);
      showNotification(`成功导入 ${newItems.length} 个文件`);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processUploadedFileList(e.dataTransfer.files);
    }
  }, []);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex flex-col h-screen w-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans select-none"
    >
      {/* Hidden file upload inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            processUploadedFileList(e.target.files);
          }
        }}
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-ignore
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            processUploadedFileList(e.target.files);
          }
        }}
      />

      {/* Top Navbar */}
      <Navbar
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        onOpenShareModal={() => setShowShareModal(true)}
        onOpenVsCodeModal={() => setShowVsCodeModal(true)}
        onOpenDeployGuide={() => setShowDeployGuide(true)}
        onOpenDatabaseModal={() => setShowDatabaseModal(true)}
        onSelectSamplePreset={handleSelectPreset}
        onTriggerFileUpload={() => fileInputRef.current?.click()}
        onTriggerFolderUpload={() => folderInputRef.current?.click()}
        onNewEmptySnippet={handleNewSnippet}
        onExportZip={() => exportFilesAsZip(files)}
        fileCount={files.length}
        isSavingToCloud={isSavingToCloud}
        cacheStatusText={cacheStatusText}
        onQuickCloudSave={handleQuickCloudSave}
        projectTitle={projectTitle}
        currentProjectId={currentProjectId}
      />

      {/* Shared Snippet Kicker Banner */}
      {sharedInfo && (
        <div className="bg-orange-950/70 border-b border-orange-800/60 px-6 py-2 flex items-center justify-between text-xs text-orange-200">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span>
              正在查看通过{sharedInfo.source === 'cloud' ? 'Cloudflare 数据库' : '永久短链'}加载的代码工程: <strong>{sharedInfo.title}</strong>
            </span>
            <span aria-hidden="true" className="text-orange-400/60">·</span>
            <span className="text-orange-300/80">代码已自动同步建立本地缓存</span>
          </div>

          <button
            onClick={() => {
              window.location.hash = '';
              setSharedInfo(null);
            }}
            className="text-xs text-orange-300 hover:text-white underline"
          >
            退出分享模式并新建
          </button>
        </div>
      )}

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: File Tree */}
        <FileTree
          files={files}
          activeFileId={activeFileId}
          onSelectFile={setActiveFileId}
          onAddFile={handleAddFile}
          onDeleteFile={handleDeleteFile}
          onRenameFile={handleRenameFile}
          onTriggerUpload={() => fileInputRef.current?.click()}
          onTriggerFolderUpload={() => folderInputRef.current?.click()}
        />

        {/* Center / Right Split Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Code Editor Panel */}
          {(viewMode === 'split' || viewMode === 'code') && activeFile && (
            <div
              className={`${
                viewMode === 'split' ? 'w-1/2 border-r border-neutral-800' : 'w-full'
              } h-full flex flex-col`}
            >
              <CodeEditor
                file={activeFile}
                onChangeContent={handleContentChange}
                onChangeLanguage={handleLanguageChange}
              />
            </div>
          )}

          {/* Live Preview Panel */}
          {(viewMode === 'split' || viewMode === 'preview') && activeFile && (
            <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} h-full flex flex-col`}>
              <PreviewPanel
                currentFile={activeFile}
                allFiles={files}
                viewMode={viewMode}
                onChangeViewMode={setViewMode}
              />
            </div>
          )}
        </div>

        {/* Fullscreen Drag & Drop Overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-neutral-950/90 border-2 border-dashed border-orange-500 z-50 flex flex-col items-center justify-center p-8 backdrop-blur-sm animate-fade-in pointer-events-none">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mb-4">
              <UploadCloud className="w-8 h-8 animate-bounce" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">松开鼠标直接导入文件或文件夹</h3>
            <p className="text-sm text-neutral-400 max-w-md text-center">
              支持上传单个文件、多个代码文件、静态网页工程文件夹以及 .ZIP 压缩包，自动识别语言与关联资源。
            </p>
          </div>
        )}

        {/* Notification Toast */}
        {toastMsg && (
          <div className="absolute bottom-6 right-6 z-50 px-4 py-2.5 bg-neutral-900/95 border border-neutral-700/80 rounded-xl shadow-2xl text-xs text-white flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}
      </div>

      {/* Modals */}
      {showSaveModal && activeFile && (
        <SaveProjectModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          files={files}
          activeFile={activeFile}
          currentProjectId={currentProjectId}
          initialTitle={projectTitle}
          isSaving={isSavingToCloud}
          onConfirmSave={handleConfirmSaveProject}
        />
      )}

      {showShareModal && activeFile && (
        <ShareModal
          files={files}
          activeFile={activeFile}
          onClose={() => setShowShareModal(false)}
          onOpenDeployGuide={() => setShowDeployGuide(true)}
          initialTitle={projectTitle}
          currentProjectId={currentProjectId}
          onSavedSnippet={(id, title) => {
            setCurrentProjectId(id);
            setProjectTitle(title);
            window.location.hash = `#id=${id}`;
          }}
        />
      )}

      {showVsCodeModal && (
        <VsCodeComparisonModal onClose={() => setShowVsCodeModal(false)} />
      )}

      {showDeployGuide && (
        <CloudflareGuideModal onClose={() => setShowDeployGuide(false)} />
      )}

      {showDatabaseModal && (
        <CloudDatabaseModal
          onClose={() => setShowDatabaseModal(false)}
          onRestoreSnapshot={handleRestoreSnapshot}
        />
      )}
    </div>
  );
}
