import { defineConfig } from 'vitest/config';

// Storybook component tests live in libs/ui/vitest.storybook.config.ts so story
// globs resolve relative to the ui package root (see @storybook/addon-vitest).
export default defineConfig({
  test: {
    projects: ['libs/ui/vite.config.mts', 'libs/ui/vitest.storybook.config.ts'],
  },
});
