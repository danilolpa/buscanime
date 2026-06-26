/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never;
    };
import { GraphQLClient, type RequestOptions } from 'graphql-request';
import { DocumentNode } from 'graphql';
type GraphQLClientRequestHeaders = RequestOptions['requestHeaders'];
/** The format the media was released in */
export type MediaFormat =
  /** Professionally published manga with more than one chapter */
  | 'MANGA'
  /** Anime movies with a theatrical release */
  | 'MOVIE'
  /** Short anime released as a music video */
  | 'MUSIC'
  /** Written books released as a series of light novels */
  | 'NOVEL'
  /** (Original Net Animation) Anime that have been originally released online or are only available through streaming services. */
  | 'ONA'
  /** Manga with just one chapter */
  | 'ONE_SHOT'
  /** (Original Video Animation) Anime that have been released directly on DVD/Blu-ray without originally going through a theatrical release or television broadcast */
  | 'OVA'
  /** Special episodes that have been included in DVD/Blu-ray releases, picture dramas, pilots, etc */
  | 'SPECIAL'
  /** Anime broadcast on television */
  | 'TV'
  /** Anime which are under 15 minutes in length and broadcast on television */
  | 'TV_SHORT';

/** Media sort enums */
export type MediaSort =
  | 'CHAPTERS'
  | 'CHAPTERS_DESC'
  | 'DURATION'
  | 'DURATION_DESC'
  | 'END_DATE'
  | 'END_DATE_DESC'
  | 'EPISODES'
  | 'EPISODES_DESC'
  | 'FAVOURITES'
  | 'FAVOURITES_DESC'
  | 'FORMAT'
  | 'FORMAT_DESC'
  | 'ID'
  | 'ID_DESC'
  | 'POPULARITY'
  | 'POPULARITY_DESC'
  | 'SCORE'
  | 'SCORE_DESC'
  | 'SEARCH_MATCH'
  | 'START_DATE'
  | 'START_DATE_DESC'
  | 'STATUS'
  | 'STATUS_DESC'
  | 'TITLE_ENGLISH'
  | 'TITLE_ENGLISH_DESC'
  | 'TITLE_NATIVE'
  | 'TITLE_NATIVE_DESC'
  | 'TITLE_ROMAJI'
  | 'TITLE_ROMAJI_DESC'
  | 'TRENDING'
  | 'TRENDING_DESC'
  | 'TYPE'
  | 'TYPE_DESC'
  | 'UPDATED_AT'
  | 'UPDATED_AT_DESC'
  | 'VOLUMES'
  | 'VOLUMES_DESC';

export type AnimeListQueryVariables = Exact<{
  page?: number | null | undefined;
  perPage?: number | null | undefined;
  search?: string | null | undefined;
  format?: MediaFormat | null | undefined;
  sort?: Array<MediaSort | null | undefined> | MediaSort | null | undefined;
}>;

export type AnimeListQuery = {
  Page: {
    pageInfo: {
      currentPage: number | null;
      hasNextPage: boolean | null;
    } | null;
    media: Array<{
      id: number;
      averageScore: number | null;
      format: MediaFormat | null;
      genres: Array<string | null> | null;
      title: { romaji: string | null; english: string | null } | null;
      coverImage: { large: string | null } | null;
    } | null> | null;
  } | null;
};

export const AnimeListDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'AnimeList' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'page' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          defaultValue: { kind: 'IntValue', value: '1' },
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'perPage' },
          },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          defaultValue: { kind: 'IntValue', value: '12' },
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'search' },
          },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'format' },
          },
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'MediaFormat' },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'sort' } },
          type: {
            kind: 'ListType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'MediaSort' },
            },
          },
          defaultValue: {
            kind: 'ListValue',
            values: [{ kind: 'EnumValue', value: 'POPULARITY_DESC' }],
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'Page' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'page' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'page' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'perPage' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'perPage' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'pageInfo' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'currentPage' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'hasNextPage' },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'media' },
                  arguments: [
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'type' },
                      value: { kind: 'EnumValue', value: 'ANIME' },
                    },
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'search' },
                      value: {
                        kind: 'Variable',
                        name: { kind: 'Name', value: 'search' },
                      },
                    },
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'format' },
                      value: {
                        kind: 'Variable',
                        name: { kind: 'Name', value: 'format' },
                      },
                    },
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'sort' },
                      value: {
                        kind: 'Variable',
                        name: { kind: 'Name', value: 'sort' },
                      },
                    },
                  ],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'title' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'romaji' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'english' },
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'coverImage' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'large' },
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'averageScore' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'format' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'genres' },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode;

export type SdkFunctionWrapper = <T>(
  action: (requestHeaders?: Record<string, string>) => Promise<T>,
  operationName: string,
  operationType?: string,
  variables?: any,
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (
  action,
  _operationName,
  _operationType,
  _variables,
) => action();

export function getSdk(
  client: GraphQLClient,
  withWrapper: SdkFunctionWrapper = defaultWrapper,
) {
  return {
    AnimeList(
      variables?: AnimeListQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
      signal?: RequestInit['signal'],
    ): Promise<AnimeListQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<AnimeListQuery>({
            document: AnimeListDocument,
            variables,
            requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders },
            signal,
          }),
        'AnimeList',
        'query',
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
