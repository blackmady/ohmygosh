-- Cloudflare D1 Database Schema for CloudPaste / ohmygosh
-- To initialize on Cloudflare:
-- 1. npx wrangler d1 create ohmygosh-db
-- 2. npx wrangler d1 execute ohmygosh-db --file=./schema.sql

CREATE TABLE IF NOT EXISTS snippets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  files TEXT NOT NULL,          -- JSON stringified array of FileItem
  active_path TEXT NOT NULL,     -- default active file path
  total_files INTEGER NOT NULL DEFAULT 1,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_snippets_created ON snippets (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_snippets_title ON snippets (title);
