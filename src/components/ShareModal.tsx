import React, { useState, useMemo, useEffect } from 'react';
import { FileItem, SharePayload } from '../types';
import { encodeSharePayload, generateQrSvg } from '../utils/compression';
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
  Sparkles,
} from 'lucide-react';

interface ShareModalProps {
  files: FileItem[];
  activeFile: FileItem;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ files, activeFile, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [title, setTitle] = useState(activeFile.name || 'CloudPaste Snippet');
  const [showQr, setShowQr] = useState(false);
  const [activeTab, setActiveTab] = useState<'cloud-d1' | 'permanent' | 'embed'>('cloud-d1');
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [cloudResult, setCloudResult] = useState<CloudSaveResult | null>(null);

  // Generate client-side permanent URL
  const permanentUrl = useMemo(() => {
    try {
      const payload: SharePayload = {
        v: 1,
        title,
        files: files.map((f) => ({
          name: f.name,
          path: f.path || f.name,
          content: f.content,
          language: f.language,
        })),
        activePath: activeFile.path || activeFile.name,
        createdAt: Date.now(),
      };
      return encodeSharePayload(payload);
    } catch (err) {
      console.error('Encoding error:', err);
      return window.location.href;
    }
  }, [files, activeFile, title]);

  // Handle saving to Cloudflare D1/KV database
  const handleSaveToCloudflare = async () => {
    setIsSavingCloud(true);
    try {
      const res = await saveSnippetToCloud(title, files, activeFile);
      setCloudResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingCloud(false);
    }
  };

  // Automatically save to cloud on modal open if on cloud-d1 tab
  useEffect(() => {
    if (activeTab === 'cloud-d1' && !cloudResult && !isSavingCloud) {
      handleSaveToCloudflare();
    }
  }, [activeTab]);

  const activeDisplayUrl = cloudResult?.shortUrl || permanentUrl;

  const qrSvgUrl = useMemo(() => {
    return generateQrSvg(activeDisplayUrl, 200);
  }, [activeDisplayUrl]);

  const embedCode = `<iframe src="${activeDisplayUrl}" width="100%" height="600" style="border: 1px solid #334155; border-radius: 12px; overflow: hidden;" allow="clipboard-write"></iframe>`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(activeDisplayUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const handleDownloadZip = () => {
    exportFilesAsZip(files, `${title.replace(/\s+/g, '-').toLowerCase()}.zip`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-neutral-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">保存与分享链接</h2>
              <p className="text-xs text-neutral-400">
                支持 Cloudflare D1 边缘数据库存储与全网永久短链
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
            onClick={() => setActiveTab('cloud-d1')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'cloud-d1'
                ? 'border-orange-500 text-orange-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Cloudflare 数据库短链</span>
          </button>
          <button
            onClick={() => setActiveTab('permanent')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'permanent'
                ? 'border-orange-500 text-orange-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            <span>纯前端免库永久链接</span>
          </button>
          <button
            onClick={() => setActiveTab('embed')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'embed'
                ? 'border-orange-500 text-orange-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>嵌入 Iframe</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Snippet Title */}
          <div>
            <label className="block text-neutral-300 font-medium mb-1.5">
              代码工程 / 片段标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-orange-500 text-xs"
            />
          </div>

          {activeTab === 'cloud-d1' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-300 font-medium">数据库短链</span>
                  {cloudResult && (
                    <span className="px-1.5 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-800/80 rounded text-[10px] font-mono">
                      {cloudResult.storageType === 'cloudflare-d1'
                        ? '已存入 D1 数据库'
                        : cloudResult.storageType === 'cloudflare-kv'
                        ? '已存入 KV 数据库'
                        : '已生成短链备份'}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setShowQr(!showQr)}
                  className="flex items-center gap-1 text-orange-400 hover:text-orange-300 transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{showQr ? '收起二维码' : '扫码手机预览'}</span>
                </button>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 font-mono text-[11px] text-neutral-300 truncate select-all flex items-center">
                  {isSavingCloud ? (
                    <span className="flex items-center gap-1.5 text-neutral-500">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" />
                      <span>正在保存至 Cloudflare 数据库...</span>
                    </span>
                  ) : (
                    <span>{cloudResult?.shortUrl || permanentUrl}</span>
                  )}
                </div>
                <button
                  onClick={handleCopyLink}
                  disabled={isSavingCloud}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white rounded-lg font-medium flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? '已复制！' : '复制短链'}</span>
                </button>
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

              <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-lg text-neutral-400 leading-relaxed text-[11px] flex items-start gap-2">
                <Cloud className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  数据已通过 <code className="text-neutral-200">/api/snippets</code> 保存至 Cloudflare 数据库，同时在你的浏览器中建立了本地持久化缓存。他人通过短链访问时，Cloudflare 边缘节点将以极速返回内容。
                </div>
              </div>
            </div>
          )}

          {activeTab === 'permanent' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-neutral-300 font-medium">
                  纯客户端压缩链接 (无需任何数据库即可永久生效)
                </span>
                <button
                  onClick={() => setShowQr(!showQr)}
                  className="flex items-center gap-1 text-orange-400 hover:text-orange-300 transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{showQr ? '收起二维码' : '扫码手机预览'}</span>
                </button>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 font-mono text-[11px] text-neutral-400 truncate select-all">
                  {permanentUrl}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-medium flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? '已复制！' : '复制链接'}</span>
                </button>
              </div>

              <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-lg text-neutral-400 leading-relaxed text-[11px]">
                基于高倍率 LZ-String 算法将所有文件压缩于 URL 中，任何即使没有配置数据库的静态站点亦可实现 100% 永久有效且免服务器。
              </div>
            </div>
          )}

          {activeTab === 'embed' && (
            <div className="space-y-3">
              <p className="text-neutral-400 leading-relaxed">
                将以下代码嵌入到 Notion、博客或技术文档中：
              </p>
              <div className="relative">
                <textarea
                  readOnly
                  rows={4}
                  value={embedCode}
                  className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-[11px] text-neutral-300 outline-none resize-none"
                />
                <button
                  onClick={handleCopyEmbed}
                  className="absolute right-2 top-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs flex items-center gap-1"
                >
                  {copiedEmbed ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEmbed ? '已复制' : '复制嵌入代码'}</span>
                </button>
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
            <span>打包下载所有文件 (.ZIP)</span>
          </button>

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
