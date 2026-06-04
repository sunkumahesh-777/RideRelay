# RideRelay Deployment Guide

## Current Deployment Status

RideRelay currently has:

- Frontend in `frontend/`
- Backend in `backend/`
- Database design in `database/`
- GitHub Pages workflow in `.github/workflows/deploy.yml`
- Vercel config in `vercel.json`

## Local Frontend Run

Open terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Frontend opens at:

```text
http://localhost:5173
```

## Local Backend Run

Open another terminal:

```bash
cd frontend
npm run api
```

Backend opens at:

```text
http://localhost:4000
```

Health check:

```text
http://localhost:4000/api/health
```

## Local API Testing

Use the Postman files:

```text
postman/RideRelay.postman_collection.json
postman/RideRelay.environment.json
```

Import both into Postman.

Use environment:

```text
RideRelay Local
```

## GitHub Pages Frontend Deployment

GitHub Pages deployment is handled by:

```text
.github/workflows/deploy.yml
```

Current workflow:

1. Checkout repository.
2. Setup Node.
3. Install dependencies inside `frontend/`.
4. Build frontend.
5. Upload `frontend/dist`.
6. Deploy to GitHub Pages.

Live frontend URL:

```text
https://sunkumahesh-777.github.io/RideRelay/
```

## Vercel Frontend Deployment

The current `vercel.json` tells Vercel:

- Build command: `cd frontend && npm install && npm run build`
- Output directory: `frontend/dist`

Recommended Vercel settings:

```text
Framework: Vite
Root Directory: project root
Build Command: cd frontend && npm install && npm run build
Output Directory: frontend/dist
```

## Backend Deployment Options

The backend is currently a Node.js API server.

Good hosting options:

- Render
- Railway
- Fly.io
- Azure App Service
- AWS Elastic Beanstalk

Recommended starter option:

```text
Render Web Service
```

Render settings:

```text
Build Command: npm install
Start Command: node backend/server.js
Environment: Node.js
Port: 4000 or process.env.PORT
```

## Backend Environment Variables

Future backend `.env` values:

```text
PORT=4000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/riderelay
JWT_SECRET=change-this-secret
FRONTEND_URL=https://sunkumahesh-777.github.io/RideRelay
```

## Database Deployment

Recommended production database:

```text
PostgreSQL
```

Good hosting options:

- Supabase
- Neon
- Render PostgreSQL
- Railway PostgreSQL

Database setup:

1. Create PostgreSQL database.
2. Run `database/schema.sql`.
3. Run seed file `database/seed/hyderabad_hubs.sql`.
4. Add `DATABASE_URL` to backend environment variables.
5. Replace JSON database code with PostgreSQL queries.

## QR Code and Document Storage

For real production, do not store QR images directly in database.

Use cloud storage:

- Cloudinary
- Firebase Storage
- AWS S3
- Supabase Storage

Store only file URL in database:

```text
captain_payment_details.qr_file_url
```

## Deployment Checklist

Before deployment:

- Frontend build passes.
- Backend health check works.
- Postman collection works.
- `.env` values are configured.
- `node_modules` is ignored.
- `backend/data` is ignored.
- GitHub workflow builds from `frontend/`.
- Vercel output directory points to `frontend/dist`.

## Future Production Flow

Recommended production architecture:

```text
Frontend: React + Vite
Backend: Node.js or FastAPI
Database: PostgreSQL
Live location cache: Redis
Maps: Google Maps / OpenStreetMap
Storage: Cloudinary or S3
Deployment: GitHub Pages or Vercel for frontend, Render for backend
```

## Final Deployment Goal

RideRelay should be deployable in three parts:

1. Frontend public website
2. Backend API service
3. Production database

This keeps the project clean, scalable, and ready for mobile app development later.

