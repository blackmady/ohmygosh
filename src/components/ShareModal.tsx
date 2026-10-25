import React, { useState, useMemo, useEffect } from 'react';
import { FileItem } from '../types';
import { generateQrSvg } from '../utils/compression';
import { exportFilesAsZip } from '../utils/zip';
import { saveSnippetToCloud, CloudSaveResult } from '../utils/cloudApi';
import {
  X,
  Link,
  Copy,
  Check,
  QrCode,
  Download,
  Share2,
  Database,
  Cloud,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Code2,
} from 'lucide-react';

interface ShareModalProps {
  files: FileItem[];
  activeFile: FileItem;
  onClose: () => void;
  onOpenDeployGuide?: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  files,
  activeFile,
  onClose,
  onOpenDeployGuide,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [title, setTitle] = useState(activeFile.name || 'CloudPaste Project');
  const [showQr, setShowQr] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cloudResult, setCloudResult] = useState<CloudSaveResult | null>(null);

  const totalSize = useMemo(() => {
    return files.reduce((acc, f) => acc + (f.size || f.content?.length || 0), 0);
  }, [files]);

  const formattedSize = useMemo(() => {
    if (totalSize < 1024) return `${totalSize} B`;
    if (totalSize < 1024 * 1024) return `${(totalSize / 1024).toFixed(1)} KB`;
    return `${(totalSize / (1024 * 1024)).toFixed(2)} MB`;
  }, [totalSize]);

  // Execute database save
  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    try {
      const res = await saveSnippetToCloud(title, files, activeFile);
      setCloudResult(res);
    } catch (err: any) {
      setCloudResult({
        success: false,
        id: '',
        shortUrl: '',
        storageType: 'none',
        createdAt: Date.now(),
        error: err.message || '网络或接口异常',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Automatically save on first render
  useEffect(() => {
    handleSaveToDatabase();
  }, []);

  const shortUrl = cloudResult?.shortUrl || '';
  const snippetId = cloudResult?.id || '';
  const isSuccess = cloudResult?.success && !!snippetId;

  const qrSvgUrl = useMemo(() => {
    if (!shortUrl) return '';
    return generateQrSvg(shortUrl, 200);
  }, [shortUrl]);

  const embedCode = useMemo(() => {
    if (!shortUrl) return '';
    return `<iframe src="${shortUrl}" width="100%" height="600" style="border: 1px solid #334155; border-radius: 12px; overflow: hidden;" allow="clipboard-write"></iframe>`;
  }, [shortUrl]);

  const handleCopyLink = () => {
    if (!shortUrl) return;
    navigator.clipboard.writeText(shortUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyId = () => {
    if (!snippetId) return;
    navigator.clipboard.writeText(snippetId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyEmbed = () => {
    if (!embedCode) return;
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const handleDownloadZip = () => {
    exportFilesAsZip(files, `${title.replace(/\s+/g, '-').toLowerCase()}.zip`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-neutral-100 max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">存入数据库并生成永久短链</h2>
              <p className="text-xs text-neutral-400">
                基于专属短 ID 检索，原生支持多文件工程及大项目
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

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs overflow-y-auto">
          {/* Project Title & Stats */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-neutral-300 font-medium">工程标题</label>
              <div className="text-[11px] text-neutral-500 font-mono">
                {files.length} 个文件 · 总容量 {formattedSize}
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-orange-500 text-xs"
              />
              <button
                onClick={handleSaveToDatabase}
                disabled={isSaving}
                className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 rounded-lg font-medium flex items-center gap-1.5 shrink-0 transition-colors"
                title="重新保存并更新短链"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin text-orange-400' : ''}`} />
                <span>{isSaving ? '正在保存...' : '重新存入'}</span>
              </button>
            </div>
          </div>

          {/* Saving Status Loader */}
          {isSaving && (
            <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-xl flex flex-col items-center justify-center gap-2 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              <div className="text-sm font-medium text-white">正在写入 Cloudflare D1 边缘数据库...</div>
              <p className="text-[11px] text-neutral-500">
                正在执行 SQL 插入并建立多文件元数据索引
              </p>
            </div>
          )}

          {/* Success State: Show Short Link & ID */}
          {!isSaving && isSuccess && (
            <div className="space-y-3">
              {/* Status Header Badge */}
              <div className="flex items-center justify-between p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-emerald-300 text-xs block">
                      ✓ 已成功存入 Cloudflare 数据库表 (snippets)
                    </span>
                    <span className="text-[11px] text-emerald-400/80 font-mono">
                      存储引擎: {cloudResult.storageType === 'cloudflare-d1' ? 'Cloudflare D1 (SQLite)' : 'Cloudflare KV'}
                    </span>
                  </div>
                </div>

                {snippetId && (
                  <button
                    onClick={handleCopyId}
                    className="px-2 py-1 bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-200 rounded text-[11px] font-mono flex items-center gap-1 border border-emerald-700/60 transition-colors"
                  >
                    <span>ID: {snippetId}</span>
                    {copiedId ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                  </button>
                )}
              </div>

              {/* Share Short URL Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-neutral-300 font-medium">永久分享短链 (基于专属 ID)</span>
                  <button
                    onClick={() => setShowQr(!showQr)}
                    className="flex items-center gap-1 text-orange-400 hover:text-orange-300 transition-colors text-[11px]"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{showQr ? '收起二维码' : '扫码手机预览'}</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 font-mono text-[11px] text-neutral-200 truncate select-all flex items-center">
                    {shortUrl}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-medium flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? '已复制！' : '复制短链'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1.5 text-[11px]">
                  <a
                    href={shortUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-orange-400 hover:text-orange-300 flex items-center gap-1 underline"
                  >
                    <span>在新标签页打开测试 ↗</span>
                  </a>
                  <button
                    onClick={() => setShowEmbed(!showEmbed)}
                    className="text-neutral-400 hover:text-neutral-200 flex items-center gap-1"
                  >
                    <Code2 className="w-3 h-3" />
                    <span>{showEmbed ? '收起嵌入代码' : '嵌入网页代码'}</span>
                  </button>
                </div>
              </div>

              {/* QR Code view */}
              {showQr && (
                <div className="flex flex-col items-center justify-center p-4 bg-neutral-950 rounded-xl border border-neutral-800 text-center animate-fade-in">
                  <img
                    src={qrSvgUrl}
                    alt="CloudPaste QR Code"
                    className="w-40 h-40 rounded-lg p-2 bg-white"
                  />
                  <p className="mt-2 text-[11px] text-neutral-400">
                    手机扫码可直接在移动端浏览器访问并运行
                  </p>
                </div>
              )}

              {/* Embed code textarea */}
              {showEmbed && (
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-neutral-400">嵌入 Iframe 代码：</span>
                    <button
                      onClick={handleCopyEmbed}
                      className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px] flex items-center gap-1"
                    >
                      {copiedEmbed ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedEmbed ? '已复制' : '复制代码'}</span>
                    </button>
                  </div>
                  <pre className="p-2 bg-neutral-900 border border-neutral-800 rounded font-mono text-[10px] text-neutral-300 overflow-x-auto whitespace-pre-wrap select-all">
                    {embedCode}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Error State: D1 not bound or query failed */}
          {!isSaving && !isSuccess && (
            <div className="space-y-3">
              <div className="p-4 bg-red-950/30 border border-red-800/60 rounded-xl space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-semibold text-red-200">
                      未能存入 Cloudflare D1 数据库
                    </h3>
                    <p className="text-[11px] text-red-300/80 mt-1 leading-relaxed">
                      {cloudResult?.error || '接口未响应或尚未配置 D1 绑定'}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-red-900/40 text-[11px] text-neutral-300 space-y-2">
                  <div className="font-semibold text-white">为什么数据库中的表是空的？</div>
                  <p className="text-neutral-400 leading-relaxed">
                    Cloudflare Pages 通过 GitHub 部署时，不会自动推断你的 D1 实例。您需要在 Cloudflare 后台手动为 Pages 项目绑定变量名为 <code className="text-orange-300 font-bold bg-neutral-900 px-1 py-0.5 rounded">DB</code> 的 D1 数据库：
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-neutral-300 pl-1 font-mono text-[10px]">
                    <li>打开 Cloudflare 控制台 -&gt; Workers 和 Pages -&gt; 点击 <strong>ohmygosh</strong></li>
                    <li>点击顶部 <strong>设置 (Settings)</strong> -&gt; 左侧 <strong>Functions</strong></li>
                    <li>找到 <strong>D1 数据库绑定 (D1 database bindings)</strong> -&gt; 点击「添加绑定」</li>
                    <li>变量名称 (Variable name) 填入：<strong className="text-orange-400">DB</strong></li>
                    <li>D1 数据库选择你的实例（例如：<strong className="text-orange-400">ohmygosh-db</strong>）并保存</li>
                  </ol>
                  <p className="text-neutral-400">
                    绑定完成后，后台会自动执行创建表结构（无需手动执行 SQL），点击下方「重试存入」即可成功入库！
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleSaveToDatabase}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>重试存入数据库</span>
                  </button>

                  {onOpenDeployGuide && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenDeployGuide();
                      }}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs transition-colors flex items-center gap-1"
                    >
                      <span>查看完整 Cloudflare 配置指引</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800 bg-neutral-900/60">
          <button
            onClick={handleDownloadZip}
            className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            <span>打包下载工程文件 (.ZIP)</span>
          </button>

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
