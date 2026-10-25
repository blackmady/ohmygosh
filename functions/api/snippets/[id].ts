// Cloudflare Pages Function: /api/snippets/:id
// Fetches snippet by short ID from Cloudflare D1 SQL database or KV

export interface Env {
  DB?: any;
  SNIPPETS_KV?: any;
}

export type PagesFunction<T = any> = (context: {
  request: Request;
  env: T;
  params: Record<string, string>;
  waitUntil: (promise: Promise<any>) => void;
  next: () => Promise<Response>;
  data: Record<string, unknown>;
}) => Response | Promise<Response>;

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { params, env } = context;
    const rawId = (params.id as string || '').trim();

    if (!rawId) {
      return new Response(JSON.stringify({ success: false, error: 'Snippet ID is required' }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    // Clean up ID in case URL contained # or parameters
    const id = rawId.replace(/^[#?]/, '').split('&')[0];

    // 1. Check Cloudflare D1 SQL Database
    if (env.DB) {
      try {
        const row = await env.DB.prepare(
          `SELECT id, title, files, active_path, total_files, size_bytes, created_at FROM snippets WHERE id = ?`
        ).bind(id).first();

        if (row) {
          let parsedFiles = row.files;
          if (typeof parsedFiles === 'string') {
            try {
              parsedFiles = JSON.parse(parsedFiles);
            } catch (pErr) {
              console.error('Failed to parse files JSON from D1:', pErr);
            }
          }

          return new Response(
            JSON.stringify({
              success: true,
              snippet: {
                id: row.id,
                title: row.title,
                files: parsedFiles,
                activePath: row.active_path,
                totalFiles: row.total_files,
                sizeBytes: row.size_bytes,
                createdAt: row.created_at,
                storage: 'cloudflare-d1',
              },
            }),
            { headers: CORS_HEADERS }
          );
        }
      } catch (d1Err) {
        console.warn('D1 query failed for id:', id, d1Err);
      }
    }

    // 2. Check Cloudflare KV fallback
    if (env.SNIPPETS_KV) {
      try {
        const kvValue = await env.SNIPPETS_KV.get(id);
        if (kvValue) {
          const parsed = JSON.parse(kvValue);
          return new Response(
            JSON.stringify({
              success: true,
              snippet: {
                ...parsed,
                storage: 'cloudflare-kv',
              },
            }),
            { headers: CORS_HEADERS }
          );
        }
      } catch (kvErr) {
        console.warn('KV get failed for id:', id, kvErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: `云端数据库中未找到 ID 为 ${id} 的代码项目`,
        id,
        d1Bound: !!env.DB,
      }),
      {
        status: 404,
        headers: CORS_HEADERS,
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || 'Server error',
      }),
      {
        status: 500,
        headers: CORS_HEADERS,
      }
    );
  }
};
