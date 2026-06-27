# Spec — Melhorias de UX na busca (clear + badges de formato)

**Data:** 2026-06-26
**Status:** Aprovado em brainstorm — aguardando revisão
**Escopo:** Dois ajustes de usabilidade no fluxo de busca da página de listagem, em cima do que já existe (`feat/listing-page`).

---

## 1. Contexto e objetivo

A página de listagem já busca por formato + texto (busca explícita, sem debounce: só dispara no botão "Buscar"/Enter ou ao trocar formato), com o botão "Buscar" desabilitado quando o input está vazio. Dois problemas de UX surgiram:

- **A — Beco sem saída pós-busca.** Depois de buscar (`?q=naruto` fica na URL), apagar o input deixa o "Buscar" desabilitado e não há como voltar à lista geral (popular).
- **B — Falta de visibilidade de onde o termo existe.** Buscar "naruto" em "Music" não retorna nada (correto), mas o usuário não vê que em "TV"/"Movie" há resultados.

Esta spec resolve os dois: **(A)** um botão **×** que limpa o campo e reseta a busca num clique; **(B)** **badges de contagem por formato**, mostradas só durante uma busca ativa.

## 2. Escopo

### 2.1 Dentro

- **A:** botão **×** (limpar) na `SearchBar`; `clearSearch()` no `useAnimeFilters`; fiação no `AnimeBrowser`.
- **B:** query `AnimeFormatCounts` (aliases por formato) + hook `useAnimeFormatCounts` no `anime-data-access`; suporte a `badge` no `ToggleGroup` (DS); montagem das options com contagem no `AnimeBrowser`.

### 2.2 Fora (YAGNI)

- Ordenar formatos por contagem, esconder/desabilitar formatos com 0, histórico de busca, contagem sem busca ativa, debounce (continua removido).

## 3. Decisões (do brainstorm)

| Tema                    | Decisão                                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Voltar à home           | **Botão × pra limpar** — limpa o texto **e** reseta a busca (`q`) num clique. "Buscar" segue desabilitado no vazio.              |
| Quando mostrar badges   | **Só durante busca ativa** (`q` preenchido). Sem busca, toggles normais.                                                         |
| Como buscar contagens   | **1 request** com **aliases por formato** lendo `Page.pageInfo.total`. Custo total da busca: **2 requests** (lista + contagens). |
| Formato com 0           | Mostra a badge **"0"** e segue **clicável** (clicar leva ao estado "Nada encontrado", que já existe). Não desabilita.            |
| Dono do visual da badge | **DS (`ToggleGroup`)** renderiza o pill de contagem — consistência visual.                                                       |

---

## Parte A — Botão × pra limpar a busca

### A.1 `SearchBar` (DS — `libs/ui/src/lib/search-bar/search-bar.tsx`)

Novas props (ambas opcionais, retrocompatíveis):

```ts
export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  loading?: boolean;
  onClear?: () => void;
  /** Há uma busca já aplicada (q na URL), mesmo que o input esteja vazio. */
  searchActive?: boolean;
}
```

- Renderiza um **botão ×** (`type="button"`, ícone `X` do lucide, `aria-label="Limpar busca"`) **dentro da área do input**, visível quando `value.trim()` não está vazio **ou** `searchActive` é `true`. Clicar → `onClear?.()`.
- Implementação de layout: envolver o `Input` num wrapper `relative` e posicionar o × absoluto à direita (`absolute right-… top-1/2 -translate-y-1/2`). O `×` só é renderizado quando deve aparecer (sem `onClear`, nunca renderiza).
- O "Buscar" e o submit (`handleSubmit` com guard de vazio) **não mudam**.

> Cobre o estado "divergente" (apaguei o texto na mão, mas `q=naruto` segue ativo): como o × aparece enquanto `searchActive`, sempre dá pra resetar.

### A.2 `useAnimeFilters` (`apps/web/src/app/(home)/use-anime-filters.ts`)

Adicionar:

```ts
const clearSearch = useCallback(() => {
  setText('');
  commit({ q: '' }); // q vazio → params.delete('q') → volta pra lista popular
}, [commit]);
// retornar também clearSearch
```

`commit({ q: '' })` já trata vazio removendo o `q` da URL (lógica existente). Retorno do hook passa a incluir `clearSearch`.

### A.3 `AnimeBrowser` (`apps/web/src/app/(home)/anime-browser.tsx`)

```tsx
const { format, q, text, setFormat, onChangeText, submitSearch, clearSearch } = useAnimeFilters();
// ...
<SearchBar value={text} onChange={onChangeText} onSearch={handleSearch} loading={searchPending && query.isFetching} onClear={clearSearch} searchActive={!!q} />;
```

Fluxo: clicar × → `clearSearch()` → `text=''` + `q` removido → `useAnimeList` refaz com `search=''` → lista popular; badges somem; o × some (sem texto e sem busca ativa).

---

## Parte B — Badges de contagem por formato

### B.1 Query + codegen (`anime-data-access`)

Criar `libs/anime/data-access/src/lib/queries/anime-format-counts.graphql` com **um alias `Page` por formato** (o `ALL` é o total do termo em qualquer formato):

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

