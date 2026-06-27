---
name: new-component
description: Use when creating a new UI component in libs/ui for buscanime. Scaffolds the 3-file contract (component, spec with a11y test, story) in the correct abstraction layer and wires up the barrel export.
---

# New Component

## Overview

Creates a new component in `libs/ui` following the project contract: 3 files in
the right layer + barrel export. Full conventions in `libs/ui/AGENTS.md`.

**Principle:** every component is born complete — `.tsx` + `.spec.tsx` (with an
a11y test) + `.stories.tsx` + export in `src/index.ts`. No CSS modules.

## Required info

If the user didn't say, ask:

1. **Name** — kebab-case (e.g. `anime-badge`, `rating-stars`).
2. **Layer:**
   - `primitives` — base block, no anime domain (Button, Chip, Input).
   - `composites` — primitives + domain (AnimeCard, Breadcrumb).
   - `layout` — page structure (Container, Header, Footer).
     If it would import from `@buscanime/anime-data-access`, it's in the wrong lib
     (it belongs in the app).

`PascalName` = name in PascalCase. Capitalized `Layer` = `Primitives`/`Composites`/`Layout`.

## Sequence

### Step 1 — Create the folder and the 3 files

In `libs/ui/src/lib/<layer>/<name>/`:

`<name>.tsx`

```tsx
import { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const <name-camelCase> = cva('', {
  variants: { tone: { brand: 'bg-brand text-white', accent: 'bg-accent text-ink' } },
  defaultVariants: { tone: 'brand' },
});

export interface <PascalName>Props
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof <name-camelCase>> {}

export function <PascalName>({ tone, className, ...props }: <PascalName>Props) {
  return <div className={cn(<name-camelCase>({ tone }), className)} {...props} />;
}
```

> Color only via token (`bg-brand`, `text-accent`, `text-ink`) — raw color breaks lint.
> No variants needed? Drop the CVA and use `cn('...', className)` directly.
> Component that takes a `ref` → `forwardRef` (see `primitives/button/button.tsx`).

`<name>.spec.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { it, expect, describe } from 'vitest';
import { <PascalName> } from './<name>';

describe('<PascalName>', () => {
  it('renders', () => {
    render(<<PascalName>>content</<PascalName>>);
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = render(<<PascalName>>content</<PascalName>>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

`<name>.stories.tsx`

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { <PascalName> } from './<name>';

const meta: Meta<typeof <PascalName>> = {
  title: '<Layer>/<PascalName>',  // mirrors the folder layer
  component: <PascalName>,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof <PascalName>>;

export const Default: Story = { args: { children: 'content' } };
```

### Step 2 — Export from the barrel

Add to `libs/ui/src/index.ts`, under the layer section (`// primitives`,
`// composites` or `// layout`):

```ts
export * from './lib/<layer>/<name>/<name>';
```

### Step 3 — Verify

```bash
pnpm nx lint ui
pnpm nx test ui
```

Both must pass (lint covers color/boundary; test includes the axe check). Report
the result and the paths of the created files.
