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

Start the app in development:

```bash
npm run dev
```

Or use the helper script:

```bash
./AGENTS.sh dev
```

- Web app: [http://localhost:5173](http://localhost:5173)
- API: [http://localhost:3001/api/health](http://localhost:3001/api/health)

## Production-style PWA run

Build both client and server:

```bash
npm run build
```

Start the Express server, which serves the built PWA:

```bash
npm start
```

Then open [http://localhost:3001](http://localhost:3001).

## Helper script

`AGENTS.sh` wraps the common project commands:

```bash
./AGENTS.sh help
./AGENTS.sh install
./AGENTS.sh dev
./AGENTS.sh build
./AGENTS.sh start
./AGENTS.sh typecheck
./AGENTS.sh health
./AGENTS.sh doctor
./AGENTS.sh repair-native
```

## Node version

This repo is set up for Node `v20.19.3` via [.nvmrc](/Users/lamle/Development/SuperNails/.nvmrc).

If native modules ever break because of an x64/arm64 mismatch on macOS, run:

```bash
./AGENTS.sh doctor
./AGENTS.sh repair-native
```

## Database

The SQLite file is created automatically at:

```text
server/data/super-nails.sqlite
```

It is seeded on startup with demo salons, stylists, services, and booking slots.
