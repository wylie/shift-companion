# Teams Shifts Companion

Teams Shifts Companion is a narrow Microsoft Teams tab companion for teams that already use Microsoft Teams Shifts. Its job is simple: help people view their work schedule and carry it into the calendar application they already use, without trying to replace Teams Shifts, payroll, or messaging.

## Project overview

The product exists because Teams Shifts is strong at manager-owned schedule publishing, but staff often still need an easier way to see their own shifts in Apple Calendar, Google Calendar, or Outlook. This app is that companion surface. It stays small on purpose.

## Goals and non-goals

### Goals

- Let staff view only their own Teams Shifts schedule
- Let staff export only their own schedule as a one-time calendar file
- Let staff keep a private, revocable calendar subscription for their own schedule
- Preserve a clean path toward future Microsoft sign-in and Teams-backed schedule access
- Keep dormant secondary features available without making them part of the MVP
- Keep the availability feature in the codebase behind `features.unavailability = false` until real user demand is validated

### Non-goals

- Replacing Microsoft Teams Shifts
- Team chat, announcements, or collaboration tooling
- Payroll, time clocks, PTO tracking, or HR workflows
- Shift swaps, approvals, or full workforce management
- Public scheduling or consumer-facing calendars

## Current MVP scope

The current MVP includes:

- React + Vite client with a Teams-compatible tab shell
- Express API with repository/service boundaries
- Browser preview mode with demo identity switching for development only
- Two primary pages: Schedule & Calendar, plus Settings & Feedback
- Persisted personal schedule view
- Personal `.ics` calendar download
- Private, revocable calendar subscription feeds
- Settings with provider diagnostics and planned-feature messaging
- Teams runtime detection plus preview-first auth and schedule boundaries for future Microsoft/Graph integration
- Postgres persistence through Neon, with in-memory fallback when `DATABASE_URL` is absent
- Graph-ready schedule provider boundaries, with the current Neon/demo provider active and a non-functional Microsoft Graph stub reserved for later work
- Auth-provider boundaries, with preview/demo auth active and Microsoft Entra held as a safe stub
- Lightweight provider status reporting in Settings so the active demo path and future Microsoft flags stay explicit
- A Microsoft setup readiness layer that reports `disabled`, `missing_config`, or `ready_to_test` without making Microsoft network calls
- Dormant unavailability and manager-review functionality preserved behind the current product boundary

The MVP intentionally does not connect to Microsoft Graph or live Teams Shifts data yet. It uses the active schedule provider to power one-time downloads and private ICS subscriptions. It is not a replacement for Teams Shifts. It exists to make Teams Shifts more useful.

## Architecture overview

At a high level:

- `src/` contains the React client, Teams runtime detection, and UI state
- `server/` contains the Express API, auth checks, config validation, logging, health reporting, database access, and application services
- `server/services/appService.ts` is the main application boundary for authorization-aware behavior
- `server/auth/` contains the auth-provider boundary, preview auth implementation, and the future Microsoft Entra stub
- `server/data/` contains repository implementations for Postgres and the in-memory demo fallback
- `server/integrations/` contains the Integration Registry, provider interfaces, mapping layer, the current Neon/demo provider, and the future Microsoft Graph stub
- `server/db/` contains schema, migrations, and seed logic
- `teams-app/` contains the Teams app manifest template and icons
- `scripts/` contains project automation such as Teams packaging and version validation

More detail lives in [docs/architecture.md](docs/architecture.md).

## Tech stack

- TypeScript
- React 18
- Vite 5
- Express 5
- Drizzle ORM
- Neon / Postgres
- Vitest
- ESLint
- Microsoft Teams JavaScript SDK

## Local development

### Prerequisites

- Node.js 22.x recommended
- npm 10+
- Optional Neon project or another Postgres-compatible database

### Environment variables

