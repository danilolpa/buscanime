import type { Page } from '@playwright/test';
import { test, expect } from './fixtures/test';

const RESULTS_TIMEOUT = 15_000;

function loadedCards(page: Page) {
  return page.locator('article:not([aria-busy="true"])');
}

async function expectGridLoaded(page: Page) {
  await expect(loadedCards(page).first()).toBeVisible({
    timeout: RESULTS_TIMEOUT,
  });
}

async function submitSearch(page: Page, term: string) {
  const searchbox = page.getByRole('searchbox', { name: 'Buscar anime' });
  await searchbox.click();
  await searchbox.fill('');
  await searchbox.pressSequentially(term);
  const submit = page.getByRole('button', { name: 'Buscar' });
  await expect(submit).toBeEnabled();
  await submit.click();
}

test('carrega, filtra e busca animes', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('banner')).toBeVisible();
  await expectGridLoaded(page);

  await page.getByRole('link', { name: 'TV Show' }).click();
  await expect(page).toHaveURL(/format=TV/);

  await submitSearch(page, 'naruto');
  await expect(page).toHaveURL(/q=naruto/);
  await expectGridLoaded(page);
});

test('restaura filtro e busca a partir da URL (deep link)', async ({
  page,
}) => {
  await page.goto('/?format=TV&q=naruto');

  await expect(page).toHaveURL(/format=TV/);
  await expect(page).toHaveURL(/q=naruto/);
  await expect(page.getByRole('link', { name: 'TV Show' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(
    page.getByRole('searchbox', { name: 'Buscar anime' }),
  ).toHaveValue('naruto');
  await expectGridLoaded(page);
});

test('"Ver mais" carrega a próxima página de resultados', async ({ page }) => {
  await page.goto('/');

  await expectGridLoaded(page);
  // Aguarda hidratação estabilizar (SSR pode renderizar cards reais antes do mock client-side).
  await expect(loadedCards(page)).toHaveCount(1, { timeout: RESULTS_TIMEOUT });
  const initialCount = await loadedCards(page).count();

  const loadMore = page.getByRole('button', { name: 'Ver mais' });
  await expect(loadMore).toBeVisible({ timeout: RESULTS_TIMEOUT });
  await loadMore.click();

  await expect
    .poll(async () => loadedCards(page).count())
    .toBeGreaterThan(initialCount);
});

test('limpar busca remove o termo da URL e volta à lista', async ({ page }) => {
  await page.goto('/');

  await expectGridLoaded(page);
  await submitSearch(page, 'naruto');
  await expect(page).toHaveURL(/q=naruto/);
  await expectGridLoaded(page);

  await page.getByRole('link', { name: 'Limpar busca' }).click();
  await expect(page).not.toHaveURL(/q=/);
  await expect(
    page.getByRole('searchbox', { name: 'Buscar anime' }),
  ).toHaveValue('');
  await expect(
    page.getByRole('link', { name: 'Limpar busca' }),
  ).not.toBeVisible();
  await expectGridLoaded(page);
});

test('busca sem resultados mostra estado vazio', async ({ page }) => {
  await page.goto('/');

  await expectGridLoaded(page);
  await submitSearch(page, 'zzzznonexistentanime999888777');

  await expect(
    page.getByRole('heading', { name: 'Nada encontrado' }),
  ).toBeVisible({ timeout: RESULTS_TIMEOUT });
  await expect(loadedCards(page)).toHaveCount(0);
});
