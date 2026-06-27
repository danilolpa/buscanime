import nx from '@nx/eslint-plugin';
import nextEslintPluginNext from '@next/eslint-plugin-next';
import baseConfig from '../../eslint.config.mjs';

export default [
  ...nx.configs['flat/react'],
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    // Override or add rules here
    rules: {},
  },
  {
    // Imagens: sempre next/image, nunca <img> cru. O stub do Storybook
    // (.storybook/next-image-stub.tsx) usa <img> de proposito e fica de fora.
    files: ['src/**/*.{ts,tsx}'],
    plugins: { '@next/next': nextEslintPluginNext },
    rules: { '@next/next/no-img-element': 'error' },
  },
  {
    ignores: ['**/out-tsc', 'storybook-static/**', '.storybook/**'],
  },
];
