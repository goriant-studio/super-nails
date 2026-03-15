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
- Current styling: Tailwind CSS with shared tokens/utilities in `client/src/global.css`
- UI direction: Tailwind-first, mobile-first, reusable component primitives

## Important Routes

- `/` - home screen
- `/booking` - booking flow
- `/salons` - salon selection
- `/services` - service selection

## Important Files

- `client/src/App.tsx`
- `client/src/booking-context.tsx`
- `client/src/pages/home-page.tsx`
- `client/src/pages/booking-page.tsx`
- `client/src/pages/salon-page.tsx`
- `client/src/pages/services-page.tsx`
- `client/src/components/MobileShell.tsx`
- `client/src/components/AppHeader.tsx`
- `client/src/components/app-bottom-nav.tsx`
- `client/src/components/StickySummaryBar.tsx`
- `client/src/components/salon-card.tsx`
- `client/src/components/service-card.tsx`
- `client/src/global.css`
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

Tailwind CSS is the default UI system for this repo.

Rules:
- Tailwind should be the default for new UI work.
- Avoid reintroducing large page-specific CSS files as the primary styling layer.
- Keep shared tokens and utilities centralized in `client/src/global.css` and Tailwind config.
- Create reusable primitives/components instead of scattering inconsistent class patterns.

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

## Known Gaps To Address

- Keep this file in sync with the actual codebase. Outdated file maps cause bad AI edits and wrong implementation assumptions.
- The booking API must validate that the chosen stylist belongs to the chosen salon before inserting a booking.
- The app header back action needs a safe fallback route for direct-entry/deep-link sessions.
- The booking header "home" action must not silently stop navigation when paired with local state cleanup.
- Booking confirmation details are currently too coupled to live selection state and can disappear after refresh marks the slot unavailable.
- PWA assets and service worker registration need to be safe for both root-path and subpath deployments.
- The bottom navigation should not point to placeholder routes that mislead users.
- The repo should pass `typecheck`, `lint`, and `build` cleanly before UI polish is considered complete.
- The repo needs basic automated coverage for booking flow, API validation, and primary navigation states.
- Current architecture is still MVP-level; avoid expanding fake features in the UI without backing models/routes.

## Implementation Plan

### Phase 1: Stabilize Navigation, Booking State, And Critical Bugs

Goals:
- remove misleading navigation behavior
- prevent invalid bookings from the API
- make direct-entry PWA flows safer
- keep confirmation/success states reliable after live data refresh
- remove deployment-sensitive path bugs before visual work starts

Tasks:
- Fix the interaction between `client/src/pages/booking-page.tsx` and `client/src/components/AppHeader.tsx` so the leading "home" action can clear transient state without blocking navigation.
- Preserve a booking success snapshot in `client/src/booking-context.tsx` and/or `client/src/pages/booking-page.tsx` so the confirmation banner keeps the booked salon/date/time even after slot availability refreshes.
- Make service worker, manifest, icon, and related client asset paths base-aware in `client/src/main.tsx`, `client/index.html`, and other affected files.
- Fix `client/src/components/app-bottom-nav.tsx` so each tab either routes to a real screen or is clearly disabled/hidden until the feature exists.
- Update `client/src/components/AppHeader.tsx` so `back` falls back to a safe in-app route when browser history is empty or external.
- Add server-side validation in `server/src/db.js` to ensure `stylistId` belongs to `salonId`.
- Return clearer API errors for invalid salon/stylist/service combinations.
- Remove current lint blockers in `client/src/booking-context.tsx` and `client/src/main.tsx` as part of the stabilization pass.

Definition of done:
- users cannot be routed to the wrong screen from the main nav
- direct opens of `/booking`, `/salons`, or `/services` still navigate safely
- invalid stylist/salon payloads are rejected by the server
- booking success still shows correct confirmation details after data refresh
- the app loads correctly from both `/` and configured Vite base paths
- `./AGENTS.sh lint` passes alongside typecheck/build

### Phase 2: Tighten Mobile UI Foundation

Goals:
- improve layout integrity on 375px, 390px, and 412px widths
- make spacing, typography, and sticky elements consistent

