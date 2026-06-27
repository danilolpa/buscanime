# Rate-limit (429) + redesign dos blank states — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) ou superpowers:executing-plans pra implementar task-by-task. Os passos usam checkbox (`- [ ]`). Cada implementer DEVE usar superpowers:test-driven-development. **Anti-over-engineering:** implemente só o que a task pede — nada de abstrações, flags ou "while I'm here". Sem mudar config de build/tsconfig/vitest.

**Goal:** Tratar o 429 (rate limit) da AniList com um blank state próprio ("aguarde um pouco", distinto do erro de servidor) e repaginar os três blank states com cor por tipo, tipografia maior e animação de entrada suave.

**Architecture:** Três camadas isoladas — (1) `anime-data-access` detecta o 429 (`isRateLimitError`); (2) o `QueryClient` do app pula o retry no 429; (3) `StatusState` (libs/ui) ganha `tone` + animação, e `AnimeBrowser` ramifica o erro entre 429 (warning) e genérico (danger).

**Tech Stack:** Next.js 16 (App Router), React 19, TanStack Query v5, graphql-request, Tailwind v4, lucide-react, Vitest + Testing Library + MSW v2 + vitest-axe. Monorepo Nx + pnpm.

**Notas de ambiente (importantes):**

- `anime-data-access` é consumido do **dist** (`main: ./dist/index.js`, gitignored) — o app em runtime só enxerga mudanças após `pnpm exec nx build anime-data-access`. Os **testes** resolvem o **src** (condição `source`), então `nx test` vê o src sem rebuild. (memória _anime-data-access-dist-consumed_)
- `ui` é consumido do **source** (`main: ./src/index.ts`) — `StatusState`/`theme.css` são pegos direto, **sem rebuild**.
- Projetos Nx: `anime-data-access`, `ui`, `web`. Comando de teste: `pnpm exec nx test <projeto>`.
- Pre-commit (husky) roda lint-staged + `nx affected -t test`. Commitar só no verde. `git add` arquivos específicos (nunca `-A`).

---

### Task 1: `isRateLimitError` (detecção do 429) — `anime-data-access`

**Files:**

- Create: `libs/anime/data-access/src/lib/anilist-error.ts`
- Create: `libs/anime/data-access/src/lib/anilist-error.spec.ts`
- Modify: `libs/anime/data-access/src/index.ts`

- [ ] **Step 1: Escrever o teste que falha**

`libs/anime/data-access/src/lib/anilist-error.spec.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { isRateLimitError } from './anilist-error.js';

describe('isRateLimitError', () => {
  it('true para ClientError com response.status 429', () => {
    expect(isRateLimitError({ response: { status: 429 } })).toBe(true);
  });

  it('false para outros status (500)', () => {
    expect(isRateLimitError({ response: { status: 500 } })).toBe(false);
  });

  it('false para Error comum (rede)', () => {
    expect(isRateLimitError(new Error('network down'))).toBe(false);
  });

  it('false para undefined e null', () => {
    expect(isRateLimitError(undefined)).toBe(false);
    expect(isRateLimitError(null)).toBe(false);
  });

  it('false quando response não tem status 429', () => {
    expect(isRateLimitError({ response: null })).toBe(false);
    expect(isRateLimitError({ response: {} })).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec nx test anime-data-access`
Expected: FAIL — `isRateLimitError` não existe (módulo `./anilist-error.js` não encontrado).

- [ ] **Step 3: Implementar**

`libs/anime/data-access/src/lib/anilist-error.ts`:

```ts
/**
 * Detecta o 429 (rate limit) da AniList. graphql-request lança `ClientError`
 * em respostas não-2xx, expondo o status HTTP em `error.response.status`.
 * Usamos duck-typing (em vez de `instanceof ClientError`) pra não depender da
 * identidade da classe através do boundary dist/src.
 */
export function isRateLimitError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const response = (error as { response?: unknown }).response;
  if (typeof response !== 'object' || response === null) return false;
  return (response as { status?: unknown }).status === 429;
}
```

Em `libs/anime/data-access/src/index.ts`, adicionar (mantendo as linhas existentes):

