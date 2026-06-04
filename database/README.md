# RideRelay Database

This folder contains the future production database design for RideRelay.

## Current Files

```text
database/
├── schema.sql
├── migrations/
└── seed/
    └── hyderabad_hubs.sql
```

## Recommended Database

Use PostgreSQL for production because RideRelay has structured data:

- Users
- Riders
- Captains
- Vehicles
- Fixed pickup hubs
- Captain trips
- Rider requests
- Ride status events
- Payments
- Reviews
- Reports
- Eco points
- Monthly impact

## Current Prototype Database

The current backend still uses:

```text
backend/data/riderelay-db.json
```

That file is local demo data and is ignored by Git.

## Future Migration Plan

1. Create PostgreSQL database.
2. Run `database/schema.sql`.
3. Run seed files from `database/seed/`.
4. Replace JSON database logic in `backend/db.js` with PostgreSQL queries.
5. Keep the same API routes.

