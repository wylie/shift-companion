# Integration Architecture

## Goal

Phase 6A prepares the app for future Microsoft Graph and Teams Shifts integration without connecting to Microsoft services yet.

Phase 6 extends that work with an auth-provider boundary for future Microsoft Entra sign-in. The app can now evolve identity and schedule integrations independently.

The current MVP remains unchanged in product scope:

- personal unavailability stays app-owned
- personal schedule review stays lightweight
- calendar export stays one-time and individual-only
- demo and persisted Neon-backed data remain the working source today

## Current provider boundary

The server now has a small schedule-provider layer in `server/integrations/`.

Current implementations:

- `neon-demo`
  - active by default
  - wraps the existing persisted schedule data from the repository layer
  - powers current schedule views and calendar export
- `microsoft-graph`
  - intentionally stubbed
  - makes no network requests
  - returns a safe not-configured result

## Why this boundary exists

Without a provider boundary, future Teams Shifts data would force schedule and calendar logic to keep reaching directly into the current data repositories.

With the boundary in place:

- the UI can keep asking for schedules the same way
- calendar export can keep using the same service entry point and the same provider-backed shift data
- the provider can later swap from demo data to Graph-backed data with less churn

## Current source of truth

Today:

- published shifts are served from the existing Neon/demo repository layer
- unavailability rules are app-owned and stay in the app database
- manager review remains a demo/read-only capability built on the same persisted data model

## Future Microsoft Graph direction

Later, published shifts should come from Microsoft Teams Shifts data via Microsoft Graph.

That future integration should stay narrow:

- read-only schedule ingestion first
- least-privilege permissions
- no expansion into full schedule authoring
- no background sync jobs until there is a clear operational need

The current Graph provider stub marks where those calls will eventually live.

## Provider selection

The active schedule provider is selected with:

```text
SCHEDULE_PROVIDER
```

Supported values today:

- `neon-demo`
- `microsoft-graph`

Behavior:

- default is `neon-demo`
- unsupported values fall back safely to `neon-demo`
- selecting `microsoft-graph` does not crash startup, but schedule calls return a clear not-configured result

## No Microsoft setup required yet

Phase 6A and the current auth-boundary work do not require:

- Microsoft credentials
- Graph SDK dependencies
- OAuth setup
- a Microsoft tenant
- background sync

That is intentional. This phase is only about creating a clean seam for future work.

See [auth-architecture.md](auth-architecture.md) for the preview auth provider, the Entra stub, and the app-user mapping direction.
