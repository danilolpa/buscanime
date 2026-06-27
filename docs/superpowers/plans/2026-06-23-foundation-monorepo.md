# Foundation Monorepo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Levar o workspace Nx `buscanime` da estrutura gerada até uma fundação com 3 libs + app, boundary rules ativas, tooling completo (pnpm/Vitest/Tailwind v4/husky) e o pipeline de runtime AniList→route handler→data-access→React cabeado e provado por testes — sem construir a feature.

**Architecture:** Monorepo Nx 23 (TS-solution). 3 libs por domínio: `ui` (DS presentational), `anime-data-access` (GraphQL/codegen/TanStack Query), `shared-types` (contrato neutro). `@nx/enforce-module-boundaries` com tags `type:*` impede `ui↔data-access`. O browser nunca chama a AniList direto — vai por um Route Handler `app/api/anilist` que faz proxy + log + captura Sentry.

**Tech Stack:** Nx 23, Next.js 16, React 19, TypeScript 5.9, pnpm, Vitest + Testing Library + MSW, Tailwind v4, TanStack Query, graphql-request + GraphQL Code Generator, @sentry/nextjs, husky + commitlint + lint-staged.

**Spec de referência:** `docs/superpowers/specs/2026-06-23-foundation-monorepo-design.md`

**Convenções de execução:**

- Comandos shell assumem o **Bash tool** (Git Bash / POSIX) salvo indicação.
- Use `pnpm exec nx ...` para invocar o Nx.
- Commits seguem Conventional Commits (a partir da Task 5 isso é enforçado por commitlint).

---

## File Structure

**Criados:**

- `libs/shared/types/` → lib `shared-types` (modelo `Anime`, `MediaFormat`)
- `libs/ui/` → lib `ui` (DS — stubs mínimos nesta fase)
- `libs/anime/data-access/` → lib `anime-data-access`
  - `src/lib/queries/anime-list.graphql` → documento da query
  - `src/lib/generated/graphql.ts` → SDK tipado (gerado pelo codegen)
  - `src/lib/anilist-client.ts` → factory do SDK graphql-request
  - `src/lib/transform.ts` → payload AniList → `Anime`
  - `src/lib/use-anime-list.ts` → hook TanStack Query
  - `src/lib/use-anime-list.spec.tsx` → teste de integração (MSW)
  - `codegen.ts` → config do GraphQL Code Generator
- `apps/web/src/app/api/anilist/route.ts` → Route Handler (proxy + Sentry)
- `apps/web/src/app/api/anilist/route.spec.ts` → teste do route handler
- `apps/web/src/app/providers.tsx` → `QueryClientProvider`
- `apps/web/src/app/error.tsx`, `apps/web/src/app/global-error.tsx` → cobertura de erro App Router
- `apps/web/instrumentation.ts`, `apps/web/instrumentation-client.ts`, `apps/web/sentry.server.config.ts`, `apps/web/sentry.edge.config.ts` → Sentry env-gated
- `postcss.config.mjs`, `commitlint.config.mjs`, `.husky/pre-commit`, `.husky/commit-msg`

**Modificados:**

- `package.json` (deps, `packageManager`, `workspaces`, scripts), `pnpm-workspace.yaml` (`packages:`)
- `.github/workflows/ci.yml` (pnpm)
- `nx.json` (plugin jest→vitest)
- `eslint.config.mjs` (depConstraints `type:*`), `apps/web/eslint.config.mjs` (jsx-a11y/react-hooks)
- `apps/web/src/app/global.css` (Tailwind v4), `layout.tsx`, `page.tsx` (limpeza), `next.config.js` (withSentryConfig)
- `DECISIONS.md` (Next 16, Vitest)

**Removidos:** `package-lock.json`, `apps/web/jest.config.cts`, `jest.config.ts`, `jest.preset.js`, `apps/web/src/app/api/hello/`

---

## Wave 1 — Higiene do workspace

