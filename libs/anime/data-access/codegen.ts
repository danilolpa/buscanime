import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'https://graphql.anilist.co',
  documents: ['libs/anime/data-access/src/lib/queries/**/*.graphql'],
  generates: {
    // Schema types (enums, scalars, input types, object types)
    'libs/anime/data-access/src/lib/generated/schema-types.ts': {
      plugins: ['typescript'],
      config: {
        enumsAsTypes: true,
      },
    },
    // Operation types + graphql-request SDK (references schema-types)
    'libs/anime/data-access/src/lib/generated/graphql.ts': {
      plugins: ['typescript-operations', 'typescript-graphql-request'],
      config: {
        enumsAsTypes: true,
        documentMode: 'documentNode',
        // Import schema types from the split file
        importDocumentNodeExternallyFrom:
          'libs/anime/data-access/src/lib/generated/schema-types.ts',
      },
    },
  },
};

export default config;
