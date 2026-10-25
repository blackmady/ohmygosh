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
  checkCloudflareDatabaseStatus,
  fetchCloudSnippetsList,
  loadSnippetFromCloud,
  CloudDatabaseStatus,
  CloudSnippetListItem,
} from '../utils/cloudApi';
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
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  FolderOpen,
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
  const [dbStatus, setDbStatus] = useState<CloudDatabaseStatus | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [remoteSnippets, setRemoteSnippets] = useState<CloudSnippetListItem[]>([]);
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);

  const checkStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const status = await checkCloudflareDatabaseStatus();
      setDbStatus(status);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const loadRemoteSnippets = async () => {
    setIsLoadingRemote(true);
    try {
      const list = await fetchCloudSnippetsList();
      setRemoteSnippets(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingRemote(false);
    }
  };

  useEffect(() => {
    setCloudSnippets(loadCloudSnippets());
    setVersionSnapshots(loadVersionHistory());
    checkStatus();
    loadRemoteSnippets();
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

  const handleLoadRemoteSnippet = async (id: string) => {
    const data = await loadSnippetFromCloud(id);
    if (data && data.files.length > 0) {
      onRestoreSnapshot(data.files, data.activePath);
      window.location.hash = `#id=${id}`;
      onClose();
    } else {
      alert(`无法载入项目 ${id}，可能尚未存入数据库`);
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
                Cloudflare D1 边缘数据库与版本存储
              </h2>
              <p className="text-xs text-neutral-400">
                实时状态检测 · 表结构自动就绪 · 专属 ID 持久化存储
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

        {/* Database Live Health Status Bar */}
        <div className="px-6 py-2.5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400">D1 连接状态:</span>
            {dbStatus?.d1Bound ? (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>已就绪 (DB 已绑定，表 snippets 共 {dbStatus.count ?? 0} 条记录)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  未检测到 DB 绑定 (若刚在后台添加了绑定，请在 Pages「部署」中点击「重试部署」或 push 代码以生效)
                </span>
              </span>
            )}
          </div>

          <button
            onClick={() => {
              checkStatus();
              loadRemoteSnippets();
            }}
            disabled={isCheckingStatus}
            className="text-neutral-400 hover:text-white flex items-center gap-1 text-[11px] transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isCheckingStatus ? 'animate-spin text-orange-400' : ''}`} />
            <span>重新检测</span>
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
            <span>云端数据库记录 ({remoteSnippets.length > 0 ? remoteSnippets.length : cloudSnippets.length})</span>
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
            <span>本地历史快照 ({versionSnapshots.length})</span>
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
            <span>Cloudflare D1 绑定与初始化</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Tab 1: Cloud Snippets */}
          {activeTab === 'cloud' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span>通过 Cloudflare D1 数据库存储的项目，均生成基于专属短 ID 的永久链接</span>
              </div>

              {/* Show D1 bound records if available */}
              {remoteSnippets.length > 0 ? (
                <div className="space-y-2">
                  {remoteSnippets.map((item) => {
                    const shortUrl = `${window.location.origin}/#id=${item.id}`;
                    return (
                      <div
                        key={item.id}
                        className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between gap-3 hover:border-neutral-700 transition-colors"
                      >
                        <div className="truncate flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-white truncate">{item.title}</span>
                            <span className="px-1.5 py-0.2 bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 rounded text-[10px] font-mono">
                              {item.id}
                            </span>
                          </div>
                          <div className="text-[11px] text-neutral-500 font-mono flex items-center gap-3">
                            <span>{new Date(item.created_at).toLocaleString()}</span>
                            <span>·</span>
                            <span>{item.total_files} 个文件</span>
                            <span>·</span>
                            <span>{(item.size_bytes / 1024).toFixed(1)} KB</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleLoadRemoteSnippet(item.id)}
                            className="px-2.5 py-1 bg-orange-600/90 hover:bg-orange-500 text-white rounded text-xs flex items-center gap-1 font-medium transition-colors"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            <span>载入</span>
                          </button>

                          <button
                            onClick={() => handleCopy(shortUrl, item.id)}
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
                    );
                  })}
                </div>
              ) : cloudSnippets.length > 0 ? (
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

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleLoadRemoteSnippet(item.id)}
                          className="px-2.5 py-1 bg-orange-600/90 hover:bg-orange-500 text-white rounded text-xs flex items-center gap-1 font-medium transition-colors"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>载入</span>
                        </button>
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
              ) : (
                <div className="py-12 text-center text-neutral-500">
                  <Cloud className="w-8 h-8 mx-auto mb-2 opacity-40 text-orange-400" />
                  <p>暂无云端保存记录。点击主界面的「存入数据库」或「生成永久链接」即可将项目入库并获得专属短链！</p>
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
                  为什么之前点「存入数据库」后表还是空的？
                </span>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Cloudflare Pages 在通过 GitHub 连接自动部署时，<strong>不会自动绑定</strong>你在 Cloudflare 创建的 D1 数据库。如果未在后台完成绑定，后端 Functions 就无法访问数据库实例。现在我们已加入<strong>自动建表机制</strong>与<strong>状态自检</strong>，您只需在 Cloudflare 后台完成一次绑定即可！
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-white">Cloudflare Pages 后台 1 分钟绑定教程：</div>
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs space-y-2 font-mono">
                  <div className="text-neutral-300">
                    1. 登录 Cloudflare Dashboard -&gt; <span className="text-orange-400">Workers 和 Pages</span> -&gt; 点击你的项目 <span className="text-orange-400">ohmygosh</span>
                  </div>
                  <div className="text-neutral-300">
                    2. 点击顶部导航栏的 <span className="text-orange-400">设置 (Settings)</span> -&gt; 点击左侧 <span className="text-orange-400">Functions</span>
                  </div>
                  <div className="text-neutral-300">
                    3. 滚动到 <span className="text-orange-400">D1 数据库绑定 (D1 database bindings)</span> 区域 -&gt; 点击 <span className="text-orange-400">添加绑定 (Add binding)</span>
                  </div>
                  <div className="text-neutral-300">
                    4. 变量名称 (Variable name) 输入：<span className="text-emerald-400 font-bold bg-neutral-900 px-1.5 py-0.5 rounded">DB</span> (区分大小写，务必填 DB)
                  </div>
                  <div className="text-neutral-300">
                    5. D1 数据库 (D1 database) 选择：你的数据库名称（如 <span className="text-orange-400">ohmygosh-db</span>）
                  </div>
                  <div className="text-neutral-300">
                    6. 点击保存，完成！
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-white">建表说明：</div>
                <p className="text-xs text-neutral-400">
                  我们在后端已内置了 <code className="text-orange-300 font-mono">CREATE TABLE IF NOT EXISTS snippets</code> 自动执行逻辑，因此在绑定好 <code className="text-orange-300 font-mono">DB</code> 后，<strong>首次存入时会自动建表并插入数据</strong>，不需要手动运行 SQL。
                </p>
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
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