### Task 1: pnpm como package manager único

**Files:**

- Delete: `package-lock.json`
- Modify: `pnpm-workspace.yaml`, `package.json`, `.github/workflows/ci.yml`

- [ ] **Step 1: Descobrir a versão do pnpm**

Run: `pnpm --version`
Anote (ex.: `10.x`). Use abaixo onde estiver `<PNPM_VERSION>`.

- [ ] **Step 2: Remover o lockfile npm**

Run: `rm -f package-lock.json`

- [ ] **Step 3: Declarar os globs de workspace no pnpm**

Adicione ao topo de `pnpm-workspace.yaml` (antes de `allowBuilds`):

```yaml
packages:
  - 'apps/*'
  - 'libs/*'
```

- [ ] **Step 4: Alinhar package.json**

Em `package.json`: garanta `"workspaces": ["apps/*", "libs/*"]` e adicione `"packageManager": "pnpm@<PNPM_VERSION>"`.

- [ ] **Step 5: Reinstalar com pnpm**

Run: `pnpm install`
Expected: gera/atualiza `pnpm-lock.yaml`, sem erros. Confirme que **não** recriou `package-lock.json`.

- [ ] **Step 6: Migrar o CI para pnpm**

Em `.github/workflows/ci.yml`, substitua o bloco de setup/install/run por:

```yaml
- uses: pnpm/action-setup@v4
  with:
    version: <PNPM_VERSION>

- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: 'pnpm'

- run: pnpm install --frozen-lockfile
- run: pnpm exec playwright install --with-deps

- run: pnpm exec nx run-many -t lint test build typecheck e2e
- run: pnpm exec nx fix-ci
  if: always()
```

- [ ] **Step 7: Verificar build/lint pós-migração**

Run: `pnpm exec nx run-many -t lint typecheck`
Expected: PASS (ainda sobre o app gerado).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: switch package manager to pnpm and update CI"
```

### Task 2: Migrar Jest → Vitest no app `web`

**Files:**

- Create: `apps/web/vite.config.ts` (via generator)
- Delete: `apps/web/jest.config.cts`, `jest.config.ts`, `jest.preset.js`, `apps/web/tsconfig.spec.json` (se Jest-specific)
- Modify: `nx.json`, `package.json`, `apps/web/specs/index.spec.tsx`

- [ ] **Step 1: Adicionar o plugin Vitest**

Run: `pnpm add -D -w @nx/vitest@23.0.1 vitest @vitejs/plugin-react jsdom @testing-library/jest-dom msw`
(Testing Library já está instalado.)

- [ ] **Step 2: Gerar a configuração Vitest do app**

Run: `pnpm exec nx g @nx/vitest:configuration web --testEnvironment=jsdom --uiFramework=react`
Expected: cria `apps/web/vite.config.ts` com bloco `test` e troca o target `test` para o executor Vitest.

- [ ] **Step 3: Trocar o plugin no nx.json**

Em `nx.json`, remova o bloco do plugin `@nx/jest/plugin` e, se o generator não tiver adicionado, inclua `@nx/vitest/plugin` com `"targetName": "test"`. Remova o `targetDefaults.test.dependsOn: ["^build"]` se o Vitest não precisar (mantém só se houver libs buildáveis dependentes).

- [ ] **Step 4: Remover artefatos do Jest**

Run: `rm -f apps/web/jest.config.cts jest.config.ts jest.preset.js`
Run: `pnpm remove -w @nx/jest jest jest-environment-jsdom jest-util babel-jest ts-jest @types/jest`

- [ ] **Step 5: Ajustar o spec de exemplo para Vitest**

Em `apps/web/specs/index.spec.tsx`, garanta imports de `vitest` (`import { describe, it, expect } from 'vitest'` se não usar `globals`). **Reduza** o teste a uma asserção trivial que **não** dependa do texto do boilerplate Nx (ex.: apenas `render(<Page />)` e `expect(screen.getByRole('main')).toBeTruthy()`), porque a `page.tsx` é reescrita para placeholder na Task 14 — assert no texto "Welcome" quebraria depois.

- [ ] **Step 6: Rodar os testes**

Run: `pnpm exec nx test web`
Expected: PASS via Vitest.

- [ ] **Step 7: Atualizar a DECISIONS.md**

Troque "Next.js 14" → "Next.js 16 (App Router)" e confirme "Vitest" como runner. Remova qualquer menção a Jest.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: migrate test runner from jest to vitest"
```