```ts
export * from './lib/anilist-error.js';
```

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm exec nx test anime-data-access`
Expected: PASS (todos os testes do projeto verdes, incluindo os 5 novos).

- [ ] **Step 5: Rebuild do dist (pro app/runtime enxergar o novo export)**

Run: `pnpm exec nx build anime-data-access`
Expected: build OK. (O `dist/` é gitignored — não entra no commit; é só pro runtime.)

- [ ] **Step 6: Commit**

```bash
git add libs/anime/data-access/src/lib/anilist-error.ts libs/anime/data-access/src/lib/anilist-error.spec.ts libs/anime/data-access/src/index.ts
git commit -m "feat: detect AniList 429 rate-limit errors"
```

---

### Task 2: Pular retry no 429 — `QueryClient` do app

**Files:**

- Modify: `apps/web/src/app/providers.tsx`

**Sem teste novo:** o `Providers` não tem harness de teste e o wiring é trivial (uma linha). O comportamento fica coberto por (a) o unit de `isRateLimitError` (Task 1) e (b) o teste de integração do 429 (Task 4). Verificação aqui = typecheck + suite do `web` no verde.

- [ ] **Step 1: Implementar**

Substituir o conteúdo de `apps/web/src/app/providers.tsx` por:

```tsx
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { isRateLimitError } from 'anime-data-access';

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Não re-tenta no 429 (rate limit): mostra o estado na hora e não
            // gera carga extra na API. Demais erros mantêm o padrão (3).
            retry: (failureCount, error) => !isRateLimitError(error) && failureCount < 3,
          },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

- [ ] **Step 2: Rodar a suite do app (regressão + resolve o import do src)**

Run: `pnpm exec nx test web`
Expected: PASS — todos os testes existentes seguem verdes (os wrappers de teste usam `retry: false`, então não mudam de comportamento).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/providers.tsx
git commit -m "feat: skip query retries on AniList 429"
```

---

### Task 3: `StatusState` repaginado (tone + animação) — `ui`

**Files:**

- Modify: `libs/ui/src/lib/status-state/status-state.tsx`
- Modify: `libs/ui/src/styles/theme.css`
- Modify (estender): `libs/ui/src/lib/status-state/status-state.spec.tsx`

- [ ] **Step 1: Escrever os testes novos que falham**

Adicionar ao final do `describe('StatusState', …)` em `libs/ui/src/lib/status-state/status-state.spec.tsx` (manter os testes existentes; `render`, `screen`, `axe`, `SearchX`, `StatusState` já estão importados):

```tsx
it('usa o tone neutral por padrão', () => {
  const { container } = render(<StatusState icon={<SearchX />} title="Nada encontrado" />);
  const circle = container.querySelector('[aria-hidden="true"]');
  expect(circle).toHaveClass('bg-ink/5', 'text-ink/40');
});

it('aplica as classes do tone danger no círculo do ícone', () => {
  const { container } = render(<StatusState tone="danger" icon={<SearchX />} title="Erro" />);
  const circle = container.querySelector('[aria-hidden="true"]');
  expect(circle).toHaveClass('bg-red-100', 'text-red-600');
});

it('aplica as classes do tone warning no círculo do ícone', () => {
  const { container } = render(<StatusState tone="warning" icon={<SearchX />} title="Muitas buscas" />);
  const circle = container.querySelector('[aria-hidden="true"]');
  expect(circle).toHaveClass('bg-amber-100', 'text-amber-600');
});

it('aplica a animação de entrada sob motion-safe', () => {
  const { container } = render(<StatusState icon={<SearchX />} title="x" />);
  expect(container.firstChild).toHaveClass('motion-safe:animate-status-in');
});

