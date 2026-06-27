# Roadmap

## Product direction

The roadmap favors operational maturity and careful integration over rapid feature sprawl. The app should remain a companion, not drift toward becoming a second workforce platform.

## Completed phases

### Phase 1: Staff MVP

Completed.

- staff unavailability management
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

### Phase 6: Read-only Microsoft Graph and Teams Shifts integration

Planned.

Scope should stay narrow:

- Phase 6A: provider/adaptor architecture with a safe Graph stub and no live Microsoft calls
- Phase 6B: auth-provider architecture with preview/demo auth active and Microsoft Entra held as a safe stub
- future app-user mapping from verified Entra identity to internal users
- read-only schedule ingestion first
- least-privilege permissions
- no attempt to replace Shifts authoring
- no broad collaboration features

## Later options

### Phase 7: Safer calendar integrations

Possible after identity and revocation controls mature.

- private calendar subscription URLs
- token rotation and revocation
- privacy review around third-party calendar clients

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
