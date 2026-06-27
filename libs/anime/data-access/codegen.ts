import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'https://graphql.anilist.co',
  documents: ['libs/anime/data-access/src/lib/graphql/queries/**/*.graphql'],
  generates: {
    'libs/anime/data-access/src/lib/graphql/generated/schema-types.ts': {
      plugins: ['typescript'],
      config: {
        enumsAsTypes: true,
      },
    },
    'libs/anime/data-access/src/lib/graphql/generated/graphql.ts': {
      plugins: ['typescript-operations', 'typescript-graphql-request'],
      config: {
        enumsAsTypes: true,
        documentMode: 'documentNode',
        importDocumentNodeExternallyFrom:
          'libs/anime/data-access/src/lib/graphql/generated/schema-types.ts',
      },
    },
  },
};

export default config;
