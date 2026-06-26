# Teams Shifts Companion

Teams Shifts Companion is a narrow Microsoft Teams tab companion for YMCA-style departments that already use Microsoft Teams Shifts. It helps staff manage unavailable times, review only their own schedules, and export a personal shift calendar without trying to replace Teams, Shifts, payroll, or messaging.

## Project overview

The product exists because Teams Shifts is strong at manager-owned schedule publishing, but lightweight staff self-service still benefits from a focused companion surface. This app is that surface. It stays small on purpose.

## Goals and non-goals

### Goals

- Give staff a simple place to manage their own unavailable times
- Let staff view only their own shifts
- Let staff export only their own schedule as a one-time calendar file
- Give managers a read-only conflict review surface for departments they manage
- Preserve a clean path toward future Teams tab deployment and identity-backed access

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
- Persisted staff unavailability rules
- Persisted personal schedule view
- Personal `.ics` calendar download
- Read-only manager conflict review
- Teams runtime detection and Entra SSO validation scaffolding
- Postgres persistence through Neon, with in-memory fallback when `DATABASE_URL` is absent

The MVP intentionally does not connect to Microsoft Graph, live Teams Shifts data, or external calendar subscriptions yet.

## Architecture overview

At a high level:

- `src/` contains the React client, Teams runtime detection, and UI state
- `server/` contains the Express API, auth checks, config validation, logging, health reporting, database access, and application services
- `server/services/appService.ts` is the main application boundary for authorization-aware behavior
- `server/data/` contains repository implementations for Postgres and the in-memory demo fallback
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
| `FEEDBACK_EMAIL` | Recommended | Email address used by the Settings feedback links. |
| `APP_DOCUMENTATION_URL` | Optional | Public documentation URL shown in Settings when configured. |
| `TEAMS_APP_ID` | Required for Teams packaging | Teams app ID used in the manifest. |
| `ENTRA_CLIENT_ID` | Required for Teams SSO | Entra app registration client ID. |
| `ENTRA_TENANT_ID` | Required for Teams SSO | Entra tenant ID. |
| `ENTRA_APP_ID_URI` | Required for Teams SSO | App ID URI / resource expected by server-side token validation. |
| `TEAMS_APP_NAME_SHORT` | Required for Teams packaging | Short Teams app display name. |
| `TEAMS_APP_NAME_FULL` | Required for Teams packaging | Full Teams app display name. |
| `TEAMS_DEVELOPER_NAME` | Required for Teams packaging | Developer display name in the manifest. |
| `TEAMS_DEVELOPER_WEBSITE_URL` | Required for Teams packaging | Developer website URL in the manifest. |
| `TEAMS_PRIVACY_POLICY_URL` | Required for Teams packaging | Privacy policy URL in the manifest. |
| `TEAMS_TERMS_OF_USE_URL` | Required for Teams packaging | Terms URL in the manifest. |
| `TEAMS_VALID_DOMAINS` | Required for Teams packaging | Comma-separated domains allowed by the manifest. |

Startup validation now checks `PORT`, `APP_BASE_URL`, `DATABASE_URL`, `FEEDBACK_EMAIL`, and partial Teams SSO configuration.

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
- `npm run version:current` prints the current application version
- `npm run version:check` validates SemVer and changelog structure
- `npm run release:verify` runs release-oriented validation, build, and Teams packaging

## Deployment overview

Deployment has two parts:

1. The web app and API
2. The Teams manifest package that points at that deployment

For deployment guidance, release flow, environment expectations, and health checks, see [docs/deployment.md](docs/deployment.md).

## Roadmap

The near-term direction stays narrow:

- Harden runtime validation, release, and operations
- Keep manager workflows read-only
- Add identity-backed integrations before any scope expansion
- Introduce Microsoft Graph and Teams Shifts in read-only form first
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
- `.github/workflows/ci.yml` for pull request and branch validation
- `.github/workflows/release.yml` for tag-based release validation and Teams package artifacts

## Additional docs

- [docs/architecture.md](docs/architecture.md)
- [docs/database.md](docs/database.md)
- [docs/deployment.md](docs/deployment.md)
- [docs/roadmap.md](docs/roadmap.md)
- [docs/contributing.md](docs/contributing.md)
- [docs/release-checklist.md](docs/release-checklist.md)
- [docs/entra-sso-setup.md](docs/entra-sso-setup.md)
- [docs/teams-local-testing.md](docs/teams-local-testing.md)
- [docs/privacy-principles.md](docs/privacy-principles.md)
