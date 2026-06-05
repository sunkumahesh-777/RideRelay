const crypto = require('crypto');

function stableUuid(kind, sourceId) {
  const hex = crypto
    .createHash('sha256')
    .update(`riderelay:${kind}:${sourceId}`)
    .digest('hex')
    .slice(0, 32);

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20)}`;
}

function timestamp(value) {
  return value || new Date().toISOString();
}

function passwordValue(user) {
  if (user.passwordHash) {
    return `${user.passwordSalt || ''}:${user.passwordHash}`;
  }
  return user.password ? `legacy:${user.password}` : 'unavailable';
}

async function isProjectionReady(client) {
  const result = await client.query(`
    SELECT
      to_regclass('public.users') IS NOT NULL AS has_users,
      to_regclass('public.projection_status') IS NOT NULL AS has_projection_status
  `);
  return Boolean(result.rows[0]?.has_users && result.rows[0]?.has_projection_status);
}

async function projectUsers(client, db) {
  for (const user of db.users || []) {
    await client.query(`
      INSERT INTO users (
        id, source_id, role, full_name, email, phone, password_hash, status, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
      ON CONFLICT (source_id) DO UPDATE SET
        role=EXCLUDED.role, full_name=EXCLUDED.full_name, email=EXCLUDED.email,
        phone=EXCLUDED.phone, password_hash=EXCLUDED.password_hash,
        status=EXCLUDED.status, updated_at=NOW()
    `, [
      stableUuid('user', user.id), user.id, user.role, user.fullName,
      user.email, user.phone || 'not-provided', passwordValue(user),
      user.status || 'pending_verification', timestamp(user.createdAt)
    ]);
  }
}

async function projectProfiles(client, db) {
  for (const rider of db.riders || []) {
    await client.query(`
      INSERT INTO riders (
        id, source_id, user_id, gender, home_stop, emergency_contact,
        verification_status, wallet_balance, metadata, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,NOW())
      ON CONFLICT (source_id) DO UPDATE SET
        gender=EXCLUDED.gender, home_stop=EXCLUDED.home_stop,
        emergency_contact=EXCLUDED.emergency_contact,
        verification_status=EXCLUDED.verification_status,
        wallet_balance=EXCLUDED.wallet_balance, metadata=EXCLUDED.metadata, updated_at=NOW()
    `, [
      stableUuid('rider', rider.id), rider.id, stableUuid('user', rider.userId),
      rider.gender || null, rider.homeStop || null, rider.emergencyContact || null,
      rider.verificationStatus || 'phone_pending', Number(rider.walletBalance || 0),
      JSON.stringify({ fullName: rider.fullName }), timestamp(rider.createdAt)
    ]);
  }

  for (const captain of db.captains || []) {
    await client.query(`
      INSERT INTO captains (
        id, source_id, user_id, gender, vehicle_type, vehicle_number, license_number,
        verification_status, average_rating, metadata, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,NOW())
      ON CONFLICT (source_id) DO UPDATE SET
        gender=EXCLUDED.gender, vehicle_type=EXCLUDED.vehicle_type,
        vehicle_number=EXCLUDED.vehicle_number, license_number=EXCLUDED.license_number,
        verification_status=EXCLUDED.verification_status,
        average_rating=EXCLUDED.average_rating, metadata=EXCLUDED.metadata, updated_at=NOW()
    `, [
      stableUuid('captain', captain.id), captain.id, stableUuid('user', captain.userId),
      captain.gender || null, captain.vehicleType || 'Unknown', captain.vehicleNumber || 'Not provided',
      captain.licenseNumber || 'Not provided', captain.verificationStatus || 'kyc_pending',
      Number(captain.dashboard?.rating || 0),
      JSON.stringify({ fullName: captain.fullName, dashboard: captain.dashboard || {} }),
      timestamp(captain.createdAt)
    ]);

    const bank = captain.bank || {};
    await client.query(`
      INSERT INTO captain_payment_details (
        id, source_id, captain_id, account_holder, bank_name, account_number_masked,
        ifsc_code, upi_id, qr_file_url, qr_mime_type, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
      ON CONFLICT (source_id) DO UPDATE SET
        account_holder=EXCLUDED.account_holder, bank_name=EXCLUDED.bank_name,
        account_number_masked=EXCLUDED.account_number_masked, ifsc_code=EXCLUDED.ifsc_code,
        upi_id=EXCLUDED.upi_id, qr_file_url=EXCLUDED.qr_file_url,
        qr_mime_type=EXCLUDED.qr_mime_type, updated_at=NOW()
    `, [
      stableUuid('captain-payment', captain.id), captain.id, stableUuid('captain', captain.id),
      bank.accountHolder || captain.fullName || null, bank.bankName || null,
      bank.accountNumber || null, bank.ifsc || null, bank.upiId || null,
      bank.qrDataUrl || null, bank.qrMimeType || null, timestamp(captain.createdAt)
    ]);
  }
}

async function projectLocations(client, db) {
  for (const location of db.locations || []) {
    if (!Number.isFinite(Number(location.lat)) || !Number.isFinite(Number(location.lng))) continue;
    await client.query(`
      UPDATE pickup_hubs SET source_id=$1, updated_at=NOW()
      WHERE source_id IS NULL AND LOWER(name)=LOWER($2) AND LOWER(area)=LOWER($3)
    `, [location.id, location.name, location.area]);
    await client.query(`
      INSERT INTO pickup_hubs (
        id, source_id, name, area, hub_type, pickup_hint, latitude, longitude,
        safety_radius_meters, city, status, priority, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      ON CONFLICT (source_id) DO UPDATE SET
        name=EXCLUDED.name, area=EXCLUDED.area, hub_type=EXCLUDED.hub_type,
        pickup_hint=EXCLUDED.pickup_hint, latitude=EXCLUDED.latitude,
        longitude=EXCLUDED.longitude, safety_radius_meters=EXCLUDED.safety_radius_meters,
        city=EXCLUDED.city, status=EXCLUDED.status, priority=EXCLUDED.priority, updated_at=NOW()
    `, [
      stableUuid('hub', location.id), location.id, location.name, location.area,
      location.type || 'Hub', location.pickupHint || null, Number(location.lat), Number(location.lng),
      Number(location.safetyRadiusMeters || 500), location.city || 'Hyderabad',
      location.status || 'active', Number(location.priority || 100),
      timestamp(location.createdAt), timestamp(location.updatedAt)
    ]);
  }
}

async function projectTripsAndRequests(client, db) {
  const captains = new Map((db.captains || []).map((captain) => [captain.id, captain]));

  for (const route of db.captainRoutes || []) {
    const captain = captains.get(route.captainId);
    await client.query(`
      INSERT INTO captain_trips (
        id, source_id, captain_id, start_location_text, destination_location_text,
        vehicle_type, available_seats, remaining_seats, distance_km,
        current_pin_text, status, metadata, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,NOW())
      ON CONFLICT (source_id) DO UPDATE SET
        start_location_text=EXCLUDED.start_location_text,
        destination_location_text=EXCLUDED.destination_location_text,
        vehicle_type=EXCLUDED.vehicle_type, available_seats=EXCLUDED.available_seats,
        remaining_seats=EXCLUDED.remaining_seats, distance_km=EXCLUDED.distance_km,
        current_pin_text=EXCLUDED.current_pin_text, status=EXCLUDED.status,
        metadata=EXCLUDED.metadata, updated_at=NOW()
    `, [
      stableUuid('trip', route.id), route.id, stableUuid('captain', route.captainId),
      route.fromLocation, route.toLocation, captain?.vehicleType || 'Unknown',
      Math.max(1, Number(route.vacantSeats || 1)), Math.max(0, Number(route.vacantSeats || 0)),
      Number(route.distanceKm || 0), route.currentPin || route.fromLocation,
      route.status || 'active', JSON.stringify(route), timestamp(route.createdAt)
    ]);
  }

  for (const request of db.rideRequests || []) {
    await client.query(`
      INSERT INTO ride_requests (
        id, source_id, rider_id, captain_id, captain_trip_id, pickup_text,
        destination_text, hop_pickup_text, hop_destination_text, requested_seats,
        distance_km, fare_amount, status, captain_message, rider_alert,
        metadata, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb,$17,NOW())
      ON CONFLICT (source_id) DO UPDATE SET
        pickup_text=EXCLUDED.pickup_text, destination_text=EXCLUDED.destination_text,
        hop_pickup_text=EXCLUDED.hop_pickup_text, hop_destination_text=EXCLUDED.hop_destination_text,
        requested_seats=EXCLUDED.requested_seats, distance_km=EXCLUDED.distance_km,
        fare_amount=EXCLUDED.fare_amount, status=EXCLUDED.status,
        captain_message=EXCLUDED.captain_message, rider_alert=EXCLUDED.rider_alert,
        metadata=EXCLUDED.metadata, updated_at=NOW()
    `, [
      stableUuid('request', request.id), request.id, stableUuid('rider', request.riderId),
      stableUuid('captain', request.captainId), stableUuid('trip', request.routeId),
      request.pickup, request.destination, request.hopPickup || request.pickup,
      request.hopDestination || request.destination, Number(request.requestedSeats || 1),
      Number(request.distanceKm || 0), Number(request.fare || 0), request.status || 'pending',
      request.captainMessage || null, request.riderAlert || null,
      JSON.stringify(request), timestamp(request.createdAt)
    ]);
  }
}

async function projectPaymentsReviewsAndAudit(client, db) {
  for (const payment of db.payments || []) {
    await client.query(`
      INSERT INTO payments (
        id, source_id, ride_request_id, rider_id, captain_id, amount, method, status, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (source_id) DO UPDATE SET
        amount=EXCLUDED.amount, method=EXCLUDED.method, status=EXCLUDED.status
    `, [
      stableUuid('payment', payment.id), payment.id, stableUuid('request', payment.requestId),
      stableUuid('rider', payment.riderId), stableUuid('captain', payment.captainId),
      Number(payment.amount || 0), payment.method || 'unknown', payment.status || 'paid',
      timestamp(payment.createdAt)
    ]);
  }

  for (const review of db.reviews || []) {
    await client.query(`
      INSERT INTO reviews (
        id, source_id, ride_request_id, rider_id, captain_id, rating, mood, comment, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (source_id) DO UPDATE SET
        rating=EXCLUDED.rating, mood=EXCLUDED.mood, comment=EXCLUDED.comment
    `, [
      stableUuid('review', review.id), review.id, stableUuid('request', review.requestId),
      stableUuid('rider', review.riderId), stableUuid('captain', review.captainId),
      Math.min(5, Math.max(1, Number(review.rating || 1))),
      review.mood || 'moderate', review.comment || null, timestamp(review.createdAt)
    ]);
  }

  for (const log of db.auditLogs || []) {
    await client.query(`
      INSERT INTO audit_logs (id, source_id, action, payload, created_at)
      VALUES ($1,$2,$3,$4::jsonb,$5)
      ON CONFLICT (source_id) DO UPDATE SET action=EXCLUDED.action, payload=EXCLUDED.payload
    `, [
      stableUuid('audit', log.id), log.id, log.action,
      JSON.stringify(log.payload || {}), timestamp(log.createdAt)
    ]);
  }
}

async function projectNormalizedState(pool, db) {
  const client = await pool.connect();
  try {
    if (!await isProjectionReady(client)) {
      return { projected: false, reason: 'Run npm run db:migrate first' };
    }

    await client.query('BEGIN');
    await projectUsers(client, db);
    await projectProfiles(client, db);
    await projectLocations(client, db);
    await projectTripsAndRequests(client, db);
    await projectPaymentsReviewsAndAudit(client, db);

    const counts = {
      users: db.users?.length || 0,
      riders: db.riders?.length || 0,
      captains: db.captains?.length || 0,
      pickupHubs: db.locations?.length || 0,
      captainTrips: db.captainRoutes?.length || 0,
      rideRequests: db.rideRequests?.length || 0,
      payments: db.payments?.length || 0,
      reviews: db.reviews?.length || 0
    };
    await client.query(`
      INSERT INTO projection_status (projection_key, projected_at, record_counts)
      VALUES ('primary', NOW(), $1::jsonb)
      ON CONFLICT (projection_key)
      DO UPDATE SET projected_at=NOW(), record_counts=EXCLUDED.record_counts
    `, [JSON.stringify(counts)]);
    await client.query('COMMIT');
    return { projected: true, counts };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  projectNormalizedState,
  stableUuid
};
