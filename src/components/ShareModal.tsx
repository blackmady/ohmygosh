import React, { useState, useMemo } from 'react';
import { FileItem, SharePayload } from '../types';
import { encodeSharePayload, generateQrSvg } from '../utils/compression';
import { exportFilesAsZip } from '../utils/zip';
import {
  X,
  Link,
  Copy,
  Check,
  QrCode,
  Download,
  Share2,
  Terminal,
  Code,
  Globe,
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
  const [copiedCli, setCopiedCli] = useState(false);
  const [title, setTitle] = useState(activeFile.name || 'CloudPaste Snippet');
  const [showQr, setShowQr] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'embed' | 'cloudflare'>('link');

  // Generate permanent URL
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

  const qrSvgUrl = useMemo(() => {
    return generateQrSvg(permanentUrl, 200);
  }, [permanentUrl]);

  const embedCode = `<iframe src="${permanentUrl}" width="100%" height="600" style="border: 1px solid #334155; border-radius: 12px; overflow: hidden;" allow="clipboard-write"></iframe>`;

  const wranglerCmd = `npx wrangler pages deploy ./dist --project-name=my-cloudpaste-app`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(permanentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const handleCopyCli = () => {
    navigator.clipboard.writeText(wranglerCmd);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const handleDownloadZip = () => {
    exportFilesAsZip(files, `${title.replace(/\s+/g, '-').toLowerCase()}.zip`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-neutral-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">永久分享链接</h2>
              <p className="text-xs text-neutral-400">
                纯客户端压缩编码 · 适配 Cloudflare Pages 静态边缘分发 · 零后端依赖
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
            onClick={() => setActiveTab('link')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'link'
                ? 'border-orange-500 text-orange-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            永久分享链接
          </button>
          <button
            onClick={() => setActiveTab('embed')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'embed'
                ? 'border-orange-500 text-orange-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            嵌入 Iframe
          </button>
          <button
            onClick={() => setActiveTab('cloudflare')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'cloudflare'
                ? 'border-orange-500 text-orange-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Cloudflare 部署指南
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs">
          {activeTab === 'link' && (
            <>
              <div>
                <label className="block text-neutral-300 font-medium mb-1.5">
                  代码片段 / 项目标题
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-orange-500 text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-neutral-300 font-medium">
                    永久链接 (内含 {files.length} 个文件数据)
                  </label>
                  <button
                    onClick={() => setShowQr(!showQr)}
                    className="flex items-center gap-1 text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{showQr ? '收起二维码' : '扫码在手机预览'}</span>
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
                    手机相机扫码即可在移动设备浏览器直接查看与运行代码
                  </p>
                </div>
              )}

              <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-lg text-neutral-400 leading-relaxed text-[11px]">
                <strong className="text-neutral-300">为什么是永久链接？</strong>
                <br />
                所有文件内容经高倍率 LZ-String 算法直接压入 URL Hash 中，链接接收者打开时由浏览器本地实时解压与渲染。无需依赖任何第三方云端数据库，数据永不过期，也绝不存在删库风险！
              </div>
            </>
          )}

          {activeTab === 'embed' && (
            <div className="space-y-3">
              <p className="text-neutral-400 leading-relaxed">
                将以下代码复制并嵌入到你的 Notion、个人博客、技术文档或产品展示页中：
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

          {activeTab === 'cloudflare' && (
            <div className="space-y-3 leading-relaxed">
              <div className="flex items-center gap-2 text-white font-medium">
                <Globe className="w-4 h-4 text-orange-400" />
                <span>部署到你自己的 Cloudflare Pages (免费 0 成本)</span>
              </div>
              <ol className="list-decimal pl-5 space-y-1.5 text-neutral-300 text-xs">
                <li>
                  执行打包生成静态目录：<code className="text-orange-400 bg-neutral-950 px-1 py-0.5 rounded">npm run build</code>
                </li>
                <li>
                  使用 Wrangler CLI 进行边缘推送：
                  <div className="mt-1 flex items-center gap-2">
                    <pre className="flex-1 p-2 bg-neutral-950 border border-neutral-800 rounded font-mono text-[11px] text-neutral-300">
                      {wranglerCmd}
                    </pre>
                    <button
                      onClick={handleCopyCli}
                      className="px-2.5 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300"
                    >
                      {copiedCli ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </li>
                <li>
                  Cloudflare 会为你分配一个免费的 <code className="text-sky-400 font-mono">*.pages.dev</code> 域名，并享有全站免费 SSL、DDoS 防护和全球 Anycast CDN 加速！
                </li>
              </ol>
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
