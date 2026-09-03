-- ============================================================================
-- PipingPro Academy — Feed schema (jobs + project awards)
-- Cloudflare D1.  Apply with:
--   wrangler d1 execute ppa-feed-db --file=./schema.sql
-- Two read-only public surfaces (jobs.html, awards.html); one writer (the
-- nightly ingest Worker) plus admin curation via the Memberstack admin tier.
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- sources : registry of feeds the ingest Worker reads.
--   kind  = 'jobs' | 'awards'  (which pipeline + which prompt to apply)
--   type  = 'rss' | 'ats_greenhouse' | 'ats_lever' | 'page'  (how to fetch)
-- Disable a noisy source by flipping enabled to 0 — no redeploy needed.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sources (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,            -- "Wood Newsroom", "KBR Greenhouse"
  url         TEXT    NOT NULL,            -- feed / API / page URL
  kind        TEXT    NOT NULL CHECK (kind IN ('jobs','awards')),
  type        TEXT    NOT NULL,            -- fetch strategy (see above)
  publisher   TEXT,                        -- human label for attribution line
  enabled     INTEGER NOT NULL DEFAULT 1,
  last_run_at TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------------
-- jobs : leading edge is the role itself. Tags are the whole value prop —
-- discipline + software + contract type are filters generic boards can't give.
-- software is a JSON array of normalised tokens, e.g. ["CAESAR II","E3D"].
-- ext_id is the dedup key: stable id derived from (source, canonical url|title).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jobs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id     INTEGER REFERENCES sources(id) ON DELETE SET NULL,
  ext_id        TEXT    NOT NULL,          -- dedup hash; see worker
  title         TEXT    NOT NULL,          -- our words, normalised
  employer      TEXT,
  discipline    TEXT,                      -- stress|layout|material|pipeline|support|other
  software      TEXT,                      -- JSON array
  contract_type TEXT,                      -- contract|staff|unknown
  region        TEXT,                      -- Middle East|Europe|Asia Pacific|...
  country       TEXT,
  city          TEXT,
  rate_band     TEXT,                      -- our own banding, nullable
  apply_url     TEXT    NOT NULL,          -- always link out to the source
  publisher     TEXT,                      -- attribution label
  posted_at     TEXT,                      -- as reported
  expires_at    TEXT    NOT NULL,          -- auto-hide past this — no rot
  status        TEXT    NOT NULL DEFAULT 'live', -- live|hidden|expired
  confidence    REAL,                      -- classifier confidence 0..1
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (ext_id)
);

CREATE INDEX IF NOT EXISTS idx_jobs_live    ON jobs (status, expires_at);
CREATE INDEX IF NOT EXISTS idx_jobs_filter  ON jobs (discipline, region, contract_type);

-- ---------------------------------------------------------------------------
-- awards : the sharper hook. These are FACTS extracted from public reporting,
-- rephrased in our voice, always linked back. Never the article body.
--   stage = 'FEED' | 'EPC' | 'EPCC' | 'FID' | 'PMC' | 'other'
--   scope = 'gas' | 'upstream' | 'midstream' | 'refining' | 'petchem' | ...
-- value_usd is best-effort numeric (USD millions); value_text keeps the raw
-- "$1.2bn" / "undisclosed" as reported. Reconcile or omit on conflict.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS awards (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id     INTEGER REFERENCES sources(id) ON DELETE SET NULL,
  ext_id        TEXT    NOT NULL,
  headline      TEXT    NOT NULL,          -- our words
  summary       TEXT,                      -- ONE line, our words, terse
  operator      TEXT,                      -- awarding client (Aramco, ADNOC...)
  contractor    TEXT,                      -- who won it (Wood, KBR...)
  project       TEXT,
  scope         TEXT,
  stage         TEXT,
  region        TEXT,
  country       TEXT,
  location      TEXT,                      -- field / site as reported
  value_usd     REAL,                      -- USD millions, nullable
  value_text    TEXT,                      -- raw as reported
  awarded_date  TEXT,                      -- as reported (best effort)
  source_url    TEXT    NOT NULL,          -- attribution + audit trail
  publisher     TEXT    NOT NULL,          -- "Energy Voice" etc.
  status        TEXT    NOT NULL DEFAULT 'live', -- live|hidden
  confidence    REAL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (ext_id)
);

CREATE INDEX IF NOT EXISTS idx_awards_recent ON awards (status, awarded_date);
CREATE INDEX IF NOT EXISTS idx_awards_filter ON awards (scope, stage, region);

-- ---------------------------------------------------------------------------
-- ingest_log : one row per source per run. Your operational visibility —
-- spot a source that stopped returning or a spike in rejects.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ingest_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id   INTEGER REFERENCES sources(id) ON DELETE SET NULL,
  run_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  fetched     INTEGER NOT NULL DEFAULT 0,  -- raw items pulled
  classified  INTEGER NOT NULL DEFAULT 0,  -- passed the relevance filter
  inserted    INTEGER NOT NULL DEFAULT 0,  -- new rows
  skipped     INTEGER NOT NULL DEFAULT 0,  -- dedup hits
  rejected    INTEGER NOT NULL DEFAULT 0,  -- classifier said "not relevant"
  error       TEXT
);

-- ---------------------------------------------------------------------------
-- Seed sources. Edit freely. Start with a hand-curated dozen — a small set of
-- high-signal feeds beats a scraped firehose. ATS endpoints are the durable
-- ones (public JSON); never seed LinkedIn/Indeed scrapes here.
-- ---------------------------------------------------------------------------
INSERT INTO sources (name, url, kind, type, publisher) VALUES
  ('Wood Newsroom',           'https://www.woodplc.com/news',                                   'awards', 'page',           'Wood'),
  ('Offshore Technology',     'https://www.offshore-technology.com/feed/',                      'awards', 'rss',            'Offshore Technology'),
  ('Hydrocarbon Engineering', 'https://www.hydrocarbonengineering.com/rss/',                    'awards', 'rss',            'Hydrocarbon Engineering'),
  ('Energy Voice',            'https://www.energyvoice.com/feed/',                              'awards', 'rss',            'Energy Voice'),
  ('KBR Careers',             'https://boards-api.greenhouse.io/v1/boards/kbr/jobs?content=true','jobs',  'ats_greenhouse', 'KBR'),
  ('Worley Careers',          'https://api.lever.co/v0/postings/worley?mode=json',              'jobs',   'ats_lever',      'Worley');
