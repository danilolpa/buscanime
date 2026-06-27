import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import {
  Header,
  Footer,
  Container,
  AnimeHero,
  StatList,
  ExternalLinks,
  DescriptionText,
  TagList,
  TrailerEmbed,
} from '@buscanime/ui';
import { fetchAnimeDetail } from '@buscanime/anime-data-access';
import { slugify, animeHref, type AnimeDetail } from '@buscanime/shared-types';

interface RouteParams {
  params: Promise<{ id: string; slug?: string[] }>;
}

function parseId(raw: string): number | null {
  return /^\d+$/.test(raw) ? Number(raw) : null;
}

async function load(rawId: string): Promise<AnimeDetail> {
  const id = parseId(rawId);
  if (id === null) notFound();
  const anime = await fetchAnimeDetail(id);
  if (!anime) notFound();
  return anime;
}

export async function generateMetadata({
  params,
}: RouteParams): Promise<Metadata> {
  const { id } = await params;
  const numId = parseId(id);
  if (numId === null) return { title: 'Anime não encontrado — BuscaAnime' };
  const anime = await fetchAnimeDetail(numId);
  if (!anime) return { title: 'Anime não encontrado — BuscaAnime' };
  const description =
    anime.description?.replace(/<[^>]+>/g, ' ').slice(0, 160) ?? undefined;
  const image = anime.coverImage ?? anime.bannerImage ?? undefined;
  return {
    title: `${anime.title} — BuscaAnime`,
    description,
    openGraph: {
      title: anime.title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function AnimeDetailPage({ params }: RouteParams) {
  const { id, slug } = await params;
  const anime = await load(id);

  const canonical = slugify(anime.title);
  if (slug?.[0] !== canonical) {
    // permanent (308) — canonical-slug redirect for SEO
    permanentRedirect(animeHref(anime.id, anime.title));
  }

  const meta = [
    anime.format,
    anime.episodes ? `${anime.episodes} eps` : null,
    anime.seasonYear?.toString(),
  ].filter(Boolean) as string[];

  const stats = [
    {
      label: 'Nota média',
      value: anime.averageScore ? `${anime.averageScore}%` : null,
    },
    { label: 'Episódios', value: anime.episodes },
    {
      label: 'Duração',
      value: anime.duration ? `${anime.duration} min` : null,
    },
    { label: 'Status', value: anime.status },
    {
      label: 'Temporada',
      value: [anime.season, anime.seasonYear].filter(Boolean).join(' ') || null,
    },
    { label: 'Formato', value: anime.format },
    { label: 'Fonte', value: anime.source },
    { label: 'Estúdio', value: anime.studios.join(', ') || null },
    { label: 'Popularidade', value: anime.popularity?.toLocaleString('pt-BR') },
    { label: 'Favoritos', value: anime.favourites?.toLocaleString('pt-BR') },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header className="sticky top-0 z-40" />
      <main className="flex flex-1 flex-col">
        <AnimeHero
          title={anime.title}
          nativeTitle={anime.nativeTitle}
          coverImage={anime.coverImage}
          coverColor={anime.coverColor}
          bannerImage={anime.bannerImage}
          score={anime.averageScore}
          meta={meta}
        />
        <Container className="grid gap-8 py-8 md:grid-cols-[280px_1fr]">
          <aside className="flex flex-col gap-6">
            <StatList items={stats} />
            <ExternalLinks
              links={anime.externalLinks.map(({ url, site, color }) => ({
                url,
                site,
                color,
              }))}
            />
          </aside>
          <div className="flex flex-col gap-6">
            <DescriptionText html={anime.description} />
            <TagList
              items={[...anime.genres, ...anime.tags.map((t) => t.name)]}
            />
            <TrailerEmbed
              youtubeId={
                anime.trailer?.site === 'youtube' ? anime.trailer.id : null
              }
              thumbnail={anime.trailer?.thumbnail ?? null}
              title={`Trailer de ${anime.title}`}
            />
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
