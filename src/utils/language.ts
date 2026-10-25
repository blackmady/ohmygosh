import { SupportedLanguage } from '../types';

export interface LanguageMeta {
  id: SupportedLanguage;
  name: string;
  extensions: string[];
  hljsLanguage: string;
  isPreviewable: boolean;
  mime: string;
}

export const LANGUAGE_LIST: LanguageMeta[] = [
  {
    id: 'html',
    name: 'HTML',
    extensions: ['html', 'htm'],
    hljsLanguage: 'xml',
    isPreviewable: true,
    mime: 'text/html',
  },
  {
    id: 'svg',
    name: 'SVG Vector',
    extensions: ['svg'],
    hljsLanguage: 'xml',
    isPreviewable: true,
    mime: 'image/svg+xml',
  },
  {
    id: 'markdown',
    name: 'Markdown',
    extensions: ['md', 'markdown', 'mdown'],
    hljsLanguage: 'markdown',
    isPreviewable: true,
    mime: 'text/markdown',
  },
  {
    id: 'csv',
    name: 'CSV Data',
    extensions: ['csv'],
    hljsLanguage: 'plaintext',
    isPreviewable: true,
    mime: 'text/csv',
  },
  {
    id: 'tsv',
    name: 'TSV Data',
    extensions: ['tsv'],
    hljsLanguage: 'plaintext',
    isPreviewable: true,
    mime: 'text/tab-separated-values',
  },
  {
    id: 'json',
    name: 'JSON',
    extensions: ['json'],
    hljsLanguage: 'json',
    isPreviewable: true,
    mime: 'application/json',
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    extensions: ['js', 'mjs', 'cjs'],
    hljsLanguage: 'javascript',
    isPreviewable: false,
    mime: 'text/javascript',
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    extensions: ['ts', 'tsx'],
    hljsLanguage: 'typescript',
    isPreviewable: false,
    mime: 'text/typescript',
  },
  {
    id: 'css',
    name: 'CSS',
    extensions: ['css', 'scss', 'less'],
    hljsLanguage: 'css',
    isPreviewable: false,
    mime: 'text/css',
  },
  {
    id: 'python',
    name: 'Python',
    extensions: ['py'],
    hljsLanguage: 'python',
    isPreviewable: false,
    mime: 'text/x-python',
  },
  {
    id: 'sql',
    name: 'SQL',
    extensions: ['sql'],
    hljsLanguage: 'sql',
    isPreviewable: false,
    mime: 'text/x-sql',
  },
  {
    id: 'yaml',
    name: 'YAML',
    extensions: ['yaml', 'yml'],
    hljsLanguage: 'yaml',
    isPreviewable: false,
    mime: 'text/yaml',
  },
  {
    id: 'bash',
    name: 'Shell / Bash',
    extensions: ['sh', 'bash', 'zsh'],
    hljsLanguage: 'bash',
    isPreviewable: false,
    mime: 'application/x-sh',
  },
  {
    id: 'rust',
    name: 'Rust',
    extensions: ['rs'],
    hljsLanguage: 'rust',
    isPreviewable: false,
    mime: 'text/rust',
  },
  {
    id: 'go',
    name: 'Go',
    extensions: ['go'],
    hljsLanguage: 'go',
    isPreviewable: false,
    mime: 'text/x-go',
  },
  {
    id: 'java',
    name: 'Java',
    extensions: ['java'],
    hljsLanguage: 'java',
    isPreviewable: false,
    mime: 'text/x-java-source',
  },
  {
    id: 'cpp',
    name: 'C / C++',
    extensions: ['cpp', 'c', 'h', 'hpp', 'cc'],
    hljsLanguage: 'cpp',
    isPreviewable: false,
    mime: 'text/x-c',
  },
  {
    id: 'text',
    name: 'Plain Text',
    extensions: ['txt', 'log'],
    hljsLanguage: 'plaintext',
    isPreviewable: false,
    mime: 'text/plain',
  },
];

/**
 * Detect language by file extension or content heuristic
 */
export function detectLanguage(fileName: string, content?: string): SupportedLanguage {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext) {
    const match = LANGUAGE_LIST.find((lang) => lang.extensions.includes(ext));
    if (match) return match.id;
  }

  // Fallback to content sniffing if extension is ambiguous or missing
  if (content) {
    const trimmed = content.trim();
    if (trimmed.startsWith('<!DOCTYPE html') || trimmed.startsWith('<html') || (trimmed.startsWith('<div') && trimmed.includes('</div>'))) {
      return 'html';
    }
    if (trimmed.startsWith('<svg') || (trimmed.includes('<path') && trimmed.includes('xmlns="http://www.w3.org/2000/svg"'))) {
      return 'svg';
    }
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        JSON.parse(trimmed);
        return 'json';
      } catch {
        // continue
      }
    }
    if (trimmed.startsWith('# ') || trimmed.includes('\n# ') || (trimmed.includes('|---') && trimmed.includes('|'))) {
      return 'markdown';
    }
    if (trimmed.includes(',') && trimmed.split('\n')[0].split(',').length >= 2) {
      return 'csv';
    }
    if (trimmed.startsWith('def ') || (trimmed.includes('import ') && trimmed.includes(':'))) {
      return 'python';
    }
    if (trimmed.startsWith('SELECT ') || trimmed.startsWith('CREATE TABLE ') || (trimmed.includes('FROM ') && trimmed.includes('WHERE '))) {
      return 'sql';
    }
  }

  return 'text';
}

export function isLanguagePreviewable(language: SupportedLanguage): boolean {
  const match = LANGUAGE_LIST.find((item) => item.id === language);
  return match?.isPreviewable ?? false;
}

export function getHljsLanguage(language: SupportedLanguage): string {
  const match = LANGUAGE_LIST.find((item) => item.id === language);
  return match?.hljsLanguage ?? 'plaintext';
}
