import React, { useState, useEffect, useRef } from 'react';
import { Save, X, Layers, HardDrive, Check, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { FileItem } from '../types';

interface SaveProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileItem[];
  activeFile: FileItem;
  currentProjectId: string | null;
  initialTitle: string;
  isSaving: boolean;
  onConfirmSave: (projectName: string, asNewProject: boolean) => Promise<void>;
}

export const SaveProjectModal: React.FC<SaveProjectModalProps> = ({
  isOpen,
  onClose,
  files,
  activeFile,
  currentProjectId,
  initialTitle,
  isSaving,
  onConfirmSave,
}) => {
  const [projectName, setProjectName] = useState(initialTitle || '我的代码工程');
  const [asNewProject, setAsNewProject] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync initial title when opened
  useEffect(() => {
    if (isOpen) {
      setProjectName(initialTitle || activeFile?.name || '我的代码工程');
      setAsNewProject(false);
      setErrorMsg(null);
      // Auto focus and select input
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen, initialTitle, activeFile]);

  if (!isOpen) return null;

  const totalSize = files.reduce((acc, f) => acc + (f.size || f.content?.length || 0), 0);
  const formattedSize =
    totalSize < 1024
      ? `${totalSize} B`
      : totalSize < 1024 * 1024
      ? `${(totalSize / 1024).toFixed(1)} KB`
      : `${(totalSize / (1024 * 1024)).toFixed(2)} MB`;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = projectName.trim();
    if (!trimmed) {
      setErrorMsg('请输入项目名称');
      inputRef.current?.focus();
      return;
    }
    setErrorMsg(null);
    await onConfirmSave(trimmed, asNewProject);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isSaving) {
      onClose();
    }
  };

  const isUpdatingExisting = Boolean(currentProjectId && !asNewProject);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in select-none"
      onKeyDown={handleKeyDown}
    >
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Save className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">保存项目</h2>
              <p className="text-xs text-neutral-400">
                单个项目仅保留最新版本 · 同步至 Cloudflare 数据库
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Project Name Input */}
          <div className="space-y-1.5">
            <label className="text-neutral-300 font-medium flex items-center justify-between">
              <span>项目名称 (必填)</span>
              <span className="text-[11px] text-neutral-500 font-mono">
                {projectName.trim().length}/60
              </span>
            </label>
            <input
              ref={inputRef}
              type="text"
              maxLength={60}
              disabled={isSaving}
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="例如：现代响应式仪表盘、Markdown 规范文档..."
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 focus:border-orange-500 rounded-xl text-white placeholder-neutral-500 text-xs outline-none transition-colors"
            />
            {errorMsg && (
              <p className="text-red-400 text-[11px] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>{errorMsg}</span>
              </p>
            )}
          </div>

          {/* Project Details Badge */}
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="flex items-center gap-1.5 text-neutral-300 font-medium">
                <Layers className="w-3.5 h-3.5 text-orange-400" />
                <span>工程容量</span>
              </span>
              <span className="font-mono text-neutral-200">
                {files.length} 个文件 · {formattedSize}
              </span>
            </div>

            <div className="flex items-center justify-between text-neutral-400 border-t border-neutral-850 pt-2 text-[11px]">
              <span>保存模式</span>
              {isUpdatingExisting ? (
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>更新现有项目 (ID: {currentProjectId})</span>
                </span>
              ) : (
                <span className="text-orange-400 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>新建项目 (将分配专属 ID)</span>
                </span>
              )}
            </div>
          </div>

          {/* Single-Version Explanation Banner */}
          <div className="p-3 bg-neutral-950/70 border border-neutral-800/80 rounded-xl text-neutral-400 text-[11px] leading-relaxed">
            <div className="text-neutral-300 font-medium mb-0.5 flex items-center gap-1.5">
              <HardDrive className="w-3 h-3 text-neutral-400" />
              <span>单一最新版本策略</span>
            </div>
            同一个项目仅保存一份最新内容，后续保存会自动覆盖更新该项目的云端与数据库记录，链接永久不变，无多版本冗余。
          </div>

          {/* Optional: Save as new project if current project already has an ID */}
          {currentProjectId && (
            <label className="flex items-center gap-2 cursor-pointer pt-1 text-neutral-300 text-xs">
              <input
                type="checkbox"
                checked={asNewProject}
                onChange={(e) => setAsNewProject(e.target.checked)}
                disabled={isSaving}
                className="w-4 h-4 rounded border-neutral-700 text-orange-600 focus:ring-0 focus:ring-offset-0 bg-neutral-950 cursor-pointer"
              />
              <span>另存为新项目（生成新的短链与独立记录）</span>
            </label>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSaving || !projectName.trim()}
              className="px-5 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>正在保存...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{isUpdatingExisting ? '更新保存' : '确认保存'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