- Re-rodar `pnpm codegen` → gera `AnimeFormatCounts` no SDK (`getSdk`) + tipos (`AnimeFormatCountsQuery` com `ALL/TV/.../MUSIC` cada `{ pageInfo: { total } }`).
- `pageInfo.total` reflete o total filtrado por `search` (+ `format`). **`perPage: 50` (máx da AniList) é obrigatório:** com `perPage: 1` o `total` satura no cap de páginas da AniList e retorna `5000` em vez da contagem real (validado contra a API). O `media(...){ id }` é necessário pros filtros (`search`/`format`) valerem; usamos só o `total`.
- **Custo de complexidade:** 8 `Page` num request. Se a AniList recusar por complexidade (improvável com `perPage: 50` + só `id`), o fallback é quebrar em menos aliases — anotar no plano, mas a expectativa é 1 request.

### B.2 Hook `useAnimeFormatCounts` (`libs/anime/data-access/src/lib/use-anime-format-counts.ts`)

```ts
import { useQuery } from '@tanstack/react-query';
import { createAnilistSdk } from './anilist-client.js';

const FORMAT_KEYS = ['ALL', 'TV', 'MOVIE', 'TV_SHORT', 'SPECIAL', 'OVA', 'ONA', 'MUSIC'] as const;
export type FormatCounts = Record<(typeof FORMAT_KEYS)[number], number>;

export interface UseAnimeFormatCountsParams {
  search?: string;
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

- `enabled: Boolean(trimmed)` → **nenhuma request sem busca**.
- `endpoint` é o mesmo seam de teste das outras (relativo→absoluto via `createAnilistSdk`).
- Exportar no barrel `libs/anime/data-access/src/index.ts`.
- **Rebuild do `dist`** depois (lib dist-consumed — `nx build anime-data-access`), senão a app não enxerga o hook novo. Ver [[anime-data-access-dist-consumed]].

### B.3 `ToggleGroup` (DS — `libs/ui/src/lib/toggle-group/toggle-group.tsx`)

```ts
export interface ToggleGroupOption {
  label: string;
  value: string;
  badge?: string | number;
}
```

- Quando `opt.badge != null` (cuidado: `!= null`, pra "0" aparecer), renderizar um **pill pequeno** ao lado do label dentro do `Button`: `<Button …>{opt.label}{badge}</Button>`, com o badge num `<span>` estilizado (ex.: `ml-2 rounded-full px-1.5 text-xs` com contraste adequado nos estados normal/active). Sem `badge`, renderiza só o label (comportamento atual).

### B.4 `AnimeBrowser` (montagem das options)

```tsx
const counts = useAnimeFormatCounts({ search: q, endpoint });
const options = q && counts.data ? FORMAT_OPTIONS.map((o) => ({ ...o, badge: counts.data![o.value] ?? 0 })) : FORMAT_OPTIONS;
// <ToggleGroup options={options} value={format} onChange={setFormat} />
```

- Badges só aparecem quando há `q` **e** as contagens chegaram. Enquanto carrega, toggles sem badge (sem indicador de loading nos toggles — simples).
- `FORMAT_OPTIONS[i].value` (`ALL`, `TV`, …) casa com as chaves de `FormatCounts`.

---

## 4. Estados e edge cases

| Situação                              | Comportamento                                                     |
| ------------------------------------- | ----------------------------------------------------------------- |
| Limpar via ×                          | `text=''` + `q` removido → lista popular; badges somem; × some    |
| Texto apagado na mão, `q` ainda ativo | × continua visível (`searchActive`), permite resetar              |
| Formato com 0 resultados              | badge "0", clicável, leva ao "Nada encontrado"                    |
| Sem busca (home/troca de formato só)  | Nenhuma request de contagens (`enabled:false`); toggles sem badge |
| Contagens em voo                      | toggles aparecem sem badge até a resposta chegar                  |

## 5. Testes

- **`useAnimeFilters`:** `clearSearch()` zera `text` e chama `replace('/', { scroll:false })` (remove `q`).
- **`SearchBar` (DS):** × aparece quando `value` tem texto **ou** `searchActive`; some quando vazio e sem busca; clicar × chama `onClear`; `aria-label="Limpar busca"`; axe sem violações.
- **`ToggleGroup` (DS):** renderiza a badge quando a option tem `badge` (inclui `badge={0}` → "0"); sem `badge`, não renderiza pill.
- **`useAnimeFormatCounts`:** MSW da operação `AnimeFormatCounts` → retorna mapa de contagens correto; **não dispara** quando `search` vazio (`enabled:false`).
- **`AnimeBrowser`:** com busca, os toggles mostram as contagens (incl. "0"); clicar no × volta pra lista (sem `q`, sem badges). MSW + mock dinâmico de `next/navigation` (já existe no spec).

## 6. Definition of Done

- [ ] `SearchBar` com `onClear`/`searchActive` + botão × (a11y) + teste.
- [ ] `useAnimeFilters.clearSearch()` + teste; `AnimeBrowser` fiando `onClear`/`searchActive`.
- [ ] Query `AnimeFormatCounts` + `pnpm codegen` + `useAnimeFormatCounts` (enabled só com busca) + teste MSW; barrel atualizado; `dist` rebuildado.
- [ ] `ToggleGroup` com `badge` (incl. "0") + teste.
- [ ] `AnimeBrowser` monta options com contagem só durante busca + teste.
- [ ] lint/test/typecheck/build verdes.

## 7. Decisões em aberto

Nenhuma — ver §3.
