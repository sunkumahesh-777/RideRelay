function numeric(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function iso(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function parsePassword(value = '') {
  if (value.startsWith('legacy:')) {
    return { password: value.slice(7) };
  }

  const separator = value.indexOf(':');
  return separator > -1
    ? { passwordSalt: value.slice(0, separator), passwordHash: value.slice(separator + 1) }
    : {};
}

async function readNormalizedState(pool) {
  const [
    userResult,
    riderResult,
    captainResult,
    paymentDetailsResult,
    hubResult,
    tripResult,
    requestResult,
    paymentResult,
    reviewResult,
    auditResult
  ] = await Promise.all([
    pool.query(`SELECT * FROM users WHERE source_id IS NOT NULL ORDER BY created_at`),
    pool.query(`SELECT r.*, u.source_id AS user_source_id FROM riders r JOIN users u ON u.id=r.user_id WHERE r.source_id IS NOT NULL ORDER BY r.created_at`),
    pool.query(`SELECT c.*, u.source_id AS user_source_id FROM captains c JOIN users u ON u.id=c.user_id WHERE c.source_id IS NOT NULL ORDER BY c.created_at`),
    pool.query(`SELECT p.*, c.source_id AS captain_source_id FROM captain_payment_details p JOIN captains c ON c.id=p.captain_id WHERE p.source_id IS NOT NULL`),
    pool.query(`SELECT * FROM pickup_hubs WHERE source_id IS NOT NULL ORDER BY priority, name`),
    pool.query(`SELECT t.*, c.source_id AS captain_source_id FROM captain_trips t JOIN captains c ON c.id=t.captain_id WHERE t.source_id IS NOT NULL ORDER BY t.created_at`),
    pool.query(`
      SELECT q.*, r.source_id AS rider_source_id, c.source_id AS captain_source_id, t.source_id AS trip_source_id
      FROM ride_requests q
      JOIN riders r ON r.id=q.rider_id
      JOIN captains c ON c.id=q.captain_id
      JOIN captain_trips t ON t.id=q.captain_trip_id
      WHERE q.source_id IS NOT NULL ORDER BY q.created_at
    `),
    pool.query(`
      SELECT p.*, q.source_id AS request_source_id, r.source_id AS rider_source_id, c.source_id AS captain_source_id
      FROM payments p
      JOIN ride_requests q ON q.id=p.ride_request_id
      JOIN riders r ON r.id=p.rider_id
      JOIN captains c ON c.id=p.captain_id
      WHERE p.source_id IS NOT NULL ORDER BY p.created_at
    `),
    pool.query(`
      SELECT v.*, q.source_id AS request_source_id, r.source_id AS rider_source_id, c.source_id AS captain_source_id
      FROM reviews v
      JOIN ride_requests q ON q.id=v.ride_request_id
      JOIN riders r ON r.id=v.rider_id
      JOIN captains c ON c.id=v.captain_id
      WHERE v.source_id IS NOT NULL ORDER BY v.created_at
    `),
    pool.query(`SELECT * FROM audit_logs WHERE source_id IS NOT NULL ORDER BY created_at DESC LIMIT 200`)
  ]);

  const bankByCaptain = new Map(paymentDetailsResult.rows.map((row) => [
    row.captain_source_id,
    {
      accountHolder: row.account_holder || '',
      bankName: row.bank_name || '',
      accountNumber: row.account_number_masked || '',
      ifsc: row.ifsc_code || '',
      upiId: row.upi_id || '',
      qrFileName: row.metadata?.qrFileName || '',
      qrMimeType: row.qr_mime_type || '',
      qrDataUrl: row.qr_file_url || ''
    }
  ]));

  const state = {
    users: userResult.rows.map((row) => ({
      id: row.source_id,
      role: row.role,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      ...parsePassword(row.password_hash),
      status: row.status,
      createdAt: iso(row.created_at)
    })),
    riders: riderResult.rows.map((row) => ({
      id: row.source_id,
      userId: row.user_source_id,
      fullName: row.metadata?.fullName || '',
      homeStop: row.home_stop || '',
      gender: row.gender || '',
      emergencyContact: row.emergency_contact || '',
      verificationStatus: row.verification_status,
      walletBalance: numeric(row.wallet_balance),
      createdAt: iso(row.created_at)
    })),
    captains: captainResult.rows.map((row) => ({
      id: row.source_id,
      userId: row.user_source_id,
      fullName: row.metadata?.fullName || '',
      gender: row.gender || '',
      vehicleType: row.vehicle_type,
      vehicleNumber: row.vehicle_number,
      licenseNumber: row.license_number,
      verificationStatus: row.verification_status,
      bank: bankByCaptain.get(row.source_id) || {},
      dashboard: {
        ...(row.metadata?.dashboard || {}),
        rating: numeric(row.average_rating)
      },
      createdAt: iso(row.created_at)
    })),
    captainRoutes: tripResult.rows.map((row) => ({
      ...(row.metadata || {}),
      id: row.source_id,
      captainId: row.captain_source_id,
      fromLocation: row.start_location_text,
      toLocation: row.destination_location_text,
      availableSeats: numeric(row.available_seats, 1),
      vacantSeats: numeric(row.remaining_seats),
      distanceKm: numeric(row.distance_km),
      status: row.status,
      currentPin: row.current_pin_text || row.start_location_text,
      createdAt: iso(row.created_at)
    })),
    rideRequests: requestResult.rows.map((row) => ({
      ...(row.metadata || {}),
      id: row.source_id,
      riderId: row.rider_source_id,
      captainId: row.captain_source_id,
      routeId: row.trip_source_id,
      pickup: row.pickup_text,
      destination: row.destination_text,
      hopPickup: row.hop_pickup_text,
      hopDestination: row.hop_destination_text,
      requestedSeats: numeric(row.requested_seats, 1),
      distanceKm: numeric(row.distance_km),
      fare: numeric(row.fare_amount),
      status: row.status,
      captainMessage: row.captain_message || '',
      riderAlert: row.rider_alert || '',
      createdAt: iso(row.created_at)
    })),
    locations: hubResult.rows.map((row) => ({
      id: row.source_id,
      name: row.name,
      area: row.area,
      type: row.hub_type,
      pickupHint: row.pickup_hint || '',
      lat: numeric(row.latitude),
      lng: numeric(row.longitude),
      city: row.city,
      status: row.status,
      safetyRadiusMeters: numeric(row.safety_radius_meters, 500),
      priority: numeric(row.priority, 100),
      source: 'PostgreSQL',
      createdAt: iso(row.created_at),
      updatedAt: iso(row.updated_at)
    })),
    payments: paymentResult.rows.map((row) => ({
      id: row.source_id,
      requestId: row.request_source_id,
      riderId: row.rider_source_id,
      captainId: row.captain_source_id,
      amount: numeric(row.amount),
      method: row.method,
      status: row.status,
      createdAt: iso(row.created_at)
    })),
    reviews: reviewResult.rows.map((row) => ({
      id: row.source_id,
      requestId: row.request_source_id,
      riderId: row.rider_source_id,
      captainId: row.captain_source_id,
      rating: numeric(row.rating),
      mood: row.mood,
      comment: row.comment || '',
      createdAt: iso(row.created_at)
    })),
    auditLogs: auditResult.rows.map((row) => ({
      id: row.source_id,
      action: row.action,
      payload: row.payload || {},
      createdAt: iso(row.created_at)
    }))
  };

  if (!state.users.length || !state.riders.length || !state.captains.length) {
    throw new Error('Normalized PostgreSQL state is incomplete');
  }

  return state;
}

module.exports = { readNormalizedState };
