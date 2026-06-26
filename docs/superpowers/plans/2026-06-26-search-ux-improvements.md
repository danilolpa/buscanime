# Search UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar ao usuário (A) um botão **×** que limpa o campo e reseta a busca num clique e (B) **badges de contagem por formato** durante uma busca, mostrando onde o termo existe.

**Architecture:** Parte A é só UI/estado (DS `SearchBar` + hook `useAnimeFilters` + `AnimeBrowser`). Parte B adiciona uma query AniList com **aliases por formato** (1 request lendo `pageInfo.total`) + um hook `useAnimeFormatCounts` no `anime-data-access`, suporte a `badge` no `ToggleGroup`, e montagem das options com contagem no `AnimeBrowser` — tudo só quando há busca ativa.

**Tech Stack:** Nx, Next 16 (App Router), React 19, TanStack Query v5, graphql-request + GraphQL Codegen, Tailwind v4, lucide-react, Vitest + Testing Library + MSW v2.

**Spec:** `docs/superpowers/specs/2026-06-26-search-ux-improvements-design.md`

**Convenções de execução:**

- Bash tool (Git Bash). `pnpm exec nx ...` pros targets. Branch atual: **`feat/listing-page`** (continuar nela — não criar branch).
- husky ativo: pre-commit (lint-staged + `nx affected -t test`) e commit-msg (commitlint — tipos `feat`/`fix`/`chore`/`docs`/`refactor`/`test`/`ci`/`a11y`). **Comitar só em verde.** `git add` só os arquivos da task (NÃO `git add -A`).
- Nomes de projeto Nx: `@buscanime/anime-data-access`, `@buscanime/ui`, `web`.
- **`@buscanime/anime-data-access` é consumida pelo `dist/`** (lib `nodenext`): os testes vitest resolvem o `src`, mas a **app (runtime/build)** usa o `dist`. Depois de mexer na lib (query/codegen/hook), rodar **`pnpm exec nx build @buscanime/anime-data-access`** pra app enxergar. Ver `docs/superpowers/specs/...` e a memória `anime-data-access-dist-consumed`.
- Imports relativos: a `libs/anime/data-access` usa `.js`; a `libs/ui` e a `apps/web` usam **sem** extensão. Seguir o vizinho.
- O spec de `anime-browser.spec.tsx` já tem um **mock dinâmico de `next/navigation`** (replace reescreve os searchParams) e o wrapper do `use-anime-list.spec.tsx` usa `notifyOnChangeProps: 'all'` — reusar esses padrões.

---

## File Structure

```
libs/ui/src/lib/
├── search-bar/search-bar.{tsx,spec.tsx}      → MODIFICAR: + onClear/searchActive + botão ×
└── toggle-group/toggle-group.{tsx,spec.tsx}   → MODIFICAR: + badge? na option

libs/anime/data-access/src/
├── lib/queries/anime-format-counts.graphql    → CRIAR: query com aliases por formato
├── lib/generated/{graphql,schema-types}.ts     → REGERAR (codegen)
├── lib/use-anime-format-counts.{ts,spec.tsx}   → CRIAR: hook + spec MSW
└── index.ts                                    → MODIFICAR: exportar o hook novo

apps/web/src/app/(home)/
├── use-anime-filters.{ts,spec.tsx}             → MODIFICAR: + clearSearch()
└── anime-browser.{tsx,spec.tsx}                → MODIFICAR: fiar onClear/searchActive + options com contagem
```

---

## Wave A — Botão × pra limpar a busca

### Task A1: `SearchBar` ganha `onClear` + botão ×

@superpowers:test-driven-development

**Files:**

- Modify: `libs/ui/src/lib/search-bar/search-bar.tsx`
- Test: `libs/ui/src/lib/search-bar/search-bar.spec.tsx`

- [ ] **Step 1: Testes que falham** — acrescentar no `describe('SearchBar', ...)`:

```tsx
it('mostra × e dispara onClear quando há texto', async () => {
  const onClear = vi.fn();
  render(<SearchBar value="naruto" onChange={vi.fn()} onSearch={vi.fn()} onClear={onClear} />);
  await userEvent.click(screen.getByRole('button', { name: 'Limpar busca' }));
  expect(onClear).toHaveBeenCalledOnce();
});

it('mostra × quando o input está vazio mas há busca ativa', () => {
  render(<SearchBar value="" onChange={vi.fn()} onSearch={vi.fn()} onClear={vi.fn()} searchActive />);
  expect(screen.getByRole('button', { name: 'Limpar busca' })).toBeInTheDocument();
});

it('não mostra × quando vazio e sem busca ativa', () => {
  render(<SearchBar value="" onChange={vi.fn()} onSearch={vi.fn()} onClear={vi.fn()} />);
  expect(screen.queryByRole('button', { name: 'Limpar busca' })).not.toBeInTheDocument();
});

it('não mostra × sem onClear', () => {
  render(<SearchBar value="naruto" onChange={vi.fn()} onSearch={vi.fn()} />);
  expect(screen.queryByRole('button', { name: 'Limpar busca' })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Rodar — deve falhar**

Run: `pnpm exec nx test @buscanime/ui`
Expected: FAIL (não existe botão "Limpar busca").

- [ ] **Step 3: Implementar** — substituir o conteúdo de `search-bar.tsx`:

```tsx
import { type ChangeEvent, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';
import { Input } from '../input/input';
import { Button } from '../button/button';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  loading?: boolean;
  onClear?: () => void;
  /** Há uma busca já aplicada (q na URL), mesmo com o input vazio. */
  searchActive?: boolean;
}

export function SearchBar({ value, onChange, onSearch, loading, onClear, searchActive }: SearchBarProps) {
  const isEmpty = !value.trim();
  const showClear = Boolean(onClear) && (!isEmpty || Boolean(searchActive));

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isEmpty) return;
    onSearch();
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="flex w-full gap-2">
      <div className="relative flex-1">
        <Input
          size="lg"
          type="search"
          aria-label="Buscar anime"
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          placeholder="Ex: Naruto, One Piece..."
          // esconde o × nativo do type=search (pra não duplicar) e abre espaço pro nosso ×
          className={cn('[&::-webkit-search-cancel-button]:appearance-none', showClear && 'pr-10')}
        />
        {showClear && (
          <button type="button" onClick={onClear} aria-label="Limpar busca" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink/50 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Button type="submit" variant="solid" size="lg" loading={loading} disabled={isEmpty}>
        Buscar
      </Button>
    </form>
  );
}
```

> `Input` mescla `className` no `<input>` via `cn` (confirmado em `input.tsx`), então o `pr-10` e o esconder-×-nativo funcionam. O nosso × fica no wrapper `relative`.

- [ ] **Step 4: Rodar — deve passar**

Run: `pnpm exec nx test @buscanime/ui`
Expected: PASS (incl. os testes existentes da `SearchBar` + o axe).

- [ ] **Step 5: Commit**

```bash
git add libs/ui/src/lib/search-bar/
git commit -m "feat: add clear (x) button to SearchBar"
```

---

### Task A2: `useAnimeFilters.clearSearch()`

@superpowers:test-driven-development

**Files:**

- Modify: `apps/web/src/app/(home)/use-anime-filters.ts`
- Test: `apps/web/src/app/(home)/use-anime-filters.spec.tsx`

- [ ] **Step 1: Teste que falha** — acrescentar no `describe('useAnimeFilters', ...)`:

```tsx
it('clearSearch zera o texto e remove o q da URL', () => {
  params = new URLSearchParams('q=naruto');
  const { result } = renderHook(() => useAnimeFilters());
  expect(result.current.text).toBe('naruto');
  act(() => result.current.clearSearch());
  expect(result.current.text).toBe('');
  expect(replace).toHaveBeenCalledWith('/', { scroll: false });
});
```

(O mock já tem `usePathname: () => '/'`, então remover o único param `q` resulta em `replace('/', { scroll: false })`.)

- [ ] **Step 2: Rodar — deve falhar**

Run: `pnpm exec nx test web`
Expected: FAIL (`clearSearch` não existe).

- [ ] **Step 3: Implementar** — em `use-anime-filters.ts`, adicionar o `clearSearch` (depois do `submitSearch`) e incluí-lo no retorno:

```ts
const clearSearch = useCallback(() => {
  setText('');
  commit({ q: '' }); // q vazio → params.delete('q') → volta pra lista popular
}, [commit]);

