import JSZip from 'jszip';
import { FileItem } from '../types';
import { detectLanguage } from './language';

/**
 * Packs multiple FileItems into a downloadable ZIP archive
 */
export async function exportFilesAsZip(files: FileItem[], zipName = 'cloudpaste-project.zip'): Promise<void> {
  const zip = new JSZip();

  for (const file of files) {
    // Normalizes path without leading slash
    const cleanPath = file.path.replace(/^\/+/, '');
    zip.file(cleanPath, file.content);
  }

  // Also include a README and Cloudflare Pages deployment file for user convenience
  zip.file(
    'README.md',
    `# Project exported from CloudPaste\n\nExported at: ${new Date().toISOString()}\nTotal files: ${files.length}\n\n## Deploying directly to Cloudflare Pages:\n1. Run \`npx wrangler pages deploy .\` or upload this unzipped folder via the Cloudflare Pages dashboard.\n`
  );

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Extracts all files from an uploaded ZIP file and converts them to FileItems
 */
export async function extractZipToFiles(file: File): Promise<FileItem[]> {
  const zip = new JSZip();
  const loaded = await zip.loadAsync(file);
  const items: FileItem[] = [];

  for (const [relativePath, zipEntry] of Object.entries(loaded.files)) {
    if (zipEntry.dir) continue;
    // skip system files (.DS_Store, etc.)
    if (relativePath.includes('__MACOSX') || relativePath.endsWith('.DS_Store')) continue;

    const content = await zipEntry.async('string');
    const name = relativePath.split('/').pop() || relativePath;
    const lang = detectLanguage(name, content);

    items.push({
      id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      path: relativePath,
      content,
      language: lang,
      size: content.length,
      lastModified: Date.now(),
    });
  }

  return items;
}
