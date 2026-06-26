# Rate-limit (429) + redesign dos blank states — Design

**Data:** 2026-06-26
**Status:** Aprovado (design)

## Objetivo

Tratar o erro **429 (rate limit)** da AniList com um blank state próprio — mensagem pedindo pra aguardar, distinta do erro de servidor — e **repaginar os blank states** (nada encontrado, erro, 429) com ícone em destaque, tipografia maior, cor por tipo de estado e uma animação de entrada suave.

## Contexto

- O proxy `apps/web/src/app/api/anilist/route.ts` repassa o status do upstream (`status: upstream.status`), então um 429 da AniList chega ao client (não é mascarado).
- `graphql-request` lança `ClientError` em respostas não-2xx, expondo `error.response.status`. (O teste atual de erro já confirma isso devolvendo `{ status: 500 }` e caindo no estado de erro.)
- Hoje `AnimeBrowser` trata qualquer `query.isError` como um único "Erro ao carregar" (`ServerCrash`). `StatusState` (libs/ui) é genérico (`icon`/`title`/`message`/`action`), monocromático (`text-ink/40`, título `text-xl`, ícone 64px).
- Os ícones já são lucide (`ServerCrash`, `SearchX`).

## Abordagem

Três camadas com responsabilidades isoladas:

### 1. data-access — detecção do 429

- Novo `libs/anime/data-access/src/lib/anilist-error.ts`:
  - `isRateLimitError(error: unknown): boolean` — **duck-type** do `ClientError`: `true` somente se `error` for objeto com `response.status === 429`. Não importa a classe `ClientError` (evita acoplamento de instância através do boundary `dist`).
- Exportado por `libs/anime/data-access/src/index.ts`.

### 2. app — política de retry

- `apps/web/src/app/providers.tsx`: o `QueryClient` (hoje `new QueryClient()`) passa a ter:
  ```ts
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => !isRateLimitError(error) && failureCount < 3,
    },
  }
  ```
- Efeito: no 429 **não re-tenta** (mostra o estado na hora e não gera carga extra na API); demais erros mantêm o padrão (3). Vale pra `useAnimeList` e `useAnimeFormatCounts`.
- Os testes constroem o próprio `QueryClient` com `retry: false`, então **não são afetados**.

### 3. ui — `StatusState` repaginado

- Ganha `tone?: 'neutral' | 'danger' | 'warning'` (default `neutral`) → cor do círculo do ícone:
  - `neutral` → `bg-ink/5 text-ink/40`
  - `danger` → `bg-red-100 text-red-600`
  - `warning` → `bg-amber-100 text-amber-600`
- Layout: ícone num círculo de 80px (`h-20 w-20 rounded-full`, ícone `[&_svg]:h-9 [&_svg]:w-9`); título `text-2xl`; mensagem `text-base max-w-md`; `gap-5 py-20`; container com `motion-safe:animate-status-in`.
- Animação em `libs/ui/src/styles/theme.css`: token `--animate-status-in: status-in 0.3s ease-out` + `@keyframes status-in` (opacity 0→1, `translateY(0.5rem)`→0). O prefixo `motion-safe` respeita `prefers-reduced-motion`.

### 4. `AnimeBrowser` — wiring

- Branch de erro:
  - `isRateLimitError(query.error)` → `StatusState tone="warning"`, ícone `<Hourglass/>`, título **"Muitas buscas"**, mensagem "Você fez muitas buscas em pouco tempo. Aguarde alguns segundos e tente de novo.", action **"Tentar de novo"** (`query.refetch()`).
  - senão → `StatusState tone="danger"`, `<ServerCrash/>`, "Erro ao carregar", mensagem + "Tentar de novo".
- Vazio → `StatusState tone="neutral"`, `<SearchX/>`, "Nada encontrado" (sem action).

## Fluxo de dados (429)

AniList 429 → proxy repassa 429 → graphql-request lança `ClientError(429)` → vira `query.error` → `useAnimeList` não re-tenta (retry skip) → `query.isError` true → `AnimeBrowser` detecta via `isRateLimitError` → renderiza o estado warning.

## Acessibilidade

- Animação só sob `motion-safe` (reduced-motion desliga).
- Círculo do ícone é `aria-hidden` (decorativo); a região de resultados já é `aria-live="polite"`.
- Contraste: título `text-ink` sobre branco; ícones são decorativos.
- `vitest-axe` limpo em cada `tone`.

## Testes

- **data-access** (`anilist-error.spec.ts`): `isRateLimitError` → `429` true; `500` / erro de rede / `Error` comum / `undefined` → false.
- **ui** (`status-state.spec.tsx`): aplica as classes por `tone` e o `motion-safe:animate-status-in`; axe limpo nas 3 tones.
- **app** (`anime-browser.spec.tsx`): MSW devolvendo `{ status: 429 }` no `AnimeList` → mostra "Muitas buscas" + botão "Tentar de novo"; mantém o teste de `500` → "Erro ao carregar".

## Fora de escopo (YAGNI)

- Contagem regressiva / encaminhar `Retry-After` (foi escolhido o botão simples).
- Dark mode (o app é light-only).

## Nota de build

`@buscanime/anime-data-access` é consumido do `dist/` (sem HMR) — mudar `isRateLimitError` exige `nx build @buscanime/anime-data-access` pro app enxergar (ver memória _anime-data-access-dist-consumed_). Já `@buscanime/ui` é consumido do **source** (`main: ./src/index.ts`), então `StatusState`/`theme.css` são pegos direto, sem rebuild. Verificar no **browser real**: a animação de entrada e o estado 429 não aparecem em testes mockados.
