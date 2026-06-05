# RideRelay Database

This folder contains the production PostgreSQL database design for RideRelay.

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

## Storage Modes

The backend supports two storage modes:

```text
Without DATABASE_URL  -> backend/data/riderelay-db.json
With DATABASE_URL     -> PostgreSQL app_state + local JSON backup
```

The compatibility `app_state` document preserves all current Rider and Captain
API behavior while the normalized tables are connected route-by-route.

## Local PostgreSQL Setup

1. Install PostgreSQL and create a database named `riderelay`.
2. Copy the values from `backend/.env.example` into your environment.
3. Set `DATABASE_URL`.
4. From `backend/`, run `npm run db:migrate`.
5. Run `npm run db:project` to project existing RideRelay data.
6. Run `npm run db:verify` and confirm `"matches": true`.
7. Check the connection with `npm run db:status`.
8. Start the API with `npm start`.

The migration command records applied schema, migration, and seed files in
`schema_migrations`, so it is safe to run again.

## Safe PostgreSQL Read Cutover

Keep this setting during migration:

```text
DB_READ_MODE=compatibility
```

After `npm run db:verify` reports that all collections match, change it to:

```text
DB_READ_MODE=normalized
```

On startup, RideRelay projects the latest durable state first and then rebuilds
the working API state from normalized PostgreSQL tables. If required relational
records are incomplete, startup stops instead of silently losing data.

## Migration Progress

- PostgreSQL connection and durable compatibility storage: completed.
- Normalized production schema: completed.
- Hyderabad pickup hub seed: completed.
- Automatic normalized projection for users, profiles, hubs, trips, requests,
  payments, reviews, and audit logs: completed.
- Controlled normalized PostgreSQL read mode and cutover verification: completed.
- Direct repository queries per API domain: next phase.
