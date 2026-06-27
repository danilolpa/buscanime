import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/out-tsc',
      '**/test-output',
      '**/vitest.config.*.timestamp*',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: [
                'type:ui',
                'type:data-access',
                'type:util',
              ],
            },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:ui', 'type:util'],
            },
            {
              sourceTag: 'type:data-access',
              onlyDependOnLibsWithTags: ['type:data-access', 'type:util'],
            },
            {
              sourceTag: 'type:util',
              onlyDependOnLibsWithTags: ['type:util'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
  {
    // Design system: forbid raw Tailwind colors. Use semantic tokens
    // (bg-brand, text-accent, text-ink). Missing a token? Add it to
    // libs/ui/src/styles/theme.css before using.
    files: ['libs/ui/**/*.{ts,tsx}', 'apps/web/**/*.{ts,tsx}'],
    ignores: [
      '**/*.spec.{ts,tsx}',
      '**/*.stories.{ts,tsx}',
      // external-links usa cores de marca de plataformas (YouTube, Netflix…)
      // que são valores fixos de terceiros e não fazem parte do design system.
      '**/external-links.tsx',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Literal[value=/\\b(bg|text|border|ring|fill|stroke|from|via|to|outline|divide|decoration|shadow|accent|caret|ring-offset)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|gray|slate|zinc|neutral|stone)-\\d{2,3}(?![/\\d])/]',
          message:
            'Raw Tailwind colors are forbidden. Use semantic tokens: bg-brand, text-accent, text-ink / text-ink-muted / text-ink-subtle. Missing a token? Add it to libs/ui/src/styles/theme.css.',
        },
      ],
    },
  },
];
