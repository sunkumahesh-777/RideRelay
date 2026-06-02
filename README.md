# RideRelay

RideRelay is a React + Vite web app.

## Share the Project Code

To share the full editable code with a friend:

1. Send them the whole `RideRelay` folder, but do not include `node_modules`.
2. They should install Node.js from https://nodejs.org if they do not already have it.
3. They should open the `RideRelay` folder in VS Code or any code editor.
4. They should run:

```bash
npm install
npm run dev
```

The terminal will show a local website address they can open in their browser.

## Run on Your Phone or Another Device

To test the app on another device on the same Wi-Fi:

1. Start the app on your computer:

```bash
npm run dev
```

2. Find your computer's local IP address.
3. On the other device, open:

```text
http://YOUR-IP-ADDRESS:5173
```

Example:

```text
http://192.168.1.5:5173
```

Both devices must be connected to the same Wi-Fi network.

## Make a Shareable Website Link

For friends who only need to view the site, deploy it with Vercel, Netlify, or GitHub Pages.

Build the production version with:

```bash
npm run build
```

The finished website files will be created in the `dist` folder.

## Run the Backend API

RideRelay now includes a starter backend API using Node.js and a local JSON database.

Start the API server:

```bash
npm run api
```

The backend runs at:

```text
http://localhost:4000
```

Health check:

```text
GET http://localhost:4000/api/health
```

The local database is created automatically at `backend/data/riderelay-db.json`. This file is ignored by Git because it is local demo data.

## Backend API Routes

Auth:

```text
POST /api/auth/signup
POST /api/auth/login
```

Profiles:

```text
GET /api/riders/:riderId/profile
PATCH /api/riders/:riderId/profile
GET /api/captains/:captainId/profile
PATCH /api/captains/:captainId/profile
PATCH /api/captains/:captainId/payment
```

Captain routes and rider requests:

```text
GET /api/captains/:captainId/routes
POST /api/captains/:captainId/routes
POST /api/rider-requests
PATCH /api/captain/requests/:requestId
PATCH /api/rides/:requestId/status
```

Payments and reviews:

```text
POST /api/payments
POST /api/reviews
```

Demo data:

```text
GET /api/bootstrap
```

## Future Real Database Upgrade

This first backend uses a local JSON database so development is easy. For production, replace it with PostgreSQL or MongoDB and store uploaded QR files in cloud storage such as S3, Firebase Storage, or Cloudinary.