return { format, q, text, setFormat, onChangeText, submitSearch, clearSearch };
```

- [ ] **Step 4: Rodar — deve passar**

Run: `pnpm exec nx test web`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "apps/web/src/app/(home)/use-anime-filters.ts" "apps/web/src/app/(home)/use-anime-filters.spec.tsx"
git commit -m "feat: add clearSearch to useAnimeFilters"
```

---

### Task A3: Fiar o × no `AnimeBrowser`

@superpowers:test-driven-development

**Files:**

- Modify: `apps/web/src/app/(home)/anime-browser.tsx`
- Test: `apps/web/src/app/(home)/anime-browser.spec.tsx`

- [ ] **Step 1: Teste que falha** — acrescentar no `describe('AnimeBrowser', ...)` (usa o mock dinâmico de `next/navigation` já existente):

```tsx
it('× limpa a busca e volta pra lista', async () => {
  render(<AnimeBrowser endpoint={TEST_ENDPOINT} />, { wrapper });
  await screen.findByText('Naruto');
  await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar anime' }), 'naruto');
  await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
  const clear = await screen.findByRole('button', { name: 'Limpar busca' });
  await userEvent.click(clear);
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Limpar busca' })).not.toBeInTheDocument());
  expect(screen.getByRole('searchbox', { name: 'Buscar anime' })).toHaveValue('');
});
```

- [ ] **Step 2: Rodar — deve falhar**

Run: `pnpm exec nx test web`
Expected: FAIL (o × não está fiado; o `AnimeBrowser` ainda não passa `onClear`/`searchActive`).

- [ ] **Step 3: Implementar** — em `anime-browser.tsx`: incluir `clearSearch` no destructure do `useAnimeFilters` e passar as props pra `SearchBar`:

```tsx
const { format, q, text, setFormat, onChangeText, submitSearch, clearSearch } = useAnimeFilters();
```

```tsx
<SearchBar value={text} onChange={onChangeText} onSearch={handleSearch} loading={searchPending && query.isFetching} onClear={clearSearch} searchActive={Boolean(q)} />
```

- [ ] **Step 4: Rodar — deve passar**

Run: `pnpm exec nx test web`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "apps/web/src/app/(home)/anime-browser.tsx" "apps/web/src/app/(home)/anime-browser.spec.tsx"
git commit -m "feat: wire clear button into AnimeBrowser"
```

---

## Wave B — Badges de contagem por formato

### Task B1: Query `AnimeFormatCounts` + codegen

**Files:**

- Create: `libs/anime/data-access/src/lib/queries/anime-format-counts.graphql`
- Regenerate: `libs/anime/data-access/src/lib/generated/{graphql,schema-types}.ts`

- [ ] **Step 1: Criar a query** — `anime-format-counts.graphql` (um alias `Page` por formato; `ALL` é o total do termo):

```graphql
query AnimeFormatCounts($search: String) {
  ALL: Page(perPage: 50) {
    pageInfo {
      total
    }
    media(type: ANIME, search: $search) {
      id
    }
  }
  TV: Page(perPage: 50) {
    pageInfo {
      total
    }
    media(type: ANIME, search: $search, format: TV) {
      id
    }
  }
  MOVIE: Page(perPage: 50) {
    pageInfo {
      total
    }
    media(type: ANIME, search: $search, format: MOVIE) {
      id
    }
  }
  TV_SHORT: Page(perPage: 50) {
    pageInfo {
      total
    }
    media(type: ANIME, search: $search, format: TV_SHORT) {
      id
    }
  }
  SPECIAL: Page(perPage: 50) {
    pageInfo {
      total
    }
    media(type: ANIME, search: $search, format: SPECIAL) {
      id
    }
  }
  OVA: Page(perPage: 50) {
    pageInfo {
      total
    }
    media(type: ANIME, search: $search, format: OVA) {
      id
    }
  }
  ONA: Page(perPage: 50) {
    pageInfo {
      total
    }
    media(type: ANIME, search: $search, format: ONA) {
      id
    }
  }
  MUSIC: Page(perPage: 50) {
    pageInfo {
      total
    }
    media(type: ANIME, search: $search, format: MUSIC) {
      id
    }
  }
}
```

- [ ] **Step 2: Regerar** (precisa de **rede** — codegen busca o schema em `https://graphql.anilist.co`):

