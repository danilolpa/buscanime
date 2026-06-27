# Anime detail page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a server-rendered anime detail page at `/anime/[id]/[slug]` that surfaces richer AniList data (banner, description, stats, studios, tags, trailer, external links), reachable by clicking a home card.

**Architecture:** A Server Component route fetches AniList directly on the server (no browser proxy) with ISR caching, computes a canonical slug and redirects on mismatch, and composes presentational components from `@buscanime/ui`. The interactive home stays client-side (React Query); the static detail page is SSR — same data source, rendering strategy chosen per surface.

**Tech Stack:** Next.js 16 App Router (async `params`), React 19, TypeScript, Tailwind v4, GraphQL (graphql-codegen + `graphql` `print`), Vitest + Testing Library + vitest-axe, Playwright, Nx, pnpm.

**Spec:** `docs/superpowers/specs/2026-06-26-anime-detail-page-design.md`

> **Reconciled 2026-06-26 after a data-access refactor** (commits `0e65510`, `c613c33`): the lib now uses feature folders (`anilist/`, `anime-list/`, `format-counts/`, `graphql/`), the home does SSR with progressive enhancement (SSR disabled under `PLAYWRIGHT_TEST`), and two primitives the original plan was going to create **already exist** — `getAnilistEndpoint()` (`lib/anilist/endpoint.ts`) and a `.status === 429`-aware `isRateLimitError` (`lib/anilist/errors.ts`). The detail SSR fetch mirrors `fetchViaSsr` in `lib/anime-list/fetch-page.ts`. Tasks 3–6, 16, 17 reflect this.

---

## File Structure

**`@buscanime/shared-types` (`libs/shared/types`)**

- Create `src/lib/slug.ts` — `slugify(title)`, `animeHref(id, title)`.
- Create `src/lib/slug.spec.ts`.
- Create `src/lib/anime-detail.ts` — `AnimeDetail` + sub-types.
- Modify `src/index.ts` — export both.

**`@buscanime/anime-data-access` (`libs/anime/data-access`)** — _refactored into feature folders; follow the `anime-list/` convention for the new `anime-detail/` folder_

- Create `src/lib/graphql/queries/anime-detail.graphql`.
- Regenerate `src/lib/graphql/generated/{graphql,schema-types}.ts` via `pnpm codegen`.
- Create `src/lib/anime-detail/transform.ts` — `toAnimeDetail` (mirrors `anime-list/transform.ts`).
- Create `src/lib/anime-detail/fetch.ts` — `fetchAnimeDetail` (SSR; mirrors `fetchViaSsr`).
- Create `src/lib/anime-detail/index.ts` — feature barrel.
- Create `src/lib/anime-detail/__tests__/{transform,fetch}.spec.ts`.
- Modify `src/index.ts` — add an `// --- Anime detail ---` export block.
- **Already shipped by the refactor (do NOT recreate):** `getAnilistEndpoint()` (`src/lib/anilist/endpoint.ts`) and the `.status === 429`-aware `isRateLimitError` (`src/lib/anilist/errors.ts`).

**`@buscanime/ui` (`libs/ui`)** — each component folder has `<name>.tsx` + `.spec.tsx` + `.stories.tsx`

- `src/lib/description-text/` — `DescriptionText` + `stripAniListHtml` helper.
- `src/lib/tag-list/` — `TagList`.
- `src/lib/stat-list/` — `StatList` (+ internal `DetailStat` row).
- `src/lib/external-links/` — `ExternalLinks`.
- `src/lib/trailer-embed/` — `TrailerEmbed` (`'use client'`, lazy YouTube).
- `src/lib/anime-hero/` — `AnimeHero`.
- Modify `src/index.ts` — export each as it lands.

**`apps/web`**

- Create `src/app/anime/[id]/[[...slug]]/page.tsx` — RSC + `generateMetadata`.
- Create `src/app/anime/[id]/[[...slug]]/loading.tsx` — hero skeleton.
- Create `src/app/anime/[id]/[[...slug]]/error.tsx` — `'use client'` boundary.
- Modify `src/app/api/anilist/route.ts` — use `getAnilistEndpoint()`.
- Modify `src/app/(home)/anime-browser.tsx` — wrap cards with `next/link`.

**`apps/web-e2e`**

- Create `src/mock-server/anilist-mock.mjs` — dependency-free mock for the detail page's server-side AniList fetch (fixture inlined).
- Modify `playwright.config.ts` — convert `webServer` to an array (add the mock) and add `ANILIST_ENDPOINT` to the web server's existing `env`.
- Create `src/anime-detail.spec.ts`.

**Docs**

- Modify `README.md` (PT-BR).

---

## Conventions (read once)

- Component spec pattern: `@testing-library/react` (`render`, `screen`), `vitest-axe` (`axe` → `toHaveNoViolations()`), tests written in PT-BR `it(...)` like `libs/ui/src/lib/anime-card/anime-card.spec.tsx`.
- Story pattern: `Meta`/`StoryObj` from `@storybook/react-vite`, `title: 'Composites/<Name>'` or `'Primitives/<Name>'`, like `anime-card.stories.tsx`.
- Run a single lib's unit tests: `pnpm nx test <project>` (`shared-types`, `anime-data-access`, `ui`, `web`).
- Run e2e: `pnpm nx e2e web-e2e`.
- After editing any UI lib, the web app consumes it from source in dev, but a full check is `pnpm nx build ui`.
- `data-access` is organized into feature folders (`anilist/`, `anime-list/`, `anime-detail/`, `format-counts/`, `graphql/queries|generated`); unit tests live in a `__tests__/` subfolder and imports use the `.js` ESM suffix (e.g. `from '../transform.js'`).
- Commit after each task. Use Conventional Commits. The pre-commit hook runs prettier + affected unit tests.

---

## Phase 1 — Shared types + slug helpers

### Task 1: `slugify` + `animeHref`

**Files:**

- Create: `libs/shared/types/src/lib/slug.ts`
- Test: `libs/shared/types/src/lib/slug.spec.ts`
- Modify: `libs/shared/types/src/index.ts`

- [ ] **Step 1: Write the failing test**