Copy `.env.example` to `.env` and set values as needed.

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | Express API port. Defaults to `8787`. |
| `DATABASE_URL` | No | Neon or Postgres connection string. If omitted, the app uses in-memory demo data. |
| `APP_BASE_URL` | No for browser preview, Yes for Teams packaging | Base URL used by Teams manifest tooling and local Teams testing. |
| `AUTH_MODE` | Optional | Active auth provider selection. Defaults to `preview-demo`. `microsoft-entra` is a safe setup-needed stub only. |
| `FEEDBACK_EMAIL` | Recommended | Email address used by the Settings feedback links. |
| `APP_DOCUMENTATION_URL` | Optional | Public documentation URL shown in Settings when configured. |
| `SCHEDULE_PROVIDER` | Optional | Placeholder schedule-provider selector. Defaults to `neon-demo`. `microsoft-graph` is present only as a safe stub today. |
| `MICROSOFT_AUTH_ENABLED` | Optional | Future Microsoft auth feature flag. Defaults to `false`. |
| `MICROSOFT_GRAPH_ENABLED` | Optional | Future Microsoft Graph / Teams Shifts feature flag. Defaults to `false`. |
| `MICROSOFT_CLIENT_ID` | Optional placeholder | Future Microsoft application client ID. Not required in preview/demo mode. |
| `MICROSOFT_TENANT_ID` | Optional placeholder | Future Microsoft tenant ID. Not required in preview/demo mode. |
| `MICROSOFT_REDIRECT_URI` | Optional placeholder | Future Microsoft auth redirect URI. Not required until real sign-in begins. |
| `MICROSOFT_CLIENT_SECRET` | Optional placeholder | Future server-only secret for Microsoft integration. Do not expose this to the client. |
| `TEAMS_APP_ID` | Required for Teams packaging | Teams app ID used in the manifest. |
| `ENTRA_CLIENT_ID` | Optional placeholder | Future Entra app registration client ID. Not required for the current MVP. |
| `ENTRA_TENANT_ID` | Optional placeholder | Future Entra tenant ID. Not required for the current MVP. |
| `ENTRA_APP_ID_URI` | Optional placeholder | Future App ID URI / resource for token validation. Not required for the current MVP. |
| `TEAMS_APP_NAME_SHORT` | Required for Teams packaging | Short Teams app display name. |
| `TEAMS_APP_NAME_FULL` | Required for Teams packaging | Full Teams app display name. |
| `TEAMS_DEVELOPER_NAME` | Required for Teams packaging | Developer display name in the manifest. |
| `TEAMS_DEVELOPER_WEBSITE_URL` | Required for Teams packaging | Developer website URL in the manifest. |
| `TEAMS_PRIVACY_POLICY_URL` | Required for Teams packaging | Privacy policy URL in the manifest. |
| `TEAMS_TERMS_OF_USE_URL` | Required for Teams packaging | Terms URL in the manifest. |
| `TEAMS_VALID_DOMAINS` | Required for Teams packaging | Comma-separated domains allowed by the manifest. |

Startup validation now checks `PORT`, `APP_BASE_URL`, `DATABASE_URL`, `FEEDBACK_EMAIL`, auth-mode selection, schedule-provider selection, and incomplete Microsoft placeholder setup without crashing preview/demo mode.

## Neon setup

1. Create a Neon project and database.
2. Copy the pooled connection string into `DATABASE_URL`.
3. Keep SSL enabled in the connection string and prefer `sslmode=verify-full`.
4. Run migrations and seed data before starting the app.

Detailed notes live in [docs/database.md](docs/database.md) and the older setup reference at [docs/database-setup.md](docs/database-setup.md).

## Database migrations

Run migrations with:

```bash
npm run db:migrate
```

Generate a new migration after schema changes with:

```bash
npm run db:generate
```

## Seed data

Seed the demo organization with:

```bash
npm run db:seed
```

The seed data exists to preserve the browser preview workflow. It is not production data and should not be treated as a real tenant model.

Demo shifts are generated relative to the current date in normal development and seeded Postgres environments. If your persisted preview schedule looks stale, rerun:

```bash
npm run db:seed
```

That reseed refreshes the demo organization with current-week and future-week shifts so the 1-week and 4-week views stay useful.

## Integration architecture

