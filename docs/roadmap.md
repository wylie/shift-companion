# Roadmap

## Product direction

The roadmap favors operational maturity and careful integration over rapid feature sprawl. The app should remain a companion that makes Teams Shifts more useful, not drift toward becoming a second workforce platform.

## Completed phases

### Phase 1: Personal schedule MVP

Completed.

- personal weekly schedule review
- one-time personal calendar export
- Teams-compatible tab shell

### Phase 2: Read-only manager review

Completed.

- manager-only conflict review
- department-scoped visibility
- no manager write path for schedule ownership

### Phase 3: Persistence and service boundaries

Completed.

- repository and service architecture
- Neon / Postgres support
- migrations and repeatable seed data
- server-side calendar generation
- persisted audit events

### Phase 4: Teams readiness foundations

Completed.

- Teams runtime detection
- Teams app packaging
- placeholder Entra identity data model support
- Teams-ready deployment structure

## Near-term priorities

### Phase 5: Production hardening

Completed.

- environment validation
- startup validation
- structured logging
- health endpoint
- CI/CD and release workflows
- documentation for long-term maintenance

### Phase 6: Microsoft/Graph groundwork and future Teams Shifts integration

In progress.

Scope should stay narrow:

- v0.2.0: integration registry, shared provider models, mapping seams, Microsoft setup checklist/readiness states, explicit configuration placeholders, provider status UI, and safer disabled defaults
- keep preview/demo auth and Neon/demo schedule data working while Microsoft paths stay stubbed
- future app-user mapping from verified Entra identity to internal users
- read-only schedule ingestion first
- personal calendar subscription support after identity and revocation controls exist
- least-privilege permissions
- no attempt to replace Shifts authoring
- no broad collaboration features
- dormant unavailability remains disabled unless it supports the schedule-access mission clearly

## Later options

### Phase 7: Safer calendar integrations

Possible after identity and revocation controls mature.

- private calendar subscription URLs
- token rotation and revocation
- privacy review around third-party calendar clients
- automatic synchronization messaging once real subscriptions exist

### Phase 8: Broader admin or scheduling workflows

Explicitly deferred. This is the point where the team should challenge whether a requested feature belongs in this app at all.

## Ongoing non-goals

The roadmap still excludes:

- payroll
- PTO balances
- time clocks
- chat
- approvals-heavy workflow engines
- a full replacement for Teams Shifts
