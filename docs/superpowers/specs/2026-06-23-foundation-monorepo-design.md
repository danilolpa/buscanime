# Spec — Fundação do Monorepo `buscanime`

**Data:** 2026-06-23
**Status:** Revisão independente OK — aguardando revisão do autor
**Escopo:** Fase de fundação do Winnin Frontend Challenge (apenas fundação — a feature de listagem vem em fase posterior)

---

## 1. Contexto e objetivo

O repositório é um workspace **Nx 23** recém-gerado (`create-nx-workspace`) com o app `web` (Next.js 16 + React 19). A `DECISIONS.md` descreve a arquitetura-alvo de um app de listagem de animes consumindo a AniList via GraphQL.

Esta spec cobre **apenas a fundação**: deixar o monorepo com a estrutura de libs, boundary rules, tooling e o **pipeline de runtime cabeado e provado por testes** — de modo que a fase de feature só precise plugar componentes e telas sobre uma base já validada.

**Não** construímos a feature real (tela de listagem, filtros, busca) nesta fase.

## 2. Escopo

### 2.1 Dentro do escopo

- Higiene do workspace: package manager único (pnpm), CI ajustado.
- Troca do test runner Jest → **Vitest**.
- **Tailwind v4** no app, com varredura das libs.
- Git hooks: **husky + commitlint + lint-staged**.
- Estrutura de **3 libs + app** com tags e **boundary rules** (`@nx/enforce-module-boundaries`).
- Plumbing de runtime cabeado: **TanStack Query**, **graphql-request + GraphQL Code Generator**, **Route Handler `api/anilist`**, **Sentry**.
- **Prova do pipeline por testes automatizados** (sem UI real, sem página throwaway).
- Limpeza do boilerplate de boas-vindas do Nx na `page.tsx`/`layout.tsx`.
- README do workspace (estrutura, tags, scripts).

### 2.2 Fora do escopo (fase de feature / futuro)

- Tela de listagem, `AnimeGrid`, filtros por formato, busca com debounce, skeletons reais.
- Componentes visuais completos do design system (apenas stubs mínimos nesta fase).
- Dark mode, responsividade fina, auditoria a11y de implementação.
- BFF dedicado (`apps/api`), cache Redis, rate limiting, OpenTelemetry.
- Rota `dashboard/` (expansão futura).
- Dimensão de tags `scope:*` (adicionável quando surgir um 2º domínio).

## 3. Decisões reconciliadas (doc ↔ repo)

| Tema            | Decisão final                                | Observação                                                                     |
| --------------- | -------------------------------------------- | ------------------------------------------------------------------------------ |
| Next.js         | **16.1.6 + React 19** (mantém o instalado)   | Atualizar a linha "Next 14" na `DECISIONS.md`                                  |
| Test runner     | **Vitest**                                   | Alinha ao doc; remove Jest                                                     |
| Package manager | **pnpm**                                     | Remove `package-lock.json`; CI passa a usar pnpm                               |
| GraphQL         | **graphql-request + codegen**                | Type-safety a partir do schema da AniList                                      |
| Libs de UI      | **Um único `ui`** (DS prático, não-headless) | Funde o antigo `anime-ui`; `AnimeCard` é composição de itens do DS             |
| Utils           | Fundidos                                     | `anime-utils`/`shared-utils` não viram libs; helpers moram junto do consumidor |
| Tags            | Apenas **`type:*`**                          | `scope:*` descartado nesta fase                                                |

## 4. Arquitetura de libs

### 4.1 Estrutura-alvo

| Pasta                    | Pacote                         | Tag                | Papel                                                                                            | Gerador         |
| ------------------------ | ------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------ | --------------- |
| `apps/web`               | `@buscanime/web`               | `type:app`         | Compõe dados + UI; route handlers; providers                                                     | (já existe)     |
| `libs/ui`                | `@buscanime/ui`                | `type:ui`          | DS único: primitivos + compostos de domínio. **Presentational** (recebe props, não busca dados). | `@nx/react:lib` |
| `libs/anime/data-access` | `@buscanime/anime-data-access` | `type:data-access` | Cliente GraphQL, SDK do codegen, hooks TanStack Query, transform p/ modelo de domínio            | `@nx/js:lib`    |
| `libs/shared/types`      | `@buscanime/shared-types`      | `type:util`        | Contrato de tipos do domínio (`Anime`, `MediaFormat`) compartilhado entre `ui` e `data-access`   | `@nx/js:lib`    |

> Setup moderno Nx 23 (TS-solution): cada lib é um pacote importado **pelo nome** (não por path do `tsconfig`); resolução via `package.json#exports` + `customConditions: ["@buscanime/source"]` já presente em `tsconfig.base.json`.