Published schedule data now passes through a schedule-provider boundary on the server.

Today:

- `neon-demo` is the active provider and uses the existing persisted schedule data
- `microsoft-graph` is an intentional stub for future read-only Teams Shifts work
- feedback remains app-owned and stays in the current database/service layer
- unavailability remains in the codebase and database as a dormant feature, disabled in the current MVP
- `MICROSOFT_GRAPH_ENABLED=false` keeps the Microsoft path safely disabled by default

No Microsoft credentials or Graph SDK setup are required yet.

## Authentication architecture

Current auth behavior now passes through a small auth-provider boundary on the server.

Today:

- `preview-demo` is the active auth mode by default
- preview identity switching remains the working MVP path
- `microsoft-entra` is selectable only as a safe setup-needed stub
- `MICROSOFT_AUTH_ENABLED=false` keeps Microsoft sign-in safely disabled by default
- no Microsoft tenant, OAuth flow, or token verification is required yet

Planned next steps:

- Microsoft / Teams sign-in
- live Teams Shifts schedule reads
- optional return of recurring availability as a secondary feature

Future Entra work should map a verified Microsoft identity to an existing app user without changing the current UI contracts.

## Microsoft groundwork

`v0.2.0` is a groundwork milestone, not a live Microsoft integration release.

It adds:

- safe Microsoft configuration placeholders
- explicit disabled/setup-needed provider status in Settings
- an informational Microsoft setup checklist and readiness checker
- stronger separation between preview/demo data and future Microsoft-backed paths

It does not add:

- real OAuth redirects
- real Microsoft Graph calls
- Teams Shifts API calls
- background sync

`ready_to_test` means the documented Microsoft placeholder config is present for that path. It does not mean real Entra sign-in or Microsoft Graph schedule reads are implemented yet.

## Running locally

Standard persisted flow:

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

This starts:

- Vite on `http://localhost:5173`
- Express on `http://localhost:8787`

Browser-only fallback flow:

```bash
npm install
npm run dev
```

Without `DATABASE_URL`, the API uses in-memory demo data. That mode is acceptable for UI development but not for persistence or release validation.

## Typechecking and build verification

Use the split typecheck commands when working on deployment-sensitive changes:

```bash
npm run typecheck:client
npm run typecheck:server
```

`npm run typecheck:server` runs the API and shared server graph with NodeNext module resolution so local checks fail on the same missing `.js` extensions and server-only module issues that would otherwise break a Vercel function build.

Production builds now run:

```bash
npm run build
```

That command executes both client and server typechecks before `vite build`, so broken API types fail locally, in CI, and on Vercel instead of producing a partial static-only deployment.

## Calendar subscriptions

The app now supports two calendar paths:

- Download `.ics`: a one-time snapshot for a selected 1-week or 4-week window
- Subscribe to calendar: a private ICS feed that external calendar apps can refresh over time

Subscription feed behavior:

- Rolling range: previous 30 days plus next 90 days
- Supported apps: Apple Calendar, Google Calendar, Outlook, and other ICS-compatible clients
- Privacy: tokens are high-entropy, hashed at rest, revocable, and regenerated on demand
- Feed contents: shift title, start time, end time, and location when available
- Excluded data: coworker names, feedback, unavailability, audit data, and internal comments
- Management routes: singular `/api/calendar/subscription` paths for status, create, regenerate, and revoke; plural `/api/calendar/subscriptions/:token/calendar.ics` for the public feed

Important limitations:

- In preview/demo mode, subscription state is tied to the currently selected preview identity
- The raw subscription URL is only shown when first generated or regenerated
- Regenerating a URL immediately invalidates the old feed
- Revoking a subscription immediately disables the feed
- External calendar providers receive the shift data when they fetch the feed

See [docs/calendar-subscriptions.md](docs/calendar-subscriptions.md) for setup guidance and privacy details.

## Product boundary

This app should stay narrow:

- Teams Shifts remains the system of record for schedule publishing

## Primary page flow

The companion now uses two primary pages:

1. Schedule & Calendar
2. Settings & Feedback

