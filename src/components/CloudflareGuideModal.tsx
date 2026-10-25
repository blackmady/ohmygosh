import React, { useState } from 'react';
import { X, Globe, Terminal, Copy, Check, ShieldCheck, Zap, GitBranch, Github } from 'lucide-react';

interface CloudflareGuideModalProps {
  onClose: () => void;
}

export const CloudflareGuideModal: React.FC<CloudflareGuideModalProps> = ({ onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copySnippet = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-neutral-100 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Github className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Cloudflare Pages 连接 GitHub 自动部署配置
              </h2>
              <p className="text-xs text-neutral-400">
                代码 push 到 GitHub 即刻自动触发全球 CDN 边缘编译与发布
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-neutral-300 leading-relaxed">
          {/* GitHub CI/CD Highlights */}
          <div className="p-4 bg-orange-950/20 border border-orange-800/40 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <GitBranch className="w-4 h-4 text-orange-400" />
              <span>标准推荐：GitHub 自动持续集成（免本地 Wrangler CLI）</span>
            </div>
            <p className="text-neutral-400 text-xs">
              在 Cloudflare Pages 控制台中关联你的 GitHub 仓库（如 <code className="text-orange-300 bg-neutral-900 px-1 py-0.5 rounded">ohmygosh</code>）后，每次 Git 提交都会在云端自动化安装依赖并编译，无需在本地安装 Wrangler。
            </p>
          </div>

          {/* Cloudflare Pages Dashboard Settings */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white">
              Cloudflare 控制台构建配置检查清单（Settings &gt; Builds & deployments）
            </h4>

            <div className="border border-neutral-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 font-semibold">
                  <tr>
                    <th className="py-2.5 px-4 w-1/3">配置项</th>
                    <th className="py-2.5 px-4 w-2/3">推荐填写值</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 font-mono text-[12px]">
                  <tr>
                    <td className="py-2.5 px-4 text-neutral-400 font-sans font-medium">Framework preset</td>
                    <td className="py-2.5 px-4 text-orange-400">Vite</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 text-neutral-400 font-sans font-medium">Build command</td>
                    <td className="py-2.5 px-4 text-emerald-400">npm run build</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 text-neutral-400 font-sans font-medium">Build output directory</td>
                    <td className="py-2.5 px-4 text-sky-400">dist</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 text-neutral-400 font-sans font-medium">Root directory</td>
                    <td className="py-2.5 px-4 text-neutral-300">/ （留空或根目录）</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Fix for Lockfile */}
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>为什么此前会报 bun.lock 错误？如何彻底解决：</span>
            </div>
            <p className="text-neutral-400 text-xs">
              Cloudflare Pages 检测到仓库中有 <code className="text-neutral-200 bg-neutral-900 px-1">bun.lock</code> 时，会自动调用 <code className="text-neutral-200 bg-neutral-900 px-1">bun install --frozen-lockfile</code>。如果改动了 package.json 但未同步提交更新后的 lockfile，就会报锁文件不一致。
            </p>
            <div className="text-neutral-300 text-xs pt-1 space-y-1">
              <div><strong>方案 A（最通用推荐）</strong>：在 GitHub 仓库中包含更新后的 <code className="text-orange-400 font-mono">package-lock.json</code>，且如果不用 Bun，可直接删掉 <code className="text-orange-400 font-mono">bun.lock</code>，让 Cloudflare 使用通用成熟的 npm 编译。</div>
              <div><strong>方案 B（继续用 Bun）</strong>：将本工作区已更新同步的最新 <code className="text-orange-400 font-mono">bun.lock</code> 一同 commit 推送到 GitHub 即可。</div>
            </div>
          </div>
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
