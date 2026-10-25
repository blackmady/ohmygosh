// Cloudflare Pages Function: /api/snippets
// Direct integration with Cloudflare D1 SQL database and Cloudflare KV

export interface Env {
  DB?: any;
  db?: any;
  d1?: any;
  DATABASE?: any;
  SNIPPETS_KV?: any;
  snippets_kv?: any;
  KV?: any;
}

export function getD1(env: any) {
  return env?.DB || env?.db || env?.d1 || env?.DATABASE || null;
}

export function getKV(env: any) {
  return env?.SNIPPETS_KV || env?.snippets_kv || env?.KV || null;
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
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Ensures the D1 table exists so users never get "no such table: snippets" error
 */
async function ensureD1Table(db: any) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS snippets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      files TEXT NOT NULL,
      active_path TEXT NOT NULL,
      total_files INTEGER NOT NULL DEFAULT 1,
      size_bytes INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `).run();

  try {
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_snippets_created ON snippets (created_at DESC)`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_snippets_title ON snippets (title)`).run();
  } catch (_) {
    // Indexes might already exist
  }
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
};

/**
 * POST /api/snippets - Saves a code snippet into Cloudflare D1 database
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const body = (await request.json().catch(() => null)) as any;

    if (!body || !Array.isArray(body.files) || body.files.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: '缺少有效的工程文件列表 (files array required)' }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const title = (body.title || 'Untitled Snippet').trim().slice(0, 100);
    const files = body.files;
    const activePath = body.activePath || files[0]?.path || files[0]?.name || 'index.html';
    const totalSize = files.reduce((acc: number, f: any) => acc + (f.content?.length || 0), 0);
    const now = Date.now();

    // Single version per project policy:
    // If body.id is provided, update that exact project; otherwise generate a new unique ID
    const rawId = typeof body.id === 'string' ? body.id.trim() : '';
    const id = rawId.length > 0
      ? rawId.replace(/^[#?]/, '').split('&')[0]
      : `cp_${now.toString(36).slice(-5)}_${Math.random().toString(36).substring(2, 6)}`;
    const filesJson = JSON.stringify(files);

    const d1 = getD1(env);
    const kv = getKV(env);

    // 1. Primary: Cloudflare D1 SQL Database (Upsert: one project keeps only one version)
    if (d1) {
      try {
        await ensureD1Table(d1);

        await d1.prepare(`
          INSERT INTO snippets (id, title, files, active_path, total_files, size_bytes, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            files = excluded.files,
            active_path = excluded.active_path,
            total_files = excluded.total_files,
            size_bytes = excluded.size_bytes,
            updated_at = excluded.updated_at
        `)
          .bind(id, title, filesJson, activePath, files.length, totalSize, now, now)
          .run();

        const url = new URL(request.url);
        const shortUrl = `${url.origin}/#id=${id}`;

        return new Response(
          JSON.stringify({
            success: true,
            id,
            title,
            shortUrl,
            storageType: 'cloudflare-d1',
            totalFiles: files.length,
            sizeBytes: totalSize,
            createdAt: now,
            message: '已成功保存至 Cloudflare D1 边缘数据库 (单个项目单一版本)',
          }),
          { status: 200, headers: CORS_HEADERS }
        );
      } catch (d1Err: any) {
        console.error('D1 execution failed:', d1Err);
        return new Response(
          JSON.stringify({
            success: false,
            error: `写入 Cloudflare D1 数据库失败: ${d1Err?.message || String(d1Err)}`,
            code: 'D1_EXECUTION_ERROR',
          }),
          { status: 500, headers: CORS_HEADERS }
        );
      }
    }

    // 2. Secondary fallback: Cloudflare KV
    if (kv) {
      try {
        await kv.put(
          id,
          JSON.stringify({ id, title, files, activePath, totalFiles: files.length, totalSize, created_at: now }),
          { metadata: { title, created_at: now, total_files: files.length } }
        );

        const url = new URL(request.url);
        const shortUrl = `${url.origin}/#id=${id}`;

        return new Response(
          JSON.stringify({
            success: true,
            id,
            title,
            shortUrl,
            storageType: 'cloudflare-kv',
            totalFiles: files.length,
            sizeBytes: totalSize,
            createdAt: now,
            message: '已存入 Cloudflare KV 存储',
          }),
          { status: 200, headers: CORS_HEADERS }
        );
      } catch (kvErr: any) {
        console.error('KV put failed:', kvErr);
        return new Response(
          JSON.stringify({
            success: false,
            error: `写入 Cloudflare KV 失败: ${kvErr?.message || String(kvErr)}`,
            code: 'KV_EXECUTION_ERROR',
          }),
          { status: 500, headers: CORS_HEADERS }
        );
      }
    }

    // 3. Neither D1 nor KV is bound in Cloudflare Pages
    return new Response(
      JSON.stringify({
        success: false,
        error:
          'Cloudflare Pages Functions 未检测到 D1 数据库绑定。请前往 Cloudflare 控制台 -> Workers & Pages -> ohmygosh -> 设置 (Settings) -> Functions -> D1 数据库绑定，添加变量名为 "DB" 的绑定。',
        code: 'DB_NOT_BOUND',
      }),
      { status: 503, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || 'Server error',
      }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
};

/**
 * GET /api/snippets
 * Supports:
 * - ?action=status: checks connection and counts in D1
 * - default: lists the recent 50 snippets
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    const d1 = getD1(env);
    const kv = getKV(env);

    // Diagnostic status endpoint
    if (action === 'status') {
      if (!d1) {
        return new Response(
          JSON.stringify({
            success: true,
            d1Bound: false,
            kvBound: !!kv,
            message: '未检测到 D1 绑定 (若刚在后台绑定了 DB，请在 Cloudflare Pages「部署」中点击「重试部署」以生效)',
            code: 'DB_NOT_BOUND',
          }),
          { status: 200, headers: CORS_HEADERS }
        );
      }

      try {
        await ensureD1Table(d1);
        const countRes = await d1.prepare('SELECT count(*) as count FROM snippets').first();
        return new Response(
          JSON.stringify({
            success: true,
            d1Bound: true,
            tableReady: true,
            count: countRes?.count || 0,
            message: 'Cloudflare D1 数据库正常就绪，表 snippets 已就绪',
          }),
          { status: 200, headers: CORS_HEADERS }
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({
            success: false,
            d1Bound: true,
            tableReady: false,
            error: err.message || String(err),
          }),
          { status: 500, headers: CORS_HEADERS }
        );
      }
    }

    // Normal list
    if (d1) {
      await ensureD1Table(d1);
      const results = await d1.prepare(
        `SELECT id, title, active_path, total_files, size_bytes, created_at FROM snippets ORDER BY created_at DESC LIMIT 50`
      ).all();

      return new Response(
        JSON.stringify({
          success: true,
          d1Bound: true,
          snippets: results.results || [],
        }),
        { headers: CORS_HEADERS }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        d1Bound: false,
        snippets: [],
        message: '未绑定 D1 数据库',
      }),
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
};
