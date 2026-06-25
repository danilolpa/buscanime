# Design System `@buscanime/ui` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir todos os componentes presentational de `@buscanime/ui` em isolamento (Storybook), com Tailwind v4, cva, lucide-react e a11y verificada por vitest-axe — prontos pra fase de feature plugar.

**Architecture:** Componentes presentational na lib `@buscanime/ui` (`type:ui`, sem `data-access`). Variantes com **cva + tailwind-merge** (`cn` util). Tokens de tema em **fonte única** `libs/ui/src/styles/theme.css` (importada pelo app e pelo Storybook). Cada componente = `*.tsx` + `*.stories.tsx` + `*.spec.tsx`, exportado pelo barrel. `AnimeCard` consome o tipo `Anime` de `@buscanime/shared-types` (boundary `type:ui → type:util` ✓).

**Tech Stack:** Nx 23, React 19, TypeScript, Tailwind v4, class-variance-authority + clsx + tailwind-merge, lucide-react, Storybook v10 (builder Vite), Vitest + Testing Library + user-event + vitest-axe.

**Spec:** `docs/superpowers/specs/2026-06-24-design-system-ui-design.md`

**Convenções de execução:**

- Bash tool (Git Bash) pra shell; `pnpm exec nx ...`; `pnpm add -w ...`.
- Branch atual: `feat/design-system`. husky ativo (pre-commit: lint-staged + `nx affected -t test`; commit-msg: commitlint — tipos feat/fix/chore/docs/refactor/test/ci/a11y). Comitar só em verde.
- Imports de pacote (`@buscanime/*`, `lucide-react`, `class-variance-authority`) sem extensão. Imports **relativos**: a `libs/ui` usa resolução `bundler`, então a extensão é **opcional** — siga o estilo dos vizinhos (o barrel atual usa **sem** extensão, `'./lib/ui'`). Os exemplos de código abaixo mostram `.js`; pode omitir pra ficar uniforme com a lib. O importante é manter consistente.

---

## Padrão por componente (vale pra todos)

- Pasta `libs/ui/src/lib/<kebab-name>/` com `<name>.tsx`, `<name>.stories.tsx`, `<name>.spec.tsx`.
- Componente que embrulha um elemento DOM nativo: `forwardRef` + spread das props nativas + `className` mesclável via `cn(...)`.
- Variantes (cores/tamanhos/estados): **cva**.
- **Story**: uma story por variante/estado relevante (catálogo visual).
- **Spec**: render + interação (quando houver) + (nos principais) `expect(await axe(container)).toHaveNoViolations()`.
- Exportar no barrel `libs/ui/src/index.ts`.

---

## File Structure

```
libs/ui/
├── .storybook/{main.ts, preview.ts}        → config Storybook (Vite + Tailwind)
├── src/
│   ├── styles/theme.css                    → @import tailwindcss + @theme (fonte única de tokens) + @source
│   ├── test-setup.ts                       → jest-dom + vitest-axe matchers + cleanup
│   ├── lib/
│   │   ├── utils/cn.ts                      → cn = twMerge(clsx(...))
│   │   ├── button/                          → Button
│   │   ├── chip/                            → Chip
│   │   ├── anime-rating/                    → AnimeRating
│   │   ├── input/                           → Input
│   │   ├── skeleton/                        → Skeleton
│   │   ├── logo/                            → Logo
│   │   ├── anime-card/                      → AnimeCard
│   │   ├── anime-grid/                      → AnimeGrid
│   │   ├── format-filter/                   → FormatFilter
│   │   ├── search-bar/                      → SearchBar
│   │   ├── anime-card-skeleton/             → AnimeCardSkeleton + AnimeGridSkeleton
│   │   ├── container/                       → Container
│   │   ├── header/                          → Header
│   │   ├── footer/                          → Footer
│   │   └── status-state/                    → StatusState
│   └── index.ts                             → barrel
apps/web/src/app/global.css                  → passa a só importar theme.css + manter o que for do app
```

