# Anime detail page — design

- **Date:** 2026-06-26
- **Status:** Approved (design), pending implementation plan
- **Author:** Danilo + Claude
- **Topic:** New `/anime/[id]` detail page (SSR) consuming richer AniList data

## Overview

Today the app only lists animes on the home (`apps/web/src/app/page.tsx` + the
client `AnimeBrowser`). This adds a dedicated **anime detail page** reachable by
clicking a card. The page is server-rendered for SEO and surfaces the relevant
AniList fields we don't show today (banner, description, stats, studios, tags,
trailer, external/streaming links).

Scope for this iteration is the **focused MVP**: hero, description, key stats,
genres/tags, studios, trailer, and external links. Relational sections
(characters, staff, relations, recommendations) are explicitly deferred.

## Goals

- A detail page at `/anime/[id]/[slug]` that renders server-side.
- Real SEO: `<title>`, description, and `og:image` via `generateMetadata`.
- Home cards link to the detail page.
- Reuse existing UI/design language (`Container`, `Chip`, `AnimeRating`,
  gradient-over-image treatment) and the existing GraphQL/codegen pipeline.

## Non-goals (fast-follow)

- Characters, staff, relations, recommendations.
- Rich text (bold/italic) in the description.
- Sharing the `/api/anilist` proxy for server-side fetches.
- Pagination/infinite anything on the detail page.

## Decisions

| Topic                  | Decision                                  | Rationale                                                   |
| ---------------------- | ----------------------------------------- | ----------------------------------------------------------- |
| Scope                  | Focused MVP (no relational sections)      | Ship value without query/UI sprawl                          |
| Rendering              | Server Component / SSR                    | SEO + fast first paint, no spinner                          |
| URL                    | `/anime/[id]/[slug]` (slug cosmetic)      | Readable + SEO; fetch uses `id` only                        |
| Server fetch           | Call AniList directly (no browser proxy)  | Proxy exists only for the browser; server can call upstream |
| Caching                | ISR `revalidate: 3600` (1h)               | Anime data changes slowly                                   |
| Description            | Plain text (strip tags, keep line breaks) | No sanitizer dep, no XSS, no `dangerouslySetInnerHTML`      |
| Trailer                | Lazy YouTube (load iframe on click)       | Avoid heavy iframe on load; hide if not YouTube             |
| Invalid id / not found | `notFound()` → 404                        | Standard App Router behavior                                |
| Upstream error         | Route-level `error.tsx`                   | Matches existing error handling                             |

## Architecture

### Why SSR + direct fetch here (vs. the client-side home)

The home is an interactive **browse** surface: format filters, debounced search,
and infinite scroll. That state lives in the browser, so it fetches client-side
with React Query through the `/api/anilist` proxy (the proxy exists so the
browser has a same-origin endpoint with logging/Sentry, instead of calling
AniList cross-origin on every keystroke).

The detail page is the opposite: a mostly-static **content** page for a single
anime. There's no per-keystroke interactivity to drive, so we render it on the
server and fetch the data there. The win is concrete:

- The HTML arrives **already populated** — no loading spinner, no client round
  trip, content visible on first paint.
- Real SEO: `generateMetadata` can set `<title>`, description, and `og:image`
  because the data is in hand at render time (a shareable, indexable page).
- On the server there's no browser/CORS constraint, so we skip the `/api/anilist`
  proxy and call AniList **directly** — one less hop, and the proxy's
  per-keystroke logging concern doesn't apply to a single page load.

So the two patterns coexist on purpose: client-side React Query for the
interactive list, server-side direct fetch for the static detail page. Same
AniList source, different rendering strategy chosen per surface.

### Routing & navigation

- **File:** `apps/web/src/app/anime/[id]/[[...slug]]/page.tsx` (optional
  catch-all so one route serves both `/anime/123` and
  `/anime/123/attack-on-titan`).
- Server Component. Steps:
  1. Parse `id`; if non-numeric → `notFound()`.
  2. `fetchAnimeDetail(id)`; if upstream returns no media → `notFound()`.
  3. Compute canonical slug from the title; if the URL's slug segment is missing
     or doesn't match → `redirect()` (308) to the canonical URL.
  4. Render the page.
- **`generateMetadata`** uses the same fetch (dedup via the framework cache) to
  emit `<title>`, description (truncated plain text), and `og:image`
  (`coverImage.extraLarge` or `bannerImage`).
- **`error.tsx`** at the route for upstream failures. Note: there is no
  route-level error template to copy today — the root `apps/web/src/app/error.tsx`
  is a bare boundary (`<h2>` + button), and the `StatusState` "Erro ao carregar"
  treatment currently lives in the **client** `AnimeBrowser` (the React Query
  `query.isError` branch). The new `error.tsx` replicates that branch: `StatusState`
  (exported from `ui`) with a retry, branching on `isRateLimitError(error)`
  for the rate-limit copy.
- **`loading.tsx`** at the route renders a lightweight hero skeleton while the
  server fetch is in flight.

### Home → detail links

- The `<Link>` wrap lives in `apps/web/src/app/(home)/anime-browser.tsx` —
  wrap each rendered `AnimeCard` with `next/link`. This keeps `AnimeCard`
  presentational and decoupled from Next. (The `AnimeGridSkeleton` placeholders
  have no `id`/title and stay unlinked.)
- New helpers `slugify(title)` and `animeHref(id, title)` exported from
  `shared-types` (lowest-level shared lib, no deps), used by both the
  home (build href) and the detail page (compute canonical slug for redirect).

