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
  const [activeTab, setActiveTab] = useState<'permanent' | 'cloud-d1' | 'embed'>('permanent');
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [cloudResult, setCloudResult] = useState<CloudSaveResult | null>(null);

  // Generate client-side permanent URL (100% guaranteed zero server dependency)
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

  // Automatically save to cloud when cloud-d1 tab is opened
  useEffect(() => {
    if (activeTab === 'cloud-d1' && !cloudResult && !isSavingCloud) {
      handleSaveToCloudflare();
    }
  }, [activeTab]);

  const isCloudBound = cloudResult?.storageType === 'cloudflare-d1' || cloudResult?.storageType === 'cloudflare-kv';
  const activeDisplayUrl = activeTab === 'cloud-d1' && isCloudBound ? cloudResult.shortUrl : permanentUrl;

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
              <h2 className="text-base font-semibold text-white">分享与生成永久链接</h2>
              <p className="text-xs text-neutral-400">
                100% 永久有效，全设备即时打开，无需后端或服务器也能秒开
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
            onClick={() => setActiveTab('permanent')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'permanent'
                ? 'border-orange-500 text-orange-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            <span>免库永久链接（首选推荐）</span>
          </button>
          <button
            onClick={() => setActiveTab('cloud-d1')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'cloud-d1'
                ? 'border-orange-500 text-orange-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Cloudflare D1 数据库短链</span>
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

          {activeTab === 'permanent' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-neutral-300 font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  <span>纯前端自包含永久链接 (100% 永久有效，全设备秒开)</span>
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
                <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 font-mono text-[11px] text-neutral-300 truncate select-all">
                  {permanentUrl}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-medium flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? '已复制！' : '复制永久链接'}</span>
                </button>
              </div>

              {/* Test link and explanation */}
              <div className="flex items-center justify-between pt-1 text-[11px]">
                <a
                  href={permanentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-orange-400 hover:text-orange-300 flex items-center gap-1 underline"
                >
                  <span>在新标签页测试打开此链接 ↗</span>
                </a>
                <span className="text-neutral-500">已自动同步本地快照</span>
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

              <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-lg text-neutral-400 leading-relaxed text-[11px]">
                💡 <strong>为什么推荐此链接？</strong>基于 LZ-String 算法将所有文件和目录压缩在 URL 中，即使没有配置数据库或服务器，他人打开也能 100% 完整复原代码工程，杜绝 404 或白屏问题。
              </div>
            </div>
          )}

          {activeTab === 'cloud-d1' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-300 font-medium">Cloudflare 数据库短链</span>
                  {cloudResult && (
                    <span
                      className={`px-1.5 py-0.2 border rounded text-[10px] font-mono ${
                        isCloudBound
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800/80'
                          : 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                      }`}
                    >
                      {isCloudBound ? '✓ 已存入 Cloudflare D1 边缘数据库' : '未绑定 D1 数据库（已降级为免库链接）'}
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
                      <span>正在请求 Cloudflare 边缘接口...</span>
                    </span>
                  ) : (
                    <span>{activeDisplayUrl}</span>
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

              <div className="flex items-center justify-between pt-1 text-[11px]">
                <a
                  href={activeDisplayUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-orange-400 hover:text-orange-300 flex items-center gap-1 underline"
                >
                  <span>在新标签页测试打开此链接 ↗</span>
                </a>
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
                  {isCloudBound ? (
                    <span>已持久化存入 Cloudflare 边缘数据库，他人访问短链将由全球 300+ 边缘节点极速响应。</span>
                  ) : (
                    <span>
                      提示：如果您尚未在 Cloudflare 控制台绑定 D1 数据库（变量名 <code className="text-orange-300 font-bold">DB</code>），系统已自动回退生成免库永久链接，保证代码绝对不会丢失或 404！
                    </span>
                  )}
                </div>
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
