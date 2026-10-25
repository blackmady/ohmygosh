import React, { useState } from 'react';
import { X, Globe, Terminal, Copy, Check, ShieldCheck, Zap, Cloud } from 'lucide-react';

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
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Cloudflare Pages 运行与部署指南
              </h2>
              <p className="text-xs text-neutral-400">
                全球 300+ 城市边缘节点 · 0 成本永久托管 · 自动化 Git 持续部署
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
          {/* Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
              <Zap className="w-4 h-4 text-orange-400 mb-1.5" />
              <div className="font-semibold text-white mb-0.5">全球 Anycast 加速</div>
              <p className="text-[11px] text-neutral-400">代码片段与应用经边缘缓存直接极速直达访问者，延迟低于 20ms。</p>
            </div>
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1.5" />
              <div className="font-semibold text-white mb-0.5">永久免运维 0 费用</div>
              <p className="text-[11px] text-neutral-400">基于纯前端压缩与静态托管，不消耗任何数据库读写配额，永不欠费。</p>
            </div>
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
              <Globe className="w-4 h-4 text-sky-400 mb-1.5" />
              <div className="font-semibold text-white mb-0.5">自定义域名 + 免费 SSL</div>
              <p className="text-[11px] text-neutral-400">自动获得 *.pages.dev 二级域名，亦可随时绑定你自己的独立域名。</p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <span>部署步骤（两种方式均可）</span>
            </h4>

            {/* Method A: CLI */}
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
              <div className="font-semibold text-neutral-200">方式一：使用 Wrangler 终端一行命令部署</div>
              <p className="text-neutral-400">
                本地构建完成后，直接使用 Cloudflare 官方 CLI 工具推送：
              </p>
              <div className="relative">
                <pre className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg font-mono text-[11px] text-orange-300 overflow-x-auto">
{`npm run build
npx wrangler pages deploy ./dist --project-name=cloudpaste`}
                </pre>
                <button
                  onClick={() => copySnippet(`npm run build\nnpx wrangler pages deploy ./dist --project-name=cloudpaste`, 1)}
                  className="absolute right-2 top-2 p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded"
                >
                  {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Method B: GitHub Git Integration */}
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
              <div className="font-semibold text-neutral-200">方式二：通过 GitHub 仓库自动持续集成</div>
              <ol className="list-decimal pl-5 space-y-1 text-neutral-400">
                <li>将代码推送到你的 GitHub 仓库。</li>
                <li>登录 <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer" className="text-orange-400 underline">Cloudflare 控制台</a>，进入 <strong>Workers & Pages</strong>。</li>
                <li>点击 <strong>Create application</strong> &gt; <strong>Pages</strong> &gt; <strong>Connect to Git</strong>。</li>
                <li>选择 Framework preset 为 <strong>Vite</strong>，Build command 填入 <code className="text-neutral-200 bg-neutral-900 px-1">npm run build</code>，Output directory 填入 <code className="text-neutral-200 bg-neutral-900 px-1">dist</code>。</li>
                <li>点击 <strong>Save and Deploy</strong>，数十秒内全球上线！</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-neutral-800 bg-neutral-900/60">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors"
          >
            关闭指南
          </button>
        </div>
      </div>
    </div>
  );
};
