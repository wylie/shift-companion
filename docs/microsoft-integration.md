# Microsoft Integration

## v0.2.0 goal

`v0.2.0` is a groundwork milestone for future Microsoft sign-in and Teams Shifts integration.

It does not connect the app to Microsoft Graph yet.

## What is intentionally not live

This milestone does not add:

- real OAuth redirects
- real Microsoft Graph calls
- Teams Shifts API calls
- background sync jobs
- live calendar subscription feeds

The app must keep working in preview/demo mode without any Microsoft setup.

## Current flags and placeholders

Future Microsoft work now has safe placeholders:

- `MICROSOFT_AUTH_ENABLED=false`
- `MICROSOFT_GRAPH_ENABLED=false`
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_TENANT_ID`
- `MICROSOFT_REDIRECT_URI`
- `MICROSOFT_CLIENT_SECRET`

Current behavior:

- when the flags stay `false`, the app behaves exactly like the current MVP
- when a flag is enabled without full setup, the app shows a safe setup-needed message
- no network requests are made by the stubs

## Readiness states

The config readiness checker only evaluates local configuration presence. It never makes network calls.

Current states:

- `disabled`
  - the related Microsoft feature flag is still off
  - preview/demo mode remains the working path
- `missing_config`
  - a Microsoft feature flag is on, but required environment variables are still missing
  - the app stays in a safe setup-needed state
- `ready_to_test`
  - the documented placeholder configuration exists for that path
  - this means the environment is ready for future controlled integration testing
  - it does not mean real Entra sign-in or Graph schedule reads are implemented yet

Current required placeholder config:

- auth
  - `MICROSOFT_AUTH_ENABLED=true`
  - `MICROSOFT_CLIENT_ID`
  - `MICROSOFT_TENANT_ID`
  - `MICROSOFT_REDIRECT_URI`
- Graph schedule provider
  - `MICROSOFT_GRAPH_ENABLED=true`
  - `MICROSOFT_CLIENT_ID`
  - `MICROSOFT_TENANT_ID`

`MICROSOFT_CLIENT_SECRET` remains a future server-only placeholder. It is documented now, but it is not required for the current readiness check.

## Microsoft setup checklist

The Settings screen now includes an informational Microsoft Setup Checklist. It exists to show what still needs to happen before real Microsoft integration work can be enabled:

1. Create a Microsoft Entra tenant or Microsoft 365 test tenant.
2. Register the app in Microsoft Entra.
3. Configure the redirect URI.
4. Add `MICROSOFT_CLIENT_ID`, `MICROSOFT_TENANT_ID`, and `MICROSOFT_REDIRECT_URI`.
5. Configure required API permissions.
6. Update the Teams app manifest if needed.
7. Verify sign-in.
8. Verify Graph access.
9. Enable `MICROSOFT_AUTH_ENABLED`.
10. Enable `MICROSOFT_GRAPH_ENABLED`.

## Source-of-truth boundaries

The source of truth is intentionally split:

- app-owned unavailability remains in Neon/Postgres because it belongs to this companion app
- app-owned feedback configuration also remains local to this app and deployment
- published shifts should eventually come from Teams Shifts through Microsoft Graph

That boundary matters because the app is not trying to become a second workforce platform.

## Future Azure / Entra setup

Later work will need:

- an Entra app registration
- client and tenant identifiers
- an approved redirect URI
- whichever delegated or server-side credentials are appropriate for the final flow
- explicit permission review before any Graph-backed Shifts reads begin

Those setup steps are documented now only as placeholders. They are not required for local development, Vercel deployment, CI, or the current release flow.
