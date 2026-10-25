import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function devSnippetApiPlugin(): Plugin {
  const devSnippets = new Map<string, any>();

  return {
    name: 'dev-snippet-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/snippets')) {
          return next();
        }

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        const url = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);

        // Status endpoint: /api/snippets?action=status
        if (req.method === 'GET' && url.searchParams.get('action') === 'status') {
          res.statusCode = 200;
          res.end(
            JSON.stringify({
              success: true,
              d1Bound: true,
              tableReady: true,
              count: devSnippets.size,
              isLocalDev: true,
              message: '本地开发仿真数据库就绪（部署到 Cloudflare Pages 后将直连 Cloudflare D1）',
            })
          );
          return;
        }

        // POST /api/snippets
        if (req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (chunk) => {
            bodyStr += chunk;
          });
          req.on('end', () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              const files = body.files || [];
              const title = (body.title || 'Untitled Snippet').trim().slice(0, 100);
              const activePath = body.activePath || files[0]?.path || 'index.html';
              const totalSize = files.reduce((acc: number, f: any) => acc + (f.content?.length || 0), 0);
              const now = Date.now();
              const rawId = typeof body.id === 'string' ? body.id.trim() : '';
              const id = rawId.length > 0
                ? rawId.replace(/^[#?]/, '').split('&')[0]
                : `cp_${now.toString(36).slice(-5)}_${Math.random().toString(36).substring(2, 6)}`;

              const snippetData = {
                id,
                title,
                files,
                activePath,
                totalFiles: files.length,
                sizeBytes: totalSize,
                createdAt: devSnippets.get(id)?.createdAt || now,
                updatedAt: now,
                storageType: 'cloudflare-d1',
              };

              devSnippets.set(id, snippetData);

              res.statusCode = 200;
              res.end(
                JSON.stringify({
                  success: true,
                  id,
                  title,
                  shortUrl: `${url.origin}/#id=${id}`,
                  storageType: 'cloudflare-d1',
                  totalFiles: files.length,
                  sizeBytes: totalSize,
                  createdAt: now,
                  message: '已存入数据库表 snippets',
                })
              );
            } catch (err: any) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        // GET /api/snippets/:id
        const pathParts = url.pathname.split('/').filter(Boolean);
        if (req.method === 'GET' && pathParts.length >= 3 && pathParts[1] === 'snippets') {
          const id = pathParts[2].replace(/^[#?]/, '').split('&')[0];
          const snippet = devSnippets.get(id);
          if (snippet) {
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, snippet }));
            return;
          } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ success: false, error: `未找到 ID 为 ${id} 的工程`, id }));
            return;
          }
        }

        // GET /api/snippets (list)
        if (req.method === 'GET') {
          const list = Array.from(devSnippets.values()).map((s) => ({
            id: s.id,
            title: s.title,
            active_path: s.activePath,
            total_files: s.totalFiles,
            size_bytes: s.sizeBytes,
            created_at: s.createdAt,
          }));
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, d1Bound: true, snippets: list }));
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), devSnippetApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