Run: `pnpm codegen`
Expected: sem erro; `generated/graphql.ts` ganha `AnimeFormatCounts` no `getSdk` + `AnimeFormatCountsQuery` (com `ALL/TV/.../MUSIC` cada `{ pageInfo: { total } }`).

- [ ] **Step 3: Verificar**

Run: `grep -n "AnimeFormatCounts" libs/anime/data-access/src/lib/generated/graphql.ts | head`
Expected: aparece o tipo e o método do SDK.

- [ ] **Step 4: Typecheck**

Run: `pnpm exec nx typecheck @buscanime/anime-data-access`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add libs/anime/data-access/src/lib/queries/anime-format-counts.graphql libs/anime/data-access/src/lib/generated/
git commit -m "feat: add AnimeFormatCounts query (per-format result totals)"
```

---

### Task B2: Hook `useAnimeFormatCounts` + rebuild do dist

@superpowers:test-driven-development

**Files:**

- Create: `libs/anime/data-access/src/lib/use-anime-format-counts.ts`
- Test: `libs/anime/data-access/src/lib/use-anime-format-counts.spec.tsx`
- Modify: `libs/anime/data-access/src/index.ts`

- [ ] **Step 1: Spec que falha** — `use-anime-format-counts.spec.tsx`:

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { graphql, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { useAnimeFormatCounts } from './use-anime-format-counts.js';

const server = setupServer(
  graphql.query('AnimeFormatCounts', () =>
    HttpResponse.json({
      data: {
        ALL: { pageInfo: { total: 20 } },
        TV: { pageInfo: { total: 9 } },
        MOVIE: { pageInfo: { total: 11 } },
        TV_SHORT: { pageInfo: { total: 0 } },
        SPECIAL: { pageInfo: { total: 0 } },
        OVA: { pageInfo: { total: 0 } },
        ONA: { pageInfo: { total: 0 } },
        MUSIC: { pageInfo: { total: 0 } },
      },
    }),
  ),
);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, notifyOnChangeProps: 'all' } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const TEST_ENDPOINT = 'http://localhost/api/anilist';

it('retorna a contagem por formato', async () => {
  const { result } = renderHook(() => useAnimeFormatCounts({ search: 'naruto', endpoint: TEST_ENDPOINT }), { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toEqual({
    ALL: 20,
    TV: 9,
    MOVIE: 11,
    TV_SHORT: 0,
    SPECIAL: 0,
    OVA: 0,
    ONA: 0,
    MUSIC: 0,
  });
});

it('não dispara quando não há busca', () => {
  const { result } = renderHook(() => useAnimeFormatCounts({ endpoint: TEST_ENDPOINT }), { wrapper });
  expect(result.current.fetchStatus).toBe('idle');
  expect(result.current.data).toBeUndefined();
});
```

- [ ] **Step 2: Rodar — deve falhar**

Run: `pnpm exec nx test @buscanime/anime-data-access`
Expected: FAIL (módulo não existe).

- [ ] **Step 3: Implementar** — `use-anime-format-counts.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { createAnilistSdk } from './anilist-client.js';

const FORMAT_KEYS = ['ALL', 'TV', 'MOVIE', 'TV_SHORT', 'SPECIAL', 'OVA', 'ONA', 'MUSIC'] as const;

export type FormatCounts = Record<(typeof FORMAT_KEYS)[number], number>;

export interface UseAnimeFormatCountsParams {
  search?: string;
  /** Test-only: endpoint absoluto pro MSW (graphql-request rejeita URL relativa em jsdom). */
  endpoint?: string;
}

export function useAnimeFormatCounts({ search, endpoint }: UseAnimeFormatCountsParams = {}) {
  const trimmed = search?.trim() ? search.trim() : undefined;
  return useQuery({
    queryKey: ['anime-format-counts', trimmed ?? null],
    enabled: Boolean(trimmed),
    queryFn: async (): Promise<FormatCounts> => {
      const sdk = createAnilistSdk(endpoint);
      const data = await sdk.AnimeFormatCounts({ search: trimmed });
      return Object.fromEntries(FORMAT_KEYS.map((k) => [k, data[k]?.pageInfo?.total ?? 0])) as FormatCounts;
    },
  });
}
```

