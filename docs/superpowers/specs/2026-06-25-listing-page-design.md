# Spec — Página de Listagem de Animes (feature)

**Data:** 2026-06-25
**Status:** Aprovado em discussão — aguardando revisão
**Escopo:** Fase de feature do Winnin Frontend Challenge — montar a página do wireframe plugando o Design System no `useAnimeList`.

---

## 1. Contexto e objetivo

A fundação (pipeline GraphQL: hook `useAnimeList`, Route Handler `/api/anilist`, Sentry) e o Design System (`@buscanime/ui`: Header, Footer, ToggleGroup, SearchBar, AnimeCard, AnimeGrid, skeletons, StatusState, Button, etc.) já existem. Esta fase **monta a página de listagem** (o wireframe) compondo o DS com os dados reais da AniList, com filtro por formato, busca por texto, paginação "Ver mais" e feedbacks de loading.

## 2. Escopo

### 2.1 Dentro

- Estender o `data-access` (query + hook) pra suportar **busca**, **filtro de formato** e **paginação**.
- Pequena adição no DS: **estado `loading` (spinner) no Button**.
- A **página** (`apps/web`) compondo o DS + o hook, com estado na **URL**, debounce na busca, e estados de loading/vazio/erro.

### 2.2 Fora (YAGNI)

- Dark mode, favoritos, rota `dashboard`, UI de ordenação, BFF dedicado.

## 3. Decisões (das perguntas de brainstorm)

| Tema            | Decisão                                                                   |
| --------------- | ------------------------------------------------------------------------- |
| Busca           | **Debounce 300ms** ao digitar + **"Buscar"/Enter força** o flush imediato |
| Estado          | **URL `searchParams`** (`?format=TV&q=naruto`)                            |
| Local do código | **Na app** (`page.tsx` + componentes/hook locais), sem nova lib           |
| Paginação       | **`useInfiniteQuery`** "Ver mais", `perPage = 12` (3×4)                   |
| Feedback        | **Skeletons** na grade + **spinner** nos botões "Buscar"/"Ver mais"       |

## 4. Arquitetura (Next App Router)

- **`apps/web/src/app/page.tsx` (Server Component):** renderiza `Header` + `<Suspense fallback={<AnimeGridSkeleton/>}><AnimeBrowser/></Suspense>` + `Footer`. (`useSearchParams` exige boundary de Suspense.)
- **`AnimeBrowser` (Client Component, `'use client'`):** orquestra a interação — lê filtros da URL, gerencia o input com debounce, dispara o `useInfiniteQuery`, renderiza `ToggleGroup` + `SearchBar` + área de resultados + "Ver mais". Envolvido por um **`Container`** (max-w-7xl) pras 4 colunas baterem.
- **`useAnimeFilters()` (hook app-local):** lê/escreve `format` e `q` na URL (`useSearchParams` + `router.replace(url, { scroll: false })`) + a lógica de debounce.

Arquivos (na app):

```
apps/web/src/app/
├── page.tsx                    → Server: Header + Suspense(AnimeBrowser) + Footer
└── (home)/
    ├── anime-browser.tsx       → Client: orquestrador
    ├── use-anime-filters.ts    → hook: URL <-> estado + debounce
    └── format-options.ts       → opções do ToggleGroup + mapa value→MediaFormat
```

## 5. Estado na URL

- `format` e `q` vivem na URL. `useAnimeFilters` expõe `{ format, q, setFormat, setQuery }`.
- **Input com digitação instantânea:** o `SearchBar` mostra o valor digitado via `useState` local; sincroniza pra URL (`q`) após **300ms**. **"Buscar"/Enter** faz flush imediato (cancela o debounce e grava na hora).
- **Paginação NÃO vai na URL** (efêmera). Quando `format`/`q` mudam, o `queryKey` muda → `useInfiniteQuery` reseta pra página 1.

## 6. Data — estende o `data-access`

- **Query** `AnimeList($page, $perPage, $search, $format, $sort)` + `Page.pageInfo { hasNextPage }`. Filtros aplicados como argumentos de `media(...)`. **Sort:** `SEARCH_MATCH` quando há `search`, senão `POPULARITY_DESC` (definido no hook ao montar as variáveis).
- **Hook** `useAnimeList({ search, format })` → **`useInfiniteQuery`** (`queryKey: ['anime-list', format, search]`, `initialPageParam: 1`). `getNextPageParam` retorna a próxima página só quando `pageInfo?.hasNextPage` é truthy — trata `null` **e** `false` como fim (`undefined`). Cada página retorna `Anime[]` (via `toAnime`) + o `pageInfo`.
- **Variáveis montadas no hook:** `$sort` é variável da query, computada no hook (`[SEARCH_MATCH]` se houver `search`, senão `[POPULARITY_DESC]`); `search` vazio vai como `undefined` (não string vazia); `format = ALL` vira `undefined`.
- **`perPage = 12`.**
- Re-rodar **`codegen`** (a query muda).