```ts
// libs/shared/types/src/lib/slug.spec.ts
import { describe, it, expect } from 'vitest';
import { slugify, animeHref } from './slug';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Attack on Titan')).toBe('attack-on-titan');
  });
  it('strips punctuation and collapses separators', () => {
    expect(slugify('Re:Zero − Starting Life!!')).toBe('re-zero-starting-life');
  });
  it('strips accents/diacritics', () => {
    expect(slugify('Mahō Shōjo')).toBe('maho-shojo');
  });
  it('falls back to "anime" for empty/symbol-only titles', () => {
    expect(slugify('—')).toBe('anime');
    expect(slugify('')).toBe('anime');
  });
});

describe('animeHref', () => {
  it('builds /anime/<id>/<slug>', () => {
    expect(animeHref(16498, 'Attack on Titan')).toBe('/anime/16498/attack-on-titan');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test shared-types`
Expected: FAIL (cannot find `./slug`).

- [ ] **Step 3: Write minimal implementation**

```ts
// libs/shared/types/src/lib/slug.ts
export function slugify(title: string): string {
  const slug = title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // non-alphanumerics -> hyphen
    .replace(/^-+|-+$/g, ''); // trim hyphens
  return slug || 'anime';
}

export function animeHref(id: number, title: string): string {
  return `/anime/${id}/${slugify(title)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm nx test shared-types`
Expected: PASS.

- [ ] **Step 5: Export + commit**

Add to `libs/shared/types/src/index.ts`:

```ts
export * from './lib/slug.js';
```

```bash
git add libs/shared/types/src/lib/slug.ts libs/shared/types/src/lib/slug.spec.ts libs/shared/types/src/index.ts
git commit -m "feat(shared-types): add slugify and animeHref helpers"
```

---

### Task 2: `AnimeDetail` type

**Files:**

- Create: `libs/shared/types/src/lib/anime-detail.ts`
- Modify: `libs/shared/types/src/index.ts`

- [ ] **Step 1: Write the type** (no test — pure types)

```ts
// libs/shared/types/src/lib/anime-detail.ts
import type { MediaFormat } from './anime.js';

export interface AnimeDate {
  year: number | null;
  month: number | null;
  day: number | null;
}
export interface AnimeDetailTag {
  name: string;
  rank: number | null;
}
export interface AnimeDetailTrailer {
  id: string;
  site: string;
  thumbnail: string | null;
}
export interface AnimeDetailExternalLink {
  url: string;
  site: string;
  color: string | null;
  type: string | null;
}

export interface AnimeDetail {
  id: number;
  title: string; // english ?? romaji ?? 'Untitled'
  romajiTitle: string | null;
  nativeTitle: string | null;
  description: string | null; // raw AniList HTML-ish; stripped at render
  coverImage: string | null; // extraLarge ?? large
  coverColor: string | null;
  bannerImage: string | null;
  averageScore: number | null;
  meanScore: number | null;
  popularity: number | null;
  favourites: number | null;
  episodes: number | null;
  duration: number | null; // minutes
  status: string | null;
  season: string | null;
  seasonYear: number | null;
  format: MediaFormat | null;
  source: string | null;
  startDate: AnimeDate | null;
  endDate: AnimeDate | null;
  genres: string[];
  tags: AnimeDetailTag[];
  studios: string[]; // main studio names
  trailer: AnimeDetailTrailer | null;
  externalLinks: AnimeDetailExternalLink[];
}
```

- [ ] **Step 2: Export + verify typecheck**

Add to `libs/shared/types/src/index.ts`:

```ts
export * from './lib/anime-detail.js';
```

Run: `pnpm nx typecheck shared-types` (or `pnpm nx build shared-types`)
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add libs/shared/types/src/lib/anime-detail.ts libs/shared/types/src/index.ts
git commit -m "feat(shared-types): add AnimeDetail type"
```

---

## Phase 2 — Data layer

### Task 3: `AnimeDetail` GraphQL query + codegen

**Files:**

- Create: `libs/anime/data-access/src/lib/graphql/queries/anime-detail.graphql`
- Regenerate: `libs/anime/data-access/src/lib/graphql/generated/{graphql,schema-types}.ts`

- [ ] **Step 1: Write the query**

```graphql
# libs/anime/data-access/src/lib/graphql/queries/anime-detail.graphql
query AnimeDetail($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    title {
      romaji
      english
      native
    }
    description
    coverImage {
      extraLarge
      large
      color
    }
    bannerImage
    averageScore
    meanScore
    popularity
    favourites
    episodes
    duration
    status
    season
    seasonYear
    format
    source
    startDate {
      year
      month
      day
    }
    endDate {
      year
      month
      day
    }
    genres
    tags {
      name
      rank
    }
    studios(isMain: true) {
      nodes {
        name
      }
    }
    trailer {
      id
      site
      thumbnail
    }
    externalLinks {
      url
      site
      color
      type
    }
  }
}
```

- [ ] **Step 2: Run codegen** (needs network — hits the live AniList schema)

Run: `pnpm codegen`
Expected: `generated/graphql.ts` now exports `AnimeDetailDocument`, `AnimeDetailQuery`, `AnimeDetailQueryVariables`, and an `AnimeDetail` SDK method (the SDK method is unused; the server fetch uses the document directly).

- [ ] **Step 3: Verify generated symbols + commit**

Run: `pnpm nx typecheck anime-data-access`
Expected: PASS.

```bash
git add libs/anime/data-access/src/lib/graphql/queries/anime-detail.graphql libs/anime/data-access/src/lib/graphql/generated
git commit -m "feat(anime-data-access): add AnimeDetail query and regenerate SDK"
```

---

### Task 4: `toAnimeDetail` transform

**Files:**

- Create: `libs/anime/data-access/src/lib/anime-detail/transform.ts`
- Create: `libs/anime/data-access/src/lib/anime-detail/index.ts` (barrel)
- Test: `libs/anime/data-access/src/lib/anime-detail/__tests__/transform.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// libs/anime/data-access/src/lib/anime-detail/__tests__/transform.spec.ts
import { describe, it, expect } from 'vitest';
import { toAnimeDetail } from '../transform.js';
import type { AnimeDetailQuery } from '../../graphql/generated/graphql.js';

type Media = NonNullable<AnimeDetailQuery['Media']>;

const media: Media = {
  id: 16498,
  title: { romaji: 'Shingeki no Kyojin', english: 'Attack on Titan', native: '進撃の巨人' },
  description: 'Humanity fights titans.',
  coverImage: { extraLarge: 'xl.jpg', large: 'lg.jpg', color: '#abc' },
  bannerImage: 'banner.jpg',
  averageScore: 85,
  meanScore: 84,
  popularity: 500000,
  favourites: 90000,
  episodes: 25,
  duration: 24,
  status: 'FINISHED',
  season: 'SPRING',
  seasonYear: 2013,
  format: 'TV',
  source: 'MANGA',
  startDate: { year: 2013, month: 4, day: 7 },
  endDate: { year: 2013, month: 9, day: 28 },
  genres: ['Action', 'Drama'],
  tags: [
    { name: 'Titans', rank: 90 },
    { name: null as never, rank: null },
  ],
  studios: { nodes: [{ name: 'Wit Studio' }, { name: null as never }] },
  trailer: { id: 'abc', site: 'youtube', thumbnail: 'thumb.jpg' },
  externalLinks: [{ url: 'https://crunchyroll.com/aot', site: 'Crunchyroll', color: '#f47521', type: 'STREAMING' }],
};

describe('toAnimeDetail', () => {
  it('prefers english title and extraLarge cover', () => {
    const d = toAnimeDetail(media);
    expect(d.title).toBe('Attack on Titan');
    expect(d.coverImage).toBe('xl.jpg');
    expect(d.studios).toEqual(['Wit Studio']);
    expect(d.tags).toEqual([{ name: 'Titans', rank: 90 }]);
  });

  it('falls back and tolerates nulls', () => {
    const bare = { ...media, title: { romaji: 'X', english: null, native: null }, coverImage: { extraLarge: null, large: 'lg.jpg', color: null }, genres: null, tags: null, studios: null, externalLinks: null } as Media;
    const d = toAnimeDetail(bare);
    expect(d.title).toBe('X');
    expect(d.coverImage).toBe('lg.jpg');
    expect(d.genres).toEqual([]);
    expect(d.studios).toEqual([]);
    expect(d.externalLinks).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test anime-data-access`
Expected: FAIL (cannot find `../transform`).

- [ ] **Step 3: Write minimal implementation**

```ts
// libs/anime/data-access/src/lib/anime-detail/transform.ts
import type { AnimeDetail, AnimeDetailExternalLink, AnimeDetailTag, MediaFormat } from '@buscanime/shared-types';
import type { AnimeDetailQuery } from '../graphql/generated/graphql.js';

type Media = NonNullable<AnimeDetailQuery['Media']>;

const str = (v: string | null | undefined): v is string => Boolean(v);

export function toAnimeDetail(media: Media): AnimeDetail {
  return {
    id: media.id,
    title: media.title?.english ?? media.title?.romaji ?? 'Untitled',
    romajiTitle: media.title?.romaji ?? null,
    nativeTitle: media.title?.native ?? null,
    description: media.description ?? null,
    coverImage: media.coverImage?.extraLarge ?? media.coverImage?.large ?? null,
    coverColor: media.coverImage?.color ?? null,
    bannerImage: media.bannerImage ?? null,
    averageScore: media.averageScore ?? null,
    meanScore: media.meanScore ?? null,
    popularity: media.popularity ?? null,
    favourites: media.favourites ?? null,
    episodes: media.episodes ?? null,
    duration: media.duration ?? null,
    status: media.status ?? null,
    season: media.season ?? null,
    seasonYear: media.seasonYear ?? null,
    format: (media.format as MediaFormat | null) ?? null,
    source: media.source ?? null,
    startDate: media.startDate ?? null,
    endDate: media.endDate ?? null,
    genres: (media.genres ?? []).filter(str),
    tags: (media.tags ?? []).filter((t): t is NonNullable<typeof t> => Boolean(t?.name)).map((t): AnimeDetailTag => ({ name: t.name, rank: t.rank ?? null })),
    studios: (media.studios?.nodes ?? []).map((n) => n?.name).filter(str),
    trailer: media.trailer?.id && media.trailer.site ? { id: media.trailer.id, site: media.trailer.site, thumbnail: media.trailer.thumbnail ?? null } : null,
    externalLinks: (media.externalLinks ?? [])
      .filter((l): l is NonNullable<typeof l> => Boolean(l?.url))
      .map(
        (l): AnimeDetailExternalLink => ({
          url: l.url,
          site: l.site,
          color: l.color ?? null,
          type: l.type ?? null,
        }),
      ),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm nx test anime-data-access`
Expected: PASS.

- [ ] **Step 5: Add the barrel + commit**

Create `libs/anime/data-access/src/lib/anime-detail/index.ts`:

```ts
export { toAnimeDetail } from './transform.js';
```

```bash
git add libs/anime/data-access/src/lib/anime-detail
git commit -m "feat(anime-data-access): add toAnimeDetail transform"
```

---

### Task 5: Confirm transport primitives (already shipped by the refactor)

No new code — the data-access refactor already provides what the detail fetch needs. Verify before Task 6:

- [ ] **Step 1:** Confirm `getAnilistEndpoint()` exists in `libs/anime/data-access/src/lib/anilist/endpoint.ts` and is re-exported from `src/index.ts` (reads `process.env['ANILIST_ENDPOINT']`, defaults to `https://graphql.anilist.co`).
- [ ] **Step 2:** Confirm `isRateLimitError` in `libs/anime/data-access/src/lib/anilist/errors.ts` already matches a raw `.status === 429` (SSR) **and** `.response.status === 429` (proxy). No change needed.
- [ ] **Step 3:** Leave the proxy route `apps/web/src/app/api/anilist/route.ts` as-is — it keeps a hardcoded endpoint on purpose (only the SSR path uses `getAnilistEndpoint()`). Do **not** modify it.

(Verification only — no commit.)

---

### Task 6: `fetchAnimeDetail` + rate-limit detection

**Files:**

- Create: `libs/anime/data-access/src/lib/anime-detail/fetch.ts`
- Test: `libs/anime/data-access/src/lib/anime-detail/__tests__/fetch.spec.ts`
- Modify: `libs/anime/data-access/src/lib/anime-detail/index.ts` (add `fetchAnimeDetail`)
- Modify: `libs/anime/data-access/src/index.ts` (add the `// --- Anime detail ---` block)

> `isRateLimitError` already matches a raw `.status` (shipped by the refactor) — nothing to change here. The detail fetch throws an `Error & { status }` exactly like `fetchViaSsr`, so the 429 case stays detectable.

- [ ] **Step 1: Write the failing test**

```ts
// libs/anime/data-access/src/lib/anime-detail/__tests__/fetch.spec.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchAnimeDetail } from '../fetch.js';
import { isRateLimitError } from '../../anilist/errors.js';

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response);
}

afterEach(() => vi.restoreAllMocks());

describe('fetchAnimeDetail', () => {
  it('returns a mapped AnimeDetail on success', async () => {
    const media = { id: 1, title: { romaji: 'X', english: 'X', native: null }, description: null, coverImage: { extraLarge: 'c.jpg', large: null, color: null }, bannerImage: null, averageScore: null, meanScore: null, popularity: null, favourites: null, episodes: null, duration: null, status: null, season: null, seasonYear: null, format: null, source: null, startDate: null, endDate: null, genres: [], tags: [], studios: { nodes: [] }, trailer: null, externalLinks: [] };
    vi.stubGlobal('fetch', mockFetch(200, { data: { Media: media } }));
    const d = await fetchAnimeDetail(1);
    expect(d?.id).toBe(1);
    expect(d?.coverImage).toBe('c.jpg');
  });

  it('returns null when Media is null', async () => {
    vi.stubGlobal('fetch', mockFetch(200, { data: { Media: null } }));
    expect(await fetchAnimeDetail(999999)).toBeNull();
  });

  it('throws a rate-limit-detectable error on 429', async () => {
    vi.stubGlobal('fetch', mockFetch(429, {}));
    await expect(fetchAnimeDetail(1)).rejects.toSatisfy(isRateLimitError);
  });

  it('throws on other non-OK responses', async () => {
    vi.stubGlobal('fetch', mockFetch(500, {}));
    await expect(fetchAnimeDetail(1)).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm nx test anime-data-access`
Expected: FAIL (cannot find `../fetch`).

- [ ] **Step 3: Write minimal implementation** (mirrors `fetchViaSsr` in `anime-list/fetch-page.ts`)

```ts
// libs/anime/data-access/src/lib/anime-detail/fetch.ts
import { print } from 'graphql';
import type { AnimeDetail } from '@buscanime/shared-types';
import { AnimeDetailDocument, type AnimeDetailQuery } from '../graphql/generated/graphql.js';
import { getAnilistEndpoint } from '../anilist/endpoint.js';
import { toAnimeDetail } from './transform.js';

/** SSR fetch: goes through Next's `fetch` (Data Cache + dedup with generateMetadata). */
export async function fetchAnimeDetail(id: number): Promise<AnimeDetail | null> {
  const res = await fetch(getAnilistEndpoint(), {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ query: print(AnimeDetailDocument), variables: { id } }),
    // cast like fetchViaSsr — the lib's tsconfig (types: ["node"]) lacks Next's fetch augmentation
    ...({ next: { revalidate: 3600 } } as RequestInit),
  });

  if (!res.ok) {
    const err = new Error(`AniList request failed: ${res.status}`) as Error & { status: number };
    err.status = res.status;
    throw err;
  }

  const json = (await res.json()) as { data?: AnimeDetailQuery };
  const media = json.data?.Media;
  return media ? toAnimeDetail(media) : null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm nx test anime-data-access`
Expected: PASS (all four cases).

- [ ] **Step 5: Export + commit**

Add `fetchAnimeDetail` to the feature barrel `libs/anime/data-access/src/lib/anime-detail/index.ts`:

```ts
export { fetchAnimeDetail } from './fetch.js';
```

Add an export block to `libs/anime/data-access/src/index.ts` (mirrors the existing `// --- Anime list ---` block):

```ts
// --- Anime detail ---
export { fetchAnimeDetail, toAnimeDetail } from './lib/anime-detail/index.js';
```

```bash
git add libs/anime/data-access/src/lib/anime-detail libs/anime/data-access/src/index.ts
git commit -m "feat(anime-data-access): add server-side fetchAnimeDetail"
```

---

## Phase 3 — UI components

> For every component task: write the spec, see it fail, implement, see it pass, add a `.stories.tsx`, export from `libs/ui/src/index.ts`, commit. Include an axe a11y assertion like `anime-card.spec.tsx`. Run with `pnpm nx test ui`.

### Task 7: `DescriptionText` (+ `stripAniListHtml`)

**Files:**

- Create: `libs/ui/src/lib/description-text/description-text.tsx`
- Test: `libs/ui/src/lib/description-text/description-text.spec.tsx`
- Story: `libs/ui/src/lib/description-text/description-text.stories.tsx`
- Modify: `libs/ui/src/index.ts`

- [ ] **Step 1: Write the failing test** (helper + component)

```tsx
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, it, expect } from 'vitest';
import { DescriptionText, stripAniListHtml } from './description-text';

describe('stripAniListHtml', () => {
  it('converts <br> to line breaks and strips other tags', () => {
    expect(stripAniListHtml('A<br>B<br/>C <i>x</i> <b>y</b>')).toBe('A\nB\nC x y');
  });
  it('decodes common entities and trims', () => {
    expect(stripAniListHtml('  Tom &amp; Jerry &mdash; ok  ')).toBe('Tom & Jerry — ok');
  });
  it('returns empty string for null', () => {
    expect(stripAniListHtml(null)).toBe('');
  });
});

describe('DescriptionText', () => {
  it('renders paragraphs split on blank lines', () => {
    render(<DescriptionText html={'Line one.<br><br>Line two.'} />);
    expect(screen.getByText('Line one.')).toBeInTheDocument();
    expect(screen.getByText('Line two.')).toBeInTheDocument();
  });
  it('renders a fallback when empty', () => {
    render(<DescriptionText html={null} />);
    expect(screen.getByText('Sem descrição disponível.')).toBeInTheDocument();
  });
  it('sem violações de a11y', async () => {
    const { container } = render(<DescriptionText html={'Hello.'} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `pnpm nx test ui` → FAIL.

- [ ] **Step 3: Implement**

```tsx
// libs/ui/src/lib/description-text/description-text.tsx
const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&mdash;': '—',
  '&ndash;': '–',
  '&hellip;': '…',
  '&nbsp;': ' ',
};

