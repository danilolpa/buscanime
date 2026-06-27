# Spec — Design System `ui`

**Data:** 2026-06-24
**Status:** Aprovado em discussão — aguardando revisão
**Escopo:** Fase de Design System do Winnin Frontend Challenge (componentes isolados; a tela/feature vem depois)

---

## 1. Contexto e objetivo

A fundação do monorepo está pronta (`ui` existe como stub, Tailwind v4 cabeado, boundaries `type:*` ativas). Esta fase constrói **todos os componentes de UI** do app de listagem de animes — de forma **isolada, com Storybook** — antes de montar qualquer tela.

Referência visual: o mock do Figma (header roxo "BUSCANIME", barra de filtros por formato, busca, grid 4-col de cards com capa + título + chips de gênero + rating %, botão "Ver mais", footer roxo).

Todos os componentes são **presentational** e vivem em `ui` (`type:ui`): recebem dados/handlers por props, **não** acessam `data-access`. A fiação com dados (página, estado, query) é a **fase de feature**, fora desta spec.

## 2. Escopo

### 2.1 Dentro do escopo

- Setup do **Storybook** no Nx com Tailwind aplicado.
- Tooling: **cva + tailwind-merge** (variantes), **lucide-react** (ícones), **vitest-axe** (a11y nos testes).
- Tokens de tema no `@theme` do Tailwind.
- Componentes (ver §5), cada um com: componente + story do Storybook + teste (Vitest + Testing Library, axe nos principais).

### 2.2 Fora do escopo (fase de feature / futuro)

- Página de listagem, estado, debounce, paginação/"load more", `aria-live` da área de resultados.
- Consumo do `useAnimeList` / qualquer chamada à AniList.
- Dark mode (a `DECISIONS.md` cita como baixo esforço, mas fica pra depois).
- Primitivos de Typography (decisão: YAGNI — usa classes Tailwind direto).

## 3. Decisões

| Tema                | Decisão                                                                  |
| ------------------- | ------------------------------------------------------------------------ |
| Workbench           | **Storybook** (Tailwind aplicado nas stories)                            |
| Roxo de marca       | **violet-700** (`#6d28d9`) — escala Tailwind, sem token custom           |
| Variantes de classe | **cva + tailwind-merge**                                                 |
| Ícones              | **lucide-react**                                                         |
| Typography          | **Sem primitivos** — classes Tailwind direto                             |
| Button: ícone       | prop genérica **`icon?: ReactNode`** — sempre renderizado à esquerda     |
| AnimeCard props     | recebe o tipo **`Anime`** de `shared-types`                              |
| Rating alto         | **teal-700** + texto branco (contraste — ver §4)                         |
| SearchBar           | **componente** próprio (Input + Button), não composição na página        |
| Amarelo             | **yellow-300** (pode subir p/ `yellow-400` se ficar pálido no Storybook) |

## 4. Tokens de tema + regras do AnimeRating (a11y)

### 4.1 Tokens — fonte única em `libs/ui/src/styles/theme.css`

Os tokens vivem em **um único arquivo**: `libs/ui/src/styles/theme.css` (`@import 'tailwindcss'; @theme { … }`). Tanto `apps/web/src/app/global.css` quanto o `.storybook/preview` **importam esse arquivo** — zero duplicação de tokens.

**Supersede a fundação:** o `global.css` hoje tem tokens placeholder `--color-score-low/mid/high/ink` (criados na Onda 2 da fundação, com cores diferentes — `#e53e3e`/`#38a169`). Eles são **removidos** e substituídos pelos abaixo. O `global.css` passa a conter só o import do tema + o `@source` (o caminho exato do import — relativo vs export do pacote `ui` — fica a critério do plano).

| Token            | Valor                | Uso                                        |
| ---------------- | -------------------- | ------------------------------------------ |
| `--color-brand`  | violet-700 `#6d28d9` | Header, Footer, filtro ativo, botão Buscar |
| `--color-accent` | yellow-300           | Botão "Ver mais"                           |
| `--color-ink`    | `#1a1a1a`            | Texto escuro sobre amarelo                 |

> As cores do **rating** não são tokens — são aplicadas como **classes Tailwind diretas** no componente (ver §4.2).

### 4.2 `AnimeRating` — cor por faixa, **com contraste WCAG AA**

As cores são **classes Tailwind diretas** no componente (não tokens). O mock usa texto branco sobre teal/amarelo, que **reprova** (~1.8–2.3:1). Corrigido:

| Faixa (score %) | Fundo (classe)  | Texto         | Contraste |
| --------------- | --------------- | ------------- | --------- |
| `< 50`          | `bg-rose-600`   | branco        | ~4.7:1 ✓  |
| `50–80`         | `bg-yellow-300` | `neutral-900` | ~13:1 ✓   |
| `> 80`          | `bg-teal-700`   | branco        | ~5.5:1 ✓  |

> O badge usa um tamanho/peso que **não qualifica** como "texto grande" no WCAG (o limite é ≥ 14pt bold = 18,66px), então o limiar AA aplicável é **4,5:1** (não 3:1). Por isso o tier baixo usa `bg-rose-600` (4,70:1) — rose-500 (3,67:1) reprovaria. teal-700 e yellow-300 com texto escuro passam com folga.

## 5. Inventário de componentes

Todos em `libs/ui/src/lib/<componente>/`. Cada um: `*.tsx` + `*.stories.tsx` + `*.spec.tsx`, exportado pelo barrel `src/index.ts`.

