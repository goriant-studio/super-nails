# CLAUDE.md

This file gives Claude project-specific guidance for working inside the `SuperNails` repository.

## Project Goal

Build `Super Nails` as a mobile-first Progressive Web App for Vietnamese users.

Near-term goal:
- Deliver a polished booking web app experience on iPhone and Samsung-sized screens.

Long-term goal:
- Reuse the same product logic and API shape later for native iPhone and Android apps.

## Product Direction

The app should feel like a real Vietnamese beauty/service booking app, not a desktop website shrunk down.

Priorities:
- Fast mobile booking flow
- Clear Vietnamese copy
- Large tap targets
- Obvious selected/active states
- Clean hierarchy for salon, date/time, stylist, and service selection
- Smooth PWA experience

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Express
- Database: SQLite via `better-sqlite3`
- Current styling: custom CSS in `client/src/index.css`
- Preferred direction for future UI refactors: Tailwind CSS

## Important Routes

- `/` - home screen
- `/booking` - booking flow
- `/salons` - salon selection
- `/services` - service selection

## Important Files

- `client/src/App.tsx`
- `client/src/pages/home-page.tsx`
- `client/src/pages/booking-page.tsx`
- `client/src/pages/salon-page.tsx`
- `client/src/pages/services-page.tsx`
- `client/src/components/device-shell.tsx`
- `client/src/components/app-bottom-nav.tsx`
- `client/src/index.css`
- `server/src/index.js`
- `server/src/db.js`
- `AGENTS.sh`
- `.nvmrc`

## Commands

Use the helper script when possible:

```bash
./AGENTS.sh help
./AGENTS.sh dev
./AGENTS.sh build
./AGENTS.sh typecheck
./AGENTS.sh health
./AGENTS.sh doctor
./AGENTS.sh repair-native
```

Direct commands:

```bash
npm run dev
npm run build
npm --prefix client run typecheck
```

## Node / Native Module Notes

This repo is pinned to:

```text
v20.19.3
```

from `.nvmrc`.

On macOS, `esbuild` or `better-sqlite3` can break if dependencies were installed under the wrong architecture.

If native modules fail:

```bash
./AGENTS.sh doctor
./AGENTS.sh repair-native
```

## UX Rules For Vietnamese Users

When editing UI, optimize for Vietnamese users first.

### Language

- Use natural Vietnamese, not stiff machine-translated text.
- Keep labels short, familiar, and action-oriented.
- Prefer wording such as:
  - `Đặt lịch`
  - `Chọn salon`
  - `Chọn ngày giờ`
  - `Chọn dịch vụ`
  - `Xác nhận lịch`
  - `Gần bạn`
  - `Có chỗ đậu ô tô`
  - `Ưu đãi`
  - `Đã chọn`
  - `Tổng thanh toán`

### Mobile Layout

- Design for 375px, 390px, and 412px widths first.
- Never build desktop-first layouts and compress them.
- Avoid text overflow, tiny controls, or dense grids.
- Sticky CTAs and sticky summaries must not cover important content.
- Typography must remain readable for Vietnamese text with diacritics.

### Interaction

- Make state changes obvious: selected, active, disabled, booked, premium, nearby.
- Buttons should be large enough for one-handed use.
- Keep booking progression easy to scan:
  1. salon
  2. date/time/stylist
  3. service
  4. confirm

## UI / Design Guidance

Preferred style:
- modern
- clean
- slightly premium
- friendly to Vietnamese salon/spa users

Visual direction:
- deep blue primary
- light background
- soft rounded corners
- controlled shadows
- strong hierarchy

Avoid:
- generic desktop admin UI
- overly flashy animations
- crowded cards
- overly long explanatory paragraphs

## Styling Guidance

If you touch UI substantially, prefer migrating toward Tailwind CSS.

Rules:
- Tailwind should be the default for new UI work.
- It is acceptable to keep old CSS temporarily during migration.
- Do not leave the app half-migrated without clear structure.
- If introducing Tailwind, create reusable primitives/components instead of scattering inconsistent class patterns.

Suggested reusable pieces:
- mobile shell
- app header
- bottom navigation
- section header
- action card
- filter chip
- salon card
- service card
- time slot button
- sticky summary bar

## Backend Rules

- Keep SQLite.
- Do not replace the database with a remote DB.
- Preserve the existing API contract unless there is a strong reason to change it.
- Prefer extending seed data and response shape carefully instead of rewriting the backend.

## Working Style

Before changing code:
- inspect the existing flow
- understand whether the issue is structural or cosmetic

When changing code:
- prefer systematic refactors over patchy fixes
- keep routes stable unless necessary
- keep the booking flow functional at all times

After changing code:
- run typecheck/build when relevant
- summarize what changed
- call out any remaining polish gaps

## Current Main Priority

If the task is about frontend polish, prioritize:
1. mobile layout integrity
2. Vietnamese UX clarity
3. cleaner booking flow
4. Tailwind-based UI refactor
5. visual consistency across home, booking, salon, and service screens

## Default Assumption

If unsure between visual complexity and usability, choose usability.

If unsure between generic global patterns and what fits Vietnamese mobile users, choose what fits Vietnamese mobile users.
