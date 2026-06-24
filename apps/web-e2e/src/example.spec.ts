import { test, expect } from '@playwright/test';

test('has placeholder content', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('main')).toContainText('buscanime');
});
