# Listing Page (anime-list) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Montar a página de listagem de animes (o wireframe) plugando o Design System `ui` no pipeline de dados `anime-data-access`, com filtro por formato, busca com debounce, paginação "Ver mais" e estados de loading/vazio/erro — estado na URL.

**Architecture:** Next App Router. `page.tsx` (Server Component) renderiza `Header` + `<Suspense>` (obrigatório por causa do `useSearchParams`) com o `AnimeBrowser` + `Footer`. `AnimeBrowser` (`'use client'`) orquestra: lê filtros da URL via `useAnimeFilters` (URL ⇄ estado + debounce 300ms), dispara `useAnimeList` (que vira `useInfiniteQuery`), e compõe os componentes do DS. A query GraphQL é estendida com `search`/`format`/`sort`/`pageInfo`. O `Button` do DS ganha estado `loading` (spinner), repassado pela `SearchBar`.

**Tech Stack:** Nx 23, Next 16 (App Router), React 19, TypeScript, TanStack Query v5 (`useInfiniteQuery`), graphql-request + GraphQL Codegen, Tailwind v4, lucide-react, Vitest + Testing Library + MSW v2, Playwright (e2e).

**Spec:** `docs/superpowers/specs/2026-06-25-listing-page-design.md`

**Convenções de execução:**

- Bash tool (Git Bash) pra shell. `pnpm exec nx ...` pros targets; `pnpm --filter <pkg> add ...` pra deps de pacote.
- **Branch:** trabalhar em `feat/listing-page` (estamos na `main`; foundation/DS usaram branches de feature). Criar antes de começar: `git switch -c feat/listing-page`.
- **husky ativo:** pre-commit (lint-staged + `nx affected -t test`) e commit-msg (commitlint — tipos `feat`/`fix`/`chore`/`docs`/`refactor`/`test`/`ci`/`a11y`). **Comitar só em verde.**
- **Nomes de projeto Nx** (de `nx show projects`): `anime-data-access`, `ui`, `web`, `web-e2e`.
- Imports de pacote (`@buscanime/*`, `lucide-react`, `@tanstack/react-query`) sem extensão. Imports **relativos** seguem o estilo do vizinho: a `libs/anime/data-access` usa `.js` nos relativos (ver `use-anime-list.ts` → `'./transform.js'`); a `libs/ui` e a `apps/web` usam **sem** extensão. Mantenha consistente com o arquivo que está editando.

**Decisões de implementação derivadas do código atual** (ler antes de começar):

1. **Endpoint injetável pra teste.** `graphql-request` (undici) rejeita URL relativa em node/jsdom — por isso o teste atual do hook passa um `endpoint` absoluto (`http://localhost/api/anilist`). Mantemos esse seam: o novo `useAnimeList({ search, format, endpoint })` continua aceitando `endpoint?`, e o `AnimeBrowser` aceita uma prop `endpoint?` (test-only) repassada ao hook. Em produção a página renderiza `<AnimeBrowser />` sem `endpoint` (usa o proxy `/api/anilist`).
2. **`SearchBar` também ganha `loading`.** A spec (§2.1, §8) chama explicitamente só a adição de `loading` no `Button`, mas o botão "Buscar" vive **dentro** da `SearchBar` (`libs/ui/src/lib/search-bar/search-bar.tsx`). Pra ligar o spinner do "Buscar", a `SearchBar` precisa aceitar `loading?` e repassar ao seu `<Button>`. Incluído na Task 4.
3. **`Container` fica no `AnimeBrowser`.** `Header`/`Footer` já embrulham o conteúdo no próprio `Container` internamente; o `AnimeBrowser` adiciona o seu `Container` (max-w-7xl) na área de resultados.

---

## File Structure

```
libs/anime/data-access/
├── src/lib/queries/anime-list.graphql          → MODIFICAR: + $search/$format/$sort + pageInfo
├── src/lib/generated/{graphql,schema-types}.ts  → REGERAR (codegen)
├── src/lib/use-anime-list.ts                    → REESCREVER: useQuery → useInfiniteQuery({search,format,endpoint})
└── src/lib/use-anime-list.spec.tsx              → ATUALIZAR: MSW por página + flatten + fetchNextPage

libs/ui/
├── src/lib/button/button.tsx                    → MODIFICAR: + prop loading (spinner Loader2 + disabled + aria-busy)
├── src/lib/button/button.spec.tsx               → ATUALIZAR: + teste de loading
├── src/lib/search-bar/search-bar.tsx            → MODIFICAR: + prop loading → repassa ao Button "Buscar"
└── src/lib/search-bar/search-bar.spec.tsx       → ATUALIZAR: + teste de loading

apps/web/
├── package.json                                 → MODIFICAR: + deps ui, anime-data-access, lucide-react
├── vite.config.mts                              → MODIFICAR: + setupFiles
├── src/test-setup.ts                            → CRIAR: jest-dom + cleanup
└── src/app/
    ├── page.tsx                                 → REESCREVER: Header + Suspense(AnimeBrowser) + Footer
    └── (home)/
        ├── format-options.ts                    → CRIAR: opções do ToggleGroup + toMediaFormat
        ├── format-options.spec.ts               → CRIAR
        ├── use-anime-filters.ts                 → CRIAR: URL ⇄ estado + debounce
        ├── use-anime-filters.spec.tsx           → CRIAR
        ├── anime-browser.tsx                    → CRIAR: orquestrador
        └── anime-browser.spec.tsx               → CRIAR

apps/web-e2e/
└── src/example.spec.ts                          → SUBSTITUIR por anime-list.spec.ts (happy path)
```

