'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'ui';
import {
  useAnimeList,
  useAnimeFormatCounts,
  isRateLimitError,
} from 'anime-data-access';
import { animeHref } from 'shared-types';
import { useAnimeFilters } from './use-anime-filters';
import { FORMAT_OPTIONS, toMediaFormat } from './format-options';
import { buildAnimeListUrl } from './anime-list-url';

export interface AnimeBrowserProps {
  initialFormat?: string;
  initialQ?: string;
  /** Test-only: endpoint absoluto pro MSW (graphql-request rejeita URL relativa em jsdom). */
  endpoint?: string;
}

export function AnimeBrowser({
  initialFormat = 'ALL',
  initialQ = '',
  endpoint,
}: AnimeBrowserProps) {
  const pathname = usePathname();
  const {
    format,
    q,
    text,
    setFormat,
    onChangeText,
    submitSearch,
    clearSearch,
  } = useAnimeFilters({ initialFormat, initialQ });
  const query = useAnimeList({
    search: q,
    format: toMediaFormat(format),
    endpoint,
  });

  const animes = query.data?.pages.flatMap((p) => p.items) ?? [];
  const fetchingResults = query.isFetching && !query.isFetchingNextPage;
  // Hidratado no SSR: isLoading=false já no 1º render. Sem dados (e2e / troca de
  // filtro com cache frio): isLoading=true → skeleton.
  const isInitialLoading = query.isLoading;
  const isBlankState =
    query.isError || (!isInitialLoading && animes.length === 0);

  const [searchPending, setSearchPending] = useState(false);
  const wasFetching = useRef(false);
  useEffect(() => {
    if (wasFetching.current && !query.isFetching) setSearchPending(false);
    wasFetching.current = query.isFetching;
  }, [query.isFetching]);

  const counts = useAnimeFormatCounts({ search: q, endpoint });
  const options = FORMAT_OPTIONS.map((o) => ({
    ...o,
    href: buildAnimeListUrl(pathname, o.value, q),
    ...(q && counts.data
      ? {
          badge: (counts.data as Record<string, number>)[o.value] ?? 0,
        }
      : {}),
  }));

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
          action={pathname}
          format={format}
          clearHref={buildAnimeListUrl(pathname, format, '')}
        />

        <div
          aria-live="polite"
          aria-busy={fetchingResults}
          className={`flex flex-1 flex-col${isBlankState ? ' justify-center' : ''}`}
        >
          {isInitialLoading ? (
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
                {animes.map((anime, i) => (
                  <Link
                    key={anime.id}
                    href={animeHref(anime.id, anime.title)}
                    className="block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    {/* capas acima da dobra carregam sem lazy (LCP) */}
                    <AnimeCard anime={anime} priority={i < 4} />
                  </Link>
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