---

## Wave 1 — Setup

### Task 1: Tooling, Storybook, tokens, test-setup

**Files:** create `libs/ui/src/lib/utils/cn.ts`, `libs/ui/src/styles/theme.css`, `libs/ui/src/test-setup.ts`; modify `libs/ui/vite.config.mts`, `apps/web/src/app/global.css`; Storybook config via generator; delete `libs/ui/src/lib/ui.tsx`, `ui.spec.tsx`, `ui.module.css`.

- [ ] **Step 1: Instalar deps**

```bash
pnpm add -w class-variance-authority clsx tailwind-merge lucide-react
pnpm add -D -w vitest-axe @testing-library/user-event
```

- [ ] **Step 2: `cn` util**

Create `libs/ui/src/lib/utils/cn.ts`:

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 3: Tokens em fonte única**

Create `libs/ui/src/styles/theme.css`:

```css
@import 'tailwindcss';
@source '../**/*.{ts,tsx}';

@theme {
  --color-brand: #6d28d9; /* violet-700 */
  --color-accent: #fde047; /* yellow-300 */
  --color-rating-low: #f43f5e; /* rose-500 */
  --color-rating-mid: #fde047; /* yellow-300 */
  --color-rating-high: #0f766e; /* teal-700 */
  --color-ink: #1a1a1a;
}
```

Then edit `apps/web/src/app/global.css` to **remove** the old `@theme { --color-score-* }` block and its `@source`, replacing the top with an import of the lib theme (relative path from `apps/web/src/app/` → `../../../../libs/ui/src/styles/theme.css`):

```css
@import '../../../../libs/ui/src/styles/theme.css';
```

(Keep any app-only CSS below it. The `@import 'tailwindcss'` now comes from `theme.css`, so remove the duplicate in `global.css`.)

- [ ] **Step 4: test-setup com vitest-axe**

Create `libs/ui/src/test-setup.ts`:

```ts
import { afterEach, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as axeMatchers from 'vitest-axe/matchers';
import '@testing-library/jest-dom/vitest';

expect.extend(axeMatchers);
afterEach(() => cleanup());
```

In `libs/ui/vite.config.mts`, **adicione** `setupFiles: ['./src/test-setup.ts']` ao bloco `test` (a chave ainda não existe) e confirme `environment: 'jsdom'`.

- [ ] **Step 5: Remover o stub**

```bash
rm libs/ui/src/lib/ui.tsx libs/ui/src/lib/ui.spec.tsx libs/ui/src/lib/ui.module.css
```

Empty the barrel `libs/ui/src/index.ts` (re-export nothing yet; components added per task).

- [ ] **Step 6: Storybook (builder Vite)**

```bash
pnpm exec nx g @nx/react:storybook-configuration ui --uiFramework=@storybook/react-vite --interactionTests=true --generateStories=false
```

In `libs/ui/.storybook/preview.ts`, import the theme so Tailwind applies in stories:

```ts
import '../src/styles/theme.css';
```

Confirm `.storybook/main.ts` uses `@storybook/react-vite`. Ensure the root `postcss.config.mjs` (with `@tailwindcss/postcss`) is picked up by Storybook's Vite — if not, add a `css.postcss` ref in the Storybook Vite config.

- [ ] **Step 7: Verificar**

```bash
pnpm exec nx build-storybook ui   # deve buildar
pnpm exec nx test ui              # passa (sem componentes ainda, ou só o setup)
pnpm exec nx lint ui
```

