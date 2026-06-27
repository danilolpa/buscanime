/** SSR da listagem desligado nos e2e (mock client-side via Playwright). */
export function isSsrListingEnabled(): boolean {
  return process.env['PLAYWRIGHT_TEST'] !== '1';
}
