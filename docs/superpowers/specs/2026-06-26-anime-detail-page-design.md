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
- **`error.tsx`** at the route for upstream failures (reuses the existing
  `StatusState` "Erro ao carregar" pattern).
- **`loading.tsx`** at the route renders a lightweight hero skeleton while the
  server fetch is in flight.

### Home → detail links

- The `<Link>` wrap lives in `apps/web/src/app/(home)/anime-browser.tsx` (and in
  the skeleton grid usage) — wrap each `AnimeCard` with `next/link`. This keeps
  `AnimeCard` presentational and decoupled from Next.
- New helpers `slugify(title)` and `animeHref(id, title)` exported from
  `@buscanime/shared-types` (lowest-level shared lib, no deps), used by both the
  home (build href) and the detail page (compute canonical slug for redirect).

### Data layer (`@buscanime/anime-data-access`)

- New query: `libs/anime/data-access/src/lib/queries/anime-detail.graphql`
  (`query AnimeDetail($id: Int)`), picked up by the existing codegen
  (`pnpm codegen` → `graphql-codegen --config libs/anime/data-access/codegen.ts`)
  which regenerates `generated/graphql.ts` with an `AnimeDetail` SDK method.
- New server fetch `fetchAnimeDetail(id: number)`:
  - Calls AniList directly (`https://graphql.anilist.co`) with
    `next: { revalidate: 3600 }`.
  - Returns `AnimeDetail | null` (null when no media).
  - Wraps upstream errors in the existing `AnilistError` so `error.tsx` and rate
    limiting behave consistently with the rest of the app.
- New transform `toAnimeDetail(media)` mirroring `toAnime`.
- New type `AnimeDetail` in `@buscanime/shared-types`.

### AniList fields (MVP)

| Section       | Fields                                                                                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hero          | `bannerImage`, `coverImage { extraLarge, large, color }`, `title { romaji, english, native }`, `format`, `episodes`, `status`, `season`, `seasonYear`, `averageScore`                      |
| Sidebar stats | `meanScore`, `popularity`, `favourites`, `episodes`, `duration`, `status`, `startDate`, `endDate`, `season` + `seasonYear`, `format`, `source`, `studios(isMain: true) { nodes { name } }` |
| Content       | `description`, `genres`, `tags { name, rank }`, `trailer { id, site, thumbnail }`, `externalLinks { url, site, color, type }`                                                              |

### New UI components (`@buscanime/ui`)

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
- Upstream/network/rate-limit error → thrown `AnilistError` caught by route
  `error.tsx` (reuses `StatusState`, with retry).

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

## Open questions

None blocking. Bold/italic description rendering and relational sections are
parked as fast-follow.
