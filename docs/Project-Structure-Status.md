# RideRelay Project Structure Status

## Current Project Phase

RideRelay is currently in the prototype plus early backend API phase.

## Completed Now

Step 1 completed:

- React + Vite frontend moved into `frontend/`.

Step 2 completed:

- Backend kept in `backend/`.
- Backend location seed reader now reads from `frontend/src/App.jsx`.

## Current Folder Structure

Current project path:

`F:\Projects\RideRelay`

Current important folders:

```text
RideRelay/
├── .github/
├── backend/
├── docs/
├── frontend/
├── .gitignore
├── README.md
└── vercel.json
```

## Frontend Folder

The frontend is now placed here:

```text
frontend/
├── public/
├── src/
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── eslint.config.js
```

Run frontend locally:

```bash
cd frontend
npm install
npm run dev
```

Build frontend:

```bash
cd frontend
npm run build
```

## Backend Folder

The backend remains here:

```text
backend/
├── server.js
├── db.js
├── locations.js
└── data/
```

Run backend locally:

```bash
cd frontend
npm run api
```

Backend runs at:

```text
http://localhost:4000
```

## API Completion Status

Current API status:

```text
Completed: 17 / 17
```

Completed APIs:

- Signup API
- Login API
- Get rider profile API
- Update rider profile API
- Get captain profile API
- Update captain profile API
- Create captain trip API
- Search rider route API
- Match captain route API
- Accept rider request API
- Decline rider request API
- Start ride API
- End ride API
- Payment update API
- Review submit API
- Location hubs API
- Route distance API

## Database Status

Current demo database:

```text
backend/data/riderelay-db.json
```

This is local demo data and is ignored by Git.

Future production database should be:

- PostgreSQL for structured records
- Redis for live session/status cache
- Cloud storage for QR code and document uploads

## Node Modules Note

`node_modules` should never be uploaded to GitHub.

Current `.gitignore` already includes:

```text
node_modules
dist
backend/data
```

This means:

- `node_modules` stays local only.
- Build output stays local only.
- Local JSON database records stay local only.

## Next Recommended Phase

Next work can be:

```text
Phase 3: Add database folder with schema.sql
Phase 4: Add Postman API collection
Phase 5: Add admin process
Phase 6: Add deployment guide
```

