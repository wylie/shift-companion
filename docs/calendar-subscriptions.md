# Calendar Subscriptions

## Purpose

Private calendar subscriptions let a staff member subscribe to their own Teams Shifts schedule from Apple Calendar, Google Calendar, Outlook, or another calendar application that supports ICS feeds.

This feature complements, but does not replace, the existing one-time `.ics` download.

## Download vs subscription

- Download `.ics`
  - one-time snapshot
  - selected 1-week or 4-week window
  - best when importing a temporary copy
- Private subscription
  - stable feed URL until regenerated or revoked
  - external calendar apps refresh the feed over time
  - best when the user wants their schedule to stay updated outside Teams

## Feed range

The private feed currently includes:

- recent shifts from the previous 30 days
- upcoming shifts for the next 90 days

That rolling range helps calendar applications update recently edited shifts while still keeping enough future schedule visibility.

## Feed contents

Each event includes only:

- shift title
- start date and time
- end date and time
- location, when available

The feed excludes:

- coworker names
- manager notes
- unavailability data
- feedback data
- audit data
- internal comments
- raw internal identifiers

Event UIDs are stable and opaque so calendar apps can update existing items instead of duplicating them.

## Privacy and security

- Each subscription belongs to exactly one app user.
- Subscription tokens are high-entropy and URL-safe.
- Only token hashes are stored in Neon/Postgres.
- Raw tokens are shown only when first generated or regenerated.
- Regenerating a subscription immediately invalidates the old URL.
- Revoking a subscription immediately disables the feed.
- Invalid and revoked tokens fail with a generic 404 response.
- Feed URLs do not include names, emails, department names, or raw database IDs.
- Feed responses discourage indexing and caching.
- The current implementation intentionally does not store `lastUsedAt`.

## Supported calendar apps

The feed is designed for:

- Apple Calendar
- Google Calendar
- Outlook
- other ICS-compatible subscription clients

Refresh timing depends on the external calendar provider, not on this app.

## Setup guidance

### Apple Calendar

Add the private URL as a calendar subscription, then confirm the refresh behavior that Apple Calendar offers on that device.

### Google Calendar

Use Google Calendar&apos;s “from URL” subscription flow so Google fetches the feed instead of importing a one-time file.

### Outlook

Use Outlook&apos;s subscribe-from-web flow and paste the private feed URL.

## Preview/demo limitation

Until Microsoft Entra sign-in is active:

- subscription creation is tied to the selected preview identity
- switching preview identities changes which subscription state is visible
- one preview identity cannot view or manage another identity&apos;s subscription

Real deployments should use the server-verified Microsoft identity after Entra authentication is enabled.

## Future direction

Today, the feed uses the active schedule provider, which is currently the Neon/demo provider by default.

Later, the same subscription architecture should work with:

- server-verified Microsoft-authenticated users
- Microsoft Graph-backed Teams Shifts schedule reads

That future change should swap the auth and schedule providers, not the subscription URL model.
