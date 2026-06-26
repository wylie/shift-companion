# Contributing

## Working principle

Contributions should make the current product clearer, safer, and easier to maintain before they make it broader.

When deciding whether to add something, start with this question:

Does this keep the app a lightweight companion, or does it push the app toward replacing Teams or Shifts?

## Local workflow

1. Copy `.env.example` to `.env`.
2. Install dependencies with `npm install`.
3. If using Postgres, run `npm run db:migrate` and `npm run db:seed`.
4. Start local development with `npm run dev`.

## Required quality checks

Before merging changes, run:

```bash
npm run lint
npm run test
npm run build
```

For release-oriented work, also run:

```bash
npm run release:verify
```

## Scope discipline

Preferred work:

- documentation
- testing
- CI/CD
- validation
- error handling
- release hygiene
- privacy hardening

Changes that need extra scrutiny:

- new user-facing features
- broader manager workflows
- integrations that widen scope beyond the companion philosophy

## Documentation expectations

Update docs when changes affect:

- setup
- environment variables
- architecture boundaries
- deployment flow
- release flow
- roadmap assumptions

The README should stay accurate for a new maintainer who has never run the project before.

## Feedback philosophy

Feature requests should be funneled through the in-app feedback links or tracked product discussion, not silently added during maintenance work.

This keeps the product honest about:

- what belongs inside the app
- what belongs in Teams
- what requires future Graph or calendar integration

## Semantic versioning and releases

- Keep `package.json` version in valid SemVer format.
- Update `CHANGELOG.md` for user-visible or operationally meaningful changes.
- Use tags in the form `vX.Y.Z`.
- Use `npm run version:check` to validate release metadata locally.

## Related references

- [../README.md](../README.md)
- [architecture.md](architecture.md)
- [deployment.md](deployment.md)
