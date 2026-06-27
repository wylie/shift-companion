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

## Source-of-truth boundaries

The source of truth is intentionally split:

- app-owned unavailability remains in Neon/Postgres because it belongs to this companion app
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
