import { FileItem } from '../types';
import { recordCloudSnippet, saveVersionSnapshot } from './storage';

export interface CloudSaveResult {
  success: boolean;
  id: string;
  shortUrl: string;
  storageType: 'cloudflare-d1' | 'cloudflare-kv' | 'none';
  totalFiles?: number;
  sizeBytes?: number;
  createdAt: number;
  error?: string;
  code?: string;
}

export interface CloudDatabaseStatus {
  success: boolean;
  d1Bound: boolean;
  kvBound?: boolean;
  tableReady?: boolean;
  count?: number;
  message?: string;
  error?: string;
  isLocalDev?: boolean;
}

export interface CloudSnippetListItem {
  id: string;
  title: string;
  active_path: string;
  total_files: number;
  size_bytes: number;
  created_at: number;
}

/**
 * Checks Cloudflare D1 connection status & table health
 */
export async function checkCloudflareDatabaseStatus(): Promise<CloudDatabaseStatus> {
  try {
    const res = await fetch('/api/snippets?action=status', {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    } else {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        d1Bound: false,
        error: errData.error || `HTTP ${res.status}`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      d1Bound: false,
      error: err.message || '网络请求失败',
    };
  }
}

/**
 * Fetches recent snippets from Cloudflare D1
 */
export async function fetchCloudSnippetsList(): Promise<CloudSnippetListItem[]> {
  try {
    const res = await fetch('/api/snippets', {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.snippets)) {
        return data.snippets;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch snippets list:', err);
  }
  return [];
}

/**
 * Saves snippet strictly to Cloudflare Database (D1/KV), producing a short ID link.
 * Strict: Never embeds Base64 payload in the URL (supports multi-MB codebases).
 */
export async function saveSnippetToCloud(
  title: string,
  files: FileItem[],
  activeFile: FileItem
): Promise<CloudSaveResult> {
  const activePath = activeFile.path || activeFile.name;
  const now = Date.now();
  const totalSize = files.reduce((acc, f) => acc + (f.size || f.content?.length || 0), 0);

  // Always save a local snapshot in browser localStorage to safeguard work
  saveVersionSnapshot(title, files, activeFile);

  try {
    const res = await fetch('/api/snippets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        files: files.map((f) => ({
          name: f.name,
          path: f.path || f.name,
          content: f.content,
          language: f.language,
          size: f.size || f.content.length,
        })),
        activePath,
      }),
    });

    const data = await res.json().catch(() => null);

    if (res.ok && data && data.success && data.id) {
      const cleanPath = window.location.pathname.endsWith('/')
        ? window.location.pathname
        : `${window.location.pathname}/`;
      const shortUrl = `${window.location.origin}${cleanPath}#id=${data.id}`;

      const result: CloudSaveResult = {
        success: true,
        id: data.id,
        shortUrl,
        storageType: data.storageType || 'cloudflare-d1',
        totalFiles: files.length,
        sizeBytes: totalSize,
        createdAt: data.createdAt || now,
      };

      // Record to local cloud history for easy retrieval
      recordCloudSnippet({
        id: result.id,
        title: title || activeFile.name,
        savedAt: result.createdAt,
        fileCount: files.length,
        size: totalSize,
        shortUrl: result.shortUrl,
      });

      return result;
    } else {
      // D1 not bound or query failed: return detailed error directly
      return {
        success: false,
        id: '',
        shortUrl: '',
        storageType: 'none',
        createdAt: now,
        error: data?.error || `服务器返回错误 (状态码: ${res.status})`,
        code: data?.code || 'SERVER_ERROR',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      id: '',
      shortUrl: '',
      storageType: 'none',
      createdAt: now,
      error: `网络连接异常: ${err.message || String(err)}`,
      code: 'NETWORK_ERROR',
    };
  }
}

/**
 * Loads a snippet from Cloudflare database by short ID
 */
export async function loadSnippetFromCloud(id: string): Promise<{
  id: string;
  title: string;
  files: FileItem[];
  activePath: string;
  createdAt: number;
  storage?: string;
  totalFiles?: number;
  sizeBytes?: number;
} | null> {
  const cleanId = id.replace(/^[#?]/, '').split('&')[0].trim();
  if (!cleanId) return null;

  try {
    const res = await fetch(`/api/snippets/${encodeURIComponent(cleanId)}`, {
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.snippet) {
        const rawFiles = Array.isArray(data.snippet.files)
          ? data.snippet.files
          : typeof data.snippet.files === 'string'
          ? JSON.parse(data.snippet.files)
          : [];

        return {
          id: data.snippet.id || cleanId,
          title: data.snippet.title || 'Untitled Snippet',
          files: rawFiles.map((f: any, idx: number) => ({
            id: `cloud_file_${idx}_${Date.now()}`,
            name: f.name,
            path: f.path || f.name,
            content: f.content || '',
            language: f.language,
            size: f.size || f.content?.length || 0,
            lastModified: data.snippet.createdAt || Date.now(),
          })),
          activePath: data.snippet.activePath || rawFiles[0]?.path || 'index.html',
          createdAt: data.snippet.createdAt || Date.now(),
          storage: data.snippet.storage,
          totalFiles: data.snippet.totalFiles || rawFiles.length,
          sizeBytes: data.snippet.sizeBytes,
        };
      }
    }
  } catch (err) {
    console.warn('Failed to load snippet from Cloudflare database:', err);
  }
  return null;
}

/**
 * Checks if current URL has a snippet ID (#id=... or ?id=... or #cp_...)
 */
export function getUrlSnippetId(): string | null {
  if (typeof window === 'undefined') return null;

  const hash = window.location.hash || '';

  // 1. Check #id=cp_xxx
  if (hash.includes('#id=') || hash.includes('&id=')) {
    const match = hash.match(/[#&]id=([a-zA-Z0-9_\-]+)/);
    if (match && match[1]) {
      return match[1];
    }
  }

  // 2. Check direct short hash #cp_xxx
  if (hash.startsWith('#cp_')) {
    const match = hash.slice(1).split('&')[0];
    if (match) return match;
  }

  // 3. Check search query ?id=... or ?s=...
  const params = new URLSearchParams(window.location.search);
  const searchId = params.get('id') || params.get('s');
  if (searchId) {
    return searchId.split('&')[0];
  }

  return null;
}
