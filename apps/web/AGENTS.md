# apps/web — Next.js 16 app (`web`)

App Router (`src/app/`). Consumes `@buscanime/ui` and `@buscanime/anime-data-access`.
UI comes from the lib — **don't create presentation components here**; if it's
reusable it goes to `libs/ui`. The app owns routes, data-fetching, SSR and page
composition.

## Structure

- `src/app/layout.tsx` — root layout (`lang="pt-BR"`), Sentry, providers.
- `src/app/providers.tsx` — React Query provider, etc.
- `src/app/(home)/` — home (anime browser with filters + SSR).
- `src/app/anime/[id]/[[...slug]]/` — detail page (with `error.tsx`/`not-found.tsx`).
- `src/app/api/anilist/route.ts` — server-side proxy to AniList.

## Rules

- **Colors:** same as the UI lib — tokens only (`bg-brand`, `text-accent`,
  `text-ink`). Raw Tailwind color breaks lint.
- **Server vs Client:** default to Server Components. Only mark `'use client'`
  when you need browser state/effects/handlers. Data hooks (`useAnimeList`) are client.
- **Data:** import hooks/functions from `@buscanime/anime-data-access`, never
  re-implement GraphQL fetching in the app. Server-side detail fetch uses `fetchAnimeDetail`.
- **Imagens:** SEMPRE `next/image` (`import Image from 'next/image'`), nunca
  `<img>` cru. O `next/image` redimensiona, serve AVIF/WebP e faz lazy por
  default — é o que mantém o LCP e o "image delivery" do Lighthouse no verde. Não
  jogue imagem para client-side achando que resolve: SSR é o caminho certo, o
  navegador busca a imagem de qualquer jeito.
  - Imagem **acima da dobra** (hero, 1ª fileira de cards): passe `priority`
    (eager + preload). Lazy é só para o que está abaixo da dobra.
  - Domínio remoto novo? Adicione em `images.remotePatterns` no `next.config.js`
    (hoje: `s4.anilist.co`, `img.anili.st`) — senão o `next/image` quebra.
  - Componentes de UI compartilhados já usam `next/image` (ver `libs/ui`); por
    isso a `libs/ui` aliasa `next/image` no Storybook.

## Known Next 16 gotchas (don't repeat the bug)

- **Streaming soft-404:** a `loading.tsx` on a route makes `notFound()`/`redirect()`
  return HTTP 200 (soft-404). For SSR routes that need a real 404, **don't** add
  `loading.tsx`; and in tests assert `res.status()`, not just the 404 UI.
- **`anime-data-access` is consumed via dist** — editing that lib needs `nx build`
  (no HMR in `nx dev web`).

## Language

App is **pt-BR only** for now: `lang="pt-BR"` in the root layout, no i18n
framework. Strings live inline in JSX, in Portuguese. Don't introduce
i18n/locale routes without an explicit decision.

## Tests

- Unit/integration: Vitest + @testing-library (e.g. `anime-browser.spec.tsx`).
- E2E: Playwright in `apps/web-e2e` (`nx e2e web-e2e`).
- `nx test web` for the app's tests.
