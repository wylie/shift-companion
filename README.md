# Teams Shifts Companion

Small Microsoft Teams tab companion for YMCA departments that use Microsoft Teams Shifts. The app stays intentionally narrow: staff manage unavailable times, review their own schedules, and download personal shift calendars without trying to replace Teams Shifts.

## Product overview

- Teams-compatible embedded tab shell for browser preview today
- Teams-tab-ready runtime boundary with browser preview, Teams host detection, and Teams SSO token flow
- Demo-only Preview identity selector for switching among persisted demo users
- Persisted staff unavailability flow with add, edit, delete, validation, and multi-day weekly recurring rules
- Persisted personal weekly schedule view scoped to the selected preview user
- Server-side `.ics` calendar download that exports only the selected preview user’s shifts
- Persisted read-only Manager View scoped to assigned departments only
- Centralized server-side repository, service, and authorization layers
- Neon/Postgres migration and seed path for the demo organization
- Teams manifest template with `webApplicationInfo`, placeholder icons, and package assembly scripts
- Server-side Microsoft Entra token verification and persisted Teams-user mapping
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
3. Set `APP_BASE_URL` to the browser or tunnel URL you want the tab manifest to use.
4. For Teams SSO testing, also set:
   - `TEAMS_APP_ID`
   - `ENTRA_CLIENT_ID`
   - `ENTRA_TENANT_ID`
   - `ENTRA_APP_ID_URI`
5. Run:

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

## Runtime modes

### Browser preview

- Primary development mode
- Shows the Preview identity selector
- Keeps the existing demo-data framing
- Uses persisted or fallback demo data through the API

### Teams mode

- Initializes the Microsoft Teams JavaScript SDK only when the app is embedded
- Hides the Preview identity selector
- Requests a Teams tab SSO token through the Teams SDK
- Sends that token to the server for verification before any app-user identity is trusted
- Maps the verified Teams or Entra identity to a persisted app user
- Shows a setup-needed message if SSO is not configured, token validation fails, or the signed-in Teams user is not mapped
- Keeps Microsoft Graph, Teams Shifts, and YMCA data disconnected

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
- `npm run teams:validate`
- `npm run teams:package`

## Privacy and authorization notes

- Staff can only view and edit their own unavailability.
- Staff can only view and export their own shifts.
- Managers can only view assigned departments in Manager View.
- Manager View remains read-only.
- Calendar download includes only the selected preview staff member’s shifts.
- Coworker schedules, unavailability notes, and manager-only data are not exposed through staff routes or calendar downloads.
- Server-side queries are scoped by the selected preview identity and department permissions.
- The Preview identity selector is still a demo/developer tool only.
- Preview identity is hidden when the app is running inside Teams.
- Teams runtime context alone is not treated as proof of identity.
- Teams mode uses a server-verified Entra token before app data is returned.
- Real Microsoft Graph, Teams Shifts integration, and YMCA system integration are still future work.
- Live calendar subscriptions remain intentionally deferred until secure identity, token storage, revocation, and privacy controls exist.

## Teams packaging

- `teams-app/manifest.template.json` contains the manifest template.
- `teams-app/color.png` and `teams-app/outline.png` are placeholder icons that are easy to replace later.
- `npm run teams:validate` checks the current manifest configuration and required files.
- `npm run teams:package` assembles a local app package zip in `teams-app/dist/`.
- The manifest now includes `webApplicationInfo` placeholders for Teams SSO.

## What is still needed before testing inside Teams

- A Microsoft 365 developer/test tenant or organization admin support
- A reachable HTTPS URL or tunnel for the tab content when Teams needs to load the app
- Real manifest values for app ID, developer info, URLs, valid domains, and `webApplicationInfo`
- A matching Microsoft Entra app registration and persisted user mapping

## Phase status

- Phase 1: complete in browser-previewable form
- Phase 2: complete in persisted demo form
- Phase 3: complete with repository/service architecture, Neon/Postgres support, persisted demo data, and server-side calendar downloads
- Phase 4: complete with Teams packaging, runtime detection, Entra SSO token handling, and server-side identity mapping
- Phase 5 next: read-only Microsoft Graph and Teams Shifts integration

## Additional docs

- [`docs/data-model.md`](docs/data-model.md)
- [`docs/database-setup.md`](docs/database-setup.md)
- [`docs/product-brief.md`](docs/product-brief.md)
- [`docs/privacy-principles.md`](docs/privacy-principles.md)
- [`docs/roadmap.md`](docs/roadmap.md)
- [`docs/entra-sso-setup.md`](docs/entra-sso-setup.md)
- [`docs/teams-integration-notes.md`](docs/teams-integration-notes.md)
- [`docs/teams-local-testing.md`](docs/teams-local-testing.md)