The first page combines personal schedule review with all calendar-management tasks. The second page combines settings, developer-facing diagnostics, and feedback. Legacy paths such as `/calendar` or `/feedback` are redirected to the matching section hash on the correct primary page.
- this app focuses on personal schedule access and calendar portability
- feedback should reinforce that scope rather than expand into workforce-management sprawl
- dormant availability tooling can return later, but it is not part of the current MVP

## Testing

Run the full test suite with:

```bash
npm run test
```

Run linting with:

```bash
npm run lint
```

Run type checking with:

```bash
npm run typecheck
```

Run type-aware production build validation with:

```bash
npm run build
```

## Build commands

- `npm run dev` starts the API and Vite dev server
- `npm run build` compiles TypeScript and builds the Vite app
- `npm run preview` starts the Express server against the built client
- `npm run test` runs Vitest
- `npm run typecheck` runs TypeScript project checks
- `npm run lint` runs ESLint with `--max-warnings 0`
- `npm run teams:validate` validates the Teams manifest inputs
- `npm run teams:package` builds the local Teams app package
- `npm run release:check` validates that a release tag matches `package.json`
- `npm run version:current` prints the current application version
- `npm run version:check` validates SemVer and changelog structure
- `npm run release:verify` runs release-oriented validation, build, and Teams packaging

## Deployment overview

Deployment has two parts:

1. The web app and API
2. The Teams manifest package that points at that deployment

For deployment guidance, release flow, environment expectations, and health checks, see [docs/deployment.md](docs/deployment.md).

## Release

For version bumps, changelog updates, tag discipline, and GitHub Release automation, see [docs/release-process.md](docs/release-process.md).

## Roadmap

The near-term direction stays narrow:

- Harden runtime validation, release, and operations
- Keep manager workflows read-only
- Add identity-backed integrations before any scope expansion
- Introduce Microsoft Graph and Teams Shifts in read-only form first
- Replace preview auth with mapped Microsoft Entra sign-in only after the auth boundary is ready
- Evaluate calendar subscriptions only after secure revocation and privacy controls exist

See [docs/roadmap.md](docs/roadmap.md) for the fuller phased plan.

## Feedback philosophy

Feature growth should not happen through ad hoc scope creep. New feature requests should come through the in-app Settings feedback entry so they can be reviewed against the app's lightweight companion philosophy:

- If a workflow belongs naturally in Teams, keep it in Teams
- If a workflow needs only narrow personal self-service, it may belong here
- If a feature expands the app toward a Shifts replacement, it is probably out of scope

## Semantic Versioning strategy

This project follows Semantic Versioning.

- Patch releases are for fixes, maintenance, and non-breaking hardening
- Minor releases are for backward-compatible product additions that still fit the companion philosophy
- Major releases are for intentional breaking changes in API contracts, data model expectations, or runtime behavior

Release metadata is tracked in [CHANGELOG.md](CHANGELOG.md). The release workflows use:

- `npm run version:check` to validate version and changelog structure
- `npm run release:check` to validate that a pushed `vX.Y.Z` tag matches `package.json`
- `.github/workflows/ci.yml` for pull request and branch validation
- `.github/workflows/release.yml` for tag-based validation, Teams package artifacts, changelog-backed release notes, and GitHub Release creation

## Additional docs

- [docs/architecture.md](docs/architecture.md)
- [docs/auth-architecture.md](docs/auth-architecture.md)
- [docs/microsoft-integration.md](docs/microsoft-integration.md)
- [docs/database.md](docs/database.md)
- [docs/deployment.md](docs/deployment.md)
- [docs/integration-architecture.md](docs/integration-architecture.md)
- [docs/roadmap.md](docs/roadmap.md)
- [docs/contributing.md](docs/contributing.md)
- [docs/release-checklist.md](docs/release-checklist.md)
- [docs/entra-sso-setup.md](docs/entra-sso-setup.md)
- [docs/teams-local-testing.md](docs/teams-local-testing.md)
- [docs/privacy-principles.md](docs/privacy-principles.md)
