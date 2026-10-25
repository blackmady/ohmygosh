import { FileItem } from '../types';
import { encodeSharePayload, decodeSharePayload } from './compression';
import { recordCloudSnippet, saveVersionSnapshot } from './storage';

export interface CloudSaveResult {
  success: boolean;
  id: string;
  shortUrl: string;
  storageType: 'cloudflare-d1' | 'cloudflare-kv' | 'client-permalink';
  createdAt: number;
}

/**
 * Saves snippet to Cloudflare Database via /api/snippets, with graceful fallback to permanent hash
 */
export async function saveSnippetToCloud(
  title: string,
  files: FileItem[],
  activeFile: FileItem
): Promise<CloudSaveResult> {
  const activePath = activeFile.path || activeFile.name;
  const now = Date.now();

  // First, always save a local version snapshot to guarantee zero data loss
  saveVersionSnapshot(title, files, activeFile);

  // Always generate client-side compressed permanent link as guaranteed base
  const permalink = encodeSharePayload({
    v: 1,
    title,
    files: files.map((f) => ({
      name: f.name,
      path: f.path || f.name,
      content: f.content,
      language: f.language,
    })),
    activePath,
    createdAt: now,
  });

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

    if (res.ok) {
      const data = await res.json();
      // Only use #id= if the server actually has D1 or KV bound
      if (data && data.success && data.id && (data.storageType === 'cloudflare-d1' || data.storageType === 'cloudflare-kv')) {
        const result: CloudSaveResult = {
          success: true,
          id: data.id,
          shortUrl: `${window.location.origin}${window.location.pathname}#id=${data.id}`,
          storageType: data.storageType,
          createdAt: data.createdAt || now,
        };

        recordCloudSnippet({
          id: result.id,
          title: title || activeFile.name,
          savedAt: result.createdAt,
          fileCount: files.length,
          size: files.reduce((acc, f) => acc + (f.size || f.content.length), 0),
          shortUrl: result.shortUrl,
        });

        return result;
      }
    }
  } catch (err) {
    console.warn('Cloudflare /api/snippets fetch failed, falling back to permanent link:', err);
  }

  // Graceful fallback: use compressed permanent hash URL (100% works without any database)
  const fallbackId = `local_${now.toString(36)}`;
  recordCloudSnippet({
    id: fallbackId,
    title: title || activeFile.name,
    savedAt: now,
    fileCount: files.length,
    size: files.reduce((acc, f) => acc + (f.size || f.content.length), 0),
    shortUrl: permalink,
  });

  return {
    success: true,
    id: fallbackId,
    shortUrl: permalink,
    storageType: 'client-permalink',
    createdAt: now,
  };
}

/**
 * Loads a snippet from Cloudflare database by ID
 */
export async function loadSnippetFromCloud(id: string): Promise<{
  title: string;
  files: FileItem[];
  activePath: string;
  createdAt: number;
} | null> {
  // First check if the URL also carried embedded payload data (e.g. #id=...&data=...)
  const embeddedData = decodeSharePayload();
  if (embeddedData && embeddedData.files.length > 0) {
    return {
      title: embeddedData.title,
      files: embeddedData.files.map((f: any, idx: number) => ({
        id: `shared_file_${idx}_${Date.now()}`,
        name: f.name,
        path: f.path || f.name,
        content: f.content,
        language: f.language,
        size: f.content.length,
        lastModified: embeddedData.createdAt,
      })),
      activePath: embeddedData.activePath || embeddedData.files[0]?.path || 'index.html',
      createdAt: embeddedData.createdAt,
    };
  }

  try {
    const res = await fetch(`/api/snippets/${encodeURIComponent(id)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.snippet) {
        return {
          title: data.snippet.title,
          files: data.snippet.files.map((f: any, idx: number) => ({
            id: `cloud_file_${idx}_${Date.now()}`,
            name: f.name,
            path: f.path || f.name,
            content: f.content,
            language: f.language,
            size: f.size || f.content?.length || 0,
            lastModified: data.snippet.createdAt,
          })),
          activePath: data.snippet.activePath || 'index.html',
          createdAt: data.snippet.createdAt,
        };
      }
    }
  } catch (err) {
    console.warn('Failed to load snippet from Cloudflare database:', err);
  }
  return null;
}

/**
 * Checks if current URL has a snippet ID (#id=... or ?id=...) cleanly without trailing parameters
 */
export function getUrlSnippetId(): string | null {
  if (typeof window === 'undefined') return null;

  const hash = window.location.hash;
  if (hash.includes('#id=') || hash.includes('&id=')) {
    const match = hash.match(/[#&]id=([a-zA-Z0-9_\-]+)/);
    if (match && match[1]) {
      return match[1];
    }
  }

  const params = new URLSearchParams(window.location.search);
  const searchId = params.get('id');
  if (searchId) {
    return searchId.split('&')[0];
  }

  return null;
}