### 5.1 Primitivos

| Componente      | API (props principais)                                                                                                       | Notas                                                                  |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Button**      | `variant: 'solid' \| 'outline'`, `active?: boolean`, `size: 'md' \| 'lg'`, `icon?: ReactNode`, + props nativas de `<button>` | `active` leva outline→solid + hover distinto. Variantes via cva.       |
| **Chip**        | `children`, `variant?` (ex.: `default \| onImage`)                                                                           | Tag de gênero; `onImage` usa fundo translúcido p/ contraste sobre capa |
| **AnimeRating** | `value: number`                                                                                                              | Cor por faixa (§4.2); arredonda/formata `%`                            |
| **Input**       | `value`, `onChange`, `placeholder`, `aria-label` (obrigatório), `icon?`                                                      | Campo de busca                                                         |
| **Skeleton**    | `width?`, `height?`, `rounded?`                                                                                              | Bloco shimmer base                                                     |
| **Logo**        | `size?`, `as?: 'span' \| 'a'`                                                                                                | "BUSC" claro + "ANIME" yellow                                          |

### 5.2 Compostos (domínio)

| Componente            | API                                             | Notas                                                                                                       |
| --------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **AnimeCard**         | `anime: Anime`                                  | Capa com `alt`, overlay gradiente no rodapé, título, `Chip` de gêneros, `AnimeRating` no canto inf. direito |
| **AnimeGrid**         | `children`                                      | Grid responsivo 1→2→4 col                                                                                   |
| **ToggleGroup**       | `options: {label,value}[]`, `value`, `onChange` | Linha de `Button`s; `aria-pressed`; só um ativo                                                             |
| **SearchBar**         | `value`, `onChange`, `onSearch`                 | `Input` + `Button` "Buscar"                                                                                 |
| **AnimeCardSkeleton** | —                                               | Layout do card em shimmer; `aria-busy`                                                                      |
| **AnimeGridSkeleton** | `count?: number`                                | Grid de N `AnimeCardSkeleton`                                                                               |

### 5.3 Layout & estados

| Componente      | API                                                          | Notas                                         |
| --------------- | ------------------------------------------------------------ | --------------------------------------------- |
| **Container**   | `children`                                                   | Wrapper centralizado, largura máxima          |
| **Header**      | `children?`                                                  | Container + `Logo` (slot p/ nav futura)       |
| **Footer**      | —                                                            | Container + `Logo` + copyright                |
| **StatusState** | `icon: ReactNode`, `title`, `message?`, `action?: ReactNode` | Um componente p/ "vazio" e "erro do servidor" |

## 6. Acessibilidade embutida

- Overlay gradiente no `AnimeCard` (legibilidade do título sobre imagem variável).
- `AnimeRating` com as cores/texto da §4.2.
- `aria-pressed` no `ToggleGroup`; `aria-label` no `Input`/`SearchBar`; `alt` nas capas; `aria-busy` nos skeletons.
- `aria-live` da área de resultados fica na **fase de feature** (não é do DS).
- `eslint-plugin-jsx-a11y` já enforça em dev; **vitest-axe** valida nos testes.

## 7. Testes

- **Vitest + Testing Library** por componente: render, variantes (cva), interação (clicks/onChange), estados.
- **vitest-axe** (`expect.toHaveNoViolations`) nos componentes-chave (Button, Chip, AnimeRating, Input, AnimeCard, ToggleGroup, SearchBar, StatusState).
- **Stories do Storybook** como catálogo: cada variante/estado vira uma story (inclui ratings verde/amarelo/vermelho, Button solid/outline/active, skeletons, empty/error).

## 8. Sequência de construção

1. **Setup** — `@nx/storybook` no `ui` com **builder Vite** (não webpack — o default do generator pode trazer webpack) + `@tailwindcss/postcss` no Storybook; importar `theme.css` no `.storybook/preview`; instalar cva, tailwind-merge, lucide-react, vitest-axe; mover tokens p/ `theme.css` e limpar `global.css`; remover o stub `ui.tsx`.
2. **Primitivos** — Button, Chip, AnimeRating, Input, Skeleton, Logo.
3. **Compostos** — AnimeCard, AnimeGrid, ToggleGroup, SearchBar, AnimeCardSkeleton, AnimeGridSkeleton.
4. **Layout/estados** — Container, Header, Footer, StatusState.
5. **Fechamento** — catálogo Storybook completo; axe verde; `nx run-many -t lint test typecheck build` verde; Storybook buildável.

## 9. Definition of Done

- [ ] Storybook roda (`nx storybook ui`) e builda (`nx build-storybook ui`) com Tailwind aplicado.
- [ ] Todos os componentes da §5 implementados, exportados pelo barrel, com story + teste.
- [ ] `AnimeRating` passa axe nas 3 faixas; contraste conforme §4.2.
- [ ] `Button` cobre solid/outline/active × md/lg × com/sem ícone (stories + testes).
- [ ] vitest-axe sem violações nos componentes-chave.
- [ ] Boundaries intactas: `ui` não importa `data-access`; `AnimeCard` usa `Anime` de `shared-types` (`type:ui → type:util` ✓).
- [ ] `nx run-many -t lint test typecheck build` verde.

## 10. Decisões em aberto

Nenhuma — ver §3. Pontos a validar empiricamente no Storybook: tom do `yellow-300` (vs `yellow-400`).
