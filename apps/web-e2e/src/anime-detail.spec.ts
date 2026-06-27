import { test, expect } from './fixtures/test';

test('navega de um card da home para o detalhe', async ({ page }) => {
  await page.goto('/');
  const firstCard = page.locator('a[href^="/anime/"]').first();
  await expect(firstCard).toBeVisible({ timeout: 15000 });
  // Clicar logo após o SSR pode cair na janela de hidratação do App Router: o
  // onClick do <Link> já deu preventDefault no clique do browser, mas a
  // navegação client-side ainda não está pronta e o clique é perdido. Re-tenta
  // até a URL mudar (determinístico em vez de depender do timing por browser).
  await expect(async () => {
    await firstCard.click();
    await expect(page).toHaveURL(/\/anime\/\d+\/[a-z0-9-]+/, { timeout: 2000 });
  }).toPass({ timeout: 15000 });
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
