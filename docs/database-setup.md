# Database Setup

## Environment

Create `.env` from `.env.example` and set:

- `DATABASE_URL`: Neon or compatible Postgres connection string
- `PORT`: optional API port, defaults to `8787`

## Local commands

```bash
npm run db:migrate
npm run db:seed
```

## Normal development flow

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

## Schema coverage

Current migration includes:

- `organizations`
- `departments`
- `users`
- `department_memberships`
- `unavailability_rules`
- `shifts`
- `audit_events`

The schema supports:

- multi-day weekly recurring unavailability
- one-time date unavailability
- date-range unavailability
- optional notes
- department-scoped manager memberships
- staff shift ownership
- persisted audit events

## Seed data

The seed process creates one persisted demo organization with:

- Departments: Wellness, Front Desk, Membership, Child Watch, Facilities
- Preview identities:
  - Jordan Lee — Staff, Wellness
  - Morgan Smith — Manager, Wellness
  - Avery Patel — Manager, Front Desk + Membership
- Additional demo staff, shifts, unavailability rules, and audit events

Seed data is explicitly demo-only and is meant to preserve the current browser preview experience.

Demo shifts are generated relative to the current date when the seed runs. If the preview schedule does not show useful current-week data, rerun `npm run db:seed`.

## Fallback mode

If `DATABASE_URL` is missing, the app falls back to an in-memory demo repository for visual development only. That fallback is not the normal Phase 3 path and does not persist changes across restarts.

## Future work

- revocation and regeneration support
- secure identity-backed authorization records
- real Teams/Entra/Graph integration
