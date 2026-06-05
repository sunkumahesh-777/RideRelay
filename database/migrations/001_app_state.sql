-- Compatibility store used while the existing APIs are migrated table-by-table.
-- PostgreSQL is the durable source when DATABASE_URL is configured.

CREATE TABLE IF NOT EXISTS app_state (
  state_key VARCHAR(80) PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