---

## Wave 1 — Camada de dados (`anime-data-access`)

### Task 1: Estender a query GraphQL + regerar o codegen

**Files:**

- Modify: `libs/anime/data-access/src/lib/queries/anime-list.graphql`
- Regenerate: `libs/anime/data-access/src/lib/generated/graphql.ts`, `libs/anime/data-access/src/lib/generated/schema-types.ts`

- [ ] **Step 1: Reescrever a query** — `libs/anime/data-access/src/lib/queries/anime-list.graphql`:

```graphql
query AnimeList($page: Int = 1, $perPage: Int = 12, $search: String, $format: MediaFormat, $sort: [MediaSort] = [POPULARITY_DESC]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      currentPage
      hasNextPage
    }
    media(type: ANIME, search: $search, format: $format, sort: $sort) {
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

- [ ] **Step 2: Regerar os tipos** — precisa de **rede** (o codegen busca o schema em `https://graphql.anilist.co`):

Run: `pnpm codegen`
Expected: regenera `generated/schema-types.ts` e `generated/graphql.ts` sem erro.

> **Fallback offline** (se `pnpm codegen` não tiver rede — ex.: sandbox Windows): editar `generated/graphql.ts` à mão — (a) em `AnimeListQueryVariables`, adicionar `search?`, `format?` e `sort?`; (b) em `AnimeListQuery['Page']`, adicionar `pageInfo: { currentPage: number | null; hasNextPage: boolean | null } | null`; (c) garantir `export type MediaSort = ...` no arquivo (já existe em `schema-types.ts`); (d) adicionar `pageInfo`, `search`, `format`, `sort` ao `AnimeListDocument` (variableDefinitions + selections). Preferir sempre o codegen real — só use o fallback se a rede falhar.

- [ ] **Step 3: Verificar a geração**

Run: `grep -nE "search|format|sort" libs/anime/data-access/src/lib/generated/graphql.ts | grep -i "AnimeListQueryVariables" -A6`
Then: `grep -n "pageInfo" libs/anime/data-access/src/lib/generated/graphql.ts`
Expected: `AnimeListQueryVariables` contém `search`/`format`/`sort`; o tipo `AnimeListQuery` contém `pageInfo`.

- [ ] **Step 4: Typecheck (a lib ainda compila — os novos args são opcionais)**

Run: `pnpm exec nx typecheck anime-data-access`
Expected: PASS (o hook atual chama `AnimeList({ page, perPage })`, que continua válido).

- [ ] **Step 5: Commit**

```bash
git add libs/anime/data-access/src/lib/queries/anime-list.graphql libs/anime/data-access/src/lib/generated/
git commit -m "feat: extend AnimeList query with search, format, sort and pageInfo"
```

---

### Task 2: `useAnimeList` → `useInfiniteQuery`

@superpowers:test-driven-development — atualizar o teste **primeiro** (vermelho), depois o hook (verde).

**Files:**

- Modify: `libs/anime/data-access/src/lib/use-anime-list.ts`
- Test: `libs/anime/data-access/src/lib/use-anime-list.spec.tsx`

- [ ] **Step 1: Reescrever o teste pra `useInfiniteQuery`** — substituir todo o conteúdo de `use-anime-list.spec.tsx`:

