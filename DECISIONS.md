# Architecture Decisions

## Framework

**Next.js 16 (App Router)** — chosen for server-side rendering and App Router support.

## Test Runner

**Vitest** — replaces Jest as the unit test runner across all projects. Configuration via `@nx/vitest:test` executor.

## Package Manager

**pnpm** — sole package manager for the monorepo. Single `pnpm-lock.yaml` lockfile.
