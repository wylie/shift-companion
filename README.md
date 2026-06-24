# Teams Shifts Companion

Small Microsoft Teams tab app scaffold for a staff-first scheduling companion. This project is intentionally narrow: it helps staff manage unavailability and prepares for future individual schedule export, without trying to replace Microsoft Teams Shifts.

## Product overview

- Teams-contained companion app shell
- Mocked staff and manager roles
- Staff-first views for unavailability and personal schedule
- Narrow manager conflict view for assigned teams only
- Privacy-first copy and architecture
- No Microsoft Graph, YMCA, production auth, or database integration yet

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

## Privacy notes

- Staff should only see their own schedule and unavailability.
- Managers should only see staff and conflict data for teams they manage.
- Future calendar export is individual-only and should be revocable.
- This scaffold uses mocked data only and does not connect to live Shifts or Graph data.

## Roadmap

See:

- [`docs/product-brief.md`](docs/product-brief.md)
- [`docs/privacy-principles.md`](docs/privacy-principles.md)
- [`docs/roadmap.md`](docs/roadmap.md)
- [`docs/teams-integration-notes.md`](docs/teams-integration-notes.md)