```tsx
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { graphql, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { useAnimeList } from './use-anime-list.js';

const naruto = {
  id: 1,
  title: { romaji: 'Naruto', english: null },
  coverImage: { large: 'naruto.jpg' },
  averageScore: 80,
  format: 'TV',
  genres: ['Action'],
};
const bleach = {
  id: 2,
  title: { romaji: 'Bleach', english: null },
  coverImage: { large: 'bleach.jpg' },
  averageScore: 75,
  format: 'TV',
  genres: ['Action'],
};

const narutoAnime = {
  id: 1,
  title: 'Naruto',
  coverImage: 'naruto.jpg',
  averageScore: 80,
  format: 'TV',
  genres: ['Action'],
};
const bleachAnime = {
  id: 2,
  title: 'Bleach',
  coverImage: 'bleach.jpg',
  averageScore: 75,
  format: 'TV',
  genres: ['Action'],
};

let lastVariables: Record<string, unknown> | undefined;

const server = setupServer(
  graphql.query('AnimeList', ({ variables }) => {
    lastVariables = variables;
    const isFirst = variables.page === 1;
    return HttpResponse.json({
      data: {
        Page: {
          pageInfo: { currentPage: variables.page, hasNextPage: isFirst },
          media: [isFirst ? naruto : bleach],
        },
      },
    });
  }),
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  lastVariables = undefined;
});
afterAll(() => server.close());

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

// Endpoint ABSOLUTO: graphql-request/undici rejeita URL relativa em node/jsdom.
const TEST_ENDPOINT = 'http://localhost/api/anilist';

it('retorna a 1ª página normalizada (flatten) e indica hasNextPage', async () => {
  const { result } = renderHook(() => useAnimeList({ endpoint: TEST_ENDPOINT }), { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data?.pages[0].items).toEqual([narutoAnime]);
  expect(result.current.hasNextPage).toBe(true);
});

it('fetchNextPage acumula as páginas e encerra quando hasNextPage é false', async () => {
  const { result } = renderHook(() => useAnimeList({ endpoint: TEST_ENDPOINT }), { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  await act(async () => {
    await result.current.fetchNextPage();
  });
  await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
  const all = result.current.data?.pages.flatMap((p) => p.items);
  expect(all).toEqual([narutoAnime, bleachAnime]);
  expect(result.current.hasNextPage).toBe(false);
});

it('usa SEARCH_MATCH quando há busca e passa search/format às variáveis', async () => {
  const { result } = renderHook(() => useAnimeList({ search: 'naruto', format: 'TV', endpoint: TEST_ENDPOINT }), { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(lastVariables).toMatchObject({
    search: 'naruto',
    format: 'TV',
    sort: ['SEARCH_MATCH'],
    perPage: 12,
  });
});
```

- [ ] **Step 2: Rodar — deve falhar**

Run: `pnpm exec nx test anime-data-access`
Expected: FAIL (o hook ainda usa `useQuery`; `result.current.data.pages` é `undefined`; `useAnimeList` não aceita objeto).

- [ ] **Step 3: Reescrever o hook** — substituir todo o conteúdo de `use-anime-list.ts`:

```ts
import { useInfiniteQuery } from '@tanstack/react-query';
import type { Anime, MediaFormat } from 'shared-types';
import type { MediaSort } from './generated/graphql.js';
import { createAnilistSdk } from './anilist-client.js';
import { toAnime } from './transform.js';

const PER_PAGE = 12;

export interface UseAnimeListParams {
  search?: string;
  format?: MediaFormat;
  /** Test-only: endpoint absoluto pro MSW (graphql-request rejeita URL relativa em jsdom). */
  endpoint?: string;
}

export function useAnimeList({ search, format, endpoint }: UseAnimeListParams = {}) {
  const trimmed = search?.trim() ? search.trim() : undefined;
  const sort: MediaSort[] = trimmed ? ['SEARCH_MATCH'] : ['POPULARITY_DESC'];

  return useInfiniteQuery({
    queryKey: ['anime-list', format ?? null, trimmed ?? null],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const sdk = createAnilistSdk(endpoint);
      const data = await sdk.AnimeList({
        page: pageParam,
        perPage: PER_PAGE,
        search: trimmed,
        format,
        sort,
      });
      const items: Anime[] = (data.Page?.media ?? []).filter((m): m is NonNullable<typeof m> => Boolean(m)).map(toAnime);
      return { items, pageInfo: data.Page?.pageInfo ?? null };
    },
    getNextPageParam: (lastPage, _allPages, lastPageParam) => (lastPage.pageInfo?.hasNextPage ? lastPageParam + 1 : undefined),
  });
}
```

> Se o `import type { MediaSort }` de `./generated/graphql.js` não existir (fallback offline da Task 1 sem ele), importar de `./generated/schema-types.js`.

- [ ] **Step 4: Rodar — deve passar**

Run: `pnpm exec nx test anime-data-access`
Expected: PASS (3 testes).

- [ ] **Step 5: Typecheck**

