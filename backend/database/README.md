# Backend Database Entry

`schema.sql` is a backend-local copy of the RideRelay PostgreSQL schema for
developers inspecting or sharing the backend folder.

The repository-level `database/` folder remains the canonical source for
migrations and seed data. Existing local PostgreSQL, GitHub Actions, and
Supabase automation continue to use that single migration source.

The backend accesses the database through `config/db.js` and the scripts in
`backend/scripts/`.
