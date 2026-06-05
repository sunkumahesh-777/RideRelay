-- Production safeguards for duplicate payments, reviews, and pickup hubs.

CREATE UNIQUE INDEX IF NOT EXISTS uq_pickup_hubs_name_area
  ON pickup_hubs (LOWER(name), LOWER(area));

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_paid_request
  ON payments (ride_request_id)
  WHERE status = 'paid';

CREATE UNIQUE INDEX IF NOT EXISTS uq_reviews_request_rider
  ON reviews (ride_request_id, rider_id);

CREATE INDEX IF NOT EXISTS idx_captain_trips_departure
  ON captain_trips (departure_time)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_ride_status_events_request_created
  ON ride_status_events (ride_request_id, created_at DESC);
