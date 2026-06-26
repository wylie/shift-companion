# Database

## Philosophy

The database exists to support the companion, not to invent a new scheduling source of truth. Persist only what the app owns directly and keep external-system assumptions loose until real integrations exist.

## Current storage modes

### Neon / Postgres

Use Postgres for the normal development and deployment path.

- connection is configured with `DATABASE_URL`
- Drizzle manages schema and SQL migrations
- health reporting checks Postgres availability when configured

### In-memory fallback

If `DATABASE_URL` is absent, the app falls back to in-memory demo data.

Use this mode for:

- UI work
- browser preview
- low-friction local experiments

Do not use this mode for:

- persistence testing
- release validation
- deployment readiness checks

## Environment setup

Required for persisted mode:

- `DATABASE_URL=postgresql://...`

Recommended sequence:

```bash
npm install
npm run db:migrate
npm run db:seed
```

## Neon setup

1. Create a Neon project.
2. Create a database for the app.
3. Copy the connection string into `.env` as `DATABASE_URL`.
4. Keep SSL enabled in the connection string.
5. Run migrations and seed data.

## Migrations

### Generate migration files

```bash
npm run db:generate
```

### Apply migrations

```bash
npm run db:migrate
```

Current committed migrations live in `server/db/migrations/`.

## Seed data

Seed the demo organization with:

```bash
npm run db:seed
```

The seed exists to support product demos, browser preview parity, and local development. It is intentionally demo-only.

## Current schema coverage

The current schema supports:

- organizations
- departments
- users
- department memberships
- unavailability rules
- shifts
- audit events

That set is intentionally small. It supports the MVP without pretending to model every downstream system the YMCA or Microsoft ecosystem may use later.

## Ownership boundaries

The database currently owns data that the companion creates or needs directly:

- app users and preview identities
- department membership mappings
- personal unavailability rules
- persisted demo shifts
- audit events for app actions

The database does not yet own:

- live Teams Shifts schedules
- Microsoft Graph sync state
- revocable calendar subscription tokens
- external calendar provider credentials

## Operational notes

- When Postgres is configured, `/api/health` checks database connectivity.
- Startup validation does not require a database, but it warns when the app is running in in-memory mode.
- For production-like validation, always test against Neon or another Postgres instance.

## Related references

- [database-setup.md](database-setup.md)
- [data-model.md](data-model.md)
