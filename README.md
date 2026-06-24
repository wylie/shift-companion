# Teams Shifts Companion

Small Microsoft Teams tab app for YMCA departments that use Microsoft Teams Shifts. This project is intentionally narrow: it helps staff enter unavailable times now and prepares for future individual schedule export, without trying to replace Microsoft Teams Shifts.

## Product overview

- Teams-contained companion app shell
- Mocked staff unavailability flow with add, edit, delete, and inline validation
- Mocked weekly schedule view with local `.ics` calendar download
- Mocked read-only Manager View for department conflict review
- Mocked staff and manager roles
- Staff-first views for unavailability and personal schedule
- Narrow manager conflict view for assigned teams only
- Privacy-first copy and architecture
- No Microsoft Graph, YMCA, production auth, or database integration yet

Aquatics may use Sling and is not the default use case for this app. Default examples stay focused on Teams Shifts departments such as Wellness, Child Watch, Front Desk, Membership, and Facilities.

## Stack

- TypeScript
- React
- Vite
- `@microsoft/teams-js`
- Local mocked data only

## Local setup

```bash
npm install
npm run dev
```

Then open the local Vite URL in a browser. The app is structured so Teams SDK initialization can be expanded later for a real Teams tab package.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
- `npm run format`
- `npm test`

## Privacy notes

- Staff should only see their own schedule and unavailability.
- The current mocked staff unavailability flow supports add, edit, delete, and validation in local state.
- The mocked Phase 1 staff experience now includes local `.ics` downloads for the current staff member's shifts.
- Manager View is mocked, local-only, and read-only.
- Manager View is hidden and guarded for staff users in the current demo experience.
- Conflict detection currently runs against mocked shifts and mocked unavailable rules only.
- Managers should only see staff and conflict data for teams they manage.
- Real department permissions, Teams SSO, persistence, and Microsoft Graph / Shifts integration remain future work.
- Live calendar subscriptions remain deferred until secure backend identity, authorization, token storage, revocation, and privacy controls exist.
- This scaffold uses mocked data only and does not connect to live Shifts or Graph data.

## Roadmap

See:

- [`docs/product-brief.md`](docs/product-brief.md)
- [`docs/privacy-principles.md`](docs/privacy-principles.md)
- [`docs/roadmap.md`](docs/roadmap.md)
- [`docs/teams-integration-notes.md`](docs/teams-integration-notes.md)
