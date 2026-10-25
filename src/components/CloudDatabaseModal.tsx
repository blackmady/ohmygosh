import React, { useState, useEffect } from 'react';
import { FileItem } from '../types';
import {
  loadCloudSnippets,
  loadVersionHistory,
  deleteVersionSnapshot,
  clearLocalWorkspaceCache,
  CloudSnippetMeta,
  VersionSnapshot,
} from '../utils/storage';
import {
  X,
  Database,
  History,
  Copy,
  Check,
  ExternalLink,
  RotateCcw,
  Trash2,
  Terminal,
  ShieldCheck,
  HardDrive,
  Cloud,
  Layers,
} from 'lucide-react';

interface CloudDatabaseModalProps {
  onClose: () => void;
  onRestoreSnapshot: (files: FileItem[], activePath: string) => void;
}

export const CloudDatabaseModal: React.FC<CloudDatabaseModalProps> = ({
  onClose,
  onRestoreSnapshot,
}) => {
  const [activeTab, setActiveTab] = useState<'cloud' | 'local' | 'd1-setup'>('cloud');
  const [cloudSnippets, setCloudSnippets] = useState<CloudSnippetMeta[]>([]);
  const [versionSnapshots, setVersionSnapshots] = useState<VersionSnapshot[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setCloudSnippets(loadCloudSnippets());
    setVersionSnapshots(loadVersionHistory());
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteSnapshot = (id: string) => {
    deleteVersionSnapshot(id);
    setVersionSnapshots(loadVersionHistory());
  };

  const handleClearCache = () => {
    if (confirm('确定要清空本地所有自动保存的草稿缓存吗？')) {
      clearLocalWorkspaceCache();
      alert('本地草稿缓存已清空');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-neutral-100 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                存储与 Cloudflare 数据库
              </h2>
              <p className="text-xs text-neutral-400">
                双轨持久化：本地实时热缓存 + Cloudflare D1 边缘数据库存储
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-800 px-6 pt-3 gap-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('cloud')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'cloud'
                ? 'border-orange-500 text-orange-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>云端已存记录 ({cloudSnippets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('local')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'local'
                ? 'border-orange-500 text-orange-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>本地版本与草稿 ({versionSnapshots.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('d1-setup')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'd1-setup'
                ? 'border-orange-500 text-orange-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Cloudflare D1 架构与初始化</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Tab 1: Cloud Snippets */}
          {activeTab === 'cloud' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span>每次点击「保存到云端」生成的 Cloudflare 数据库与永久短链记录</span>
              </div>

              {cloudSnippets.length === 0 ? (
                <div className="py-12 text-center text-neutral-500">
                  <Cloud className="w-8 h-8 mx-auto mb-2 opacity-40 text-orange-400" />
                  <p>暂无云端保存记录。点击主界面的「保存至云端 (Ctrl+S)」即可自动保存！</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cloudSnippets.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between gap-3 hover:border-neutral-700 transition-colors"
                    >
                      <div className="truncate flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white truncate">{item.title}</span>
                          <span className="px-1.5 py-0.2 bg-orange-950/60 text-orange-400 border border-orange-800/60 rounded text-[10px] font-mono">
                            {item.id}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-500 font-mono flex items-center gap-3">
                          <span>{new Date(item.savedAt).toLocaleString()}</span>
                          <span>·</span>
                          <span>{item.fileCount} 个文件</span>
                          <span>·</span>
                          <span>{(item.size / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleCopy(item.shortUrl, item.id)}
                          className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded text-xs flex items-center gap-1 transition-colors"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedId === item.id ? '已复制' : '复制短链'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Local Version Snapshots */}
          {activeTab === 'local' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span>本地自动保存的历史快照，离线即时恢复，防止代码意外丢失</span>
                <button
                  onClick={handleClearCache}
                  className="text-neutral-500 hover:text-red-400 transition-colors text-[11px]"
                >
                  清空本地草稿缓存
                </button>
              </div>

              {versionSnapshots.length === 0 ? (
                <div className="py-12 text-center text-neutral-500">
                  <HardDrive className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>暂无本地历史版本。代码编辑时系统每隔几秒将自动创建安全备份。</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {versionSnapshots.map((snap) => (
                    <div
                      key={snap.id}
                      className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="truncate flex-1">
                        <div className="font-semibold text-neutral-200 truncate mb-1">
                          {snap.title}
                        </div>
                        <div className="text-[11px] text-neutral-500 font-mono flex items-center gap-2">
                          <span>{new Date(snap.timestamp).toLocaleTimeString()}</span>
                          <span>·</span>
                          <span>{snap.fileCount} 个文件</span>
                          <span>·</span>
                          <span>{(snap.totalSize / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            onRestoreSnapshot(snap.files, snap.activePath);
                            onClose();
                          }}
                          className="px-2.5 py-1 bg-orange-600/90 hover:bg-orange-500 text-white rounded text-xs flex items-center gap-1 font-medium transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>恢复此版本</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSnapshot(snap.id)}
                          className="p-1 text-neutral-500 hover:text-red-400 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Cloudflare D1 Guide */}
          {activeTab === 'd1-setup' && (
            <div className="space-y-4 leading-relaxed text-neutral-300">
              <div className="p-3 bg-orange-950/20 border border-orange-800/40 rounded-xl">
                <span className="font-semibold text-white block mb-1">
                  Cloudflare D1 边缘关系型数据库 (Serverless SQLite)
                </span>
                <p className="text-neutral-400 text-xs">
                  我们在项目根目录内置了 <code className="text-orange-300 bg-neutral-900 px-1 py-0.5 rounded">schema.sql</code> 和 <code className="text-orange-300 bg-neutral-900 px-1 py-0.5 rounded">/functions/api/snippets</code>，原生直连 Cloudflare D1 数据库。
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-white">两步初始化 D1 数据库：</div>
                <div className="relative">
                  <pre className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-[11px] text-orange-300 overflow-x-auto">
{`# 1. 创建 D1 数据库实例
npx wrangler d1 create ohmygosh-db

# 2. 导入数据表结构 (执行根目录下的 schema.sql)
npx wrangler d1 execute ohmygosh-db --file=./schema.sql`}
                  </pre>
                  <button
                    onClick={() =>
                      handleCopy(
                        'npx wrangler d1 create ohmygosh-db\nnpx wrangler d1 execute ohmygosh-db --file=./schema.sql',
                        'd1_cmd'
                      )
                    }
                    className="absolute right-2 top-2 p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded"
                  >
                    {copiedId === 'd1_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-xs text-neutral-400">
                <div>
                  <strong>双轨回退机制</strong>：在你的 Cloudflare 控制台完成 D1 绑定前，系统会自动使用 LZ-String 客户端压缩链接无缝保存，<strong>无需担心报错或数据丢失</strong>。
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-neutral-800 bg-neutral-900/60">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