---

## Wave 2 — Tooling de qualidade

### Task 3: Tailwind v4

**Files:**

- Create: `postcss.config.mjs`
- Modify: `apps/web/src/app/global.css`, `package.json`

- [ ] **Step 1: Instalar Tailwind v4**

Run: `pnpm add -w tailwindcss @tailwindcss/postcss postcss`

- [ ] **Step 2: PostCSS na raiz**

Create `postcss.config.mjs`:

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

- [ ] **Step 3: Entrada Tailwind + tokens + varredura das libs**

Substitua o conteúdo de `apps/web/src/app/global.css` por:

```css
@import 'tailwindcss';

/* Varre as classes usadas nas libs do workspace (cross-package) */
@source '../../../../libs/ui/src/**/*.{ts,tsx}';

@theme {
  --color-score-low: #e53e3e; /* score < 50 */
  --color-score-mid: #f5c518; /* 50–80 */
  --color-score-high: #38a169; /* > 80 */
  --color-score-ink: #1a1a1a; /* texto escuro p/ contraste AA no amarelo */
}
```

- [ ] **Step 4: Provar que o Tailwind aplica**

Em `apps/web/src/app/page.tsx` (placeholder), use uma classe utilitária (ex.: `<main className="p-8 text-2xl font-bold">buscanime</main>`).
Run: `pnpm exec nx build web`
Expected: build PASS; CSS gerado contém a utilitária.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: set up tailwind v4 with shared lib source scanning"
```

### Task 4: ESLint — React Hooks + jsx-a11y enforçados

**Files:**

- Modify: `apps/web/eslint.config.mjs` (onde vivem os componentes React)

- [ ] **Step 1: Inspecionar a config atual do app**

Run: `cat apps/web/eslint.config.mjs`
Identifique onde adicionar plugins (deve estender a base + next).

- [ ] **Step 2: Adicionar flat configs de a11y e hooks**

Inclua no array exportado de `apps/web/eslint.config.mjs` (plugins já instalados na raiz):

```js
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';

// ...dentro do array de config, após a base:
  jsxA11y.flatConfigs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: { ...reactHooks.configs.recommended.rules },
  },
```

- [ ] **Step 3: Rodar o lint**

Run: `pnpm exec nx lint web`
Expected: PASS (sem violações no placeholder atual).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: enforce react-hooks and jsx-a11y in eslint"
```

### Task 5: Git hooks — husky + commitlint + lint-staged

**Files:**

- Create: `.husky/pre-commit`, `.husky/commit-msg`, `commitlint.config.mjs`
- Modify: `package.json` (scripts, `lint-staged`)

- [ ] **Step 1: Instalar**

Run: `pnpm add -D -w husky @commitlint/cli @commitlint/config-conventional lint-staged`

- [ ] **Step 2: Inicializar husky**

Run: `pnpm exec husky init`
Expected: cria `.husky/` e o script `prepare` no package.json.

- [ ] **Step 3: commitlint com os tipos do projeto**

Create `commitlint.config.mjs`:

```js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'chore', 'docs', 'refactor', 'test', 'ci', 'a11y']],
  },
};
```

- [ ] **Step 4: lint-staged no package.json**

Adicione ao `package.json`:

```json
"lint-staged": {
  "*.{ts,tsx,js,jsx,json,css,md}": "prettier --write",
  "*.{ts,tsx}": "eslint --fix"
}
```

