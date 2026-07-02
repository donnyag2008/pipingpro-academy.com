-- PipingPro Academy: Project Workspace
-- Migration 0001: projects, project_calcs, project_notes
-- Run with: wrangler d1 execute ppa-feed-db --file=./migrations/0001_create_project_workspace.sql
-- (or a dedicated ppa-projects-db if you'd rather keep this separate from the feed ingest data)

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,              -- uuid, generate client or server side
  member_id TEXT NOT NULL,          -- Memberstack member id
  name TEXT NOT NULL,               -- e.g. "Al-Hada SRU Piping"
  client TEXT,                      -- e.g. "Saudi Aramco"
  job_number TEXT,                  -- e.g. "BI-10-21834"
  status TEXT NOT NULL DEFAULT 'active',   -- active | archived
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS project_calcs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  calc_type TEXT NOT NULL,          -- 'wall-thickness', 'flexibility', 'wt', 'vw', 'ps', 'el', etc.
  label TEXT,                       -- user-given name, e.g. '12"-P-1001-A'
  rev TEXT NOT NULL DEFAULT '0',    -- revision marker, e.g. '0', '1', 'A', 'B'
  input_json TEXT NOT NULL,         -- serialized calculator inputs
  output_json TEXT NOT NULL,        -- serialized calculator results
  parent_calc_id TEXT REFERENCES project_calcs(id),  -- NULL if this is Rev 0
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS project_notes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  note_type TEXT NOT NULL DEFAULT 'note',  -- 'note' | 'standard-ref' | 'material-ref'
  title TEXT,
  content TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_calcs_project ON project_calcs(project_id);
CREATE INDEX IF NOT EXISTS idx_calcs_parent ON project_calcs(parent_calc_id);
CREATE INDEX IF NOT EXISTS idx_notes_project ON project_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_member ON projects(member_id);
