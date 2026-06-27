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
  Breadcrumb,
  stripAniListHtml,
} from '@buscanime/ui';
import { fetchAnimeDetail } from '@buscanime/anime-data-access';
import {
  slugify,
  animeHref,
  type AnimeDate,
  type AnimeDetail,
} from '@buscanime/shared-types';

function fmtDate(d: AnimeDate | null): string | null {
  if (!d?.year) return null;
  if (d.day && d.month) {
    return `${String(d.day).padStart(2, '0')}/${String(d.month).padStart(2, '0')}/${d.year}`;
  }
  if (d.month) return `${String(d.month).padStart(2, '0')}/${d.year}`;
  return String(d.year);
}

function airedRange(
  start: AnimeDate | null,
  end: AnimeDate | null,
): string | null {
  const s = fmtDate(start);
  if (!s) return null;
  const e = fmtDate(end);
  return e && e !== s ? `${s} – ${e}` : s;
}

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

// Corta no limite de palavra e adiciona reticências (não corta no meio da palavra).
function truncate(text: string, max = 160): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  return `${slice.slice(0, lastSpace > 0 ? lastSpace : max).trimEnd()}…`;
}

// Usa a sinopse da AniList; se vier vazia, sintetiza uma descrição com os metadados.
function buildDescription(anime: AnimeDetail): string {
  const synopsis = stripAniListHtml(anime.description).trim();
  if (synopsis) return truncate(synopsis);
  const facts = [
    anime.format,
    anime.seasonYear ? `de ${anime.seasonYear}` : null,
    anime.episodes ? `${anime.episodes} episódios` : null,
    anime.averageScore ? `nota ${anime.averageScore}%` : null,
    anime.studios[0] ?? null,
  ].filter(Boolean);
  const lead = facts.length ? `${facts.join(' · ')}. ` : '';
  return truncate(
    `${lead}Veja sinopse, estúdio, gêneros, trailer e onde assistir ${anime.title} no BuscaAnime.`,
  );
}

export async function generateMetadata({
  params,
}: RouteParams): Promise<Metadata> {
  const { id } = await params;
  const numId = parseId(id);
  if (numId === null) return { title: 'Anime não encontrado' };
  const anime = await fetchAnimeDetail(numId);
  if (!anime) return { title: 'Anime não encontrado' };

  const title = anime.seasonYear
    ? `${anime.title} (${anime.seasonYear})`
    : anime.title;
  const description = buildDescription(anime);
  // Banner é paisagem (ideal pro card 1200×630); capa é retrato. Fallback: OG da marca.
  const image = anime.bannerImage ?? anime.coverImage ?? '/og-home.png';
  const canonical = animeHref(anime.id, anime.title);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      title,
      description,
      images: [{ url: image, alt: `Capa de ${anime.title}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function AnimeDetailPage({ params }: RouteParams) {
  const { id, slug } = await params;
  const anime = await load(id);

  const canonical = slugify(anime.title);
  if (slug?.length !== 1 || slug[0] !== canonical) {
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
    { label: 'Exibição', value: airedRange(anime.startDate, anime.endDate) },
    { label: 'Formato', value: anime.format },
    { label: 'Fonte', value: anime.source },
    { label: 'Estúdio', value: anime.studios.join(', ') || null },
    { label: 'Popularidade', value: anime.popularity?.toLocaleString('pt-BR') },
    { label: 'Favoritos', value: anime.favourites?.toLocaleString('pt-BR') },
  ];

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: anime.title },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header className="sticky top-0 z-40" />
      <main className="flex flex-1 flex-col">
        <Container className="md:hidden">
          <Breadcrumb className="py-3" items={breadcrumbItems} />
        </Container>
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
          <Breadcrumb
            className="col-span-full hidden md:block"
            items={breadcrumbItems}
          />
          <aside
            aria-label="Detalhes e estatísticas"
            className="flex flex-col gap-6"
          >
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
              items={[
                ...anime.genres,
                ...[...anime.tags]
                  .sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0))
                  .map((t) => t.name),
              ]}
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