> O `transform.toAnime` não muda. O `endpoint?` opcional continua, pra os testes MSW.

## 7. Composição da página

| Bloco      | Componente do DS          | Notas                                                                                    |
| ---------- | ------------------------- | ---------------------------------------------------------------------------------------- |
| Topo       | `Header`                  | Logo                                                                                     |
| Filtros    | `ToggleGroup`             | options de §9; `value=format`, `onChange=setFormat`                                      |
| Busca      | `SearchBar`               | `value` (input local), `onChange` (debounce→URL), `onSearch` (flush); `loading` no botão |
| Resultados | `AnimeGrid` + `AnimeCard` | flatten de `data.pages`; recebe `Anime`                                                  |
| Mais       | `Button` "Ver mais"       | `size=lg`, accent, ícone `Plus`, `loading` no fetchNextPage; só quando `hasNextPage`     |
| Rodapé     | `Footer`                  | Logo + copyright                                                                         |

## 8. Estados e feedback (área de resultados, com `aria-live="polite"`)

| Estado                                     | Render                                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------------ |
| Loading inicial (e ao trocar filtro/busca) | `AnimeGridSkeleton` (12)                                                             |
| Carregando mais                            | grid atual + botão "Ver mais" com **spinner** (`loading`)                            |
| Busca em andamento                         | botão "Buscar" com **spinner** (`loading`)                                           |
| Erro                                       | `StatusState` (`ServerCrash`, "Erro ao carregar", ação "Tentar de novo" → `refetch`) |
| Vazio (0 resultados)                       | `StatusState` (`SearchX`, "Nada encontrado")                                         |
| Sucesso                                    | `AnimeGrid` de `AnimeCard` + "Ver mais" se `hasNextPage`                             |

### Adição no DS — `Button` ganha `loading`

- Prop `loading?: boolean`. Quando `true`: mostra um **spinner** (`Loader2` do lucide com `animate-spin`) no lugar do `icon`, mantém o texto, e fica **desabilitado** (`disabled || loading`) + `aria-busy`.
- Usado por "Buscar" (`loading={isFetching && !isFetchingNextPage}`) e "Ver mais" (`loading={isFetchingNextPage}`).

## 9. Mapa de formato (ToggleGroup → AniList)

| Label       | `value` (URL) | `MediaFormat`  |
| ----------- | ------------- | -------------- |
| All Formats | `ALL`         | — (sem filtro) |
| TV Show     | `TV`          | `TV`           |
| Movie       | `MOVIE`       | `MOVIE`        |
| TV Short    | `TV_SHORT`    | `TV_SHORT`     |
| Special     | `SPECIAL`     | `SPECIAL`      |
| OVA         | `OVA`         | `OVA`          |
| ONA         | `ONA`         | `ONA`          |
| Music       | `MUSIC`       | `MUSIC`        |

## 10. Acessibilidade

- `aria-live="polite"` na área de resultados (anuncia mudança/contagem ao filtrar).
- `aria-busy` no skeleton (já tem) e nos botões em loading.
- `ToggleGroup` já tem `aria-pressed`; `SearchBar`/`Input` já têm `aria-label`; `AnimeCard` já tem `alt`.

## 11. Testes

- **data-access:** atualizar o teste MSW do hook pra `useInfiniteQuery` — mock com `pageInfo`, assert flatten da 1ª página + `fetchNextPage` acumulando.
- **DS:** teste do `Button` com `loading` (spinner presente + `disabled` + `aria-busy`).
- **app (`AnimeBrowser`):** Vitest + Testing Library + MSW — render inicial (skeleton→grid), trocar filtro reflete na URL + refaz a query, busca debounced grava na URL, "Ver mais" acumula, estados vazio e erro.
- **e2e (Playwright):** fluxo feliz (carrega → filtra → busca). Deixo o teste; roda no CI (não roda no sandbox Windows — limitação conhecida).

## 12. Definition of Done

- [ ] Query estendida (`search`/`format`/`sort`/`pageInfo`) + `codegen` regenerado.
- [ ] `useAnimeList({search,format})` via `useInfiniteQuery` (perPage 12) com teste MSW atualizado.
- [ ] `Button` com `loading` (spinner + disabled + aria-busy) + teste.
- [ ] Página compõe Header/ToggleGroup/SearchBar/AnimeGrid/AnimeCard/"Ver mais"/Footer dentro de `Container`.
- [ ] Estado na URL (`format`,`q`); busca com debounce 300ms + flush no botão/Enter.
- [ ] Estados: skeleton, vazio, erro, e spinners nos botões.
- [ ] `aria-live` nos resultados; lint/test/typecheck/build verdes; e2e (CI).

## 13. Decisões em aberto

Nenhuma — ver §3.