### Data layer (`anime-data-access`)

- New query: `libs/anime/data-access/src/lib/queries/anime-detail.graphql`
  (`query AnimeDetail($id: Int)`), picked up by the existing codegen
  (`pnpm codegen` → `graphql-codegen --config libs/anime/data-access/codegen.ts`)
  which regenerates `generated/graphql.ts` with the `AnimeDetailQuery` type and
  `AnimeDetailDocument` node that the raw fetch below consumes. (Codegen also
  emits an `AnimeDetail` SDK method, but the server fetch path below does not use
  it.)
- New server fetch `fetchAnimeDetail(id: number)`:
  - Uses a raw `fetch` to AniList directly (`https://graphql.anilist.co`) with the
    generated `AnimeDetailDocument` (`print()`-ed) as the query body, and
    `next: { revalidate: 3600 }`. Going through Next's `fetch` (not the
    `graphql-request` client) is what gives us the Data Cache + request
    memoization that dedups the `generateMetadata` and page calls. We still get
    typed results from the generated `AnimeDetailQuery` type.
  - Returns `AnimeDetail | null` (null when no media).
  - On a non-OK response it throws (propagating to the route `error.tsx`). There
    is **no** `AnilistError` class today — the existing primitive is the
    `isRateLimitError(error)` duck-type (`error.response.status === 429`) in
    `anilist-error.ts`. To keep that working for the 429 case, throw an error
    shaped so `isRateLimitError` still matches (i.e. carry `response.status`), or
    extend `isRateLimitError` to also accept the raw `Response` status. The plan
    picks one; no new error class is required.
- New transform `toAnimeDetail(media)` mirroring `toAnime`.
- New type `AnimeDetail` in `shared-types`.

### AniList fields (MVP)

| Section       | Fields                                                                                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hero          | `bannerImage`, `coverImage { extraLarge, large, color }`, `title { romaji, english, native }`, `format`, `episodes`, `status`, `season`, `seasonYear`, `averageScore`                      |
| Sidebar stats | `meanScore`, `popularity`, `favourites`, `episodes`, `duration`, `status`, `startDate`, `endDate`, `season` + `seasonYear`, `format`, `source`, `studios(isMain: true) { nodes { name } }` |
| Content       | `description`, `genres`, `tags { name, rank }`, `trailer { id, site, thumbnail }`, `externalLinks { url, site, color, type }`                                                              |

### New UI components (`ui`)

Each follows the repo convention: `libs/ui/src/lib/<name>/<name>.tsx` +
`.spec.tsx` + `.stories.tsx`. All presentational (no data fetching, no router).

- **`AnimeHero`** — banner + overlapping cover + title/meta row; reuses the
  gradient-over-image treatment from `AnimeCard`.
- **`StatList`** + **`DetailStat`** — sidebar rows (label + value, with an icon).
- **`DescriptionText`** — renders the AniList description as plain text:
  converts `<br>` to line breaks and strips remaining tags. No
  `dangerouslySetInnerHTML`.
- **`TagList`** — genre + tag chips (reuses `Chip`).
- **`TrailerEmbed`** — lazy YouTube: shows `trailer.thumbnail`, loads the iframe
  only on click; renders only when `site === 'youtube'`, otherwise hidden.
- **`ExternalLinks`** — list of external/streaming links with the AniList
  site name and color.

### Page composition

```
Header (reused, sticky)
AnimeHero (banner + cover + title + meta)
Container
  grid md:grid-cols-[280px_1fr]
    aside: StatList + ExternalLinks
    main:  DescriptionText + TagList + TrailerEmbed
Footer (reused)
```

Collapses to a single column on mobile.

## Error handling

- Non-numeric/invalid `id` → `notFound()` (404).
- Anime not found upstream → `notFound()` (404).
- Slug mismatch/missing → `redirect()` 308 to canonical URL.
- Upstream/network error → `fetchAnimeDetail` throws; caught by the route
  `error.tsx`, which renders `StatusState` with a retry. The rate-limit (429)
  case is detected via `isRateLimitError(error)` for the "Muitas buscas" copy —
  same branch the client `AnimeBrowser` already uses.

## Testing

- **Unit (Vitest):**
  - `toAnimeDetail` maps AniList media → `AnimeDetail` (incl. null/missing
    fields).
  - `slugify` / `animeHref` (spaces, punctuation, unicode, empty title).
  - `DescriptionText` strips tags and preserves line breaks.
  - `.spec.tsx` for each new UI component (render + key props).
- **E2E (Playwright):**
  - Click a home card → detail page renders hero, title, description.
  - Invalid `id` → 404.
  - Wrong/missing slug → redirect to canonical URL.
- **Mocking:** MSW handlers for the `AnimeDetail` query (success, not-found,
  error).

## Documentation

- Update the project `README.md` as part of this work. Note: the README is in
  **Portuguese** (PT-BR) with a documented voice (sections like "Por que um
  monorepo?", "Tech stack") — the addition must match that language and tone.
  - Add the new `/anime/[id]/[slug]` detail route to the feature/route list.
  - Document the deliberate rendering split — client-side React Query for the
    interactive home, **server-side SSR with a direct AniList fetch** for the
    static detail page — and why (SEO, server-populated HTML, no proxy hop). This
    mirrors the "Why SSR + direct fetch here" section above, condensed.

## Open questions

None blocking. Bold/italic description rendering and relational sections are
parked as fast-follow.