Tasks:
- Audit `HomePage`, `BookingPage`, `SalonPage`, and `ServicesPage` for overflow, cramped cards, inconsistent spacing, and sticky footer overlap.
- Normalize page sections using shared wrappers such as `MobileShell`, `AppHeader`, `SectionHeader`, `TimeSlotButton`, `StickySummaryBar`, `salon-card`, and `service-card`.
- Refine typography for Vietnamese labels so text with diacritics remains readable at mobile sizes.
- Verify tap targets, card padding, and CTA hierarchy for one-handed use.
- Revisit safe-area handling and fixed-position bars so sticky summaries, floating hotline CTA, and bottom nav do not collide.
- Replace obviously placeholder UI states or labels such as hard-coded profile identity, fake country badges, and unfinished action affordances.

Definition of done:
- no text clipping or broken card proportions on target phone widths
- sticky summaries and bottom nav never cover actionable content
- shared components express a consistent visual system

### Phase 3: Improve Vietnamese UX In Booking Flow

Goals:
- make the booking journey easier to scan and complete quickly
- reduce hesitation for Vietnamese users on mobile

Tasks:
- Simplify wording across booking steps, salon cards, service cards, and CTAs using natural Vietnamese copy.
- Make selected, active, disabled, premium, and unavailable states more obvious.
- Improve the booking step rail so completion/progress is visually clear from top to bottom.
- Rebalance the order and prominence of salon, stylist, date, time, and service decisions to support quick booking.
- Ensure pricing, dates, and time-slot labels are formatted in a way familiar to Vietnamese users.
- Remove copy that feels overly placeholder, gender-assumptive, or disconnected from actual product state.

Definition of done:
- users can understand the next action at a glance
- selection states are visible without extra explanation
- booking feels closer to a native Vietnamese service app than a resized website

### Phase 4: Polish Salon And Service Discovery

Goals:
- make search, filtering, and browsing feel trustworthy and easy
- reduce visual density without losing important information

Tasks:
- Refine salon search/filter rows for `Gần bạn`, `Có chỗ đậu ô tô`, and `Premium`.
- Re-evaluate default filter states so the salon list does not look unexpectedly sparse on first load.
- Rework salon cards to prioritize hero image, name, address, distance, utility badges, and primary CTA.
- Improve service category chips and service cards so price, duration, and selection status are obvious.
- Review summary/footer states so users always understand how many services are selected and what the current total is.
- Decide whether the services grid/list toggle is truly useful; if not, simplify to one stronger default layout.

Definition of done:
- salon and service lists are easy to scan on small screens
- filter states are obvious
- totals and selected items remain understandable throughout the flow

### Phase 5: Harden Architecture For Next Iteration

Goals:
- reduce implementation risk as the app grows
- prepare the codebase for future native clients

Tasks:
- Introduce lightweight request validation for API payloads before they reach the database layer.
- Separate schema/seed/bootstrap/query/write concerns in the backend over time instead of keeping all logic in one file.
- Add a minimal test layer:
  - booking API success/failure cases
  - invalid stylist/salon combination
  - core booking context state transitions
  - navigation regressions for primary routes
- Keep route contracts stable so future iPhone/Android clients can reuse the same booking flow semantics.

Definition of done:
- core booking logic is protected by tests
- backend validation failures are explicit and consistent
- frontend and backend responsibilities are easier to reason about

### Suggested Execution Order

1. Fix navigation, confirmation-state, deployment-path, and API validation bugs first.
2. Make the project green on `typecheck`, `lint`, and `build`.
3. Clean up mobile layout integrity across all primary screens.
4. Polish Vietnamese UX copy, hierarchy, and states.
5. Improve salon/service discovery screens.
6. Add validation and tests before expanding feature scope.

### Verification Gates

Run before closing any UI/bugfix pass:
- `./AGENTS.sh typecheck`
- `./AGENTS.sh lint`
- `./AGENTS.sh build`

Manual QA checklist:
- verify `/`, `/booking`, `/salons`, and `/services` on 375px, 390px, and 412px widths
- confirm sticky elements do not cover core actions
- confirm booking success preserves visible confirmation details after submission
- confirm root-path and subpath builds both load their static assets correctly

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
4. fix real booking/navigation bugs before adding more screens
5. visual consistency across home, booking, salon, and service screens

## Default Assumption

If unsure between visual complexity and usability, choose usability.

If unsure between generic global patterns and what fits Vietnamese mobile users, choose what fits Vietnamese mobile users.
