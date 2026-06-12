-- RideRelay production database schema
-- Recommended database: PostgreSQL

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(20) NOT NULL CHECK (role IN ('rider', 'captain', 'admin')),
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  phone VARCHAR(30) NOT NULL,
  password_hash TEXT NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'pending_verification',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE riders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  gender VARCHAR(20),
  home_stop VARCHAR(120),
  emergency_contact VARCHAR(30),
  verification_status VARCHAR(40) NOT NULL DEFAULT 'phone_pending',
  wallet_balance NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE captains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  gender VARCHAR(20),
  vehicle_type VARCHAR(40) NOT NULL,
  vehicle_number VARCHAR(40) NOT NULL,
  license_number VARCHAR(80) NOT NULL,
  verification_status VARCHAR(40) NOT NULL DEFAULT 'kyc_pending',
  average_rating NUMERIC(3, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE captain_payment_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  captain_id UUID NOT NULL UNIQUE REFERENCES captains(id) ON DELETE CASCADE,
  account_holder VARCHAR(120),
  bank_name VARCHAR(120),
  account_number_masked VARCHAR(40),
  ifsc_code VARCHAR(30),
  upi_id VARCHAR(120),
  qr_file_url TEXT,
  qr_mime_type VARCHAR(80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pickup_hubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(160) NOT NULL,
  area VARCHAR(120) NOT NULL,
  hub_type VARCHAR(40) NOT NULL,
  pickup_hint TEXT,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  safety_radius_meters INTEGER NOT NULL DEFAULT 500,
  city VARCHAR(80) NOT NULL DEFAULT 'Hyderabad',
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  priority INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pickup_hubs_area ON pickup_hubs(area);
CREATE INDEX idx_pickup_hubs_type ON pickup_hubs(hub_type);
CREATE INDEX idx_pickup_hubs_status ON pickup_hubs(status);

CREATE TABLE captain_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  captain_id UUID NOT NULL REFERENCES captains(id) ON DELETE CASCADE,
  start_hub_id UUID REFERENCES pickup_hubs(id),
  destination_hub_id UUID REFERENCES pickup_hubs(id),
  start_location_text VARCHAR(160) NOT NULL,
  destination_location_text VARCHAR(160) NOT NULL,
  vehicle_type VARCHAR(40) NOT NULL,
  available_seats INTEGER NOT NULL CHECK (available_seats > 0),
  remaining_seats INTEGER NOT NULL CHECK (remaining_seats >= 0),
  distance_km NUMERIC(8, 2) NOT NULL DEFAULT 0,
  departure_time TIMESTAMPTZ,
  current_pin_text VARCHAR(160),
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_captain_trips_captain ON captain_trips(captain_id);
CREATE INDEX idx_captain_trips_status ON captain_trips(status);
CREATE INDEX idx_captain_trips_route ON captain_trips(start_location_text, destination_location_text);

CREATE TABLE ride_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
  captain_id UUID NOT NULL REFERENCES captains(id) ON DELETE CASCADE,
  captain_trip_id UUID NOT NULL REFERENCES captain_trips(id) ON DELETE CASCADE,
  pickup_hub_id UUID REFERENCES pickup_hubs(id),
  drop_hub_id UUID REFERENCES pickup_hubs(id),
  pickup_text VARCHAR(160) NOT NULL,
  destination_text VARCHAR(160) NOT NULL,
  hop_pickup_text VARCHAR(160) NOT NULL,
  hop_destination_text VARCHAR(160) NOT NULL,
  requested_seats INTEGER NOT NULL DEFAULT 1,
  distance_km NUMERIC(8, 2) NOT NULL DEFAULT 0,
  fare_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status VARCHAR(40) NOT NULL DEFAULT 'pending',
  captain_message TEXT,
  rider_alert TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ride_requests_rider ON ride_requests(rider_id);
CREATE INDEX idx_ride_requests_captain ON ride_requests(captain_id);
CREATE INDEX idx_ride_requests_trip ON ride_requests(captain_trip_id);
CREATE INDEX idx_ride_requests_status ON ride_requests(status);

CREATE TABLE ride_status_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_request_id UUID NOT NULL REFERENCES ride_requests(id) ON DELETE CASCADE,
  status VARCHAR(40) NOT NULL,
  note TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  created_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_request_id UUID NOT NULL REFERENCES ride_requests(id) ON DELETE CASCADE,
  rider_id UUID NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
  captain_id UUID NOT NULL REFERENCES captains(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  method VARCHAR(40) NOT NULL,
  transaction_reference VARCHAR(160),
  status VARCHAR(40) NOT NULL DEFAULT 'paid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_ride_request ON payments(ride_request_id);
CREATE INDEX idx_payments_captain ON payments(captain_id);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_request_id UUID NOT NULL REFERENCES ride_requests(id) ON DELETE CASCADE,
  rider_id UUID NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
  captain_id UUID NOT NULL REFERENCES captains(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  mood VARCHAR(30) NOT NULL DEFAULT 'moderate',
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ride_request_id UUID REFERENCES ride_requests(id) ON DELETE SET NULL,
  report_type VARCHAR(60) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE eco_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
  ride_request_id UUID REFERENCES ride_requests(id) ON DELETE SET NULL,
  points INTEGER NOT NULL,
  reason VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE monthly_impact (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
  month_start DATE NOT NULL,
  walking_distance_km NUMERIC(8, 2) NOT NULL DEFAULT 0,
  calories_burned INTEGER NOT NULL DEFAULT 0,
  fuel_saved_liters NUMERIC(8, 2) NOT NULL DEFAULT 0,
  co2_reduced_kg NUMERIC(8, 2) NOT NULL DEFAULT 0,
  eco_points_earned INTEGER NOT NULL DEFAULT 0,
  UNIQUE (rider_id, month_start)
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(60) NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(120) NOT NULL,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
