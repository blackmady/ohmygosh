import { FileItem } from '../types';

export interface SamplePreset {
  id: string;
  title: string;
  badge: string;
  description: string;
  files: FileItem[];
  activePath: string;
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'html-modern-app',
    title: 'HTML & CSS 实时交互卡片',
    badge: 'HTML / JS',
    description: '具有粒子物理效果、暗黑磨砂玻璃质感与实时交互的现代前端组件',
    activePath: 'index.html',
    files: [
      {
        id: 'sample_html_1',
        name: 'index.html',
        path: 'index.html',
        language: 'html',
        size: 2150,
        content: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cloudflare Edge Monitor</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: radial-gradient(circle at 50% 20%, #171b26 0%, #080a0f 100%);
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      overflow-x: hidden;
    }
    .card {
      background: rgba(23, 27, 38, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      backdrop-filter: blur(16px);
      box-shadow: 0 20px 40px rgba(0,0,0,0.45);
      width: 100%;
      max-width: 480px;
      padding: 28px;
      position: relative;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #f97316;
      font-weight: 600;
      letter-spacing: 0.05em;
    }
    .badge::before {
      content: '';
      width: 8px;
      height: 8px;
      background: #f97316;
      border-radius: 50%;
      box-shadow: 0 0 10px #f97316;
    }
    h2 { font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 6px; }
    p.sub { font-size: 13px; color: #94a3b8; margin-bottom: 24px; }
    .metrics {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 24px;
    }
    .metric-box {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      padding: 14px;
      border-radius: 10px;
    }
    .metric-box .label { font-size: 12px; color: #64748b; margin-bottom: 4px; }
    .metric-box .val { font-size: 22px; font-weight: 700; color: #f8fafc; font-variant-numeric: tabular-nums; }
    canvas {
      width: 100%;
      height: 90px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      margin-bottom: 20px;
      display: block;
    }
    .btn-group {
      display: flex;
      gap: 10px;
    }
    button {
      flex: 1;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }
    .btn-primary {
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: #fff;
    }
    .btn-primary:hover { opacity: 0.92; transform: translateY(-1px); }
    .btn-outline {
      background: transparent;
      color: #cbd5e1;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    .btn-outline:hover { background: rgba(255, 255, 255, 0.05); }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="badge">CLOUDFLARE EDGE ACTIVE</div>
      <span style="font-size: 12px; color: #64748b;">HKG / PoP-12</span>
    </div>
    <h2>实时边缘网络吞吐</h2>
    <p class="sub">测试高频数据流与 Canvas 帧渲染性能</p>

    <div class="metrics">
      <div class="metric-box">
        <div class="label">当前请求数 (Req/s)</div>
        <div class="val" id="rps">12,480</div>
      </div>
      <div class="metric-box">
        <div class="label">边缘响应延迟 (P99)</div>
        <div class="val" id="latency">8.4 ms</div>
      </div>
    </div>

    <canvas id="chart" width="420" height="90"></canvas>

    <div class="btn-group">
      <button class="btn-primary" onclick="simulateBurst()">触发突发流量测试</button>
      <button class="btn-outline" onclick="resetChart()">重置采样</button>
    </div>
  </div>

  <script>
    console.log("Cloudflare Edge Monitor Initialized!");
    const canvas = document.getElementById('chart');
    const ctx = canvas.getContext('2d');
    let points = Array.from({ length: 40 }, () => 30 + Math.random() * 20);

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      const step = canvas.width / (points.length - 1);
      
      points.forEach((val, i) => {
        const x = i * step;
        const y = canvas.height - (val / 100) * canvas.height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // gradient fill
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, 'rgba(249, 115, 22, 0.25)');
      grad.addColorStop(1, 'rgba(249, 115, 22, 0)');
      ctx.fillStyle = grad;
      ctx.fill();
    }

    let interval = setInterval(() => {
      points.shift();
      const last = points[points.length - 1];
      const next = Math.max(15, Math.min(85, last + (Math.random() - 0.5) * 16));
      points.push(next);
      draw();
      document.getElementById('rps').innerText = (12000 + Math.floor(next * 80)).toLocaleString();
      document.getElementById('latency').innerText = (6.2 + (next / 25)).toFixed(1) + ' ms';
    }, 150);

    function simulateBurst() {
      console.warn("Simulating burst traffic load test...");
      points = points.map(p => Math.min(95, p + 25 + Math.random() * 15));
      draw();
    }
    function resetChart() {
      console.info("Chart samples reset.");
      points = Array.from({ length: 40 }, () => 30);
      draw();
    }
    draw();
  </script>
</body>
</html>`,
      },
    ],
  },
  {
    id: 'svg-badge',
    title: 'SVG 动态矢量图与渐变勋章',
    badge: 'SVG',
    description: '支持缩放、网格透视、透明底色切换与直接导出 SVG/PNG',
    activePath: 'badge.svg',
    files: [
      {
        id: 'sample_svg_1',
        name: 'badge.svg',
        path: 'badge.svg',
        language: 'svg',
        size: 1540,
        content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  <defs>
    <!-- Background Gradient -->
    <radialGradient id="spaceGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="60%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </radialGradient>

    <!-- Edge Orange Gradient -->
    <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fb923c"/>
      <stop offset="50%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#c2410c"/>
    </linearGradient>

    <!-- Neon Cyan Glow -->
    <linearGradient id="cyanGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>

    <!-- Glow Filter -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Deep Background Circle -->
  <circle cx="300" cy="300" r="280" fill="url(#spaceGrad)" stroke="#334155" stroke-width="2"/>

  <!-- Rotating Coordinate Grid Rings -->
  <circle cx="300" cy="300" r="230" fill="none" stroke="#475569" stroke-width="1.5" stroke-dasharray="6 8" opacity="0.6"/>
  <circle cx="300" cy="300" r="180" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="14 12" opacity="0.4"/>
  <circle cx="300" cy="300" r="120" fill="none" stroke="#f97316" stroke-width="2" stroke-dasharray="4 6" opacity="0.8"/>

  <!-- Outer Hexagonal Tech Badge -->
  <polygon points="300,90 470,190 470,390 300,490 130,390 130,190" 
           fill="none" stroke="url(#cloudGrad)" stroke-width="5" filter="url(#glow)"/>

  <!-- Inner Cloudflare Symbol Graphic -->
  <g transform="translate(180, 210) scale(1.0)">
    <path d="M195 90 C195 62 172 40 145 40 C138 40 131 42 125 45 C116 25 96 10 72 10 C40 10 14 34 11 65 C4 70 0 78 0 88 C0 101 11 112 25 112 L195 112 Z" 
          fill="url(#cloudGrad)" />
    <!-- Secondary Flare -->
    <path d="M225 112 C236 112 245 103 245 92 C245 82 238 73 228 71 C224 55 210 44 193 44 C189 44 185 45 182 46 C180 43 178 39 174 36 L160 112 Z" 
          fill="url(#cyanGrad)" opacity="0.85" />
  </g>

  <!-- Typography Labels -->
  <text x="300" y="380" font-family="'JetBrains Mono', monospace" font-size="22" font-weight="700" fill="#f8fafc" text-anchor="middle" letter-spacing="4">
    CLOUDFLARE PAGES
  </text>
  <text x="300" y="415" font-family="sans-serif" font-size="13" font-weight="500" fill="#94a3b8" text-anchor="middle" letter-spacing="2">
    PERMANENT EDGE RUNTIME
  </text>
</svg>`,
      },
    ],
  },
  {
    id: 'markdown-doc',
    title: 'Markdown 产品设计规范与图表',
    badge: 'Markdown',
    description: '支持 GFM 表格、任务清单、高亮代码块、引用与大纲导航',
    activePath: 'README.md',
    files: [
      {
        id: 'sample_md_1',
        name: 'README.md',
        path: 'README.md',
        language: 'markdown',
        size: 1820,
        content: `# Cloudflare Pages 现代代码预览与永久分享系统

欢迎使用 **CloudPaste**！这是一个专为前端开发者、设计工程师和技术写作者打造的静态与边缘代码预览分享站。

> **核心设计理念**：无需任何后端服务器或传统数据库，完全依靠浏览器端压缩算法与 Cloudflare 全球边缘分发网络，实现零运维、零成本的永久链接分享。

---

## 核心功能矩阵

| 模块类别 | 支持格式 / 技术 | 预览能力 | 永久分享方式 |
| :--- | :--- | :--- | :--- |
| **前端交互** | HTML, CSS, JavaScript | 独立沙箱 iframe / 控制台捕获 | URL Hash 压缩（永久直达） |
| **矢量图像** | SVG, XML | 动态矢量画板 / 缩放 / 导出 PNG | 嵌入式 base64 或静态 Zip |
| **文档排版** | Markdown (GFM) | 标题大纲 / 任务列表 / 表格语法 | 纯前端即时渲染 |
| **结构化数据** | CSV, TSV, JSON | 交互表格 / 列排序 / 树状折叠 | 过滤检索与导出 CSV |

---

## 为什么比 VS Code 插件更适合日常分享？

- [x] **极低的使用门槛**：接收者无需安装 VS Code，手机、平板或任意浏览器点击即看。
- [x] **跨平台无依赖**：无需配置 Node.js、扩展插件或本地工作区环境。
- [x] **边缘永久托管**：一键部署到 Cloudflare Pages，享受全球 300+ 城市 Anycast CDN 加速。
- [ ] *进阶插件联动*：后续可补充轻量 VS Code 右键菜单，一键把选区直接发送到本 Web 页面。

---

## 快速代码片段示例

\`\`\`javascript
// 压缩并生成永久分享链接核心代码 (LZ-String)
import LZString from 'lz-string';

export function createPermanentUrl(snippetData) {
  const json = JSON.stringify(snippetData);
  const hash = LZString.compressToEncodedURIComponent(json);
  return \`\${window.location.origin}#data=\${hash}\`;
}
\`\`\`

## 部署到 Cloudflare Pages 说明

只需一条终端命令即可部署你的专属实例：

\`\`\`bash
# 1. 安装 Wrangler CLI
npm install -g wrangler

# 2. 部署到 Cloudflare Pages
npx wrangler pages deploy ./dist --project-name=cloudpaste
\`\`\`
`,
      },
    ],
  },
  {
    id: 'csv-analytics',
    title: 'CSV SaaS 运营数据表格',
    badge: 'CSV',
    description: '支持列排序、文本过滤、指标统计与表格/源码即刻切换',
    activePath: 'saas_metrics_2026.csv',
    files: [
      {
        id: 'sample_csv_1',
        name: 'saas_metrics_2026.csv',
        path: 'saas_metrics_2026.csv',
        language: 'csv',
        size: 980,
        content: `Month,Region,ActiveUsers,MRR_USD,NewSignups,ChurnRate,CAC_USD,LTV_USD
2026-01,North America,18420,92100,2450,1.8%,142,2840
2026-01,Asia Pacific,14200,63900,3120,2.1%,98,1850
2026-01,Europe,12100,58000,1890,1.9%,125,2300
2026-02,North America,19850,99250,2680,1.7%,138,2950
2026-02,Asia Pacific,16100,72450,3450,2.0%,94,1920
2026-02,Europe,13400,64320,2100,1.8%,120,2410
2026-03,North America,21900,109500,2950,1.6%,135,3100
2026-03,Asia Pacific,18400,82800,3800,1.9%,91,2010
2026-03,Europe,14900,71520,2340,1.7%,118,2520
2026-04,North America,24100,120500,3200,1.5%,130,3250
2026-04,Asia Pacific,20900,94050,4100,1.8%,88,2100
2026-04,Europe,16500,79200,2550,1.6%,115,2640`,
      },
    ],
  },
  {
    id: 'json-api',
    title: 'JSON REST API 响应结构体',
    badge: 'JSON',
    description: '支持层级折叠、格式化校验、语法高亮与键值搜索',
    activePath: 'response.json',
    files: [
      {
        id: 'sample_json_1',
        name: 'response.json',
        path: 'response.json',
        language: 'json',
        size: 1100,
        content: `{
  "status": "success",
  "code": 200,
  "timestamp": 1774435800000,
  "service": "cloudflare-edge-gateway",
  "data": {
    "organization": {
      "id": "org_992144",
      "name": "HyperScale Cloud Systems",
      "tier": "enterprise-plus",
      "edgeRegions": ["syd01", "hkg02", "nrt01", "fra01", "sfo03"]
    },
    "deployments": [
      {
        "id": "dep_8812a",
        "project": "cloudpaste-web",
        "branch": "main",
        "status": "active",
        "url": "https://cloudpaste.pages.dev",
        "buildTimeMs": 1420,
        "ssl": {
          "enabled": true,
          "issuer": "Cloudflare Edge Origin CA",
          "protocol": "TLS 1.3 / HTTP 3 (QUIC)"
        }
      }
    ],
    "quotas": {
      "bandwidthGb": 25000,
      "usedBandwidthGb": 3410.5,
      "requestsTotal": 4820194,
      "unlimitedPages": true
    }
  }
}`,
      },
    ],
  },
  {
    id: 'multi-file-web',
    title: '多文件项目：HTML + CSS + JS 组合',
    badge: '多文件工程',
    description: '演示上传文件夹后，多文件相对路径自动关联并于沙箱内协同渲染',
    activePath: 'index.html',
    files: [
      {
        id: 'multi_1',
        name: 'index.html',
        path: 'index.html',
        language: 'html',
        size: 780,
        content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Multi-File Component</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="wrapper">
    <div class="glow-orb"></div>
    <h1>多文件协同预览系统</h1>
    <p>当前页面引用了同一工程下的 <code>style.css</code> 与 <code>app.js</code>。</p>
    <div class="counter-box">
      <button id="minus-btn">-</button>
      <span id="counter">0</span>
      <button id="plus-btn">+</button>
    </div>
  </div>
  <script src="app.js"></script>
</body>
</html>`,
      },
      {
        id: 'multi_2',
        name: 'style.css',
        path: 'style.css',
        language: 'css',
        size: 650,
        content: `body {
  margin: 0;
  padding: 0;
  background: #090d16;
  color: #e2e8f0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}
.wrapper {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 14px;
  padding: 32px;
  text-align: center;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
}
h1 { font-size: 20px; color: #f97316; margin-bottom: 10px; }
p { font-size: 13px; color: #9ca3af; margin-bottom: 24px; line-height: 1.5; }
code { background: #1e293b; padding: 2px 6px; border-radius: 4px; color: #38bdf8; }
.counter-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
button {
  background: #f97316;
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
}
button:hover { opacity: 0.9; }
#counter {
  font-size: 28px;
  font-weight: 700;
  min-width: 50px;
  font-variant-numeric: tabular-nums;
}`,
      },
      {
        id: 'multi_3',
        name: 'app.js',
        path: 'app.js',
        language: 'javascript',
        size: 380,
        content: `let count = 0;
const counterEl = document.getElementById('counter');
document.getElementById('plus-btn').addEventListener('click', () => {
  count++;
  counterEl.textContent = count;
  console.log('Counter increased to:', count);
});
document.getElementById('minus-btn').addEventListener('click', () => {
  count--;
  counterEl.textContent = count;
  console.log('Counter decreased to:', count);
});
console.log('Multi-file scripts linked successfully!');`,
      },
    ],
  },
];
