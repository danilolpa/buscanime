import type { Page, Route } from '@playwright/test';
import {
  anilistZeroFormatCounts,
  resolveAnimeListPage,
  type AnimeListVariables,
} from './anilist-responses';

interface GraphqlRequestBody {
  operationName?: string;
  variables?: AnimeListVariables;
}

export async function mockAnilistApi(page: Page) {
  await page.route('**/api/anilist', async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    const body = route.request().postDataJSON() as GraphqlRequestBody;
    const operation = body.operationName;

    if (operation === 'AnimeFormatCounts') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: anilistZeroFormatCounts }),
      });
      return;
    }

    if (operation === 'AnimeList') {
      const pageData = resolveAnimeListPage(body.variables ?? {});
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { Page: pageData } }),
      });
      return;
    }

    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        errors: [
          { message: `Unhandled GraphQL operation: ${operation ?? 'unknown'}` },
        ],
      }),
    });
  });
}
