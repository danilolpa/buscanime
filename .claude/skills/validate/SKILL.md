---
name: validate
description: Use when the user wants to validate the buscanime project before pushing or deploying — runs lint, typecheck, tests, build and format check in sequence and reports each step. Does not bump version or push.
---

# Validate

## Overview

Runs buscanime's "ready for production" gate, in order, reporting each step.
Does **not** commit, bump version or push — it only validates.

**Principle:** run the whole sequence without asking the user to pick steps.
Stop and report as soon as a step fails (error, not warning). Report each step
with a one-line status before moving on: `✅ Step 1: format ok`,
`❌ Step 2: lint failed`, etc.

## Sequence

### Step 1 — Formatting

```bash
pnpm nx format:check
```

If it fails: run `pnpm nx format:write`, report the adjusted files and continue
(the user commits later). Don't leave formatting pending if the goal is a push.

### Step 2 — Lint + typecheck + tests (affected)

```bash
pnpm nx affected -t lint typecheck test --base=origin/main --head=HEAD
```

- `lint` covers off-token raw color and module-boundary violations.
- `test` includes accessibility tests (vitest-axe).
- Any error → stop and report the output. Warnings are acceptable.

To validate the whole repo (not just affected), swap `affected` for
`run-many --all`.

### Step 3 — App build

```bash
pnpm nx build web
```

Broken build = do not ship.

## Final report

```
Validate
────────
✅ Formatting clean
✅ Lint + typecheck + test (affected)
✅ Build web

Ready to ship.
```

If something failed, list the step, the project and the first lines of the
error — do not declare "ready".
