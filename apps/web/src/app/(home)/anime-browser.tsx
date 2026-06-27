'use client';
import { useEffect, useRef, useState } from 'react';
import { Hourglass, Plus, SearchX, ServerCrash } from 'lucide-react';
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
import {
  useAnimeList,
  useAnimeFormatCounts,
  isRateLimitError,
} from '@buscanime/anime-data-access';
import { useAnimeFilters } from './use-anime-filters';
import { FORMAT_OPTIONS, toMediaFormat } from './format-options';

export interface AnimeBrowserProps {
  /** Test-only: endpoint absoluto pro MSW (graphql-request rejeita URL relativa em jsdom). */
  endpoint?: string;
}

export function AnimeBrowser({ endpoint }: AnimeBrowserProps) {
  const {
    format,
    q,
    text,
    setFormat,
    onChangeText,
    submitSearch,
    clearSearch,
  } = useAnimeFilters();
  const query = useAnimeList({
    search: q,
    format: toMediaFormat(format),
    endpoint,
  });

  const animes = query.data?.pages.flatMap((p) => p.items) ?? [];
  const fetchingResults = query.isFetching && !query.isFetchingNextPage;
  // Estados em branco (erro / nada encontrado) centralizam na altura disponível;
  // a grade e o skeleton ficam no topo.
  const isBlankState =
    query.isError || (!query.isLoading && animes.length === 0);

  // O botão "Buscar" só mostra loading quando a busca foi disparada por clique/Enter —
  // não no load inicial nem ao trocar de formato. Liga no clique e desliga quando o fetch
  // resultante termina (transição de fetching true -> false).
  const [searchPending, setSearchPending] = useState(false);
  const wasFetching = useRef(false);
  useEffect(() => {
    if (wasFetching.current && !query.isFetching) setSearchPending(false);
    wasFetching.current = query.isFetching;
  }, [query.isFetching]);

  const counts = useAnimeFormatCounts({ search: q, endpoint });
  const options =
    q && counts.data
      ? FORMAT_OPTIONS.map((o) => ({
          ...o,
          // cast pra Record<string, number>: o.value é string e FormatCounts é tipado
          // por união literal de chaves — sem o cast o `nx build`/typecheck reclama.
          badge: (counts.data as Record<string, number>)[o.value] ?? 0,
        }))
      : FORMAT_OPTIONS;

  function handleSearch() {
    setSearchPending(true);
    submitSearch();
  }

  return (
    <Container className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-6 py-8">
        <div className="-mx-4 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:overflow-visible md:py-0">
          <ToggleGroup
            options={options}
            value={format}
            onChange={setFormat}
            className="w-max flex-nowrap px-4 md:w-auto md:flex-wrap md:px-0"
          />
        </div>
        <SearchBar
          value={text}
          onChange={onChangeText}
          onSearch={handleSearch}
          loading={searchPending && query.isFetching}
          onClear={clearSearch}
          searchActive={Boolean(q)}
        />

        {/* aria-busy sinaliza qualquer refetch de resultados (filtro/busca), não só a carga inicial. */}
        <div
          aria-live="polite"
          aria-busy={fetchingResults}
          className={`flex flex-1 flex-col${isBlankState ? ' justify-center' : ''}`}
        >
          {query.isLoading ? (
            <AnimeGridSkeleton count={12} />
          ) : query.isError ? (
            isRateLimitError(query.error) ? (
              <StatusState
                tone="warning"
                icon={<Hourglass />}
                title="Muitas buscas"
                message="Você fez muitas buscas em pouco tempo. Aguarde alguns segundos e tente de novo."
                action={
                  <Button onClick={() => query.refetch()}>
                    Tentar de novo
                  </Button>
                }
              />
            ) : (
              <StatusState
                tone="danger"
                icon={<ServerCrash />}
                title="Erro ao carregar"
                message="Algo deu errado ao buscar os animes."
                action={
                  <Button onClick={() => query.refetch()}>
                    Tentar de novo
                  </Button>
                }
              />
            )
          ) : animes.length === 0 ? (
            <StatusState
              tone="neutral"
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
                    variant="accent"
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
