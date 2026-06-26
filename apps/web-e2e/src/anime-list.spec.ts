import { test, expect } from '@playwright/test';

test('carrega, filtra e busca animes', async ({ page }) => {
  await page.goto('/');

  // Header visível
  await expect(page.getByRole('banner')).toBeVisible();

  // A grade carrega (AnimeCard é um <article>)
  await expect(page.getByRole('article').first()).toBeVisible({
    timeout: 15000,
  });

  // Filtra por TV Show → reflete na URL
  await page.getByRole('button', { name: 'TV Show' }).click();
  await expect(page).toHaveURL(/format=TV/);

  // Busca por texto → reflete na URL e mantém resultados
  await page.getByRole('searchbox', { name: 'Buscar anime' }).fill('naruto');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page).toHaveURL(/q=naruto/);
  await expect(page.getByRole('article').first()).toBeVisible({
    timeout: 15000,
  });
});
