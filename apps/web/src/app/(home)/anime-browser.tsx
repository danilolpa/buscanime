'use client';
import { Plus, SearchX, ServerCrash } from 'lucide-react';
import {
  AnimeGrid,
  AnimeCard,
  AnimeGridSkeleton,
  ToggleGroup,
  SearchBar,
  StatusState,
  Button,
  Container,
} from '@buscanime/ui';
import { useAnimeList } from '@buscanime/anime-data-access';
import { useAnimeFilters } from './use-anime-filters';
import { FORMAT_OPTIONS, toMediaFormat } from './format-options';

export interface AnimeBrowserProps {
  /** Test-only: endpoint absoluto pro MSW (graphql-request rejeita URL relativa em jsdom). */
  endpoint?: string;
}

export function AnimeBrowser({ endpoint }: AnimeBrowserProps) {
  const { format, q, text, setFormat, onChangeText, flush } = useAnimeFilters();
  const query = useAnimeList({
    search: q,
    format: toMediaFormat(format),
    endpoint,
  });

  const animes = query.data?.pages.flatMap((p) => p.items) ?? [];
  const searching = query.isFetching && !query.isFetchingNextPage;

  return (
    <Container>
      <div className="flex flex-col gap-6 py-8">
        <ToggleGroup
          options={FORMAT_OPTIONS}
          value={format}
          onChange={setFormat}
        />
        <SearchBar
          value={text}
          onChange={onChangeText}
          onSearch={flush}
          loading={searching}
        />

        <div aria-live="polite" aria-busy={query.isLoading}>
          {query.isLoading ? (
            <AnimeGridSkeleton count={12} />
          ) : query.isError ? (
            <StatusState
              icon={<ServerCrash />}
              title="Erro ao carregar"
              message="Algo deu errado ao buscar os animes."
              action={
                <Button onClick={() => query.refetch()}>Tentar de novo</Button>
              }
            />
          ) : animes.length === 0 ? (
            <StatusState
              icon={<SearchX />}
              title="Nada encontrado"
              message="Tente outro filtro ou outra busca."
            />
          ) : (
            <>
              <AnimeGrid>
                {animes.map((anime) => (
                  <AnimeCard key={anime.id} anime={anime} />
                ))}
              </AnimeGrid>
              {query.hasNextPage && (
                <div className="mt-8 flex justify-center">
                  <Button
                    size="lg"
                    icon={<Plus />}
                    loading={query.isFetchingNextPage}
                    onClick={() => query.fetchNextPage()}
                  >
                    Ver mais
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Container>
  );
}