it('sem violações de a11y no tone danger com action', async () => {
  const { container } = render(<StatusState tone="danger" icon={<SearchX />} title="Erro ao carregar" message="Algo deu errado ao buscar os animes." action={<button>Tentar de novo</button>} />);
  expect(await axe(container)).toHaveNoViolations();
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec nx test ui`
Expected: FAIL — o círculo não tem `bg-red-100`/`bg-amber-100`/`bg-ink/5` nem a classe `motion-safe:animate-status-in` (o componente atual não tem `tone` nem círculo colorido).

- [ ] **Step 3: Implementar o componente**

Substituir `libs/ui/src/lib/status-state/status-state.tsx` por:

```tsx
import { type ReactNode } from 'react';
import { cn } from '../utils/cn';

export type StatusTone = 'neutral' | 'danger' | 'warning';

export interface StatusStateProps {
  icon: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
  tone?: StatusTone;
}

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: 'bg-ink/5 text-ink/40',
  danger: 'bg-red-100 text-red-600',
  warning: 'bg-amber-100 text-amber-600',
};

export function StatusState({ icon, title, message, action, tone = 'neutral' }: StatusStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-20 text-center motion-safe:animate-status-in">
      <div className={cn('flex h-20 w-20 items-center justify-center rounded-full [&_svg]:h-9 [&_svg]:w-9', TONE_CLASSES[tone])} aria-hidden="true">
        {icon}
      </div>
      <h2 className="text-2xl font-bold text-ink">{title}</h2>
      {message && <p className="max-w-md text-base text-ink/60">{message}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
```

- [ ] **Step 4: Registrar a animação no theme**

Substituir `libs/ui/src/styles/theme.css` por:

```css
@import 'tailwindcss';
@source '../**/*.{ts,tsx}';

@theme {
  --color-brand: #6d28d9; /* violet-700 */
  --color-accent: #fde047; /* yellow-300 */
  --color-ink: #1a1a1a;

  --animate-status-in: status-in 0.3s ease-out;
}

@keyframes status-in {
  from {
    opacity: 0;
    transform: translateY(0.5rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

> Padrão Tailwind v4: o token `--animate-status-in` em `@theme` gera o utilitário `animate-status-in`; o `@keyframes` fica no top-level. Se por algum motivo o utilitário não for gerado, o fallback é `@utility animate-status-in { animation: status-in 0.3s ease-out; }` — verificar no browser na Task 5.

- [ ] **Step 5: Rodar e ver passar**

Run: `pnpm exec nx test ui`
Expected: PASS — os novos testes + os existentes verdes.

- [ ] **Step 6: Commit**

```bash
git add libs/ui/src/lib/status-state/status-state.tsx libs/ui/src/styles/theme.css libs/ui/src/lib/status-state/status-state.spec.tsx
git commit -m "feat: restyle blank states with tone colors and entrance animation"
```

---

### Task 4: Wiring no `AnimeBrowser` (429 → warning, demais → danger) — `web`

**Files:**

- Modify: `apps/web/src/app/(home)/anime-browser.tsx`
- Modify (estender): `apps/web/src/app/(home)/anime-browser.spec.tsx`

- [ ] **Step 1: Escrever o teste que falha**

Adicionar dentro do `describe('AnimeBrowser', …)` em `apps/web/src/app/(home)/anime-browser.spec.tsx` (o `server`, `graphql`, `HttpResponse`, `wrapper`, `TEST_ENDPOINT` já existem):

```tsx
it('mostra o estado de rate limit (429) com botão "Tentar de novo"', async () => {
  server.use(graphql.query('AnimeList', () => HttpResponse.json({ errors: [{ message: 'Too Many Requests' }] }, { status: 429 })));
  render(<AnimeBrowser endpoint={TEST_ENDPOINT} />, { wrapper });
  expect(await screen.findByText('Muitas buscas')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /tentar de novo/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec nx test web`
Expected: FAIL — hoje o 429 cai no estado genérico "Erro ao carregar"; o teste não acha "Muitas buscas".

- [ ] **Step 3: Implementar**

Em `apps/web/src/app/(home)/anime-browser.tsx`:

3a. Atualizar o import do lucide (adicionar `Hourglass`):

```tsx
import { Hourglass, Plus, SearchX, ServerCrash } from 'lucide-react';
```

3b. Atualizar o import do data-access (adicionar `isRateLimitError`):

```tsx
import { useAnimeList, useAnimeFormatCounts, isRateLimitError } from 'anime-data-access';
```

3c. Substituir o bloco de branches (de `query.isLoading ? (` até o fechamento antes da grade) por:

```tsx
          {query.isLoading ? (
            <AnimeGridSkeleton count={12} />
          ) : query.isError ? (
            isRateLimitError(query.error) ? (
              <StatusState
                tone="warning"
                icon={<Hourglass />}
                title="Muitas buscas"
                message="Você fez muitas buscas em pouco tempo. Aguarde alguns segundos e tente de novo."
                action={
                  <Button onClick={() => query.refetch()}>Tentar de novo</Button>
                }
              />
            ) : (
              <StatusState
                tone="danger"
                icon={<ServerCrash />}
                title="Erro ao carregar"
                message="Algo deu errado ao buscar os animes."
                action={
                  <Button onClick={() => query.refetch()}>Tentar de novo</Button>
                }
              />
            )
          ) : animes.length === 0 ? (
            <StatusState
              tone="neutral"
              icon={<SearchX />}
              title="Nada encontrado"
              message="Tente outro filtro ou outra busca."
            />
          ) : (
```

> `query.refetch()` continua funcionando sob a política de não-retry: `retry` governa só re-tentativas automáticas, não o refetch manual do botão.

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm exec nx test web`
Expected: PASS — o novo teste do 429 + todos os existentes (incl. o de 500 → "Erro ao carregar") verdes.

- [ ] **Step 5: Commit**

```bash
git add "apps/web/src/app/(home)/anime-browser.tsx" "apps/web/src/app/(home)/anime-browser.spec.tsx"
git commit -m "feat: show dedicated rate-limit state on 429"
```

---

### Task 5: Verificação final (suite completa + browser)

**Files:** nenhum (verificação; o rebuild do dist é artefato de runtime, gitignored — sem commit).

- [ ] **Step 1: Garantir o dist do data-access atualizado**

Run: `pnpm exec nx build anime-data-access`
Expected: build OK (já feito na Task 1; reconfirmar caso o src tenha mudado depois).

- [ ] **Step 2: Suite completa + lint**

Run: `pnpm exec nx run-many -t test lint -p anime-data-access ui web`
Expected: tudo verde.

- [ ] **Step 3: Smoke no browser real** (a animação/contraste não aparecem em teste mockado)

Subir o dev (`pnpm exec nx dev web`) e conferir em `http://localhost:3000`:

- **Nada encontrado** (`/?q=zzqxwvnoresult123`): ícone em círculo neutro, título maior, animação de entrada ao aparecer.
- **Erro de servidor**: círculo vermelho + botão (forçar temporariamente `route.ts` a retornar `{ status: 500 }`, conferir, e **reverter**).
- **429**: forçar temporariamente `route.ts` a retornar `{ status: 429 }` → conferir "Muitas buscas" (círculo âmbar) + botão; **reverter**.
- **Reduced motion**: com `prefers-reduced-motion: reduce` (DevTools → Rendering), a animação não roda.

- [ ] **Step 4: Sem mudanças pendentes não-intencionais**

Run: `git status --short`
Expected: limpo (só artefatos gitignored, se houver). Reverter qualquer edição temporária do `route.ts`.

---

## Resumo dos arquivos

| Arquivo                                                | Ação   | Responsabilidade                      |
| ------------------------------------------------------ | ------ | ------------------------------------- |
| `libs/anime/data-access/src/lib/anilist-error.ts`      | criar  | `isRateLimitError` (detecção do 429)  |
| `libs/anime/data-access/src/lib/anilist-error.spec.ts` | criar  | unit do detector                      |
| `libs/anime/data-access/src/index.ts`                  | editar | exportar o detector                   |
| `apps/web/src/app/providers.tsx`                       | editar | `QueryClient` pula retry no 429       |
| `libs/ui/src/lib/status-state/status-state.tsx`        | editar | prop `tone` + layout + animação       |
| `libs/ui/src/styles/theme.css`                         | editar | keyframe/token `status-in`            |
| `libs/ui/src/lib/status-state/status-state.spec.tsx`   | editar | testes de tone/animação/axe           |
| `apps/web/src/app/(home)/anime-browser.tsx`            | editar | branch 429 (warning) vs danger; tones |
| `apps/web/src/app/(home)/anime-browser.spec.tsx`       | editar | teste de integração do 429            |