export function stripAniListHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z#0-9]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? m)
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

export interface DescriptionTextProps {
  html: string | null | undefined;
}

export function DescriptionText({ html }: DescriptionTextProps) {
  const text = stripAniListHtml(html);
  if (!text) {
    return <p className="text-sm text-neutral-500">Sem descrição disponível.</p>;
  }
  const paragraphs = text.split(/\n{2,}/).map((p) => p.replace(/\n/g, ' ').trim());
  return (
    <div className="space-y-3 text-sm leading-relaxed text-neutral-700">
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run to verify it passes** — `pnpm nx test ui` → PASS.

- [ ] **Step 5: Story + export + commit**

`description-text.stories.tsx` (title `'Detail/DescriptionText'`) with `Normal` (long HTML string) and `Empty` (`html: null`) stories. Add `export * from './lib/description-text/description-text';` to `libs/ui/src/index.ts`.

```bash
git add libs/ui/src/lib/description-text libs/ui/src/index.ts
git commit -m "feat(ui): add DescriptionText with AniList HTML stripping"
```

---

### Task 8: `TagList`

**Files:** `libs/ui/src/lib/tag-list/{tag-list.tsx,tag-list.spec.tsx,tag-list.stories.tsx}` + index export.

- [ ] **Step 1: Failing test**

```tsx
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { it, expect } from 'vitest';
import { TagList } from './tag-list';

it('renderiza um chip por item', () => {
  render(<TagList items={['Action', 'Drama', 'Shounen']} />);
  ['Action', 'Drama', 'Shounen'].forEach((t) => expect(screen.getByText(t)).toBeInTheDocument());
});
it('não renderiza nada quando vazio', () => {
  const { container } = render(<TagList items={[]} />);
  expect(container).toBeEmptyDOMElement();
});
it('sem violações de a11y', async () => {
  const { container } = render(<TagList items={['Action']} />);
  expect(await axe(container)).toHaveNoViolations();
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

```tsx
// libs/ui/src/lib/tag-list/tag-list.tsx
import { Chip } from '../chip/chip';

export interface TagListProps {
  items: string[];
}

export function TagList({ items }: TagListProps) {
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item}>
          <Chip>{item}</Chip>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Story + export + commit** — `git commit -m "feat(ui): add TagList"`

---

### Task 9: `StatList`

**Files:** `libs/ui/src/lib/stat-list/{stat-list.tsx,stat-list.spec.tsx,stat-list.stories.tsx}` + index export.

`StatList` takes `items: { label: string; value: ReactNode }[]`, skips items with `null/undefined/''` value, renders a definition list. (Internal `DetailStat` row, not exported.)

- [ ] **Step 1: Failing test**

```tsx
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { it, expect } from 'vitest';
import { StatList } from './stat-list';

it('renderiza label e valor, pulando vazios', () => {
  render(
    <StatList
      items={[
        { label: 'Episódios', value: 25 },
        { label: 'Fonte', value: null },
      ]}
    />,
  );
  expect(screen.getByText('Episódios')).toBeInTheDocument();
  expect(screen.getByText('25')).toBeInTheDocument();
  expect(screen.queryByText('Fonte')).not.toBeInTheDocument();
});
it('sem violações de a11y', async () => {
  const { container } = render(<StatList items={[{ label: 'Status', value: 'Finalizado' }]} />);
  expect(await axe(container)).toHaveNoViolations();
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

```tsx
// libs/ui/src/lib/stat-list/stat-list.tsx
import type { ReactNode } from 'react';

export interface StatItem {
  label: string;
  value: ReactNode;
}
export interface StatListProps {
  items: StatItem[];
}

function isEmpty(v: ReactNode): boolean {
  return v === null || v === undefined || v === '';
}

export function StatList({ items }: StatListProps) {
  const visible = items.filter((i) => !isEmpty(i.value));
  if (visible.length === 0) return null;
  return (
    <dl className="divide-y divide-neutral-200 rounded-lg border border-neutral-200">
      {visible.map((i) => (
        <div key={i.label} className="flex items-center justify-between gap-4 px-4 py-2.5">
          <dt className="text-sm text-neutral-500">{i.label}</dt>
          <dd className="text-sm font-medium text-neutral-900">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}
```

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Story + export + commit** — `git commit -m "feat(ui): add StatList"`

---

### Task 10: `ExternalLinks`

**Files:** `libs/ui/src/lib/external-links/{external-links.tsx,external-links.spec.tsx,external-links.stories.tsx}` + index export.

Props: `links: { url: string; site: string; color: string | null }[]`. Renders `<a target="_blank" rel="noopener noreferrer">` with the site name; uses `color` as a left accent (inline style) when present.

- [ ] **Step 1: Failing test**

```tsx
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { it, expect } from 'vitest';
import { ExternalLinks } from './external-links';

const links = [{ url: 'https://crunchyroll.com/x', site: 'Crunchyroll', color: '#f47521' }];

it('renderiza links externos com rel seguro', () => {
  render(<ExternalLinks links={links} />);
  const link = screen.getByRole('link', { name: 'Crunchyroll' });
  expect(link).toHaveAttribute('href', 'https://crunchyroll.com/x');
  expect(link).toHaveAttribute('target', '_blank');
  expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
});
it('não renderiza nada quando vazio', () => {
  const { container } = render(<ExternalLinks links={[]} />);
  expect(container).toBeEmptyDOMElement();
});
it('sem violações de a11y', async () => {
  const { container } = render(<ExternalLinks links={links} />);
  expect(await axe(container)).toHaveNoViolations();
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

```tsx
// libs/ui/src/lib/external-links/external-links.tsx
export interface ExternalLinkItem {
  url: string;
  site: string;
  color: string | null;
}
export interface ExternalLinksProps {
  links: ExternalLinkItem[];
}

export function ExternalLinks({ links }: ExternalLinksProps) {
  if (links.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2">
      {links.map((l) => (
        <li key={l.url}>
          <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50" style={l.color ? { borderLeftColor: l.color, borderLeftWidth: 3 } : undefined}>
            {l.site}
          </a>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Story + export + commit** — `git commit -m "feat(ui): add ExternalLinks"`

---

### Task 11: `TrailerEmbed` (lazy YouTube, `'use client'`)

**Files:** `libs/ui/src/lib/trailer-embed/{trailer-embed.tsx,trailer-embed.spec.tsx,trailer-embed.stories.tsx}` + index export.

Props: `{ youtubeId: string | null; thumbnail: string | null; title?: string }`. Renders nothing when `youtubeId` is null. Shows a thumbnail button; clicking swaps to the YouTube iframe (`youtube-nocookie.com/embed/<id>?autoplay=1`).

- [ ] **Step 1: Failing test**

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { it, expect } from 'vitest';
import { TrailerEmbed } from './trailer-embed';

it('não renderiza nada sem youtubeId', () => {
  const { container } = render(<TrailerEmbed youtubeId={null} thumbnail={null} />);
  expect(container).toBeEmptyDOMElement();
});
it('carrega o iframe só após o clique', () => {
  render(<TrailerEmbed youtubeId="abc123" thumbnail="t.jpg" title="Trailer" />);
  expect(document.querySelector('iframe')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /reproduzir trailer/i }));
  const iframe = document.querySelector('iframe');
  expect(iframe?.getAttribute('src')).toContain('abc123');
});
it('sem violações de a11y', async () => {
  const { container } = render(<TrailerEmbed youtubeId="abc123" thumbnail="t.jpg" />);
  expect(await axe(container)).toHaveNoViolations();
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

```tsx
// libs/ui/src/lib/trailer-embed/trailer-embed.tsx
'use client';
import { useState } from 'react';

export interface TrailerEmbedProps {
  youtubeId: string | null;
  thumbnail: string | null;
  title?: string;
}

export function TrailerEmbed({ youtubeId, thumbnail, title = 'Trailer' }: TrailerEmbedProps) {
  const [playing, setPlaying] = useState(false);
  if (!youtubeId) return null;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      {playing ? (
        <iframe className="absolute inset-0 h-full w-full" src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1`} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} aria-label={`Reproduzir trailer: ${title}`} className="group absolute inset-0 h-full w-full">
          {thumbnail && <img src={thumbnail} alt="" className="h-full w-full object-cover" />}
          <span className="absolute inset-0 grid place-items-center bg-black/30 transition group-hover:bg-black/40">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-white/90 text-2xl text-black">▶</span>
          </span>
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Story + export + commit** — `git commit -m "feat(ui): add lazy TrailerEmbed"`

---

### Task 12: `AnimeHero`

**Files:** `libs/ui/src/lib/anime-hero/{anime-hero.tsx,anime-hero.spec.tsx,anime-hero.stories.tsx}` + index export.

Props:

```ts
export interface AnimeHeroProps {
  title: string;
  nativeTitle?: string | null;
  coverImage: string | null;
  coverColor?: string | null;
  bannerImage: string | null;
  meta?: string[]; // e.g. ['TV', '25 eps', '2013']
  score?: number | null;
}
```

Banner background (or `coverColor` fallback) with the `AnimeCard` gradient treatment, overlapping cover, `<h1>` title + native subtitle, a meta row, and `AnimeRating` when `score != null`.

- [ ] **Step 1: Failing test**

```tsx
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { it, expect } from 'vitest';
import { AnimeHero } from './anime-hero';

it('renderiza título como h1, capa e nota', () => {
  render(<AnimeHero title="Attack on Titan" coverImage="c.jpg" bannerImage="b.jpg" score={85} meta={['TV', '25 eps']} />);
  expect(screen.getByRole('heading', { level: 1, name: 'Attack on Titan' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Attack on Titan' })).toBeInTheDocument();
  expect(screen.getByText('85%')).toBeInTheDocument();
  expect(screen.getByText('TV')).toBeInTheDocument();
});
it('sem violações de a11y', async () => {
  const { container } = render(<AnimeHero title="X" coverImage="c.jpg" bannerImage={null} score={null} />);
  expect(await axe(container)).toHaveNoViolations();
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement** (compose; reuse `AnimeRating`, gradient like `anime-card.tsx:35`)

```tsx
// libs/ui/src/lib/anime-hero/anime-hero.tsx
import { AnimeRating } from '../anime-rating/anime-rating';
import { Container } from '../container/container';

export interface AnimeHeroProps {
  title: string;
  nativeTitle?: string | null;
  coverImage: string | null;
  coverColor?: string | null;
  bannerImage: string | null;
  meta?: string[];
  score?: number | null;
}

export function AnimeHero({ title, nativeTitle, coverImage, coverColor, bannerImage, meta = [], score }: AnimeHeroProps) {
  return (
    <section className="relative">
      <div className="h-48 w-full bg-cover bg-center md:h-64" style={{ backgroundColor: coverColor ?? '#1a1a1a', backgroundImage: bannerImage ? `url(${bannerImage})` : undefined }} aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/40 to-transparent md:h-64" />
      <Container className="relative -mt-20 flex flex-col gap-4 md:-mt-24 md:flex-row md:items-end">
        {coverImage && <img src={coverImage} alt={title} className="h-48 w-32 flex-none rounded-lg object-cover shadow-lg md:h-64 md:w-44" />}
        <div className="flex flex-1 flex-col gap-2 pb-2">
          <h1 className="text-2xl font-bold text-neutral-900 md:text-3xl">{title}</h1>
          {nativeTitle && <p className="text-sm text-neutral-500">{nativeTitle}</p>}
          <div className="flex flex-wrap items-center gap-2">
            {score != null && <AnimeRating value={score} />}
            {meta.map((m) => (
              <span key={m} className="text-sm text-neutral-600">
                {m}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Story + export + commit** — `git commit -m "feat(ui): add AnimeHero"`

---

## Phase 4 — Page wiring

### Task 13: Detail route `page.tsx` + `generateMetadata`

**Files:**

- Create: `apps/web/src/app/anime/[id]/[[...slug]]/page.tsx`

> Note: async RSCs aren't unit-tested here; behavior is verified by `pnpm nx build web` (Step 2) and e2e (Phase 5). Pure helpers already have unit coverage (slug, transform, fetch).

- [ ] **Step 1: Implement the page**

```tsx
// apps/web/src/app/anime/[id]/[[...slug]]/page.tsx
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { Header, Footer, Container, AnimeHero, StatList, ExternalLinks, DescriptionText, TagList, TrailerEmbed } from '@buscanime/ui';
import { fetchAnimeDetail } from '@buscanime/anime-data-access';
import { slugify, animeHref, type AnimeDetail } from '@buscanime/shared-types';

interface RouteParams {
  params: Promise<{ id: string; slug?: string[] }>;
}

function parseId(raw: string): number | null {
  return /^\d+$/.test(raw) ? Number(raw) : null;
}

async function load(rawId: string): Promise<AnimeDetail> {
  const id = parseId(rawId);
  if (id === null) notFound();
  const anime = await fetchAnimeDetail(id);
  if (!anime) notFound();
  return anime;
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { id } = await params;
  const numId = parseId(id);
  if (numId === null) return { title: 'Anime não encontrado — BuscaAnime' };
  const anime = await fetchAnimeDetail(numId);
  if (!anime) return { title: 'Anime não encontrado — BuscaAnime' };
  const description = anime.description?.replace(/<[^>]+>/g, ' ').slice(0, 160) ?? undefined;
  const image = anime.coverImage ?? anime.bannerImage ?? undefined;
  return {
    title: `${anime.title} — BuscaAnime`,
    description,
    openGraph: { title: anime.title, description, images: image ? [image] : undefined },
  };
}

export default async function AnimeDetailPage({ params }: RouteParams) {
  const { id, slug } = await params;
  const anime = await load(id);

  const canonical = slugify(anime.title);
  if (slug?.[0] !== canonical) {
    // permanent (308) — canonical-slug redirect for SEO; matches the spec
    permanentRedirect(animeHref(anime.id, anime.title));
  }

  const meta = [anime.format, anime.episodes ? `${anime.episodes} eps` : null, anime.seasonYear?.toString()].filter(Boolean) as string[];
  const stats = [
    { label: 'Nota média', value: anime.averageScore ? `${anime.averageScore}%` : null },
    { label: 'Episódios', value: anime.episodes },
    { label: 'Duração', value: anime.duration ? `${anime.duration} min` : null },
    { label: 'Status', value: anime.status },
    { label: 'Temporada', value: [anime.season, anime.seasonYear].filter(Boolean).join(' ') || null },
    { label: 'Formato', value: anime.format },
    { label: 'Fonte', value: anime.source },
    { label: 'Estúdio', value: anime.studios.join(', ') || null },
    { label: 'Popularidade', value: anime.popularity?.toLocaleString('pt-BR') },
    { label: 'Favoritos', value: anime.favourites?.toLocaleString('pt-BR') },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header className="sticky top-0 z-40" />
      <main className="flex flex-1 flex-col">
        <AnimeHero title={anime.title} nativeTitle={anime.nativeTitle} coverImage={anime.coverImage} coverColor={anime.coverColor} bannerImage={anime.bannerImage} score={anime.averageScore} meta={meta} />
        <Container className="grid gap-8 py-8 md:grid-cols-[280px_1fr]">
          <aside className="flex flex-col gap-6">
            <StatList items={stats} />
            <ExternalLinks links={anime.externalLinks} />
          </aside>
          <div className="flex flex-col gap-6">
            <DescriptionText html={anime.description} />
            <TagList items={[...anime.genres, ...anime.tags.map((t) => t.name)]} />
            <TrailerEmbed youtubeId={anime.trailer?.site === 'youtube' ? anime.trailer.id : null} thumbnail={anime.trailer?.thumbnail ?? null} title={`Trailer de ${anime.title}`} />
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm nx build web`
Expected: PASS (type-checks the new route + imports).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/anime
git commit -m "feat(web): add SSR anime detail page with metadata and slug redirect"
```

---

### Task 14: `loading.tsx`

**Files:** Create `apps/web/src/app/anime/[id]/[[...slug]]/loading.tsx`

- [ ] **Step 1: Implement** (reuse `Skeleton` from `@buscanime/ui`)

```tsx
// apps/web/src/app/anime/[id]/[[...slug]]/loading.tsx
import { Header, Footer, Container, Skeleton } from '@buscanime/ui';

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header className="sticky top-0 z-40" />
      <main className="flex flex-1 flex-col">
        <Skeleton className="h-48 w-full md:h-64" />
        <Container className="grid gap-8 py-8 md:grid-cols-[280px_1fr]">
          <Skeleton className="h-64 w-full rounded-lg" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
```

(If `Skeleton`'s API differs, check `libs/ui/src/lib/skeleton/skeleton.tsx` and adjust.)

- [ ] **Step 2: Build + commit**

Run: `pnpm nx build web` → PASS.

```bash
git add apps/web/src/app/anime/[id]/[[...slug]]/loading.tsx
git commit -m "feat(web): add detail route loading skeleton"
```

---

### Task 15: `error.tsx`

**Files:** Create `apps/web/src/app/anime/[id]/[[...slug]]/error.tsx`

Replicates the `AnimeBrowser` error branch (`StatusState` + `isRateLimitError`).

- [ ] **Step 1: Implement**

```tsx
// apps/web/src/app/anime/[id]/[[...slug]]/error.tsx
'use client';
import { Hourglass, ServerCrash } from 'lucide-react';
import { StatusState, Button } from '@buscanime/ui';
import { isRateLimitError } from '@buscanime/anime-data-access';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const rateLimited = isRateLimitError(error);
  return <div className="grid min-h-screen place-items-center p-6">{rateLimited ? <StatusState tone="warning" icon={<Hourglass />} title="Muitas buscas" message="Você fez muitas requisições em pouco tempo. Aguarde alguns segundos e tente de novo." action={<Button onClick={reset}>Tentar de novo</Button>} /> : <StatusState tone="danger" icon={<ServerCrash />} title="Erro ao carregar" message="Algo deu errado ao buscar este anime." action={<Button onClick={reset}>Tentar de novo</Button>} />}</div>;
}
```

(Confirm `StatusState`/`Button` prop names against `libs/ui/src/lib/status-state/status-state.tsx` and the usage in `anime-browser.tsx:104-128`.)

- [ ] **Step 2: Build + commit**

Run: `pnpm nx build web` → PASS.

```bash
git add apps/web/src/app/anime/[id]/[[...slug]]/error.tsx
git commit -m "feat(web): add detail route error boundary"
```

---

### Task 16: Home cards → links

**Files:** Modify `apps/web/src/app/(home)/anime-browser.tsx` (the `animes.map` block, ~line 156) and its spec `anime-browser.spec.tsx`. `AnimeBrowser` is already a `'use client'` component, so `next/link` works there. (Note: the home now renders via `page.tsx` → `HomeWithData` → `AnimeBrowser`; the map block is unchanged in shape.)

- [ ] **Step 1: Update the existing unit test** (`anime-browser.spec.tsx`)

Add an assertion that a rendered card is wrapped in a link to the detail page, e.g.:

```tsx
// after the grid loads with Naruto (id 1)
expect(screen.getByRole('link', { name: /naruto/i })).toHaveAttribute('href', '/anime/1/naruto');
```

- [ ] **Step 2: Run → FAIL** (`pnpm nx test web`).

- [ ] **Step 3: Wrap cards with `next/link`**

```tsx
import Link from 'next/link';
import { animeHref } from '@buscanime/shared-types';
// ...
<AnimeGrid>
  {animes.map((anime) => (
    <Link key={anime.id} href={animeHref(anime.id, anime.title)} className="block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500">
      <AnimeCard anime={anime} />
    </Link>
  ))}
</AnimeGrid>;
```

- [ ] **Step 4: Run → PASS** (`pnpm nx test web`).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/(home)/anime-browser.tsx apps/web/src/app/(home)/anime-browser.spec.tsx
git commit -m "feat(web): link home cards to the anime detail page"
```

---

## Phase 5 — E2E

> Why this phase exists: the detail page fetches AniList **server-side**, which Playwright's `page.route` (browser-level) cannot intercept. (The home sidesteps this by disabling SSR under `PLAYWRIGHT_TEST` — see `ssr-listing.ts` — but the detail page is SSR-only, with no client fallback.) We point the web server's `ANILIST_ENDPOINT` at a standalone mock started by Playwright.

### Task 17: AniList mock server + Playwright wiring

**Files:**

- Create: `apps/web-e2e/src/mock-server/anilist-mock.mjs`
- Modify: `apps/web-e2e/playwright.config.ts`

> Keep the mock **dependency-free**: a plain `.mjs` run by bare `node` (the repo has no `tsx`/TS loader). Inline the fixture object — do **not** import the `.ts` fixtures file (Node can't import `.ts` without a loader).

- [ ] **Step 1: Write the dependency-free mock server** (fixture inlined)

```js
// apps/web-e2e/src/mock-server/anilist-mock.mjs
import { createServer } from 'node:http';

const port = Number(process.env.MOCK_ANILIST_PORT ?? 4010);

function resolveAnimeDetail(id) {
  return {
    id,
    title: { romaji: 'Naruto', english: 'Naruto', native: 'ナルト' },
    description: 'Um ninja determinado a se tornar Hokage.',
    coverImage: { extraLarge: 'https://picsum.photos/seed/naruto/300/400', large: null, color: '#6d28d9' },
    bannerImage: null,
    averageScore: 80,
    meanScore: 80,
    popularity: 1000,
    favourites: 100,
    episodes: 220,
    duration: 23,
    status: 'FINISHED',
    season: 'FALL',
    seasonYear: 2002,
    format: 'TV',
    source: 'MANGA',
    startDate: { year: 2002, month: 10, day: 3 },
    endDate: { year: 2007, month: 2, day: 8 },
    genres: ['Action', 'Adventure'],
    tags: [{ name: 'Ninja', rank: 95 }],
    studios: { nodes: [{ name: 'Pierrot' }] },
    trailer: null,
    externalLinks: [],
  };
}

createServer((req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405).end();
    return;
  }
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const { variables } = JSON.parse(body || '{}');
    const id = Number(variables?.id);
    const media = id > 0 && id < 100000000 ? resolveAnimeDetail(id) : null;
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ data: { Media: media } }));
  });
}).listen(port, () => console.log(`anilist-mock on :${port}`));
```

- [ ] **Step 2: Wire Playwright** — convert the single `webServer` object into an array: keep the web entry on `npx nx run web:dev` (same `url`/`reuseExistingServer: false`/`cwd`), add `ANILIST_ENDPOINT` to its **existing** `env`, and prepend the mock server. Do **not** switch to `web:start` (needs a prior build).

The real config is a single `webServer` object with `reuseExistingServer: false` and `env: { ...process.env, PLAYWRIGHT_TEST: '1' }`. Replace with (preserve `...process.env` and `PLAYWRIGHT_TEST`):

```ts
webServer: [
  {
    command: 'node apps/web-e2e/src/mock-server/anilist-mock.mjs',
    url: 'http://127.0.0.1:4010',
    reuseExistingServer: false,
    cwd: workspaceRoot,
  },
  {
    command: 'npx nx run web:dev',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    cwd: workspaceRoot,
    env: {
      ...process.env,
      PLAYWRIGHT_TEST: '1',
      ANILIST_ENDPOINT: 'http://127.0.0.1:4010',
    },
  },
],
```

(`notFound()` returns a real 404 in dev, so Task 18's `status()` assertion holds against `web:dev`.)

- [ ] **Step 3: Sanity-run e2e** (existing home tests must still pass)

Run: `pnpm nx e2e web-e2e`
Expected: existing suite PASS (home tests unaffected; they intercept `/api/anilist` at the browser).

- [ ] **Step 4: Commit**

```bash
git add apps/web-e2e/src/mock-server apps/web-e2e/playwright.config.ts
git commit -m "test(web-e2e): add server-side AniList mock for the detail page"
```

---

### Task 18: Detail page e2e specs

**Files:** Create `apps/web-e2e/src/anime-detail.spec.ts`

- [ ] **Step 1: Write the specs**

```ts
import { test, expect } from './fixtures/test';

test('navega de um card da home para o detalhe', async ({ page }) => {
  await page.goto('/');
  const firstCard = page.locator('a[href^="/anime/"]').first();
  await expect(firstCard).toBeVisible({ timeout: 15000 });
  await firstCard.click();
  await expect(page).toHaveURL(/\/anime\/\d+\/[a-z0-9-]+/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('id não-numérico retorna 404', async ({ page }) => {
  const res = await page.goto('/anime/not-a-number');
  expect(res?.status()).toBe(404);
});

test('slug incorreto redireciona para o canônico', async ({ page }) => {
  await page.goto('/anime/1/slug-errado');
  await expect(page).toHaveURL('/anime/1/naruto');
});
```

- [ ] **Step 2: Run → PASS**

Run: `pnpm nx e2e web-e2e`
Expected: new specs PASS (mock server serves `Naruto` for id 1; `not-a-number` → notFound 404; wrong slug → 308 → `/anime/1/naruto`).

- [ ] **Step 3: Commit**

```bash
git add apps/web-e2e/src/anime-detail.spec.ts
git commit -m "test(web-e2e): cover detail navigation, 404, and slug redirect"
```

---

## Phase 6 — Documentation

### Task 19: Update README (PT-BR)

**Files:** Modify `README.md`

- [ ] **Step 1: Add the route + the SSR rationale** (match the file's PT-BR voice). Add the `/anime/[id]/[slug]` route to the relevant list and a short note such as:

```markdown
### Renderização: client na home, SSR no detalhe

A home é interativa (filtros, busca, scroll infinito) e busca os dados no
browser com React Query, via o proxy `/api/anilist`. A página de detalhe
(`/anime/[id]/[slug]`) é o oposto: conteúdo estático de um anime, renderizado no
**servidor** com fetch direto na AniList. Assim o HTML já chega populado (sem
spinner), o `generateMetadata` consegue gerar `<title>`/`og:image` para SEO, e a
gente economiza o hop do proxy (que existe só para o browser). Mesma fonte de
dados, estratégia de render escolhida por superfície.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: document the anime detail route and SSR rendering split"
```

---

## Final verification

- [ ] `pnpm nx run-many -t test` (or `pnpm nx affected -t test`) — all unit tests pass.
- [ ] `pnpm nx e2e web-e2e` — all e2e pass.
- [ ] `pnpm nx build web` — production build succeeds.
- [ ] Manual smoke (`pnpm nx dev web`): open the home, click a card, confirm the detail page renders hero/stats/description/tags; try `/anime/16498` (no slug) → redirects; `/anime/abc` → 404.
