# Integration Architecture

## Goal

The `v0.2.0` milestone prepares the app for future Microsoft Entra authentication and Microsoft Graph / Teams Shifts schedule reads without connecting to Microsoft services yet.

The app can now evolve auth and schedule integrations behind stable internal contracts while keeping the current MVP behavior unchanged:

- personal schedule review stays lightweight
- calendar export stays one-time and individual-only
- demo and persisted Neon-backed data remain the working source today
- dormant unavailability stays app-owned and can be re-enabled later without API or database rewrites

## Design principles

- The UI only understands internal app models.
- The application service asks an integration registry for providers.
- Providers expose status and capabilities without making network calls.
- External provider shapes are mapped into internal models before they reach the UI.
- Unavailability remains app-owned unless a future Microsoft capability clearly replaces it, but it is not part of the current primary MVP flow.

## Integration Registry

`server/integrations/registry.ts` is the central provider factory.

It owns creation and selection of:

- `AuthProvider`
- `ScheduleProvider`
- `CalendarExportProvider`
- `FeedbackProvider`

The rest of the application should not instantiate provider implementations directly. `AppService` requests providers from the registry and then enforces authorization on top of them.

Current default selections:

- auth: `preview-demo`
- schedule: `neon-demo`
- calendar export: same active schedule provider
- feedback: email-backed provider status with a safe disabled state when `FEEDBACK_EMAIL` is missing

## Architecture diagram

```text
React UI
  |
  v
AppService
  |
  v
IntegrationRegistry
  |-- AuthProvider ----------> PreviewAuthProvider
  |                          -> MicrosoftEntraAuthProvider (stub)
  |
  |-- ScheduleProvider ------> NeonScheduleProvider
  |                          -> MicrosoftGraphScheduleProvider (stub)
  |
  |-- CalendarExportProvider -> active ScheduleProvider
  |
  |-- FeedbackProvider ------> EmailFeedbackProvider

Neon/Postgres shift records
  |
  v
Neon mapping layer
  |
  v
Internal Shift model
  |
  v
UI / calendar export
```

## Shared internal models

Shared provider-facing and UI-facing models now live under `src/models/`.

Current shared models include:

- `auth.ts`
  - `AppAuthSession`
  - `AuthMode`
- `integration.ts`
  - `ProviderStatus`
  - `ProviderCapability`
- `schedule.ts`
  - `Shift`
  - `ShiftAssignment`
- `availability.ts`
  - `UnavailabilityRule`
  - `UnavailabilityRuleInput`

`src/types.ts` re-exports these so the UI and server can converge on the same internal shapes without leaking provider-specific payloads.

## Mapping layer

The mapping layer sits between provider-specific records and internal schedule models.

Current mapping path:

```text
Neon/Postgres shift record
  -> server/integrations/mappers/neonScheduleMapper.ts
  -> internal Shift model
  -> AppService / UI / calendar export
```

Later mapping path:

```text
Microsoft Graph / Teams Shifts payload
  -> future Graph mapper
  -> internal Shift model
  -> AppService / UI / calendar export
```

This is why the UI never talks directly to Neon or Graph. The UI consumes app-owned models, not provider payloads.

## Current provider implementations

### `neon-demo`

- active by default
- wraps the existing persisted schedule repository behavior
- maps repository records into internal `Shift` models
- powers current schedule views and calendar export

### `microsoft-graph`

- intentionally stubbed
- makes no network requests
- returns a safe disabled, not-configured, or not-implemented result depending on future flags
- marks the future home for Teams Shifts Graph reads

### `preview-demo`

- active by default
- resolves the selected demo identity
- keeps preview mode explicit and local-only

### `microsoft-entra`

- intentionally stubbed
- never redirects or requests tokens
- reports disabled, not-configured, or future setup-needed states safely

## Provider status and diagnostics

Each provider exposes lightweight metadata for debugging:

- name
- optional version
- configured
- enabled
- availability/status
- capabilities

Settings reads these diagnostics through bootstrap data and shows:

- preview/demo mode state
- active authentication provider and auth mode
- active schedule provider
- calendar export provider status
- Microsoft auth and Microsoft Graph placeholder status
- Microsoft setup readiness and checklist guidance
- feedback provider status
- database runtime summary

No secrets are exposed in this diagnostics view.

## Microsoft readiness layer

`server/integrations/microsoftReadiness.ts` evaluates future Microsoft setup from local config only.

It reports:

- `disabled`
- `missing_config`
- `ready_to_test`

This readiness layer is intentionally narrow:

- it only checks local feature flags and required environment variables
- it never requests tokens
- it never calls Microsoft Graph
- it never validates tenant reachability

Ready-to-test means the documented placeholder config is present for that path. It does not mean the Microsoft integration itself exists yet.

## Current source of truth

Today:

- published shifts are served from the Neon/demo repository layer
- unavailability rules are app-owned, stay in the app database, and are currently dormant in the UI
- manager review remains a demo/read-only capability built on the same persisted data model

Later:

- published shifts should come from Microsoft Teams Shifts via Graph
- app-owned unavailability should remain local unless a future Teams capability proves to be a better fit

## Provider selection

The active providers are selected with configuration rather than UI changes.

Relevant values today:

- `AUTH_MODE`
- `SCHEDULE_PROVIDER`
- `MICROSOFT_AUTH_ENABLED`
- `MICROSOFT_GRAPH_ENABLED`
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_TENANT_ID`
- `MICROSOFT_REDIRECT_URI`
- `MICROSOFT_CLIENT_SECRET` as a future server-only placeholder when needed later

Behavior:

- default auth stays `preview-demo`
- default schedule stays `neon-demo`
- unsupported values fall back safely to preview/demo or Neon/demo
- enabling Microsoft flags without full setup does not crash startup

## No Microsoft setup required yet

`v0.2.0` does not require:

- Microsoft credentials
- Graph SDK dependencies
- OAuth setup
- a Microsoft tenant
- background sync
- Teams Shifts API calls

That is intentional. This phase is only about creating clean seams for future work.

See [auth-architecture.md](auth-architecture.md) for auth boundary details and [microsoft-integration.md](microsoft-integration.md) for future setup placeholders and source-of-truth guidance.
