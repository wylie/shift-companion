# Architecture

## Why this companion exists

Teams Shifts Companion exists to handle a narrow slice of scheduling work that is useful to staff but does not justify turning the app into a second scheduling platform. The app is intentionally smaller than Microsoft Teams and smaller than Microsoft Teams Shifts.

The product boundary matters:

- Teams remains the primary collaboration surface
- Teams Shifts remains the scheduling system of record
- This app handles lightweight, privacy-sensitive self-service around personal schedule review and calendar access

## Lightweight companion philosophy

The architecture is shaped by a simple rule: if the workflow is broad, collaborative, or manager-driven by default, it probably belongs in Teams or Shifts rather than here.

That is why the current implementation favors:

- personal views over shared views
- read-only manager tooling over write-heavy orchestration
- explicit privacy boundaries
- server-side authorization checks
- thin integrations that can be expanded later without re-platforming

## What belongs inside the app

Current and likely in-scope responsibilities:

- personal schedule review
- personal calendar export
- private personal calendar subscriptions
- read-only conflict review for managers with assigned departments
- privacy and audit-oriented status messaging
- narrow identity-backed workflows that do not duplicate Teams collaboration features
- dormant availability support preserved outside the default MVP navigation

## What intentionally belongs in Microsoft Teams

These workflows should stay in Teams or Shifts unless a future decision explicitly changes scope:

- team chat and announcements
- shift publishing and schedule ownership
- staff coordination around open shifts
- broad collaboration features
- notifications that are better handled by Teams-native surfaces
- tenant-wide organizational navigation

## System overview

### Client

`src/` contains the React application.

Key responsibilities:

- two primary pages with in-page section navigation inside each page
- Teams host detection
- browser preview fallback
- user-facing loading, empty, and error states
- API calls through `src/data/apiClient.ts`

### Server

`server/` contains the Express application.

Key responsibilities:

- environment and startup validation
- request logging and error handling
- health reporting
- auth-session resolution through preview and future Entra provider boundaries
- repository selection between Postgres and in-memory demo data
- schedule-provider selection between the current Neon/demo source and future external providers
- authorization-aware application behavior through `AppService`

The same Express app is reused in both runtime environments:

- `server/index.ts` calls `app.listen()` for local development
- `api/[...path].ts` exports the shared app for the Vercel Node function entry point
- server typechecking runs under NodeNext rules so Vercel-only ESM import failures are caught locally

### Data

The app uses a repository boundary so the same product behavior can run against:

- Postgres via Drizzle and Neon
- in-memory demo data for browser preview and low-friction development

This keeps UI and service behavior stable while the data backend changes.

### Integration providers

Phase 6A adds a small provider boundary for published schedule data.

Current state:

- `neon-demo` is the active schedule provider by default
- `microsoft-graph` is present only as a stub
- app-owned unavailability remains in the existing repository layer as a dormant feature

This keeps published shifts replaceable later without forcing a rewrite of the current UI flows.

### Authentication providers

Phase 6 adds a parallel auth-provider boundary.

Current state:

- `preview-demo` is the default auth mode
- `microsoft-entra` is a safe stub that returns setup-needed state
- protected routes now resolve identity through one request boundary before applying authorization

This keeps future sign-in work from leaking into route handlers and UI components.

## Request flow

Typical flow:

1. The client initializes browser preview or Teams runtime mode.
2. The client calls `/api/bootstrap`.
3. The server resolves an auth session, then requires a current app user only for protected routes.
4. `AppService` applies authorization rules and returns scoped data.
5. Schedule and calendar-export routes resolve shifts through the active schedule provider.
6. Unavailability, manager review, audit events, and other app-owned behaviors continue through the repository and service layers.

The important constraints are that identity and authorization live on the server, not only in client state, and that schedule access stays primary while secondary workflows remain de-emphasized.

## Primary page shell

The default app shell now renders two primary pages:

1. Schedule & Calendar
2. Settings & Feedback

Within those pages, section anchors still handle direct jumps to `#schedule`, `#calendar`, `#settings`, and `#feedback`. Legacy paths such as `/schedule`, `/calendar`, `/settings`, and `/feedback` are normalized to the matching section hash on the correct primary page.

## Runtime modes

### Browser preview

Browser preview is a development convenience, not real authentication.

- Preview identity switching is available
- Demo users are resolved through the same service and repository layers
- This mode supports local UI work without requiring Teams embedding

### Future Microsoft auth

Microsoft Entra sign-in is the future deployment path.

- The current phase keeps Entra behind a safe stub
- The server boundary already has room for a future verified identity session
- Future sign-in should map Microsoft identities onto existing app users before any Graph-backed schedule data is trusted

## Observability and operational boundaries

The current hardening work adds:

- startup validation
- request IDs and structured logging
- consistent API error payloads
- a health endpoint at `/api/health`

This is intentionally modest infrastructure, but it is enough to support CI, debugging, and deployment checks without introducing heavy platform complexity.

## Future Microsoft Graph integration

Graph integration is future work and should start read-only.

Planned posture:

- use Graph only after identity mapping and authorization boundaries are stable
- pull only the minimum data needed for the companion use case
- avoid broad permissions early
- treat Graph as an integration source, not as a reason to widen the product

The first reasonable step is read-only access to Shifts-related schedule data once tenancy, consent, and user mapping are in place.

See [integration-architecture.md](integration-architecture.md) for the schedule boundary and [auth-architecture.md](auth-architecture.md) for the current auth seam.

## Future calendar integrations

Calendar work should remain conservative.

Safe progression:

1. one-time `.ics` download
2. identity-backed private subscription URLs
3. revocation and regeneration controls
4. only then broader calendar integration conversations

Automatic calendar feeds should not ship before the app can revoke access reliably.