- [ ] **Step 5: Hooks**

Conteúdo de `.husky/pre-commit`:

```sh
pnpm exec lint-staged
pnpm exec nx affected -t test --passWithNoTests
```

Conteúdo de `.husky/commit-msg`:

```sh
pnpm exec commitlint --edit "$1"
```

- [ ] **Step 6: Provar o guardrail**

Run: `git commit --allow-empty -m "mensagem invalida"`
Expected: FAIL (commitlint rejeita). Depois:
Run: `git commit --allow-empty -m "chore: verify commitlint hook"`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: add husky commitlint and lint-staged hooks"
```

---

## Wave 3 — Skeleton de libs + boundary rules

### Task 6: Lib `shared-types`

**Files:**

- Create: `libs/shared/types/*` (via generator)

- [ ] **Step 1: Gerar a lib**

Run: `pnpm exec nx g @nx/js:library libs/shared/types --bundler=tsc --unitTestRunner=vitest --linter=eslint --tags=type:util`

- [ ] **Step 2: Conferir o nome do pacote**

Run: `cat libs/shared/types/package.json`
Garanta `"name": "shared-types"`. Se vier diferente (ex.: `@buscanime/types`), ajuste para `shared-types`.

- [ ] **Step 3: Teste trivial**

Em `libs/shared/types/src/lib/*.spec.ts`, mantenha/escreva um teste que importe um símbolo e asserte (prova que a lib builda/importa).
Run: `pnpm exec nx test shared-types`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: scaffold shared-types library"
```

### Task 7: Lib `ui`

**Files:**

- Create: `libs/ui/*` (via generator)

- [ ] **Step 1: Gerar a lib React**

Run: `pnpm exec nx g @nx/react:library libs/ui --unitTestRunner=vitest --bundler=none --linter=eslint --tags=type:ui`

- [ ] **Step 2: Conferir nome do pacote**

Garanta `"name": "ui"` em `libs/ui/package.json`.

- [ ] **Step 3: Teste trivial do componente gerado**

Run: `pnpm exec nx test ui`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: scaffold ui design-system library"
```

### Task 8: Lib `anime-data-access`

**Files:**

- Create: `libs/anime/data-access/*` (via generator)

- [ ] **Step 1: Gerar a lib**

Run: `pnpm exec nx g @nx/js:library libs/anime/data-access --bundler=tsc --unitTestRunner=vitest --linter=eslint --tags=type:data-access`

- [ ] **Step 2: Conferir nome do pacote**

Garanta `"name": "anime-data-access"` em `libs/anime/data-access/package.json`.

- [ ] **Step 3: Forçar ambiente jsdom (lib entrega hook React)**

Em `libs/anime/data-access/vite.config.ts`, garanta `test.environment: 'jsdom'` e instale o plugin React se necessário:
Run: `pnpm add -D -w @testing-library/react`
(Confirme `@vitejs/plugin-react` no `vite.config.ts` desta lib.)

- [ ] **Step 4: Teste trivial + rodar**

Run: `pnpm exec nx test anime-data-access`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: scaffold anime-data-access library"
```

### Task 9: Boundary rules `type:*`

**Files:**

- Modify: `eslint.config.mjs`

- [ ] **Step 1: Substituir o depConstraints default**

Em `eslint.config.mjs`, troque o array `depConstraints` (hoje `sourceTag: "*" → "*"`) por:

```js
depConstraints: [
  { sourceTag: 'type:app', onlyDependOnLibsWithTags: ['type:ui', 'type:data-access', 'type:util'] },
  { sourceTag: 'type:ui', onlyDependOnLibsWithTags: ['type:ui', 'type:util'] },
  { sourceTag: 'type:data-access', onlyDependOnLibsWithTags: ['type:data-access', 'type:util'] },
  { sourceTag: 'type:util', onlyDependOnLibsWithTags: ['type:util'] },
];
```

- [ ] **Step 2: Garantir a tag do app**

Confirme que `apps/web/project.json` tem `"tags": ["type:app"]`.

- [ ] **Step 3: Lint geral**

Run: `pnpm exec nx run-many -t lint`
Expected: PASS (nada viola ainda).

- [ ] **Step 4: Provar o guardrail (violação temporária)**

Adicione em `libs/ui/src/index.ts` um import proibido: `import 'anime-data-access';`
Run: `pnpm exec nx lint ui`
Expected: FAIL com `@nx/enforce-module-boundaries` (type:ui não pode depender de type:data-access).
**Reverta** o import depois de confirmar.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: enforce type-based module boundaries"
```

---

## Wave 4 — Plumbing de runtime (pipeline provado)

### Task 10: Modelo de domínio em `shared-types`

**Files:**

- Create: `libs/shared/types/src/lib/anime.ts`
- Modify: `libs/shared/types/src/index.ts`

- [ ] **Step 1: Definir o contrato**

Create `libs/shared/types/src/lib/anime.ts`:

```ts
export type MediaFormat = 'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC';

export interface Anime {
  id: number;
  title: string;
  coverImage: string;
  averageScore: number | null;
  format: MediaFormat | null;
  genres: string[];
}
```

- [ ] **Step 2: Exportar no barrel**

Em `libs/shared/types/src/index.ts`: `export * from './lib/anime';`

- [ ] **Step 3: Typecheck + commit**

Run: `pnpm exec nx typecheck shared-types`

```bash
git add -A
git commit -m "feat: add Anime domain contract to shared-types"
```

### Task 11: Cliente GraphQL + codegen em `anime-data-access`

**Files:**

- Create: `libs/anime/data-access/src/lib/queries/anime-list.graphql`, `libs/anime/data-access/codegen.ts`, `libs/anime/data-access/src/lib/anilist-client.ts`
- Modify: `package.json` (deps + script `codegen`)

- [ ] **Step 1: Instalar deps**

Run: `pnpm add -w graphql graphql-request`
Run: `pnpm add -D -w @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-graphql-request`

- [ ] **Step 2: Documento da query**

Create `libs/anime/data-access/src/lib/queries/anime-list.graphql`:

```graphql
query AnimeList($page: Int = 1, $perPage: Int = 20) {
  Page(page: $page, perPage: $perPage) {
    media(type: ANIME, sort: POPULARITY_DESC) {
      id
      title {
        romaji
        english
      }
      coverImage {
        large
      }
      averageScore
      format
      genres
    }
  }
}
```

- [ ] **Step 3: Config do codegen**

Create `libs/anime/data-access/codegen.ts`:

```ts
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'https://graphql.anilist.co',
  documents: ['libs/anime/data-access/src/lib/queries/**/*.graphql'],
  generates: {
    'libs/anime/data-access/src/lib/generated/graphql.ts': {
      plugins: ['typescript', 'typescript-operations', 'typescript-graphql-request'],
    },
  },
};

