export type MediaFormat =
  | 'TV'
  | 'TV_SHORT'
  | 'MOVIE'
  | 'SPECIAL'
  | 'OVA'
  | 'ONA'
  | 'MUSIC';

export interface Anime {
  id: number;
  title: string;
  coverImage: string;
  averageScore: number | null;
  format: MediaFormat | null;
  genres: string[];
}
