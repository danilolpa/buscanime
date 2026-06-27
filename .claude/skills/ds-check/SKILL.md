---
name: ds-check
description: Use when the user wants to audit the buscanime codebase for design system violations the linter does not catch — raw HTML elements that should be UI components, internal-path imports of the UI lib, and stray hex colors.
---

# DS Check

## Overview

Audits `libs/ui/src` and `apps/web/src` for design-system violations ESLint
does **not** catch. (Raw Tailwind color and module boundaries are already lint
errors — see `eslint.config.mjs`; this covers the rest.)

**Principle:** report only — never auto-fix. Show file + line for each violation
so the user decides with context. If a case is intentional, the dev can mark it
with `{/* ds-ok */}` on the same line to suppress it.

## Sequence

### Step 1 — Raw HTML that should be a DS component

Native elements that have an equivalent in `@buscanime/ui`:

```bash
# <button> → use <Button>
rg -n '<button' apps/web/src libs/ui/src -g '*.tsx' | rg -v 'ds-ok'

# <input> → use <Input>
rg -n '<input' apps/web/src libs/ui/src -g '*.tsx' | rg -v 'ds-ok'
```

> Matches **inside `libs/ui`** may be legitimate (it's where the base component
> is defined). Focus on `apps/web/src` and composites that should reuse primitives.

### Step 2 — Internal-path import of the UI lib

Consumers must import from the barrel (`@buscanime/ui`), never a subpath:

```bash
rg -n "from '@buscanime/ui/" apps/web/src libs/ui/src -g '*.{ts,tsx}'
rg -n "from '\.\./.*/(primitives|composites|layout)/" apps/web/src -g '*.{ts,tsx}'
```

Any match here is a violation → switch to `import { X } from '@buscanime/ui'`.

### Step 3 — Stray hex (color outside a token)

```bash
rg -n '#[0-9a-fA-F]{3,8}\b' apps/web/src libs/ui/src -g '*.{ts,tsx}' | rg -v 'ds-ok'
```

A color literal should become a semantic token in `libs/ui/src/styles/theme.css`
(`--color-brand`, `--color-accent`, `--color-ink`) and be used as a class
(`bg-brand`, etc.). Ignore hex in config/non-styling SVG files. Third-party brand
colors (e.g. streaming services) and dynamic colors from the API are legitimate —
mark them `ds-ok`.

### Step 4 — Confirm the color lint is active

```bash
pnpm nx lint ui --skip-nx-cache 2>&1 | rg -i 'raw Tailwind' || echo 'color lint clean'
```

## Report

```
DS Check
────────
Step 1 — raw HTML:        <n> hits
Step 2 — internal import: <n>
Step 3 — stray hex:       <n>

Detail:
  apps/web/src/app/.../foo.tsx:42  <button>  → use <Button>
  ...
```

If everything is clean: `✅ No design-system violations found.`
