import { FileItem } from '../types';
import { encodeSharePayload } from './compression';
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
      if (data && data.success && data.id) {
        const result: CloudSaveResult = {
          success: true,
          id: data.id,
          shortUrl: `${window.location.origin}${window.location.pathname}#id=${data.id}`,
          storageType: data.storageType || 'cloudflare-d1',
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

  // Graceful fallback: generate compressed permanent hash URL and local ID
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
 * Checks if current URL has a snippet ID (#id=... or ?id=...)
 */
export function getUrlSnippetId(): string | null {
  const hash = window.location.hash;
  if (hash.includes('#id=')) {
    return hash.slice(hash.indexOf('#id=') + 4);
  }
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}
