export type SupportedLanguage =
  | 'html'
  | 'svg'
  | 'markdown'
  | 'csv'
  | 'tsv'
  | 'json'
  | 'javascript'
  | 'typescript'
  | 'css'
  | 'python'
  | 'sql'
  | 'yaml'
  | 'bash'
  | 'rust'
  | 'go'
  | 'java'
  | 'cpp'
  | 'text';

export interface FileItem {
  id: string;
  name: string;
  path: string; // e.g. "index.html", "src/style.css"
  content: string;
  language: SupportedLanguage;
  size: number;
  lastModified?: number;
}

export interface SharePayload {
  v: number;
  title: string;
  files: Array<{
    name: string;
    path: string;
    content: string;
    language: SupportedLanguage;
  }>;
  activePath: string;
  createdAt: number;
}

export type ViewMode = 'split' | 'code' | 'preview';
export type DeviceViewport = 'desktop' | 'tablet' | 'mobile';

export interface ConsoleMessage {
  id: string;
  type: 'log' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}
