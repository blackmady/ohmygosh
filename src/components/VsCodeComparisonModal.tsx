import React from 'react';
import { X, CheckCircle2, AlertCircle, ArrowRight, HelpCircle, Layers, Sparkles } from 'lucide-react';

interface VsCodeComparisonModalProps {
  onClose: () => void;
}

export const VsCodeComparisonModal: React.FC<VsCodeComparisonModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-neutral-100 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                架构对比：Web 工具 (Cloudflare Pages) vs VS Code 插件
              </h2>
              <p className="text-xs text-neutral-400">
                以 VS Code 插件的形式存在会不会更合理更容易开发出来？深度评估分析
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs leading-relaxed text-neutral-300">
          {/* Executive Summary */}
          <div className="p-4 bg-orange-950/30 border border-orange-800/40 rounded-xl text-orange-200">
            <strong className="text-white text-sm block mb-1">
              核心结论：做成 Web 网站工具（配合 Cloudflare Pages）明显更合理、更容易开发！
            </strong>
            因为你的核心诉求是「<strong>支持生成永久分享链接，方便分享给更多人使用</strong>」。如果做成 VS Code 插件，接收者必须也安装 VS Code 客户端并在电脑端配置环境才能看，分享链路会严重断裂。
          </div>

          {/* Comparison Matrix */}
          <div className="border border-neutral-800 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-950/80 border-b border-neutral-800 text-[11px] font-semibold text-neutral-400 uppercase">
                  <th className="py-2.5 px-4 w-1/4">对比维度</th>
                  <th className="py-2.5 px-4 w-3/8 text-orange-400 bg-orange-950/10">
                    Web 工具 (Cloudflare Pages)
                  </th>
                  <th className="py-2.5 px-4 w-3/8 text-neutral-400">
                    VS Code 插件形式
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/70">
                <tr>
                  <td className="py-3 px-4 font-semibold text-neutral-200">
                    1. 目标受众与分享门槛
                  </td>
                  <td className="py-3 px-4 text-emerald-300 bg-orange-950/5">
                    <strong>零门槛</strong>。手机、iPad、Mac/Windows 任意浏览器点击链接直接秒开预览，产品经理、设计师、客户都能看。
                  </td>
                  <td className="py-3 px-4 text-neutral-400">
                    <strong>门槛极高</strong>。仅限安装了 VS Code 且同为程序员的用户，手机平板完全无法使用。
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-neutral-200">
                    2. 开发与调试难度
                  </td>
                  <td className="py-3 px-4 text-emerald-300 bg-orange-950/5">
                    <strong>更容易</strong>。标准 React/Vite 技术栈，浏览器 DevTools 直接热重载调试，无需处理 VS Code 复杂通信机制。
                  </td>
                  <td className="py-3 px-4 text-neutral-400">
                    <strong>限制繁多</strong>。VS Code Webview 存在严苛的 CSP 沙箱、复杂的扩展与 Webview postMessage 异步通信与生命周期。
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-neutral-200">
                    3. 永久分享链接实现
                  </td>
                  <td className="py-3 px-4 text-emerald-300 bg-orange-950/5">
                    <strong>完美原生支持</strong>。利用 URL Hash 压缩（LZ-String），100% 静态免数据库，全网任意平台即粘即用。
                  </td>
                  <td className="py-3 px-4 text-neutral-400">
                    <strong>需额外搭建 Web 服务</strong>。插件生成的链接若要在浏览器打开，本身依然需要编写并部署一套配套 Web 前端。
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-neutral-200">
                    4. 托管成本与部署
                  </td>
                  <td className="py-3 px-4 text-emerald-300 bg-orange-950/5">
                    <strong>Cloudflare Pages 终身免费</strong>。全球 300+ 城市 Anycast CDN 加速，DDoS 防护，无需租用云服务器。
                  </td>
                  <td className="py-3 px-4 text-neutral-400">
                    需申请微软开发者账号、打包 VSIX、提交 VS Code Marketplace 审核或私下分发安装包。
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Optimal Recommendation */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-neutral-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span>业界最佳落地实践路线</span>
            </h4>
            <p className="text-neutral-400">
              最明智的做法是<strong>以 Web 网站为核心枢纽</strong>（正如当前构建的 CloudPaste 系统）：
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                <span className="font-semibold text-white block mb-1">阶段一（当前）：Web 核心工具</span>
                <span className="text-neutral-400">
                  支持网页直接粘贴、拖入文件夹/ZIP、实时沙箱运行、永久 URL 与二维码，随时随地在任何设备分享。
                </span>
              </div>
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                <span className="font-semibold text-white block mb-1">阶段二（可选）：极简 VS Code 联动插件</span>
                <span className="text-neutral-400">
                  仅需不到 50 行代码的 VS Code 小插件：在编辑器中右键选区「一键上传到 CloudPaste」，直接生成分享链接，两者无缝互补！
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-neutral-800 bg-neutral-900/60">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors"
          >
            了解并返回工具
          </button>
        </div>
      </div>
    </div>
  );
};
