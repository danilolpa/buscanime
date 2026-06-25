# buscanime

Nx monorepo — foundation stage of an AniList anime-listing app built as a job challenge. The current codebase establishes the full infrastructure pipeline from browser to the AniList GraphQL API; the UI layer is a placeholder pending implementation.

---

## Tech stack

| Concern         | Technology                                               |
| --------------- | -------------------------------------------------------- |
| Monorepo        | [Nx 23](https://nx.dev)                                  |
| App framework   | Next.js 16 (App Router, Turbopack)                       |
| UI library      | React 19                                                 |
| Language        | TypeScript 5.9                                           |
| Package manager | pnpm 11 (single workspace lockfile)                      |
| Unit testing    | Vitest 4 + Testing Library + MSW 2                       |
| E2E testing     | Playwright (via `@nx/playwright`)                        |
| Styling         | Tailwind CSS v4                                          |
| Data fetching   | TanStack Query v5                                        |
| GraphQL client  | graphql-request 7 + GraphQL Code Generator 7             |
| Error tracking  | @sentry/nextjs 10                                        |
| Linting         | ESLint 9 (flat config) + `@nx/enforce-module-boundaries` |
| Formatting      | Prettier 3                                               |
| Commits         | commitlint + husky + lint-staged (Conventional Commits)  |

---

## Workspace structure

```
buscanime/
├── apps/
│   ├── web/           # Next.js app (tag: type:app)
│   └── web-e2e/       # Playwright e2e suite
└── libs/
    ├── anime/
    │   └── data-access/   # TanStack Query hook + AniList SDK (tag: type:data-access)
    ├── ui/                # Shared React components (tag: type:ui)
    └── shared/
        └── types/         # Domain types — Anime, etc. (tag: type:util)
```

### Import boundary rules (enforced by `@nx/enforce-module-boundaries`)

| Source tag         | May import                                 |
| ------------------ | ------------------------------------------ |
| `type:app`         | `type:ui`, `type:data-access`, `type:util` |
| `type:ui`          | `type:ui`, `type:util`                     |
| `type:data-access` | `type:data-access`, `type:util`            |
| `type:util`        | `type:util`                                |

Key constraint: **`type:ui` cannot import `type:data-access`**. Data-fetching logic stays out of the component library.

---

## AniList data pipeline

```
Browser
  └─ TanStack Query (useAnimeList)
       └─ graphql-request → POST /api/anilist   (same-origin)
            └─ Next.js Route Handler (proxy)
                 ├─ logs latency: [anilist] <status> in <ms>ms
                 ├─ captures upstream errors to Sentry
                 └─ fetches https://graphql.anilist.co
```

The browser never calls AniList directly. All GraphQL traffic goes through the `/api/anilist` proxy, which provides a single egress point for latency logging, error capture, and future rate-limit handling.

---

## Commands

```bash
# Install dependencies
pnpm install

# Dev server (Next.js with Turbopack)
pnpm exec nx dev web

# Run all checks (lint + test + typecheck + build) across the workspace
pnpm exec nx run-many -t lint test typecheck build

# Regenerate the typed AniList SDK from the GraphQL schema
pnpm codegen

# Interactive dependency graph
pnpm exec nx graph

# E2E tests (requires Playwright browsers installed)
pnpm exec nx e2e web-e2e
```

---

## Environment variables

| Variable                 | Required | Purpose                                                                |
| ------------------------ | -------- | ---------------------------------------------------------------------- |
| `NEXT_PUBLIC_SENTRY_DSN` | No       | Sentry DSN. Sentry is a no-op when absent — safe to omit in local dev. |

---

## Design System

`libs/ui` (`@buscanime/ui`) is a presentational component library: **no data-fetching, no side-effects, Storybook-first**. Every component is tested with vitest-axe for structural accessibility and previewed in Storybook with `@storybook/addon-a11y` for in-browser contrast checking.

### Component catalog

**Primitives**

| Component     | Description                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------------- |
| `Button`      | `solid`/`outline` variants, `md`/`lg` sizes, `active` toggle, optional leading `icon` node          |
| `Chip`        | Inline genre tag; `default` (tinted) or `onImage` (translucent dark) variant                        |
| `AnimeRating` | Percentage badge (0–100) color-coded by score tier: rose (low), yellow (mid), teal (high)           |
| `Input`       | Controlled text field with required `aria-label` and optional leading `icon`; no visible label slot |
| `Skeleton`    | Shimmer `aria-hidden` block; accepts `width`, `height`, and `rounded` props                         |
| `Logo`        | "BUSC"+"ANIME" text logotype (accent color); polymorphic `as: span \| a`, `md`/`lg` size            |

**Domain composites**

| Component           | Description                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| `AnimeCard`         | Takes an `Anime` object; renders cover image, gradient overlay, title, up to 3 genre chips, and a rating badge |
| `AnimeGrid`         | Responsive CSS Grid wrapper (1 → 2 → 4 columns)                                                                |
| `FormatFilter`      | Single-select row of outline `Button`s with `aria-pressed` per option                                          |
| `SearchBar`         | Controlled `Input` + submit `Button` wrapped in a `role="search"` form                                         |
| `AnimeCardSkeleton` | `aria-busy` loading placeholder matching `AnimeCard` dimensions                                                |
| `AnimeGridSkeleton` | Grid of `AnimeCardSkeleton`s; `count` prop (default 12)                                                        |

**Layout & states**

| Component     | Description                                                                           |
| ------------- | ------------------------------------------------------------------------------------- |
| `Container`   | Max-width (`max-w-6xl`) content wrapper with horizontal padding                       |
| `Header`      | Brand-colored `<header>` with `Logo` and optional `children` slot                     |
| `Footer`      | Brand-colored `<footer>` with `Logo` and auto-generated copyright year line           |
| `StatusState` | Centered empty/error state: required `icon`, `title`, optional `message` and `action` |

### Theme tokens

All design tokens live in `libs/ui/src/styles/theme.css` (CSS custom properties). Components consume them via Tailwind CSS v4 utilities — no hard-coded color values in component source.

### Running the catalog

```bash
# Interactive Storybook dev server
pnpm exec nx storybook ui

# Static build (outputs to libs/ui/storybook-static/)
pnpm exec nx build-storybook ui
```

---

## Known follow-ups

- **`@nx/vitest:test` executor deprecation** — the `web` project uses the executor form (`@nx/vitest:test` in `project.json`). Migrate to inferred targets before Nx v24: `pnpm exec nx g @nx/vitest:convert-to-inferred`.
- **UI implementation** — `apps/web` currently renders a plain `<main>buscanime</main>` placeholder. The anime listing page, search, and filters are next-phase work.
