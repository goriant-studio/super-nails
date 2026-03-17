# Super Nails

Mobile-first Super Nails web app built as a progressive web app with a lightweight SQLite backend.

## Stack

- `client/`: React + TypeScript + Vite
- `server/`: Express + SQLite via `better-sqlite3`
- PWA assets: `client/public/manifest.webmanifest`, `client/public/sw.js`

## Features

- Booking home flow inspired by the reference screenshots
- Salon selection with search, province chips, and filter pills
- Stylist, date, and time-slot selection
- Service selection with sticky total summary
- SQLite seed data for salons, stylists, services, and time slots
- Booking API that stores reservations and blocks booked slots

## Run locally

Install dependencies:

```bash
npm install
npm --prefix client install
npm --prefix server install
```

Start the client and local Express API:

```bash
npm run dev
```

By default the client uses the local API. When `VITE_API_URL` is unset, browser requests stay on `/api` and Vite proxies them to `http://127.0.0.1:3001`.

To opt into the hosted API for manual testing, copy [`client/.env.example`](/Users/lamle/Development/SuperNails/client/.env.example) to `client/.env.local` and set `VITE_API_URL` there.

- Web app: [http://127.0.0.1:5173](http://127.0.0.1:5173)
- API: [http://127.0.0.1:3001/api/health](http://127.0.0.1:3001/api/health)

## Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm start
npm run test:e2e
```

## API shape

- `GET /api/health`
- `GET /api/static`
- `GET /api/slots?salonId=...&date=YYYY-MM-DD`
- `POST /api/bookings`
- `GET /api/bootstrap` is still available as a legacy endpoint and static fallback source

## Production-style PWA run

Build both client and server:

```bash
npm run build
```

Start the Express server, which serves the built PWA:

```bash
npm start
```

Then open [http://127.0.0.1:3001](http://127.0.0.1:3001).

## Node version

This repo is set up for Node `v20.19.3` via [.nvmrc](/Users/lamle/Development/SuperNails/.nvmrc).

If native modules break because of an x64/arm64 mismatch on macOS, remove `node_modules`, `client/node_modules`, and `server/node_modules`, then reinstall under the pinned Node version.

## Database

The SQLite file is created automatically at:

```text
server/data/super-nails.sqlite
```

It is seeded on startup with demo salons, stylists, services, and booking slots.