export default config;
```

- [ ] **Step 4: Script + geração**

Adicione ao `package.json`: `"codegen": "graphql-codegen --config libs/anime/data-access/codegen.ts"`.
Run: `pnpm codegen`
Expected: cria `libs/anime/data-access/src/lib/generated/graphql.ts` com `getSdk` e `AnimeListQuery`.

- [ ] **Step 5: Factory do SDK**

Create `libs/anime/data-access/src/lib/anilist-client.ts`:

```ts
import { GraphQLClient } from 'graphql-request';
import { getSdk } from './generated/graphql';

/** O browser fala com o Route Handler, não com a AniList direto. */
export const ANILIST_PROXY_ENDPOINT = '/api/anilist';

export function createAnilistSdk(endpoint: string = ANILIST_PROXY_ENDPOINT) {
  return getSdk(new GraphQLClient(endpoint));
}
```

- [ ] **Step 6: Typecheck + commit**

Run: `pnpm exec nx typecheck anime-data-access`

```bash
git add -A
git commit -m "feat: add anilist graphql client and codegen setup"
```

### Task 12: Hook `useAnimeList` + transform (TDD com MSW)

**Files:**

- Create: `libs/anime/data-access/src/lib/transform.ts`, `libs/anime/data-access/src/lib/use-anime-list.ts`, `libs/anime/data-access/src/lib/use-anime-list.spec.tsx`
- Modify: `libs/anime/data-access/src/index.ts`, `package.json` (`@tanstack/react-query`)

- [ ] **Step 1: Instalar TanStack Query**

Run: `pnpm add -w @tanstack/react-query`

- [ ] **Step 2: Escrever o teste que falha**

Create `libs/anime/data-access/src/lib/use-anime-list.spec.tsx`:

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { graphql, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { useAnimeList } from './use-anime-list';

const server = setupServer(
  graphql.query('AnimeList', () =>
    HttpResponse.json({
      data: {
        Page: {
          media: [
            {
              id: 1,
              title: { romaji: 'Naruto', english: null },
              coverImage: { large: 'naruto.jpg' },
              averageScore: 80,
              format: 'TV',
              genres: ['Action'],
            },
          ],
        },
      },
    }),
  ),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

// Endpoint ABSOLUTO: graphql-request/undici rejeita URL relativa em node/jsdom.
// O MSW intercepta por nome de operação ('AnimeList'), independente da URL.
const TEST_ENDPOINT = 'http://localhost/api/anilist';

it('retorna a lista de Anime normalizada', async () => {
  const { result } = renderHook(() => useAnimeList(TEST_ENDPOINT), { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toEqual([
    {
      id: 1,
      title: 'Naruto',
      coverImage: 'naruto.jpg',
      averageScore: 80,
      format: 'TV',
      genres: ['Action'],
    },
  ]);
});
```