Run: `pnpm exec nx typecheck anime-data-access`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add libs/anime/data-access/src/lib/use-anime-list.ts libs/anime/data-access/src/lib/use-anime-list.spec.tsx
git commit -m "feat: paginate useAnimeList with useInfiniteQuery, search and format"
```

---

## Wave 2 — Adições no Design System (`ui`)

### Task 3: `Button` ganha `loading`

@superpowers:test-driven-development

**Files:**

- Modify: `libs/ui/src/lib/button/button.tsx`
- Test: `libs/ui/src/lib/button/button.spec.tsx`

- [ ] **Step 1: Adicionar o teste** — acrescentar este `it` dentro do `describe('Button', ...)` em `button.spec.tsx` (depois do teste do ícone):

```tsx
it('mostra spinner, desabilita e marca aria-busy quando loading', () => {
  render(<Button loading>Buscar</Button>);
  const btn = screen.getByRole('button', { name: 'Buscar' });
  expect(btn).toBeDisabled();
  expect(btn).toHaveAttribute('aria-busy', 'true');
  expect(btn.querySelector('svg.animate-spin')).toBeInTheDocument();
});
```

- [ ] **Step 2: Rodar — deve falhar**

Run: `pnpm exec nx test ui`
Expected: FAIL (`Button` ainda não aceita `loading`; sem spinner, sem `aria-busy`).

- [ ] **Step 3: Implementar** — editar `button.tsx`: importar `Loader2`, adicionar `loading` à interface, e renderizar o spinner no lugar do ícone + `disabled`/`aria-busy`.

No topo, adicionar o import:

```tsx
import { Loader2 } from 'lucide-react';
```

Na interface:

```tsx
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof button> {
  icon?: ReactNode;
  loading?: boolean;
}
```

No componente, trocar a assinatura e o corpo do `<button>`:

```tsx
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, variant, size, active, icon, loading, children, disabled, ...props }, ref) {
  return (
    <button ref={ref} className={cn(button({ variant, size, active }), className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading ? (
        <span aria-hidden="true">
          <Loader2 className="animate-spin" />
        </span>
      ) : (
        icon && <span aria-hidden="true">{icon}</span>
      )}
      {children}
    </button>
  );
});
```

- [ ] **Step 4: Story** — em `button.stories.tsx`, adicionar uma story `Loading` (`args: { children: 'Buscar', loading: true }`), seguindo o padrão `Meta`/`StoryObj` das stories existentes.

- [ ] **Step 5: Rodar — deve passar**

Run: `pnpm exec nx test ui`
Expected: PASS (incluindo o novo teste e os de a11y já existentes).

- [ ] **Step 6: Commit**

```bash
git add libs/ui/src/lib/button/
git commit -m "feat: add loading state with spinner to Button"
```

---

### Task 4: `SearchBar` repassa `loading` ao botão "Buscar"

@superpowers:test-driven-development

**Files:**

- Modify: `libs/ui/src/lib/search-bar/search-bar.tsx`
- Test: `libs/ui/src/lib/search-bar/search-bar.spec.tsx`

- [ ] **Step 1: Adicionar o teste** — acrescentar em `search-bar.spec.tsx`:

```tsx
it('repassa loading pro botão Buscar', () => {
  render(<SearchBar value="" onChange={() => {}} onSearch={() => {}} loading />);
  expect(screen.getByRole('button', { name: 'Buscar' })).toHaveAttribute('aria-busy', 'true');
});
```

(Se o arquivo não importar `render`/`screen`/`it`/`expect`, seguir os imports já usados nos outros specs da lib.)

- [ ] **Step 2: Rodar — deve falhar**

Run: `pnpm exec nx test ui`
Expected: FAIL (`SearchBar` ignora `loading`; o botão não tem `aria-busy`).

- [ ] **Step 3: Implementar** — editar `search-bar.tsx`: adicionar `loading?` à interface e repassar ao `<Button>`:

```tsx
export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  loading?: boolean;
}
```

E na assinatura/JSX:

```tsx
export function SearchBar({ value, onChange, onSearch, loading }: SearchBarProps) {
  // ...handleSubmit inalterado...
  // no botão:
  <Button type="submit" variant="solid" size="lg" loading={loading}>
    Buscar
  </Button>
```

- [ ] **Step 4: Rodar — deve passar**

Run: `pnpm exec nx test ui`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add libs/ui/src/lib/search-bar/
git commit -m "feat: forward loading prop from SearchBar to its search Button"
```

---

## Wave 3 — Página (`apps/web`)

### Task 5: Dependências da app + test-setup

**Files:**

- Modify: `apps/web/package.json`, `apps/web/vite.config.mts`
- Create: `apps/web/src/test-setup.ts`

- [ ] **Step 1: Adicionar as deps de workspace + lucide-react** à app:

```bash
pnpm --filter web add ui@workspace:* anime-data-access@workspace:* lucide-react
```

Expected: grava as 3 deps em `apps/web/package.json` e roda `pnpm install`. (As libs de teste — `msw`, `@testing-library/*`, `vitest-axe` — já estão na raiz e resolvem por hoisting.)

- [ ] **Step 2: Criar o test-setup** — `apps/web/src/test-setup.ts`:

```ts
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

afterEach(() => cleanup());
```

- [ ] **Step 3: Ligar o setupFiles** — em `apps/web/vite.config.mts`, dentro do bloco `test`, adicionar a chave (logo após `environment: 'jsdom',`):

```ts
    setupFiles: ['./src/test-setup.ts'],
```

- [ ] **Step 4: Verificar que nada quebrou** (o `route.spec.ts` existente roda):

Run: `pnpm exec nx test web`
Expected: PASS (testes da API continuam verdes; jest-dom carregado).

- [ ] **Step 5: Commit**

```bash
git add apps/web/package.json apps/web/vite.config.mts apps/web/src/test-setup.ts pnpm-lock.yaml
git commit -m "chore: wire ui/data-access deps and test-setup into web app"
```

---

### Task 6: `format-options.ts` (opções do ToggleGroup + mapa de formato)

@superpowers:test-driven-development

**Files:**

- Create: `apps/web/src/app/(home)/format-options.ts`
- Test: `apps/web/src/app/(home)/format-options.spec.ts`

- [ ] **Step 1: Teste que falha** — `format-options.spec.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { FORMAT_OPTIONS, toMediaFormat } from './format-options';

describe('format-options', () => {
  it('a primeira opção é "All Formats" com value ALL', () => {
    expect(FORMAT_OPTIONS[0]).toEqual({ label: 'All Formats', value: 'ALL' });
  });

  it('ALL vira undefined (sem filtro)', () => {
    expect(toMediaFormat('ALL')).toBeUndefined();
  });

  it('os demais valores viram o MediaFormat correspondente', () => {
    expect(toMediaFormat('TV')).toBe('TV');
    expect(toMediaFormat('MOVIE')).toBe('MOVIE');
    expect(toMediaFormat('MUSIC')).toBe('MUSIC');
  });
});
```

- [ ] **Step 2: Rodar — deve falhar**

Run: `pnpm exec nx test web`
Expected: FAIL (módulo `format-options` não existe).

- [ ] **Step 3: Implementar** — `format-options.ts` (mapa da §9 da spec):

```ts
import type { MediaFormat } from 'shared-types';
import type { ToggleGroupOption } from 'ui';

export const FORMAT_OPTIONS: ToggleGroupOption[] = [
  { label: 'All Formats', value: 'ALL' },
  { label: 'TV Show', value: 'TV' },
  { label: 'Movie', value: 'MOVIE' },
  { label: 'TV Short', value: 'TV_SHORT' },
  { label: 'Special', value: 'SPECIAL' },
  { label: 'OVA', value: 'OVA' },
  { label: 'ONA', value: 'ONA' },
  { label: 'Music', value: 'MUSIC' },
];

/** 'ALL' (ou desconhecido) → undefined (sem filtro); senão o próprio MediaFormat. */
export function toMediaFormat(value: string): MediaFormat | undefined {
  return value === 'ALL' ? undefined : (value as MediaFormat);
}
```

- [ ] **Step 4: Rodar — deve passar**

Run: `pnpm exec nx test web`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "apps/web/src/app/(home)/format-options.ts" "apps/web/src/app/(home)/format-options.spec.ts"
git commit -m "feat: add format options and MediaFormat mapping for the browser"
```

---

### Task 7: `useAnimeFilters` (URL ⇄ estado + debounce)

@superpowers:test-driven-development

**Files:**

- Create: `apps/web/src/app/(home)/use-anime-filters.ts`
- Test: `apps/web/src/app/(home)/use-anime-filters.spec.tsx`

- [ ] **Step 1: Teste que falha** — `use-anime-filters.spec.tsx` (mocka `next/navigation` + fake timers):

```tsx
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const replace = vi.fn();
let params = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/',
  useSearchParams: () => params,
}));

