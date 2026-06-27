# BuscaAnime — guide for AI agents

Nx 23 monorepo (pnpm). Next.js app + shared UI and data libs.
**Always also read the `AGENTS.md` in the folder you're editing** — it has the
domain-specific rules:

- `libs/ui/AGENTS.md` — component contract (files, tests, stories, colors)
- `apps/web/AGENTS.md` — Next.js, App Router, SSR, routes
- `libs/anime/data-access/AGENTS.md` — GraphQL, TanStack Query, dist build

## Stack

- pnpm 11 · Nx 23 · TypeScript strict
- Next.js 16 (App Router) · React
- UI: Tailwind CSS v4 (CSS-first, `@theme` block) + CVA + `cn()`
- Tests: Vitest 4 + @testing-library/react + vitest-axe
- Stories: Storybook 10 (CSF3, `@storybook/react-vite`)
- Data: GraphQL (graphql-codegen) + TanStack Query

## Commands (always via Nx — never call tsc/vitest/eslint directly)

- Dev: `pnpm nx dev web`
- Test: `pnpm nx test <project>` (e.g. `nx test ui`)
- Lint: `pnpm nx lint <project>`
- Typecheck: `pnpm nx typecheck <project>`
- Build: `pnpm nx build <project>`
- Affected: `pnpm nx affected -t lint test typecheck build`
- Codegen: `pnpm codegen` (after changing GraphQL queries)

Projects: `web` (app), `ui`, `anime-data-access`, `shared-types`.

## Hard rules

1. **Colors: never use raw Tailwind colors** (`bg-purple-700`, `text-red-500`,
   `#hex`). Always use the semantic theme tokens defined in
   `libs/ui/src/styles/theme.css`. Current tokens:
   - `bg-brand` / `text-brand` — cor principal da marca (#6d28d9)
   - `bg-accent` / `text-accent` — destaque / CTA (#fde047)
   - `text-ink` — texto primário, títulos (#1a1a1a)
   - `text-ink-muted` — texto secundário, subtítulos, meta (#525252)
   - `text-ink-subtle` — texto terciário, hints, placeholders (#737373)

   Missing a token? Add it to `libs/ui/src/styles/theme.css` first.
   Opacity modifiers (`text-ink/60`) are linter-safe but prefer named tokens —
   on colored backgrounds opacity blends with the bg and produces unpredictable results.
   Enforced by ESLint (`no-restricted-syntax`) in `libs/ui` and `apps/web`.

2. **Nx boundaries** (lint-enforced): `ui` imports only `ui`/`util`;
   `data-access` imports only `data-access`/`util`; the app imports all.
   `ui` never imports `data-access` (UI is pure, no fetching).
3. **Import from the lib root**, never an internal path:
   `import { Button } from 'ui'` — not `.../lib/primitives/button`.
4. **Conventional commits** (commitlint runs in the husky hook).
   E.g. `feat(ui): ...`, `fix(web): ...`.

## Before shipping to production

Definition of "done" — run all of these and they must pass:

```bash
pnpm nx affected -t lint typecheck test --base=origin/main
pnpm nx build web
pnpm nx format:check        # fix with: pnpm nx format:write
```

`test` includes accessibility tests (vitest-axe). A red lint (covers off-token
raw color and module-boundary violations), type error, failing test or broken
build = do not ship. Skill: `validate`.

## Common tasks

- New lib: `pnpm nx g @nx/react:library <name> --directory=libs/<name>
--bundler=vite --unitTestRunner=vitest --importPath=<name>
--no-component --no-interactive` then `pnpm nx sync` (updates paths and tags).
- New UI component: skill `new-component`, or follow `libs/ui/AGENTS.md`.

## Project skills (in .claude/skills)

- `validate` — pre-prod gate (lint/typecheck/test/build/format)
- `new-component` — scaffold the 3-file UI component contract
- `ds-check` — audit design-system violations lint can't catch
- `storybook-check` — every component has a story

## Decisions already made (don't reopen)

- No CSS modules — styling is Tailwind + `cn()`; variants via CVA.
- App is pt-BR only for now (no i18n framework); strings live inline in JSX.
- `anime-data-access` is consumed via build (dist) — no HMR in `nx dev web`.
