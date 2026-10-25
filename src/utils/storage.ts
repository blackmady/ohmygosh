import { FileItem } from '../types';

const WORKSPACE_CACHE_KEY = 'cloudpaste_workspace_cache_v1';
const VERSION_HISTORY_KEY = 'cloudpaste_version_history_v1';
const CLOUD_SNIPPETS_CACHE_KEY = 'cloudpaste_cloud_snippets_v1';

export interface WorkspaceCache {
  files: FileItem[];
  activeFileId: string;
  lastSavedAt: number;
  autoSaved: boolean;
}

export interface VersionSnapshot {
  id: string;
  title: string;
  timestamp: number;
  fileCount: number;
  totalSize: number;
  files: FileItem[];
  activePath: string;
}

export interface CloudSnippetMeta {
  id: string;
  title: string;
  savedAt: number;
  fileCount: number;
  size: number;
  shortUrl: string;
}

/**
 * Saves current workspace files to localStorage
 */
export function saveWorkspaceToLocal(files: FileItem[], activeFileId: string, autoSaved = true): void {
  try {
    const data: WorkspaceCache = {
      files,
      activeFileId,
      lastSavedAt: Date.now(),
      autoSaved,
    };
    localStorage.setItem(WORKSPACE_CACHE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to cache workspace in localStorage:', err);
  }
}

/**
 * Loads cached workspace from localStorage if available
 */
export function loadWorkspaceFromLocal(): WorkspaceCache | null {
  try {
    const raw = localStorage.getItem(WORKSPACE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorkspaceCache;
    if (parsed && Array.isArray(parsed.files) && parsed.files.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to read workspace from localStorage:', err);
  }
  return null;
}

/**
 * Clears local cache
 */
export function clearLocalWorkspaceCache(): void {
  try {
    localStorage.removeItem(WORKSPACE_CACHE_KEY);
  } catch (err) {
    console.warn(err);
  }
}

/**
 * Creates and appends a named version snapshot to local history
 */
export function saveVersionSnapshot(
  title: string,
  files: FileItem[],
  activeFile: FileItem
): VersionSnapshot {
  const snapshot: VersionSnapshot = {
    id: `snap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: title || activeFile.name || '未命名版本',
    timestamp: Date.now(),
    fileCount: files.length,
    totalSize: files.reduce((acc, f) => acc + (f.size || f.content.length), 0),
    files: JSON.parse(JSON.stringify(files)),
    activePath: activeFile.path || activeFile.name,
  };

  try {
    const existing = loadVersionHistory();
    const updated = [snapshot, ...existing].slice(0, 30); // keep max 30 snapshots
    localStorage.setItem(VERSION_HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save version snapshot:', err);
  }

  return snapshot;
}

/**
 * Loads local version history
 */
export function loadVersionHistory(): VersionSnapshot[] {
  try {
    const raw = localStorage.getItem(VERSION_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as VersionSnapshot[];
  } catch {
    return [];
  }
}

/**
 * Deletes a snapshot
 */
export function deleteVersionSnapshot(id: string): void {
  try {
    const existing = loadVersionHistory();
    const filtered = existing.filter((s) => s.id !== id);
    localStorage.setItem(VERSION_HISTORY_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn(err);
  }
}

/**
 * Saves Cloudflare Snippet metadata locally for quick retrieval
 */
export function recordCloudSnippet(snippet: CloudSnippetMeta): void {
  try {
    const existing = loadCloudSnippets();
    const filtered = existing.filter((s) => s.id !== snippet.id);
    const updated = [snippet, ...filtered].slice(0, 50);
    localStorage.setItem(CLOUD_SNIPPETS_CACHE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to record cloud snippet:', err);
  }
}

/**
 * Loads recorded Cloudflare Snippets
 */
export function loadCloudSnippets(): CloudSnippetMeta[] {
  try {
    const raw = localStorage.getItem(CLOUD_SNIPPETS_CACHE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CloudSnippetMeta[];
  } catch {
    return [];
  }
}