import { useAnimeFilters } from './use-anime-filters';

beforeEach(() => {
  replace.mockClear();
  params = new URLSearchParams();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe('useAnimeFilters', () => {
  it('setFormat grava format na URL e remove em ALL', () => {
    const { result } = renderHook(() => useAnimeFilters());
    act(() => result.current.setFormat('TV'));
    expect(replace).toHaveBeenCalledWith('/?format=TV', { scroll: false });
    act(() => result.current.setFormat('ALL'));
    expect(replace).toHaveBeenLastCalledWith('/', { scroll: false });
  });

  it('digitar faz debounce de 300ms antes de gravar q', () => {
    const { result } = renderHook(() => useAnimeFilters());
    act(() => result.current.onChangeText('naruto'));
    expect(replace).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(300));
    expect(replace).toHaveBeenCalledWith('/?q=naruto', { scroll: false });
  });

  it('flush (Buscar/Enter) grava na hora e cancela o debounce pendente', () => {
    const { result } = renderHook(() => useAnimeFilters());
    act(() => result.current.onChangeText('one piece'));
    act(() => result.current.flush());
    expect(replace).toHaveBeenCalledWith('/?q=one+piece', { scroll: false });
    replace.mockClear();
    act(() => vi.advanceTimersByTime(300));
    expect(replace).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar — deve falhar**

Run: `pnpm exec nx test web`
Expected: FAIL (`use-anime-filters` não existe).

- [ ] **Step 3: Implementar** — `use-anime-filters.ts`:

```ts
'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const DEBOUNCE_MS = 300;

export function useAnimeFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const format = searchParams.get('format') ?? 'ALL';
  const q = searchParams.get('q') ?? '';

  // Input com digitação instantânea (local); sincroniza pra URL via debounce.
  const [text, setText] = useState(q);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commit = useCallback(
    (next: { format?: string; q?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.format !== undefined) {
        if (next.format === 'ALL') params.delete('format');
        else params.set('format', next.format);
      }
      if (next.q !== undefined) {
        if (!next.q.trim()) params.delete('q');
        else params.set('q', next.q);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const setFormat = useCallback((value: string) => commit({ format: value }), [commit]);

  const onChangeText = useCallback(
    (value: string) => {
      setText(value);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => commit({ q: value }), DEBOUNCE_MS);
    },
    [commit],
  );

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    commit({ q: text });
  }, [commit, text]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { format, q, text, setFormat, onChangeText, flush };
}
```

- [ ] **Step 4: Rodar — deve passar**

Run: `pnpm exec nx test web`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "apps/web/src/app/(home)/use-anime-filters.ts" "apps/web/src/app/(home)/use-anime-filters.spec.tsx"
git commit -m "feat: add useAnimeFilters hook for URL-synced filters with debounce"
```

---

### Task 8: `AnimeBrowser` (orquestrador)

@superpowers:test-driven-development

**Files:**

- Create: `apps/web/src/app/(home)/anime-browser.tsx`
- Test: `apps/web/src/app/(home)/anime-browser.spec.tsx`

- [ ] **Step 1: Teste que falha** — `anime-browser.spec.tsx` (MSW + `next/navigation` mockado estático):

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { graphql, HttpResponse } from 'msw';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import type { ReactNode } from 'react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

import { AnimeBrowser } from './anime-browser';

const TEST_ENDPOINT = 'http://localhost/api/anilist';

const page1 = {
  pageInfo: { currentPage: 1, hasNextPage: true },
  media: [{ id: 1, title: { romaji: 'Naruto', english: null }, coverImage: { large: 'n.jpg' }, averageScore: 80, format: 'TV', genres: ['Action'] }],
};
const page2 = {
  pageInfo: { currentPage: 2, hasNextPage: false },
  media: [{ id: 2, title: { romaji: 'Bleach', english: null }, coverImage: { large: 'b.jpg' }, averageScore: 75, format: 'TV', genres: ['Action'] }],
};

const server = setupServer(graphql.query('AnimeList', ({ variables }) => HttpResponse.json({ data: { Page: variables.page === 1 ? page1 : page2 } })));
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('AnimeBrowser', () => {
  it('mostra skeleton e depois a grade', async () => {
    render(<AnimeBrowser endpoint={TEST_ENDPOINT} />, { wrapper });
    expect(screen.getAllByLabelText('Carregando anime').length).toBeGreaterThan(0);
    expect(await screen.findByText('Naruto')).toBeInTheDocument();
  });

  it('"Ver mais" acumula a próxima página', async () => {
    render(<AnimeBrowser endpoint={TEST_ENDPOINT} />, { wrapper });
    await screen.findByText('Naruto');
    await userEvent.click(screen.getByRole('button', { name: /ver mais/i }));
    expect(await screen.findByText('Bleach')).toBeInTheDocument();
    expect(screen.getByText('Naruto')).toBeInTheDocument();
  });

  it('mostra o estado vazio quando não há resultados', async () => {
    server.use(
      graphql.query('AnimeList', () =>
        HttpResponse.json({
          data: { Page: { pageInfo: { currentPage: 1, hasNextPage: false }, media: [] } },
        }),
      ),
    );
    render(<AnimeBrowser endpoint={TEST_ENDPOINT} />, { wrapper });
    expect(await screen.findByText('Nada encontrado')).toBeInTheDocument();
  });

  it('mostra erro e "Tentar de novo" refaz a query', async () => {
    let calls = 0;
    server.use(
      graphql.query('AnimeList', () => {
        calls += 1;
        return calls === 1 ? HttpResponse.json({ errors: [{ message: 'boom' }] }, { status: 500 }) : HttpResponse.json({ data: { Page: page1 } });
      }),
    );
    render(<AnimeBrowser endpoint={TEST_ENDPOINT} />, { wrapper });
    expect(await screen.findByText('Erro ao carregar')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /tentar de novo/i }));
    expect(await screen.findByText('Naruto')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar — deve falhar**

Run: `pnpm exec nx test web`
Expected: FAIL (`anime-browser` não existe).

- [ ] **Step 3: Implementar** — `anime-browser.tsx`:

```tsx
'use client';
import { Plus, SearchX, ServerCrash } from 'lucide-react';
import { AnimeGrid, AnimeCard, AnimeGridSkeleton, ToggleGroup, SearchBar, StatusState, Button, Container } from 'ui';
import { useAnimeList } from 'anime-data-access';
import { useAnimeFilters } from './use-anime-filters';
import { FORMAT_OPTIONS, toMediaFormat } from './format-options';

export interface AnimeBrowserProps {
  /** Test-only: endpoint absoluto pro MSW (graphql-request rejeita URL relativa em jsdom). */
  endpoint?: string;
}

export function AnimeBrowser({ endpoint }: AnimeBrowserProps) {
  const { format, q, text, setFormat, onChangeText, flush } = useAnimeFilters();
  const query = useAnimeList({ search: q, format: toMediaFormat(format), endpoint });

  const animes = query.data?.pages.flatMap((p) => p.items) ?? [];
  const searching = query.isFetching && !query.isFetchingNextPage;

  return (
    <Container>
      <div className="flex flex-col gap-6 py-8">
        <ToggleGroup options={FORMAT_OPTIONS} value={format} onChange={setFormat} />
        <SearchBar value={text} onChange={onChangeText} onSearch={flush} loading={searching} />

        <div aria-live="polite" aria-busy={query.isLoading}>
          {query.isLoading ? (
            <AnimeGridSkeleton count={12} />
          ) : query.isError ? (
            <StatusState icon={<ServerCrash />} title="Erro ao carregar" message="Algo deu errado ao buscar os animes." action={<Button onClick={() => query.refetch()}>Tentar de novo</Button>} />
          ) : animes.length === 0 ? (
            <StatusState icon={<SearchX />} title="Nada encontrado" message="Tente outro filtro ou outra busca." />
          ) : (
            <>
              <AnimeGrid>
                {animes.map((anime) => (
                  <AnimeCard key={anime.id} anime={anime} />
                ))}
              </AnimeGrid>
              {query.hasNextPage && (
                <div className="mt-8 flex justify-center">
                  <Button size="lg" icon={<Plus />} loading={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>
                    Ver mais
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Container>
  );
}
```

- [ ] **Step 4: Rodar — deve passar**

Run: `pnpm exec nx test web`
Expected: PASS (4 testes do AnimeBrowser + os demais da app).

- [ ] **Step 5: Commit**

```bash
git add "apps/web/src/app/(home)/anime-browser.tsx" "apps/web/src/app/(home)/anime-browser.spec.tsx"
git commit -m "feat: add AnimeBrowser orchestrating filters, search and pagination"
```

---

### Task 9: `page.tsx` (Server Component)

**Files:**

- Modify: `apps/web/src/app/page.tsx`

- [ ] **Step 1: Reescrever a página** — substituir todo o conteúdo de `page.tsx`:

```tsx
import { Suspense } from 'react';
import { Header, Footer, Container, AnimeGridSkeleton } from 'ui';
import { AnimeBrowser } from './(home)/anime-browser';

export default function Index() {
  return (
    <>
      <Header />
      <main>
        <Suspense
          fallback={
            <Container>
              <div className="py-8">
                <AnimeGridSkeleton count={12} />
              </div>
            </Container>
          }
        >
          <AnimeBrowser />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
```

> O `<Suspense>` é **obrigatório** em volta do `AnimeBrowser` porque ele usa `useSearchParams()` — sem o boundary, o Next quebra o build (ou força client-render da rota inteira).

- [ ] **Step 2: Build** (o build do Next faz o typecheck via tsc e valida o uso de `useSearchParams` sob Suspense):

Run: `pnpm exec nx build web`
Expected: PASS. (O build pode logar que a rota usa client features — ok, o Suspense trata.)

> O projeto `web` **não tem** um target `typecheck` próprio (só `build`, `dev`, `lint`, `test`, etc.) — a checagem de tipos vem do `nx build web`. Não rodar `nx typecheck web` (falha com "Cannot find configuration for task web:typecheck"). As libs (`anime-data-access`, `ui`) têm `typecheck` inferido, então os comandos das Tasks 1–2 e o `run-many` da Task 11 seguem válidos.

- [ ] **Step 3: Lint**

Run: `pnpm exec nx lint web`
Expected: PASS (sem violação de module-boundary: `type:app` → `type:ui`/`type:data-access` é permitido).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/page.tsx
git commit -m "feat: compose listing page with Header, AnimeBrowser and Footer"
```

---

## Wave 4 — E2E e fechamento

### Task 10: E2E happy path (Playwright)

**Files:**

- Delete: `apps/web-e2e/src/example.spec.ts`
- Create: `apps/web-e2e/src/anime-list.spec.ts`

> O e2e sobe o dev server (`nx run web:dev` em :3000) e bate na AniList real via Route Handler — **precisa de rede** e roda no **CI**, não no sandbox Windows (limitação conhecida). O `example.spec.ts` atual (`main` contém "buscanime") deixa de valer depois da Task 9, por isso é substituído.

- [ ] **Step 1: Remover o exemplo**

```bash
rm apps/web-e2e/src/example.spec.ts
```

- [ ] **Step 2: Criar o fluxo feliz** — `apps/web-e2e/src/anime-list.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('carrega, filtra e busca animes', async ({ page }) => {
  await page.goto('/');

  // Header visível
  await expect(page.getByRole('banner')).toBeVisible();

  // A grade carrega (AnimeCard é um <article>)
  await expect(page.getByRole('article').first()).toBeVisible({ timeout: 15000 });

  // Filtra por TV Show → reflete na URL
  await page.getByRole('button', { name: 'TV Show' }).click();
  await expect(page).toHaveURL(/format=TV/);

  // Busca por texto → reflete na URL e mantém resultados
  await page.getByRole('searchbox', { name: 'Buscar anime' }).fill('naruto');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page).toHaveURL(/q=naruto/);
  await expect(page.getByRole('article').first()).toBeVisible({ timeout: 15000 });
});
```

- [ ] **Step 3: Rodar (em ambiente com rede; pular no sandbox)**

Run: `pnpm exec nx e2e web-e2e`
Expected (CI/online): PASS. No sandbox Windows offline: pode pular — anotar que roda no CI.

- [ ] **Step 4: Commit**

```bash
git add apps/web-e2e/src/anime-list.spec.ts
git rm --cached apps/web-e2e/src/example.spec.ts 2>/dev/null; true
git commit -m "test: replace e2e placeholder with listing page happy path"
```

---

### Task 11: Verificação final + README

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Rodar tudo**

Run: `pnpm exec nx run-many -t lint test typecheck build`
Expected: tudo verde (lint, todos os specs Vitest, typecheck, build do Next).

- [ ] **Step 2: Atualizar o README** — adicionar uma linha curta na seção de features descrevendo a página de listagem (filtro por formato, busca com debounce, paginação "Ver mais", estados de loading/vazio/erro) e como rodar a app (`pnpm exec nx dev web`).

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document the anime listing page"
```

- [ ] **Step 4: Finalizar a branch** — usar @superpowers:finishing-a-development-branch pra decidir merge/PR.

---

## Definition of Done

(espelha a §12 da spec)

- [ ] Query estendida (`search`/`format`/`sort`/`pageInfo`) + codegen regenerado (Task 1).
- [ ] `useAnimeList({ search, format, endpoint })` via `useInfiniteQuery` (perPage 12), `getNextPageParam` tratando `null`/`false` como fim, com spec MSW de paginação atualizada (Task 2).
- [ ] `Button` com `loading` (spinner `Loader2` + `disabled` + `aria-busy`) + teste; `SearchBar` repassa `loading` (Tasks 3–4).
- [ ] Página compõe `Header`/`ToggleGroup`/`SearchBar`/`AnimeGrid`/`AnimeCard`/"Ver mais"/`Footer` dentro de `Container`, sob `<Suspense>` (Tasks 8–9).
- [ ] Estado na URL (`format`, `q`); busca com debounce 300ms + flush no botão/Enter (Task 7).
- [ ] Estados: skeleton inicial, vazio, erro (com retry) e spinners nos botões "Buscar"/"Ver mais" (Task 8).
- [ ] `aria-live="polite"` na área de resultados; `aria-busy` nos botões em loading (Tasks 3, 8).
- [ ] `nx run-many -t lint test typecheck build` verde; e2e happy path no CI (Tasks 10–11).

```

```
