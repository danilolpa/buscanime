# libs/ui — component library (`ui`)

Pure presentation components. **No data-fetching, no business logic, no import
of `data-access`.** Everything comes via props. (Boundary is lint-enforced.)

## 3-layer architecture

- `src/lib/primitives/` — base blocks, no domain (Button, Chip, Input, Skeleton,
  Logo, AnimeRating). Variants via CVA.
- `src/lib/composites/` — primitives + anime domain (AnimeCard, AnimeHero,
  SearchBar, Breadcrumb, AnimeGrid, TagList, StatList, etc.).
- `src/lib/layout/` — page structure (Container, Header, Footer).
- `src/lib/utils/cn.ts` — class merge (`clsx` + `tailwind-merge`).
- `src/styles/theme.css` — theme tokens (`@theme`) and keyframes.

Pick the right layer: a component that would need to import `data-access` lives
in the app, not here. Composites use primitives; a primitive knows no domain.

## Contract: every new component MUST have

A `kebab-case/` folder in the right layer, with 3 files:

```
composites/anime-badge/
  anime-badge.tsx          # component
  anime-badge.spec.tsx     # tests (Vitest) — ALWAYS includes an a11y test (axe)
  anime-badge.stories.tsx  # Storybook (CSF3, autodocs)
```

Plus a named export in `src/index.ts`, under the layer section
(`// primitives` / `// composites` / `// layout`).

**No CSS modules.** Styling = Tailwind classes + `cn()`. Variants = CVA.

## Colors — semantic tokens only

Raw Tailwind color (`bg-purple-700`, `text-red-500`) **breaks lint**.
Novo token? Adicione em `src/styles/theme.css` antes de usar — não improvise.

| Token                                 | Valor             | Quando usar                                      |
| ------------------------------------- | ----------------- | ------------------------------------------------ |
| `bg-brand` / `text-brand`             | #6d28d9           | Cor principal da marca                           |
| `bg-accent` / `text-accent`           | #fde047           | Destaque / CTA                                   |
| `text-ink`                            | #1a1a1a           | Texto primário — títulos, corpo                  |
| `text-ink-muted`                      | #525252           | Texto secundário — subtítulos, labels, meta info |
| `text-ink-subtle`                     | #737373           | Texto terciário — hints, placeholders            |
| `bg-surface`                          | #ffffff           | Fundo de superfície — cards, inputs              |
| `border-border`                       | #e5e5e5           | Bordas e divisores sutis                         |
| `text-on-brand`                       | #ffffff           | Texto/ícone sobre `bg-brand` (botão, chip…)      |
| `text-on-media`                       | #ffffff           | Texto/overlay sobre imagens (título do card)     |
| `bg-scrim` / `from-scrim`             | #000000           | Escurecimento sobre mídia — gradientes, skeleton |
| `text-danger` / `bg-danger-surface`   | #dc2626 / #fee2e2 | Estado de erro (StatusState)                     |
| `text-warning` / `bg-warning-surface` | #d97706 / #fef3c7 | Estado de alerta / rate limit                    |
| `bg-score-low/mid/high`               | rose/yellow/teal  | Faixas de nota do anime (AnimeRating)            |
| `text-on-score`                       | #ffffff           | Texto sobre `score-low` / `score-high`           |

Opacity modifiers (`text-ink/60`) são permitidos pelo linter mas **evite** —
em fundos coloridos o valor mistura com o fundo e fica imprevisível.
Prefira tokens nomeados com valor sólido.

## Expected skeletons (copy these patterns)

```tsx
// anime-badge.tsx — primitive with CVA
import { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badge = cva('inline-flex items-center rounded-sm px-1.5 py-0.5 text-xs font-semibold', {
  variants: { tone: { brand: 'bg-brand text-white', accent: 'bg-accent text-ink' } },
  defaultVariants: { tone: 'brand' },
});

export interface AnimeBadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badge> {}

export function AnimeBadge({ tone, className, ...props }: AnimeBadgeProps) {
  return <span className={cn(badge({ tone }), className)} {...props} />;
}
```

```tsx
// anime-badge.spec.tsx — last test is always a11y
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { it, expect, describe } from 'vitest';
import { AnimeBadge } from './anime-badge';

describe('AnimeBadge', () => {
  it('renders its content', () => {
    render(<AnimeBadge>New</AnimeBadge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = render(<AnimeBadge>New</AnimeBadge>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

```tsx
// anime-badge.stories.tsx — CSF3, import from @storybook/react-vite
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AnimeBadge } from './anime-badge';

const meta: Meta<typeof AnimeBadge> = {
  title: 'Composites/AnimeBadge', // Primitives/… for primitives, Layout/… for layout
  component: AnimeBadge,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof AnimeBadge>;

export const Default: Story = { args: { children: 'New' } };
```

## Conventions

- **Story title mirrors the folder layer** — filesystem and Storybook are one
  mental model: `Primitives/*` for `primitives/`, `Composites/*` for
  `composites/`, `Layout/*` for `layout/`. Moving a component across layers =
  move the folder AND update the `title`.
- Components that take a `ref` use `forwardRef` (see `Button`).
- Export CVA variants when useful externally: `export { badge as badgeVariants }`.
- Always spread `...props` and merge `className` last via `cn(..., className)`.
- Icons: `lucide-react`, marked `aria-hidden="true"` when decorative.
- **Imagens: use `next/image`**, nunca `<img>` cru (otimização + LCP — ver
  `apps/web/AGENTS.md`). Como esta lib roda no Storybook (Vite, sem runtime do
  Next), `next/image` é aliasado para um stub `<img>` em
  `.storybook/main.ts` (`viteFinal`) → `.storybook/next-image-stub.tsx`. Use
  `fill`+`sizes` para imagem que preenche o container e `priority` para imagem
  acima da dobra. Stories renderizam via stub — não precisam de config extra.

## Before committing UI changes

- `pnpm nx test ui` · `pnpm nx lint ui` (lint already blocks off-token raw color)
- Confirm a new component has `.spec.tsx` (with axe test) and `.stories.tsx`,
  and is exported in `src/index.ts`. Skills: `new-component`, `storybook-check`.
