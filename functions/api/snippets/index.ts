// Cloudflare Pages Function: /api/snippets
// Handles saving snippets to Cloudflare D1 (SQL) or Cloudflare KV

export interface Env {
  DB?: any; // Cloudflare D1 Database binding
  SNIPPETS_KV?: any; // Cloudflare KV binding
}

export type PagesFunction<T = any> = (context: {
  request: Request;
  env: T;
  params: Record<string, string>;
  waitUntil: (promise: Promise<any>) => void;
  next: () => Promise<Response>;
  data: Record<string, unknown>;
}) => Response | Promise<Response>;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const body = await request.json() as any;

    if (!body || !Array.isArray(body.files) || body.files.length === 0) {
      return new Response(JSON.stringify({ error: 'Files array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const title = (body.title || 'Untitled Snippet').trim().slice(0, 100);
    const files = body.files;
    const activePath = body.activePath || files[0]?.path || files[0]?.name || 'index.html';
    const totalSize = files.reduce((acc: number, f: any) => acc + (f.content?.length || 0), 0);
    const now = Date.now();

    // Generate unique short ID: e.g. cp_k9b4_2a
    const id = `cp_${now.toString(36).slice(-4)}_${Math.random().toString(36).substring(2, 6)}`;
    let storageType = 'client-fallback';

    // 1. Try Cloudflare D1 SQL Database
    if (env.DB) {
      try {
        await env.DB.prepare(
          `INSERT INTO snippets (id, title, files, active_path, total_files, size_bytes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
          .bind(id, title, JSON.stringify(files), activePath, files.length, totalSize, now, now)
          .run();
        storageType = 'cloudflare-d1';
      } catch (d1Err) {
        console.warn('D1 insert failed, trying KV fallback:', d1Err);
      }
    }

    // 2. Try Cloudflare KV fallback
    if (storageType === 'client-fallback' && env.SNIPPETS_KV) {
      try {
        await env.SNIPPETS_KV.put(
          id,
          JSON.stringify({ id, title, files, activePath, totalSize, created_at: now }),
          { metadata: { title, created_at: now, total_files: files.length } }
        );
        storageType = 'cloudflare-kv';
      } catch (kvErr) {
        console.warn('KV put failed:', kvErr);
      }
    }

    const isDatabaseBound = storageType === 'cloudflare-d1' || storageType === 'cloudflare-kv';
    const url = new URL(request.url);
    const shortUrl = isDatabaseBound ? `${url.origin}/#id=${id}` : null;

    return new Response(
      JSON.stringify({
        success: true,
        id: isDatabaseBound ? id : null,
        title,
        shortUrl,
        storageType,
        isDatabaseBound,
        totalFiles: files.length,
        sizeBytes: totalSize,
        createdAt: now,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { env } = context;

    if (env.DB) {
      const results = await env.DB.prepare(
        `SELECT id, title, active_path, total_files, size_bytes, created_at FROM snippets ORDER BY created_at DESC LIMIT 30`
      ).all();

      return new Response(
        JSON.stringify({ success: true, snippets: results.results || [] }),
        {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, snippets: [] }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
