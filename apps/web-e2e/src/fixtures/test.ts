import { test as base, expect } from '@playwright/test';
import { mockAnilistApi } from './mock-anilist-api';

export const test = base.extend({
  page: async ({ page }, use) => {
    await mockAnilistApi(page);
    await use(page);
  },
});

export { expect };
