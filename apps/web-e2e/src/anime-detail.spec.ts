import { test, expect } from './fixtures/test';

test('navega de um card da home para o detalhe', async ({ page }) => {
  await page.goto('/');
  const firstCard = page.locator('a[href^="/anime/"]').first();
  await expect(firstCard).toBeVisible({ timeout: 15000 });
  await firstCard.click();
  await expect(page).toHaveURL(/\/anime\/\d+\/[a-z0-9-]+/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('id não-numérico retorna 404 e mostra a página de não encontrado', async ({
  page,
}) => {
  const res = await page.goto('/anime/not-a-number');
  expect(res?.status()).toBe(404);
  await expect(
    page.getByRole('heading', { name: 'Anime não encontrado' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: /Voltar para a home/i }),
  ).toBeVisible();
});

test('slug incorreto redireciona para o canônico', async ({ page }) => {
  await page.goto('/anime/1/slug-errado');
  await expect(page).toHaveURL('/anime/1/naruto');
});