### 4.2 Tags e boundary rules

Constraints em `eslint.config.mjs` (`@nx/enforce-module-boundaries`):

| `sourceTag`        | Pode depender de                                        |
| ------------------ | ------------------------------------------------------- |
| `type:app`         | `type:ui`, `type:data-access`, `type:util`              |
| `type:ui`          | `type:ui`, `type:util` — **✗ nunca `type:data-access`** |
| `type:data-access` | `type:data-access`, `type:util` — **✗ nunca `type:ui`** |
| `type:util`        | `type:util`                                             |

Tradução direta da "regra de dependência entre libs" da `DECISIONS.md`, agora quebrando o lint/CI em violação.

### 4.3 Grafo de dependência

```
apps/web [type:app]  — compõe dados + UI
   ├─ usa → ui                 (type:ui)           primitivos + AnimeCard…
   ├─ usa → anime-data-access  (type:data-access)  hooks/queries
   └─ usa → shared-types       (type:util)
                 ▲                        ▲
   ui ───────────┘   (consome o tipo)     │
   anime-data-access ─────────────────────┘   (produz o tipo)

Regra dura: ui ✗ data-access  |  data-access ✗ ui
            (o contrato Anime vive em shared-types, ponto neutro)
```

**Por que `shared-types` é separado:** como `ui` e `data-access` não podem se importar, o tipo `Anime` que ambos usam precisa morar fora dos dois. Se ficasse em `ui`, `data-access` teria que importar `ui` (proibido).

## 5. Tooling

### 5.1 Package manager — pnpm

- Remover `package-lock.json`.
- Declarar `packages:` em `pnpm-workspace.yaml` (`apps/*`, `libs/*`).
- CI: `pnpm/action-setup` + `actions/setup-node` com `cache: 'pnpm'` + `pnpm install --frozen-lockfile`.

### 5.2 Test runner — Vitest

- Adicionar `@nx/vite`; configurar `vitest.config.ts` por projeto (environment `jsdom`, `@testing-library/react`, `@vitejs/plugin-react`).
- Remover deps/config Jest (`@nx/jest`, `jest.config.*`, `jest.preset.js`, `babel-jest`, `ts-jest`).
- **MSW** como dependência de teste para mock de rede.
- Atualizar `DECISIONS.md` (Vitest confirmado).

### 5.3 Tailwind v4

- `@tailwindcss/postcss`; `@import "tailwindcss"` no `global.css`; tokens via `@theme`.
- `@source` apontando para `libs/ui` (e demais libs com classes) para o app varrer as classes.
- Tokens de cor do `ScoreBadge` (vermelho/amarelo/verde) já com os ajustes de contraste do doc.

### 5.4 Git hooks — husky + commitlint + lint-staged

- `pre-commit`: `lint-staged` (eslint --fix + prettier) + `nx affected -t test`.
- `commit-msg`: `commitlint` com Conventional Commits, incluindo os tipos do doc (`feat`, `fix`, `chore`, `docs`, `a11y`).

## 6. Plumbing de runtime

### 6.1 `shared-types`

- Modelo de domínio normalizado: `Anime` (id, título, capa, score, formato, genres) e `MediaFormat`.
- Sem dependências de runtime.

### 6.2 `anime-data-access`

- **Endpoint AniList:** `https://graphql.anilist.co` (POST JSON, sem auth para queries públicas) — chamado **via Route Handler** do app, não direto do browser.
- **graphql-request** como cliente.
- **GraphQL Code Generator**: introspecção do schema da AniList → SDK tipado (`@graphql-codegen/cli` + `typescript` + `typescript-operations` + `typescript-graphql-request`, padrão `getSdk`). Script `codegen` no projeto.
  - _Alternativa considerada:_ `@graphql-codegen/client-preset` (TypedDocumentNode) com `graphql-request` só como fetcher — é o caminho recomendado para greenfield em 2026. Mantemos `getSdk` pela ergonomia; trocar é de baixo custo se preferirmos o preset moderno.
- 1 query mínima (`Page.media`) + função `useAnimeList()` (TanStack Query) que chama `/api/anilist` e faz `transform` do payload tipado → `Anime` de `shared-types`.

### 6.3 Route Handler `apps/web/src/app/api/anilist/route.ts`

- Substitui o `api/hello` de exemplo.
- Proxy `POST` → AniList: encaminha `{ query, variables }`, mede latência, loga, e **captura erros no Sentry** (timeout, rate limit, resposta inválida) antes de retornar erro tratado ao cliente.

### 6.4 Providers + Sentry (`layout.tsx`)

