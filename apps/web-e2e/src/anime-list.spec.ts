import { test, expect, type Page } from '@playwright/test';

const RESULTS_TIMEOUT = 15_000;

async function expectGridLoaded(page: Page) {
  await expect(page.getByRole('article').first()).toBeVisible({
    timeout: RESULTS_TIMEOUT,
  });
}

test('carrega, filtra e busca animes', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('banner')).toBeVisible();
  await expectGridLoaded(page);

  await page.getByRole('button', { name: 'TV Show' }).click();
  await expect(page).toHaveURL(/format=TV/);

  await page.getByRole('searchbox', { name: 'Buscar anime' }).fill('naruto');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page).toHaveURL(/q=naruto/);
  await expectGridLoaded(page);
});

test('restaura filtro e busca a partir da URL (deep link)', async ({
  page,
}) => {
  await page.goto('/?format=TV&q=naruto');

  await expect(page).toHaveURL(/format=TV/);
  await expect(page).toHaveURL(/q=naruto/);
  await expect(page.getByRole('button', { name: 'TV Show' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(
    page.getByRole('searchbox', { name: 'Buscar anime' }),
  ).toHaveValue('naruto');
  await expectGridLoaded(page);
});

test('"Ver mais" carrega a próxima página de resultados', async ({ page }) => {
  await page.goto('/');

  await expectGridLoaded(page);
  const initialCount = await page.getByRole('article').count();

  const loadMore = page.getByRole('button', { name: 'Ver mais' });
  await expect(loadMore).toBeVisible({ timeout: RESULTS_TIMEOUT });
  await loadMore.click();

  await expect
    .poll(async () => page.getByRole('article').count())
    .toBeGreaterThan(initialCount);
});

test('limpar busca remove o termo da URL e volta à lista', async ({ page }) => {
  await page.goto('/');

  await expectGridLoaded(page);
  await page.getByRole('searchbox', { name: 'Buscar anime' }).fill('naruto');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page).toHaveURL(/q=naruto/);
  await expectGridLoaded(page);

  await page.getByRole('button', { name: 'Limpar busca' }).click();
  await expect(page).not.toHaveURL(/q=/);
  await expect(
    page.getByRole('searchbox', { name: 'Buscar anime' }),
  ).toHaveValue('');
  await expect(
    page.getByRole('button', { name: 'Limpar busca' }),
  ).not.toBeVisible();
  await expectGridLoaded(page);
});

test('busca sem resultados mostra estado vazio', async ({ page }) => {
  await page.goto('/');

  await expectGridLoaded(page);
  await page
    .getByRole('searchbox', { name: 'Buscar anime' })
    .fill('zzzznonexistentanime999888777');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(
    page.getByRole('heading', { name: 'Nada encontrado' }),
  ).toBeVisible({ timeout: RESULTS_TIMEOUT });
  await expect(page.getByRole('article')).toHaveCount(0);
});
