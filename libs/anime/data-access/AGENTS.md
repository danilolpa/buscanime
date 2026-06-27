# libs/anime/data-access — data layer (`anime-data-access`)

AniList data layer: HTTP transport, GraphQL → domain mapping, and React Query
hooks. **No presentation React, no UI JSX** — does not import `ui`.
(Lint-enforced: `data-access` depends only on `data-access`/`util`.)

## Structure (`src/lib/`)

- `anilist/` — transport: `client.ts`, `endpoint.ts`, `errors.ts` (`/api/anilist` proxy).
- `anime-list/` — listing: page fetch, query options, query key, normalize,
  transform, `use-anime-list.ts`, `constants.ts`.
- `anime-detail/` — detail: `fetch.ts`, `transform.ts`.
- `format-counts/` — counts per format.
- `graphql/generated/` — **codegen output — do NOT hand-edit.**

Everything public is exported from `src/index.ts` (internal imports use `.js` ext, ESM).

## Build & consumption (important gotcha)

This lib is **consumed via build (dist)** by the app — **no HMR** in `nx dev web`.
After changing anything here, run `pnpm nx build anime-data-access`
(or `nx build web`) for the app to see the change.

## GraphQL

- Changed a query/`.graphql`? Run `pnpm codegen` and use types from `graphql/generated`.
- `graphql-request` **rejects the relative path `/api/anilist`** — resolve to an
  absolute URL before passing it to the client (see `endpoint.ts`).

## AniList — pagination pitfall

AniList `pageInfo.total` **caps at 5000**. For an accurate result count use
`perPage: 50`. Mocked tests **don't** catch this — validate against the real API
when the result count matters.

## Tests

- Vitest in `__tests__/` per feature (`fetch.spec.ts`, `transform.spec.ts`, etc.).
- `pnpm nx test anime-data-access`.
- Test transform/normalize with fixtures; cover the rate-limit case (`isRateLimitError`).
