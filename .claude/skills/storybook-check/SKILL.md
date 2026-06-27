---
name: storybook-check
description: Use when the user wants to verify that every component in libs/ui (primitives, composites, layout) has a Storybook story, or to run the Storybook build to catch rendering errors.
---

# Storybook Check

## Overview

Ensures every component in `libs/ui/src/lib/{primitives,composites,layout}` has a
`.stories.tsx`. Components without a story are invisible in review and prone to
silent regressions.

**Principle:** every public component needs at least one story, with a `title`
mirroring the folder layer (`Primitives/*`, `Composites/*`, `Layout/*`).

## Sequence

### Step 1 — Components missing a story

```bash
for dir in libs/ui/src/lib/{primitives,composites,layout}/*/; do
  name=$(basename "$dir")
  if ! ls "$dir"*.stories.tsx >/dev/null 2>&1; then
    echo "MISSING story: $dir"
  fi
done
```

### Step 2 — Stories without a named export

A story needs `export default meta` + at least one named export:

```bash
rg -L 'export const' libs/ui/src/lib/**/*.stories.tsx
```

### Step 3 — Title outside the taxonomy

The `title` must start with the folder layer:

```bash
rg -n "title:\s*'" libs/ui/src/lib/primitives/**/*.stories.tsx | rg -v "'Primitives/"
rg -n "title:\s*'" libs/ui/src/lib/composites/**/*.stories.tsx | rg -v "'Composites/"
rg -n "title:\s*'" libs/ui/src/lib/layout/**/*.stories.tsx     | rg -v "'Layout/"
```

Any match = title doesn't match the layer → fix it.

### Step 4 — Storybook build (optional, only if asked)

Slow; run only if the user asks. Catches rendering errors:

```bash
pnpm nx build-storybook ui
```

## Report

```
Storybook Check
───────────────
✅ With story: <n>
❌ Missing story (<n>):
   libs/ui/src/lib/composites/<x>/
⚠️  Title outside taxonomy (<n>):
   libs/ui/src/lib/primitives/<y>/<y>.stories.tsx
```

If all good: `✅ Every component has a story in the correct taxonomy.`
