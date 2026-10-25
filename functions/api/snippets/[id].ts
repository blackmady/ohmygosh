// Cloudflare Pages Function: /api/snippets/:id
// Fetches snippet by ID from Cloudflare D1 or KV

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

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { params, env } = context;
    const id = params.id as string;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Snippet ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Check Cloudflare D1 SQL Database
    if (env.DB) {
      const row = await env.DB.prepare(
        `SELECT id, title, files, active_path, total_files, size_bytes, created_at FROM snippets WHERE id = ?`
      ).bind(id).first();

      if (row) {
        return new Response(
          JSON.stringify({
            success: true,
            snippet: {
              id: row.id,
              title: row.title,
              files: typeof row.files === 'string' ? JSON.parse(row.files) : row.files,
              activePath: row.active_path,
              createdAt: row.created_at,
              storage: 'cloudflare-d1',
            },
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'public, max-age=3600',
            },
          }
        );
      }
    }

    // 2. Check Cloudflare KV fallback
    if (env.SNIPPETS_KV) {
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
          {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'public, max-age=3600',
            },
          }
        );
      }
    }

    return new Response(JSON.stringify({ error: 'Snippet not found', id }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