- `QueryClientProvider` (TanStack Query) num `Providers` client component.
- **Sentry** via `@sentry/nextjs` (instrumentação client/server/edge), DSN por `NEXT_PUBLIC_SENTRY_DSN`. **Env-gated**: sem DSN, vira no-op (não quebra build/dev). **Pinar** uma versão do `@sentry/nextjs` onde o transporte server-side sob Next 16/Turbopack esteja corrigido (ver §10).
- `Sentry.ErrorBoundary` no layout (**client-only** — não captura erros de SSR/RSC).
- `app/error.tsx` + `app/global-error.tsx` para cobrir erros de render do App Router (Server Components / SSR) que o `ErrorBoundary` não alcança.
- Limpar boilerplate Nx; `metadata` própria; `page.tsx` placeholder mínimo.

## 7. Estratégia de testes (prova do pipeline)

Sem UI real e sem página throwaway. O "plumbing provado" são **dois testes automatizados**:

1. **`anime-data-access` (integração, MSW):** mocka a AniList no nível de rede → prova cliente + tipos do codegen + `useAnimeList` + `transform` para `Anime`. Embora seja lib `@nx/js`, ela entrega um hook React: o `vitest.config.ts` desta lib usa **`environment: 'jsdom'`** + `renderHook` do `@testing-library/react` (não herdar `node` por default).
2. **Route handler `api/anilist`:** prova o proxy (caminho feliz) e o caminho de erro (mock de `fetch` falhando → `Sentry.captureException` chamado, resposta de erro tratada).

`QueryClientProvider` e Sentry no layout são verificados por `build` + `typecheck` (são configuração).
Cada lib recebe um teste trivial mínimo (1 export + 1 assert) garantindo que builda/importa. Inclui **1 teste de boundary documentado** (import proibido acusado pelo lint).

## 8. Sequência de execução (ondas)

1. **Higiene** — pnpm cleanup + CI; Jest → Vitest; `DECISIONS.md` (Next 16, Vitest).
2. **Qualidade** — Tailwind v4; ESLint (react/react-hooks/jsx-a11y nas flat configs); husky + commitlint + lint-staged.
3. **Skeleton** — gerar `ui`, `anime/data-access`, `shared/types` com tags; configurar `depConstraints`; conteúdo mínimo + teste trivial por lib (incl. teste de boundary).
4. **Runtime** — `shared-types` → `anime-data-access` (codegen + hook) → route handler → providers → Sentry → 2 testes do pipeline.
5. **Fechamento** — README (estrutura, tags, scripts); `nx run-many -t lint test typecheck build e2e` verde; `nx graph` como evidência.

## 9. Definition of Done

- [ ] Um único lockfile (`pnpm-lock.yaml`); CI verde usando pnpm.
- [ ] `nx run-many -t lint test typecheck build` verde; e2e mínimo verde.
- [ ] 3 libs criadas com tags corretas; `enforce-module-boundaries` ativo com as constraints `type:*`.
- [ ] Teste de boundary prova que `ui → data-access` é bloqueado.
- [ ] `codegen` gera o SDK tipado da AniList sem erro.
- [ ] Teste MSW do `useAnimeList` passa; teste do route handler (feliz + erro) passa.
- [ ] Sentry inicializa env-gated (sem DSN não quebra; com DSN, captura no route handler).
- [ ] Tailwind v4 aplica classes vindas de `libs/ui` no app.
- [ ] Boilerplate Nx removido; README atualizado.

## 10. Riscos e mitigações

| Risco                                                                                                        | Mitigação                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Dois lockfiles divergentes confundem instalação/CI                                                           | Wave 1 remove `package-lock.json` e fixa pnpm antes de tudo                                                                            |
| Vitest + Next 16 + React 19 com fricção de config                                                            | Usar `@nx/vite` + `@vitejs/plugin-react`; isolar config por projeto                                                                    |
| Codegen depende de rede (schema AniList)                                                                     | Cache do schema introspectado; script `codegen` idempotente                                                                            |
| Sentry exige DSN/conta                                                                                       | Init env-gated: ausência de DSN = no-op, não bloqueia dev/build                                                                        |
| Sentry pode perder eventos server-side sob Next 16 + Turbopack (bug conhecido ~`@sentry/nextjs` 10.32–10.34) | Pinar versão corrigida do `@sentry/nextjs`; fallback de fetch-transport se necessário. Captura no client/`ErrorBoundary` não é afetada |
| Rate limit da AniList em testes                                                                              | Testes usam MSW (sem rede real)                                                                                                        |

## 11. Decisões em aberto

Nenhuma. Todas as bifurcações foram resolvidas (ver §3).
