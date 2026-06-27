import type { MediaFormat } from './anime.js';

export interface AnimeDate {
  year: number | null;
  month: number | null;
  day: number | null;
}

export interface AnimeDetailTag {
  name: string;
  rank: number | null;
}

export interface AnimeDetailTrailer {
  id: string;
  site: string;
  thumbnail: string | null;
}

export interface AnimeDetailExternalLink {
  url: string;
  site: string;
  color: string | null;
  type: string | null;
}

export interface AnimeDetail {
  id: number;
  title: string; // english ?? romaji ?? 'Untitled'
  romajiTitle: string | null;
  nativeTitle: string | null;
  description: string | null; // raw AniList HTML-ish; stripped at render
  coverImage: string | null; // extraLarge ?? large
  coverColor: string | null;
  bannerImage: string | null;
  averageScore: number | null;
  meanScore: number | null;
  popularity: number | null;
  favourites: number | null;
  episodes: number | null;
  duration: number | null; // minutes
  status: string | null;
  season: string | null;
  seasonYear: number | null;
  format: MediaFormat | null;
  source: string | null;
  startDate: AnimeDate | null;
  endDate: AnimeDate | null;
  genres: string[];
  tags: AnimeDetailTag[];
  studios: string[]; // main studio names
  trailer: AnimeDetailTrailer | null;
  externalLinks: AnimeDetailExternalLink[];
}
