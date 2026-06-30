# Auth Architecture

## Goal

The `v0.2.0` milestone extends the MVP with an auth-provider boundary so future Microsoft Entra sign-in can replace preview identity selection without forcing a rewrite of the UI or API contracts.

This phase does not add:

- real OAuth flows
- real Entra sign-in
- token acquisition redirects
- tenant requirements
- Microsoft Graph calls

## Current auth modes

The server now resolves auth through a small provider interface in `server/auth/`.

Current states:

- `preview-demo`
  - default mode
  - resolves the selected demo user
  - powers local development, Vercel demo environments, and the current MVP
- `microsoft-entra-not-configured`
  - returned when Microsoft auth is still disabled or future Microsoft setup is incomplete
  - keeps the app in a safe setup-needed state
- `microsoft-entra-future`
  - returned when future Microsoft auth is enabled and placeholder setup exists
  - still does not authenticate anyone yet

## Why this boundary exists

Before this phase, preview user parsing and future Teams identity assumptions were mixed into route handlers and service code.

The new boundary keeps three concerns separate:

- request parsing
- auth-session resolution
- authorization against app-owned users and roles

That separation matters because future Entra work should only replace the provider implementation, not the schedule UI, unavailability UI, or calendar export flow.

## Current provider implementations

### PreviewAuthProvider

`PreviewAuthProvider` wraps the existing demo identity behavior.

It:

- resolves the selected preview user from request inputs
- falls back to the first preview user when needed
- returns an authenticated app user immediately
- keeps preview mode clearly labeled as demo-only

### MicrosoftEntraAuthProvider

`MicrosoftEntraAuthProvider` is intentionally a stub.

It:

- never redirects
- never requests tokens
- never requires a Microsoft tenant
- returns a safe setup-needed session instead of throwing

Future Entra token verification and app-user mapping will live here later.

Current placeholder inputs live behind:

- `MICROSOFT_AUTH_ENABLED`
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_TENANT_ID`
- `MICROSOFT_REDIRECT_URI`
- `MICROSOFT_CLIENT_SECRET` for future server-only work when needed

The readiness checker now reports:

- `disabled` when `MICROSOFT_AUTH_ENABLED=false`
- `missing_config` when auth is enabled without the required placeholder values
- `ready_to_test` when the future auth placeholder config is present

Ready-to-test does not mean sign-in is implemented. It only means the local environment is prepared for future controlled testing.

## Server-side request flow

The request flow is now:

1. `server/auth/requestContext.ts` parses auth-related request inputs.
2. `AppService.resolveRequestUser()` asks the active auth provider for an auth session.
3. `AppService.requireCurrentUser()` turns that session into a required app user for protected routes.
4. Authorization remains inside `AppService` and existing access helpers.

This keeps route handlers from parsing preview-user headers ad hoc.

## App-user mapping direction

Future Entra work should map a Microsoft identity to an existing app user record through stable identifiers such as:

- tenant ID
- Entra object ID
- user principal name
- email as a fallback only where appropriate

That mapping should happen before any Graph-backed schedule data is trusted.

## Relationship to Graph integration

The auth boundary and the schedule-provider boundary are complementary:

- auth decides who the current app user is
- schedule providers decide where that user's published shifts come from

Later, a verified Entra identity can map to an app user, and the Graph schedule provider can fetch only that user's published shift data.

## What remains app-owned

Even after Entra sign-in arrives, the current plan is:

- published shifts may come from Teams Shifts
- unavailability remains app-owned unless a later product decision changes that
- authorization remains enforced by the app's own user, role, and department model

No Microsoft tenant is required yet. Preview/demo auth remains the active MVP path.
