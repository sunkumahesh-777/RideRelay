# RideRelay Supabase Automation

RideRelay uses Supabase as a hosted PostgreSQL database. The frontend must not
receive the database password. The Node backend connects to Supabase and keeps
all rider, captain, route, payment, and review rules inside the RideRelay API.

## Create the Supabase project

1. Create a Supabase project.
2. Open **Connect** in the Supabase dashboard.
3. Copy the **Session pooler** connection URI. It works well for the persistent
   RideRelay Node backend and IPv4 environments.
4. Replace the password placeholder in the copied URI with the database
   password. URL-encode special password characters when necessary.

## Configure GitHub secrets

Open the RideRelay GitHub repository:

**Settings -> Secrets and variables -> Actions -> New repository secret**

Create:

| Secret | Value |
| --- | --- |
| `SUPABASE_DATABASE_URL` | Supabase Session pooler connection URI |
| `RIDERELAY_JWT_SECRET` | A long random secret used to sign RideRelay login tokens |

Never add either value to Git, frontend environment variables, screenshots, or
chat messages.

## Automatic deployment

The `Deploy Supabase Database` GitHub workflow runs when backend or database
files reach `main`. It:

1. Validates the backend.
2. Applies pending schema, migration, and seed files.
3. Projects RideRelay records into normalized PostgreSQL tables.
4. Verifies local and Supabase records match.
5. Reports the final database status.

The workflow can also be started manually from:

**GitHub -> Actions -> Deploy Supabase Database -> Run workflow**

## Local deployment

Copy `backend/.env.supabase.example` to `backend/.env` and insert the Supabase
connection URI. Then run:

```text
cd backend
npm install
npm run db:supabase:deploy
```

Use `PGSSL=require` and `DB_READ_MODE=normalized`.

## Backend hosting

Add the same secure environment values to the backend hosting provider:

```text
DATABASE_URL=<Supabase Session pooler URI>
PGSSL=require
DB_READ_MODE=normalized
JWT_SECRET=<long random secret>
```

The frontend should receive only the deployed RideRelay API URL through
`VITE_API_BASE_URL`.

## Safety

- Supabase database credentials stay server-side.
- Existing migration keys make repeated deployments safe.
- A failed migration stops the workflow.
- Verification must pass before the deployment is considered successful.
- Keep Supabase Row Level Security enabled before exposing any Supabase Data API
  directly to a frontend. RideRelay currently uses its secured Node API instead.
