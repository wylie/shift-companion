# Teams Shifts Companion

Small Microsoft Teams tab companion for YMCA departments that use Microsoft Teams Shifts. The app stays intentionally narrow: staff manage unavailable times, review their own schedules, and download personal shift calendars without trying to replace Teams Shifts.

## Product overview

- Teams-compatible embedded tab shell for browser preview today
- Demo-only Preview identity selector for switching among persisted demo users
- Persisted staff unavailability flow with add, edit, delete, validation, and multi-day weekly recurring rules
- Persisted personal weekly schedule view scoped to the selected preview user
- Server-side `.ics` calendar download that exports only the selected preview user’s shifts
- Persisted read-only Manager View scoped to assigned departments only
- Centralized server-side repository, service, and authorization layers
- Neon/Postgres migration and seed path for the demo organization
- In-memory fallback only when `DATABASE_URL` is absent, so visual development is still possible without a live database

Aquatics may use Sling and is not the default use case. Default examples stay focused on Teams Shifts departments such as Wellness, Child Watch, Front Desk, Membership, and Facilities.

## Stack

- TypeScript
- React
- Vite
- Express
- Drizzle ORM
- Neon/Postgres
- `@microsoft/teams-js`

## Local setup

### Normal development path

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to a Neon or compatible Postgres database.
3. Run:

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

The app runs with:

- Vite on `http://localhost:5173`
- Express API on `http://localhost:8787`

The Vite dev server proxies `/api` requests to the Express API.

### Visual-only fallback

If `DATABASE_URL` is not set, the server falls back to an in-memory demo repository. This keeps browser preview working, but data will not persist between restarts and does not represent the normal Phase 3 path.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
- `npm run format`
- `npm run test`
- `npm run typecheck`
- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:seed`

## Privacy and authorization notes

- Staff can only view and edit their own unavailability.
- Staff can only view and export their own shifts.
- Managers can only view assigned departments in Manager View.
- Manager View remains read-only.
- Calendar download includes only the selected preview staff member’s shifts.
- Coworker schedules, unavailability notes, and manager-only data are not exposed through staff routes or calendar downloads.
- Server-side queries are scoped by the selected preview identity and department permissions.
- The Preview identity selector is still a demo/developer tool only.
- Real Teams SSO, Microsoft Entra authorization, Microsoft Graph, Teams Shifts integration, and YMCA system integration are still future work.
- Live calendar subscriptions remain intentionally deferred until secure identity, token storage, revocation, and privacy controls exist.

## Phase status

- Phase 1: complete in browser-previewable form
- Phase 2: complete in persisted demo form
- Phase 3: complete with repository/service architecture, Neon/Postgres support, persisted demo data, and server-side calendar downloads
- Phase 4 next: Teams packaging and Entra SSO groundwork

## Additional docs

- [`docs/data-model.md`](docs/data-model.md)
- [`docs/database-setup.md`](docs/database-setup.md)
- [`docs/product-brief.md`](docs/product-brief.md)
- [`docs/privacy-principles.md`](docs/privacy-principles.md)
- [`docs/roadmap.md`](docs/roadmap.md)
- [`docs/teams-integration-notes.md`](docs/teams-integration-notes.md)
