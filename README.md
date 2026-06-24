# Teams Shifts Companion

Small Microsoft Teams tab app for YMCA departments that use Microsoft Teams Shifts. This project is intentionally narrow: it helps staff enter unavailable times now and prepares for future individual schedule export, without trying to replace Microsoft Teams Shifts.

## Product overview

- Teams-contained companion app shell
- Mocked identity preview selector for developer/demo use
- Mocked staff unavailability flow with add, edit, delete, inline validation, and multi-day recurring weekly rules
- Mocked horizontal weekly schedule view with local `.ics` calendar download
- Mocked read-only Manager View for department conflict review
- Persistence-ready repository and data-access layer backed by mocked local data
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
- Phase 2 is complete in mocked/local form.
- Phase 3 has started with a persistence-ready data access layer.
- The current mocked staff unavailability flow supports add, edit, delete, and validation in local state.
- The mocked Phase 1 staff experience now includes local `.ics` downloads for the current staff member's shifts.
- Manager View is mocked, local-only, and read-only.
- Manager View is hidden and guarded for staff users in the current demo experience.
- Manager tools are scoped by mocked identity and assigned departments.
- Conflict detection currently runs against mocked shifts and mocked unavailable rules only.
- Managers should only see staff and conflict data for teams they manage.
- Identity and role handling are still mocked for preview purposes.
- The app still runs with mocked/local data by default.
- A real database will come next after the repository boundaries are stable.
- Real department permissions, Teams SSO, persistence, and Microsoft Graph / Shifts integration remain future work.
- Real authorization must later be enforced server-side after Teams SSO and persistence exist.
- Live calendar subscriptions remain deferred until secure backend identity, authorization, token storage, revocation, and privacy controls exist.
- This scaffold uses mocked data only and does not connect to live Shifts or Graph data.

## Roadmap

See:

- [`docs/data-model.md`](docs/data-model.md)
- [`docs/product-brief.md`](docs/product-brief.md)
- [`docs/privacy-principles.md`](docs/privacy-principles.md)
- [`docs/roadmap.md`](docs/roadmap.md)
- [`docs/teams-integration-notes.md`](docs/teams-integration-notes.md)
