import React, { useState } from 'react';
import { FileItem, SupportedLanguage } from '../types';
import { detectLanguage } from '../utils/language';
import {
  FileCode,
  FileText,
  FileSpreadsheet,
  Image,
  FolderPlus,
  FilePlus,
  Trash2,
  Edit2,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

interface FileTreeProps {
  files: FileItem[];
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
  onAddFile: (name: string, content?: string) => void;
  onDeleteFile: (fileId: string) => void;
  onRenameFile: (fileId: string, newName: string) => void;
  onTriggerUpload: () => void;
  onTriggerFolderUpload: () => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onAddFile,
  onDeleteFile,
  onRenameFile,
  onTriggerUpload,
  onTriggerFolderUpload,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const handleStartRename = (file: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(file.id);
    setEditName(file.name);
  };

  const handleFinishRename = (fileId: string) => {
    if (editName.trim()) {
      onRenameFile(fileId, editName.trim());
    }
    setEditingId(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFileName.trim()) {
      onAddFile(newFileName.trim());
      setNewFileName('');
      setIsCreating(false);
    }
  };

  const getFileIcon = (lang: SupportedLanguage, name: string) => {
    if (lang === 'html') return <FileCode className="w-4 h-4 text-orange-400 shrink-0" />;
    if (lang === 'svg') return <Image className="w-4 h-4 text-yellow-400 shrink-0" />;
    if (lang === 'markdown') return <FileText className="w-4 h-4 text-sky-400 shrink-0" />;
    if (lang === 'csv' || lang === 'tsv') return <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />;
    if (lang === 'json') return <FileCode className="w-4 h-4 text-amber-300 shrink-0" />;
    if (lang === 'javascript' || lang === 'typescript') return <FileCode className="w-4 h-4 text-amber-400 shrink-0" />;
    if (lang === 'css') return <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />;
    if (lang === 'python') return <FileCode className="w-4 h-4 text-blue-400 shrink-0" />;
    return <FileText className="w-4 h-4 text-neutral-400 shrink-0" />;
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-r border-neutral-800 text-xs text-neutral-300 select-none w-60 shrink-0">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800 bg-neutral-900/90">
        <span className="font-semibold text-neutral-200 uppercase tracking-wider text-[11px]">
          工作区文件 ({files.length})
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCreating(true)}
            title="新建文件"
            className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* New File Inline Form */}
      {isCreating && (
        <form onSubmit={handleCreateSubmit} className="p-2 border-b border-neutral-800 bg-neutral-950">
          <input
            autoFocus
            type="text"
            placeholder="文件名 (如 demo.html, data.csv)"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onBlur={() => setIsCreating(false)}
            className="w-full px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-orange-500 font-mono"
          />
        </form>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {files.length === 0 ? (
          <div className="text-center py-8 px-3 text-neutral-500">
            暂无文件，点击上方新建或拖拽上传
          </div>
        ) : (
          files.map((file) => {
            const isActive = file.id === activeFileId;
            const isEditing = file.id === editingId;

            return (
              <div
                key={file.id}
                onClick={() => onSelectFile(file.id)}
                className={`group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-neutral-800 text-white font-medium border-l-2 border-orange-500'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                }`}
              >
                <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                  {getFileIcon(file.language, file.name)}
                  {isEditing ? (
                    <input
                      autoFocus
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleFinishRename(file.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleFinishRename(file.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-neutral-950 border border-orange-500 rounded px-1.5 py-0 text-xs text-white outline-none w-full font-mono"
                    />
                  ) : (
                    <span className="truncate font-mono text-xs">{file.path || file.name}</span>
                  )}
                </div>

                {/* Hover actions */}
                {!isEditing && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-1">
                    <button
                      onClick={(e) => handleStartRename(file, e)}
                      title="重命名"
                      className="p-1 hover:text-white rounded"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    {files.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`确定要删除 ${file.name} 吗？`)) {
                            onDeleteFile(file.id);
                          }
                        }}
                        title="删除文件"
                        className="p-1 hover:text-red-400 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Upload Shortcuts Footer */}
      <div className="p-2 border-t border-neutral-800 bg-neutral-950/60 flex flex-col gap-1.5">
        <button
          onClick={onTriggerUpload}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded transition-colors text-xs"
        >
          <FilePlus className="w-3.5 h-3.5 text-neutral-400" />
          <span>上传文件</span>
        </button>
        <button
          onClick={onTriggerFolderUpload}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded transition-colors text-xs"
        >
          <Folder className="w-3.5 h-3.5 text-neutral-400" />
          <span>上传整个文件夹</span>
        </button>
      </div>
    </div>
  );
};