Then add to `libs/anime/data-access/src/index.ts`:

```ts
export * from './lib/use-anime-format-counts.js';
```

- [ ] **Step 4: Rodar — deve passar**

Run: `pnpm exec nx test @buscanime/anime-data-access`
Expected: PASS (2 testes novos + os existentes).

- [ ] **Step 5: Typecheck + rebuild do dist** (pra app enxergar o hook):

Run: `pnpm exec nx typecheck @buscanime/anime-data-access`
Then: `pnpm exec nx build @buscanime/anime-data-access`
Expected: ambos PASS; `dist/` regenerado com o hook.

- [ ] **Step 6: Commit**

```bash
git add libs/anime/data-access/src/lib/use-anime-format-counts.ts libs/anime/data-access/src/lib/use-anime-format-counts.spec.tsx libs/anime/data-access/src/index.ts
git commit -m "feat: add useAnimeFormatCounts hook (per-format totals, search-gated)"
```

---

### Task B3: `ToggleGroup` ganha `badge`

@superpowers:test-driven-development

**Files:**

- Modify: `libs/ui/src/lib/toggle-group/toggle-group.tsx`
- Test: `libs/ui/src/lib/toggle-group/toggle-group.spec.tsx`

- [ ] **Step 1: Testes que falham** — acrescentar no `describe('ToggleGroup', ...)`:

```tsx
it('renderiza a badge de contagem quando a option tem badge', () => {
  render(<ToggleGroup options={[{ label: 'TV Show', value: 'TV', badge: 9 }]} value="ALL" onChange={vi.fn()} />);
  expect(screen.getByText('9')).toBeInTheDocument();
});

it('renderiza a badge "0"', () => {
  render(<ToggleGroup options={[{ label: 'Music', value: 'MUSIC', badge: 0 }]} value="ALL" onChange={vi.fn()} />);
  expect(screen.getByText('0')).toBeInTheDocument();
});
```

- [ ] **Step 2: Rodar — deve falhar**

Run: `pnpm exec nx test @buscanime/ui`
Expected: FAIL (badge não renderiza; `badge` nem existe na option).

- [ ] **Step 3: Implementar** — em `toggle-group.tsx`: adicionar `badge?` à option e renderizar o pill (usar `!= null` pra "0" aparecer):

```tsx
export interface ToggleGroupOption {
  label: string;
  value: string;
  badge?: string | number;
}
```

No corpo do `Button`:

```tsx
<Button key={opt.value} variant="outline" size="md" active={isActive} aria-pressed={isActive} onClick={() => onChange(opt.value)}>
  {opt.label}
  {opt.badge != null && <span className="ml-2 rounded-full bg-current/15 px-1.5 text-xs font-semibold tabular-nums">{opt.badge}</span>}
</Button>
```

> `bg-current/15` herda a cor do texto do botão (funciona no estado normal e no `active`), com leve opacidade. Se o Tailwind não suportar `bg-current/15` no projeto, usar `bg-black/10` — é só estética; o teste valida o texto.
>
> **Atenção (nome acessível):** com a badge, o nome acessível do botão passa a incluir o número (ex.: "TV Show 9"). Os testes existentes consultam toggles **sem badge** (não afetados) e o teste da Task B4 usa `findByText('9')` (não nome de botão). Se algum teste precisar achar um toggle por nome **durante uma busca**, usar regex (`{ name: /TV Show/ }`) em vez de string exata.

- [ ] **Step 4: Rodar — deve passar**