- [ ] **Step 3: Rodar — deve falhar**

Run: `pnpm exec nx test anime-data-access`
Expected: FAIL (`use-anime-list` não existe).

- [ ] **Step 4: Implementar o transform**

Create `libs/anime/data-access/src/lib/transform.ts`:

```ts
import type { Anime, MediaFormat } from 'shared-types';
import type { AnimeListQuery } from './generated/graphql';

type Media = NonNullable<NonNullable<AnimeListQuery['Page']>['media']>[number];

export function toAnime(media: NonNullable<Media>): Anime {
  return {
    id: media.id,
    title: media.title?.english ?? media.title?.romaji ?? 'Untitled',
    coverImage: media.coverImage?.large ?? '',
    averageScore: media.averageScore ?? null,
    format: (media.format as MediaFormat | null) ?? null,
    genres: (media.genres ?? []).filter((g): g is string => Boolean(g)),
  };
}
```

- [ ] **Step 5: Implementar o hook**

Create `libs/anime/data-access/src/lib/use-anime-list.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import type { Anime } from 'shared-types';
import { createAnilistSdk } from './anilist-client';
import { toAnime } from './transform';

export function useAnimeList(endpoint?: string) {
  return useQuery({
    queryKey: ['anime-list'],
    queryFn: async (): Promise<Anime[]> => {
      const sdk = createAnilistSdk(endpoint);
      const data = await sdk.AnimeList({ page: 1, perPage: 20 });
      return (data.Page?.media ?? []).filter((m): m is NonNullable<typeof m> => Boolean(m)).map(toAnime);
    },
  });
}
```

- [ ] **Step 6: Exportar no barrel**

Em `libs/anime/data-access/src/index.ts`:

```ts
export * from './lib/use-anime-list';
export * from './lib/anilist-client';
```

- [ ] **Step 7: Rodar — deve passar**