Expected: build-storybook OK; lint/test verdes.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "chore: set up storybook, cva tooling and theme tokens for ui"
```

---

## Wave 2 — Primitivos

> Cada task: componente + story + spec, comitando em verde com `feat: add <Component> component`.

### Task 2: Button (exemplar do padrão cva)

**Files:** create `libs/ui/src/lib/button/{button.tsx,button.stories.tsx,button.spec.tsx}`; modify barrel.

- [ ] **Step 1: Spec que falha** — `button.spec.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('renderiza children e dispara onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Buscar</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renderiza o ícone', () => {
    render(<Button icon={<svg data-testid="ic" />}>Ver mais</Button>);
    expect(screen.getByTestId('ic')).toBeInTheDocument();
  });

  it('sem violações de a11y', async () => {
    const { container } = render(<Button>OK</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

Run `pnpm exec nx test ui` → FAIL (Button não existe).

- [ ] **Step 2: Implementar** — `button.tsx`:

```tsx
import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn.js';

const button = cva('inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none', {
  variants: {
    variant: {
      solid: 'bg-brand text-white hover:bg-brand/90',
      outline: 'border border-brand text-brand hover:bg-brand/10',
    },
    size: { md: 'h-9 px-4 text-sm', lg: 'h-12 px-6 text-base' },
    active: { true: '', false: '' },
  },
  compoundVariants: [{ variant: 'outline', active: true, class: 'bg-brand text-white border-transparent font-bold hover:bg-brand' }],
  defaultVariants: { variant: 'solid', size: 'md', active: false },
});

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof button> {
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, variant, size, active, icon, children, ...props }, ref) {
  return (
    <button ref={ref} className={cn(button({ variant, size, active }), className)} {...props}>
      {icon && <span aria-hidden>{icon}</span>}
      {children}
    </button>
  );
});
```

(`bg-brand`/`text-brand`/`border-brand` vêm do token `--color-brand` do Tailwind v4.)

- [ ] **Step 3: Story** — `button.stories.tsx` com stories: Solid, Outline, Active, Sizes (md/lg), WithIcon (lucide `Plus`/`Search`). Use `Meta`/`StoryObj` de `@storybook/react`.

- [ ] **Step 4: Barrel + rodar + commit**
      Add `export * from './lib/button/button.js';` to `libs/ui/src/index.ts`.
      `pnpm exec nx test ui` → PASS. `git add -A && git commit -m "feat: add Button component"`.

### Task 3: Chip

API: `children`, `variant?: 'default' | 'onImage'`. cva: `default` = `bg-brand/10 text-brand`; `onImage` = `bg-black/60 text-white` (contraste sobre capa). Spec: render + axe. Story: default + onImage. Commit `feat: add Chip component`.

### Task 4: AnimeRating (a11y-crítico)

**Files:** `anime-rating/{anime-rating.tsx,*.stories.tsx,*.spec.tsx}`.

- Spec (TDD) cobre as 3 faixas + axe nas 3:

```tsx
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { it, expect } from 'vitest';
import { AnimeRating } from './anime-rating';

it.each([42, 70, 88])('renderiza %i%% e a faixa de cor correta', (value) => {
  render(<AnimeRating value={value} />);
  expect(screen.getByText(`${value}%`)).toBeInTheDocument();
});
it('sem violações de a11y nas faixas', async () => {
  for (const v of [42, 70, 88]) {
    const { container } = render(<AnimeRating value={v} />);
    expect(await axe(container)).toHaveNoViolations();
  }
});
```

- Implementação:

```tsx
import { cn } from '../utils/cn.js';
export interface AnimeRatingProps {
  value: number;
}
function tone(value: number) {
  if (value < 50) return 'bg-rating-low text-white';
  if (value <= 80) return 'bg-rating-mid text-ink';
  return 'bg-rating-high text-white';
}
export function AnimeRating({ value }: AnimeRatingProps) {
  return <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-sm font-bold', tone(value))}>{Math.round(value)}%</span>;
}
```

- Se o axe reprovar `rating-low` + branco, ajustar token `--color-rating-low` p/ rose-600 (`#e11d48`) no `theme.css` e re-rodar. Story: Low/Mid/High. Commit `a11y: add AnimeRating with WCAG-safe color tiers`.

### Task 5: Input

API: `value`, `onChange`, `placeholder?`, `aria-label` (obrigatório via type), `icon?`. `forwardRef`. Spec: render com `aria-label`, digita e dispara onChange, axe. Story: vazio + com ícone (lucide `Search`). Commit `feat: add Input component`.

### Task 6: Skeleton

API: `width?`, `height?`, `rounded?: boolean`. Classe base `animate-pulse bg-black/10`, dimensões via style/className. Spec: render (role/aria opcional — aqui é decorativo). Story: linhas/blocos. Commit `feat: add Skeleton component`.

### Task 7: Logo

API: `size?: 'md'|'lg'`, `as?: 'span'|'a'`. Render "BUSC" (text-white) + "ANIME" (text-accent), bold. Spec: render texto. Story: sobre fundo `bg-brand`. Commit `feat: add Logo component`.

---

## Wave 3 — Compostos

### Task 8: AnimeCard (composto principal)

**Files:** `anime-card/{anime-card.tsx,*.stories.tsx,*.spec.tsx}`; modify `libs/ui/package.json`.

- **Step 0 (workspace dep):** `AnimeCard` importa `@buscanime/shared-types`. Adicionar `"@buscanime/shared-types": "workspace:*"` em `libs/ui/package.json` (criar o campo `"dependencies"` se não existir) e rodar `pnpm install`. Sem isso o Vitest/bundler não resolve o import no spec. (Boundary `type:ui → type:util` permite.)
- Spec (TDD): dado um `Anime` mock, renderiza `alt`=título, título, chips de gênero, e o `AnimeRating`; axe sem violações.

```tsx
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { it, expect } from 'vitest';
import { AnimeCard } from './anime-card';
import type { Anime } from '@buscanime/shared-types';

const anime: Anime = { id: 1, title: 'Naruto', coverImage: 'n.jpg', averageScore: 88, format: 'TV', genres: ['Action', 'Drama'] };

it('renderiza capa, título, gêneros e rating', () => {
  render(<AnimeCard anime={anime} />);
  expect(screen.getByRole('img', { name: 'Naruto' })).toBeInTheDocument();
  expect(screen.getByText('Naruto')).toBeInTheDocument();
  expect(screen.getByText('Action')).toBeInTheDocument();
  expect(screen.getByText('88%')).toBeInTheDocument();
});
it('sem violações de a11y', async () => {
  const { container } = render(<AnimeCard anime={anime} />);
  expect(await axe(container)).toHaveNoViolations();
});
```

- Implementação (img nativa — sem next/image, mantém DS framework-agnóstico; overlay gradiente p/ contraste do título):

```tsx
import type { Anime } from '@buscanime/shared-types';
import { Chip } from '../chip/chip.js';
import { AnimeRating } from '../anime-rating/anime-rating.js';

export interface AnimeCardProps {
  anime: Anime;
}

export function AnimeCard({ anime }: AnimeCardProps) {
  return (
    <article className="relative aspect-[3/4] overflow-hidden rounded-lg">
      <img src={anime.coverImage} alt={anime.title} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3 pt-12">
        <h3 className="font-bold text-white">{anime.title}</h3>
        <div className="mt-1 flex flex-wrap gap-1">
          {anime.genres.slice(0, 3).map((g) => (
            <Chip key={g} variant="onImage">
              {g}
            </Chip>
          ))}
        </div>
      </div>
      {anime.averageScore != null && (
        <div className="absolute bottom-2 right-2">
          <AnimeRating value={anime.averageScore} />
        </div>
      )}
    </article>
  );
}
```

Story: card normal + sem score + título longo. Commit `feat: add AnimeCard component`.

### Task 9: AnimeGrid

API: `children`. `div` com `grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`. Spec: renderiza N filhos. Story: grid de AnimeCards. Commit `feat: add AnimeGrid component`.

### Task 10: FormatFilter

API: `options: {label:string; value:string}[]`, `value: string`, `onChange: (value:string)=>void`. Renderiza um `Button` por opção (`size=md`), `active={opt.value===value}`, `aria-pressed={opt.value===value}`, `onClick`. Spec: clica numa opção → `onChange` com o value; `aria-pressed` correto; axe. Story: barra com formatos (All/TV/Movie/...). Commit `feat: add FormatFilter component`.

### Task 11: SearchBar

API: `value`, `onChange`, `onSearch: ()=>void`. `Input` (aria-label "Buscar anime") + `Button` "Buscar"; submit via form (`onSubmit`→`onSearch`, previne default) pra suportar Enter. Spec: digita, submete (click + Enter) → `onSearch`; axe. Story: vazio + preenchido. Commit `feat: add SearchBar component`.

### Task 12: AnimeCardSkeleton + AnimeGridSkeleton

`anime-card-skeleton/`: `AnimeCardSkeleton` (mesmo aspect-ratio do card, blocos `Skeleton`, wrapper com `aria-busy="true"` e `aria-hidden` no conteúdo decorativo). `AnimeGridSkeleton({count=12})` reusa `AnimeGrid` + N skeletons. Spec: renderiza `count` skeletons; `aria-busy` presente. Story: grid de loading. Commit `feat: add anime loading skeletons`.

---

## Wave 4 — Layout & estados

### Task 13: Container

API: `children`. `div` `mx-auto w-full max-w-6xl px-4`. Spec: render. Story: dentro de um fundo. Commit `feat: add Container component`.

### Task 14: Header + Footer

`header/`: `Header` = `<header className="bg-brand">` + `Container` + `Logo` (slot `children?` p/ futura nav). `footer/`: `Footer` = `<footer className="bg-brand text-white/80">` + `Container` + `Logo` + copyright. Specs: render do Logo; `banner`/`contentinfo` roles; axe. Stories. Commit `feat: add Header and Footer`.

### Task 15: StatusState

API: `icon: ReactNode`, `title: string`, `message?: string`, `action?: ReactNode`. Layout centralizado (ícone grande, título, mensagem, ação). Spec: render de title/message/action; axe. Stories: **Empty** (lucide `SearchX`, "Nada encontrado") e **Error** (lucide `ServerCrash`, "Erro ao carregar", action=Button "Tentar de novo"). Commit `feat: add StatusState for empty and error`.

---

## Wave 5 — Fechamento

### Task 16: Barrel, catálogo e verificação

- [ ] **Step 1:** Garantir que `libs/ui/src/index.ts` exporta **todos** os componentes (Button, Chip, AnimeRating, Input, Skeleton, Logo, AnimeCard, AnimeGrid, FormatFilter, SearchBar, AnimeCardSkeleton, AnimeGridSkeleton, Container, Header, Footer, StatusState) + tipos de props públicos.
- [ ] **Step 2:** `pnpm exec nx build-storybook ui` → catálogo builda com todas as stories.
- [ ] **Step 3:** `pnpm exec nx run-many -t lint test typecheck build` → tudo verde (axe sem violações nos componentes-chave).
- [ ] **Step 4:** Atualizar `README.md` com uma linha sobre o DS + como rodar o Storybook (`pnpm exec nx storybook ui`).
- [ ] **Step 5:** Commit `docs: document design system and storybook usage`.

---

## Definition of Done

- [ ] Storybook roda (`nx storybook ui`) e builda (`nx build-storybook ui`) com Tailwind aplicado.
- [ ] 16 componentes implementados, exportados pelo barrel, cada um com story + spec.
- [ ] `AnimeRating` passa axe nas 3 faixas; contraste conforme spec §4.2.
- [ ] `Button` cobre solid/outline/active × md/lg × com/sem ícone (stories + specs).
- [ ] vitest-axe sem violações nos componentes-chave (Button, Chip, AnimeRating, Input, AnimeCard, FormatFilter, SearchBar, StatusState).
- [ ] Boundaries intactas: `ui` não importa `data-access`; `AnimeCard` usa `Anime` de `shared-types`.
- [ ] Tokens em fonte única (`theme.css`); `global.css` sem os placeholders antigos.
- [ ] `nx run-many -t lint test typecheck build` verde.