Run: `pnpm exec nx test @buscanime/ui`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add libs/ui/src/lib/toggle-group/
git commit -m "feat: support count badges in ToggleGroup options"
```

---

### Task B4: `AnimeBrowser` monta as options com contagem

@superpowers:test-driven-development

**Files:**

- Modify: `apps/web/src/app/(home)/anime-browser.tsx`
- Test: `apps/web/src/app/(home)/anime-browser.spec.tsx`

- [ ] **Step 1: Teste que falha** — acrescentar no `describe('AnimeBrowser', ...)`:

```tsx
it('mostra a contagem por formato durante a busca', async () => {
  server.use(
    graphql.query('AnimeList', () => HttpResponse.json({ data: { Page: page1 } })),
    graphql.query('AnimeFormatCounts', () =>
      HttpResponse.json({
        data: {
          ALL: { pageInfo: { total: 20 } },
          TV: { pageInfo: { total: 9 } },
          MOVIE: { pageInfo: { total: 11 } },
          TV_SHORT: { pageInfo: { total: 0 } },
          SPECIAL: { pageInfo: { total: 0 } },
          OVA: { pageInfo: { total: 0 } },
          ONA: { pageInfo: { total: 0 } },
          MUSIC: { pageInfo: { total: 0 } },
        },
      }),
    ),
  );
  render(<AnimeBrowser endpoint={TEST_ENDPOINT} />, { wrapper });
  await screen.findByText('Naruto');
  await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar anime' }), 'naruto');
  await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
  expect(await screen.findByText('9')).toBeInTheDocument();
  expect(screen.getByText('11')).toBeInTheDocument();
});
```

- [ ] **Step 2: Rodar — deve falhar**

Run: `pnpm exec nx test web`
Expected: FAIL (sem badges; `useAnimeFormatCounts` não está sendo usado).

- [ ] **Step 3: Implementar** — em `anime-browser.tsx`:

Importar o hook:

```tsx
import { useAnimeList, useAnimeFormatCounts } from '@buscanime/anime-data-access';
```

Depois do `query`, montar as options:

```tsx
const counts = useAnimeFormatCounts({ search: q, endpoint });
const options =
  q && counts.data
    ? FORMAT_OPTIONS.map((o) => ({
        ...o,
        // cast pra Record<string, number>: o.value é string e FormatCounts é tipado
        // por união literal de chaves — sem o cast o `nx typecheck`/build reclama.
        badge: (counts.data as Record<string, number>)[o.value] ?? 0,
      }))
    : FORMAT_OPTIONS;
```

E usar no `ToggleGroup`:

```tsx
<ToggleGroup options={options} value={format} onChange={setFormat} />
```

- [ ] **Step 4: Rodar — deve passar**

Run: `pnpm exec nx test web`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "apps/web/src/app/(home)/anime-browser.tsx" "apps/web/src/app/(home)/anime-browser.spec.tsx"
git commit -m "feat: show per-format result counts on the toggle group during search"
```

---

## Wave C — Fechamento

### Task C1: Rebuild + verificação completa

**Files:** nenhum (verificação).

- [ ] **Step 1: Garantir o dist da lib atualizado**

Run: `pnpm exec nx build @buscanime/anime-data-access`
Expected: PASS (o `dist` tem `AnimeFormatCounts` + `useAnimeFormatCounts`).

- [ ] **Step 2: Verificação completa**

Run: `pnpm exec nx run-many -t lint test typecheck build --skip-nx-cache`
Expected: tudo verde (lint, todos os specs, typecheck das libs, build do Next).

> Se `web:build` for marcado "flaky" no Windows (erro OS-1314 de symlink no cache do Nx), re-rodar `pnpm exec nx build web --skip-nx-cache` uma vez — o build em si é limpo.

- [ ] **Step 3 (opcional): Smoke no browser** — `pnpm exec nx dev web`, buscar "naruto", conferir: badges por formato aparecem (TV/Movie com número, Music "0"); o × limpa e volta pra lista popular. (E2E roda no CI.)

---

## Definition of Done

- [ ] **A:** `SearchBar` com `onClear`/`searchActive` + botão × (aria-label "Limpar busca", esconde o × nativo) + testes; `useAnimeFilters.clearSearch()` + teste; `AnimeBrowser` fiando `onClear`/`searchActive`; clicar × volta pra lista popular.
- [ ] **B:** query `AnimeFormatCounts` + codegen; `useAnimeFormatCounts` (`enabled` só com busca) + teste MSW; barrel atualizado; `dist` rebuildado; `ToggleGroup` com `badge` (incl. "0") + teste; `AnimeBrowser` monta options com contagem só durante busca + teste.
- [ ] `nx run-many -t lint test typecheck build` verde.

```

```