Run: `pnpm exec nx test anime-data-access`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add useAnimeList hook with anilist transform"
```

### Task 13: Route Handler `api/anilist` (TDD)

**Files:**

- Create: `apps/web/src/app/api/anilist/route.ts`, `apps/web/src/app/api/anilist/route.spec.ts`
- Delete: `apps/web/src/app/api/hello/`
- Modify: `package.json` (`@sentry/nextjs`)

- [ ] **Step 1: Instalar Sentry (pinar versão pós-fix Turbopack)**

Run: `pnpm add -w @sentry/nextjs@latest`
Depois **pine a versão instalada** no `package.json` (sem `^`) e registre-a no commit. O bug de transporte server-side em Next 16/Turbopack afetou ~10.32–10.34 (ver §10 da spec); a `@latest` atual já está acima disso. Só revisite se o teste de captura server-side da Task 13 (caso de erro → `Sentry.captureException`) falhar. Run: `pnpm why @sentry/nextjs` para confirmar a versão resolvida.

- [ ] **Step 2: Escrever os testes que falham**

Create `apps/web/src/app/api/anilist/route.spec.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Sentry from '@sentry/nextjs';
import { POST } from './route';

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

describe('POST /api/anilist', () => {
  beforeEach(() => vi.clearAllMocks());

  it('faz proxy da query e devolve o payload da AniList', async () => {
    const upstream = { data: { Page: { media: [] } } };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(upstream), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );
    const req = new Request('http://localhost/api/anilist', {
      method: 'POST',
      body: JSON.stringify({ query: '{ Page { media { id } } }' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(upstream);
  });

  it('captura falha de upstream no Sentry e responde 502', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    const req = new Request('http://localhost/api/anilist', {
      method: 'POST',
      body: JSON.stringify({ query: '{}' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(502);
    expect(Sentry.captureException).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Rodar — deve falhar**

Run: `pnpm exec nx test web`
Expected: FAIL (`./route` não existe).

- [ ] **Step 4: Implementar o handler**

Create `apps/web/src/app/api/anilist/route.ts`:

```ts
import * as Sentry from '@sentry/nextjs';

const ANILIST_ENDPOINT = 'https://graphql.anilist.co';

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    const body = await request.text();
    const upstream = await fetch(ANILIST_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body,
    });
    const payload = await upstream.text();
    console.info(`[anilist] ${upstream.status} in ${Date.now() - startedAt}ms`);
    return new Response(payload, {
      status: upstream.status,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    Sentry.captureException(error);
    console.error(`[anilist] failed in ${Date.now() - startedAt}ms`, error);
    return Response.json({ error: 'Upstream AniList request failed' }, { status: 502 });
  }
}
```

- [ ] **Step 5: Remover a rota de exemplo**

Run: `rm -rf apps/web/src/app/api/hello`

- [ ] **Step 6: Rodar — deve passar**

Run: `pnpm exec nx test web`
Expected: PASS (ambos os casos).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add anilist route handler with sentry capture"
```

### Task 14: Providers + Sentry + limpeza do layout

**Files:**

- Create: `apps/web/src/app/providers.tsx`, `apps/web/src/app/error.tsx`, `apps/web/src/app/global-error.tsx`, `apps/web/instrumentation.ts`, `apps/web/instrumentation-client.ts`, `apps/web/sentry.server.config.ts`, `apps/web/sentry.edge.config.ts`
- Modify: `apps/web/src/app/layout.tsx`, `apps/web/src/app/page.tsx`, `apps/web/next.config.js`

- [ ] **Step 1: Providers (TanStack Query)**

Create `apps/web/src/app/providers.tsx`:

```tsx
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

- [ ] **Step 2: Sentry configs (env-gated)**

Create `apps/web/sentry.server.config.ts` e `apps/web/sentry.edge.config.ts` (mesmo conteúdo):

```ts
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
Sentry.init({ dsn, enabled: Boolean(dsn), tracesSampleRate: 1.0 });
```

Create `apps/web/instrumentation-client.ts`:

```ts
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
Sentry.init({ dsn, enabled: Boolean(dsn), tracesSampleRate: 1.0, replaysOnErrorSampleRate: 1.0 });
```

Create `apps/web/instrumentation.ts`:

```ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export { captureRequestError as onRequestError } from '@sentry/nextjs';
```

- [ ] **Step 3: Error boundaries do App Router**

Create `apps/web/src/app/global-error.tsx`:

```tsx
'use client';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <html lang="pt-BR">
      <body>
        <h2>Algo deu errado.</h2>
      </body>
    </html>
  );
}
```

Create `apps/web/src/app/error.tsx`:

```tsx
'use client';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <main>
      <h2>Algo deu errado.</h2>
      <button onClick={reset}>Tentar novamente</button>
    </main>
  );
}
```

- [ ] **Step 4: Limpar o layout + page**

Substitua `apps/web/src/app/layout.tsx`:

```tsx
import './global.css';
import { Providers } from './providers';

export const metadata = {
  title: 'buscanime',
  description: 'Listagem de animes — AniList',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

Substitua `apps/web/src/app/page.tsx` por um placeholder mínimo (sem boilerplate Nx):

```tsx
export default function Index() {
  return <main className="p-8 text-2xl font-bold">buscanime</main>;
}
```

Run: `rm -f apps/web/src/app/page.module.css`

- [ ] **Step 5: Envolver o Next config com Sentry**

Em `apps/web/next.config.js`, envolva o export com `withSentryConfig`:

```js
const { withSentryConfig } = require('@sentry/nextjs');
/** @type {import('next').NextConfig} */
const nextConfig = {};
module.exports = withSentryConfig(nextConfig, { silent: true });
```

- [ ] **Step 6: Verificar build + typecheck (Sentry no-op sem DSN)**

Run: `pnpm exec nx run-many -t typecheck build -p web`
Expected: PASS sem `NEXT_PUBLIC_SENTRY_DSN` setado (init vira no-op).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: wire query provider and env-gated sentry"
```

---

## Wave 5 — Fechamento

### Task 15: README + verificação final

**Files:**

- Modify: `README.md`

- [ ] **Step 1: README do workspace**

Documente em `README.md`: visão geral, estrutura das libs + tabela de tags, regra de boundary (`ui ✗ data-access`), como rodar (`pnpm install`, `pnpm exec nx dev web`), scripts (`pnpm codegen`), env (`NEXT_PUBLIC_SENTRY_DSN`).

- [ ] **Step 2: Verificação completa (Definition of Done)**

Run: `pnpm exec nx run-many -t lint test typecheck build`
Expected: tudo PASS.
Run: `pnpm exec nx e2e web-e2e`
Expected: PASS (e2e mínimo gerado).

- [ ] **Step 3: Grafo como evidência**

Run: `pnpm exec nx graph --file=docs/superpowers/nx-graph.html`
Confirme os nós das 3 libs + app e as arestas conforme o desenho.

- [ ] **Step 4: Confirmar lockfile único**

Run: `ls package-lock.json 2>/dev/null && echo "REMOVER" || echo "ok: só pnpm-lock"`
Expected: `ok: só pnpm-lock`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "docs: add workspace readme and foundation evidence"
```

---

## Definition of Done (checklist final)

- [ ] Lockfile único (`pnpm-lock.yaml`); CI verde com pnpm.
- [ ] `nx run-many -t lint test typecheck build` verde; e2e mínimo verde.
- [ ] 3 libs com tags corretas; `enforce-module-boundaries` com constraints `type:*`.
- [ ] Violação `ui → data-access` é bloqueada pelo lint (provado na Task 9).
- [ ] `pnpm codegen` gera o SDK tipado sem erro.
- [ ] Teste MSW do `useAnimeList` passa; testes do route handler (feliz + erro) passam.
- [ ] Sentry env-gated (sem DSN = no-op; com DSN captura no route handler).
- [ ] Tailwind v4 aplica classes vindas de `libs/ui` no app.
- [ ] Boilerplate Nx removido; README atualizado.
