-- Stable identity and metadata used by the compatibility-to-relational projector.

ALTER TABLE users ADD COLUMN IF NOT EXISTS source_id VARCHAR(80);
ALTER TABLE riders ADD COLUMN IF NOT EXISTS source_id VARCHAR(80);
ALTER TABLE captains ADD COLUMN IF NOT EXISTS source_id VARCHAR(80);
ALTER TABLE captain_payment_details ADD COLUMN IF NOT EXISTS source_id VARCHAR(80);
ALTER TABLE pickup_hubs ADD COLUMN IF NOT EXISTS source_id VARCHAR(120);
ALTER TABLE captain_trips ADD COLUMN IF NOT EXISTS source_id VARCHAR(80);
ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS source_id VARCHAR(80);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS source_id VARCHAR(80);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS source_id VARCHAR(80);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS source_id VARCHAR(80);

ALTER TABLE riders ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE captains ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE captain_trips ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_source_id ON users(source_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_riders_source_id ON riders(source_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_captains_source_id ON captains(source_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_captain_payment_source_id ON captain_payment_details(source_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pickup_hubs_source_id ON pickup_hubs(source_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_captain_trips_source_id ON captain_trips(source_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_ride_requests_source_id ON ride_requests(source_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_source_id ON payments(source_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_reviews_source_id ON reviews(source_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_audit_logs_source_id ON audit_logs(source_id);

CREATE TABLE IF NOT EXISTS projection_status (
  projection_key VARCHAR(80) PRIMARY KEY,
  projected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  record_counts JSONB NOT NULL DEFAULT '{}'::jsonb
);
