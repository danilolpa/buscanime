/** Headers padrão para POST GraphQL na AniList (SSR, proxy e Route Handler). */
export const ANILIST_JSON_HEADERS: Readonly<Record<string, string>> = {
  'content-type': 'application/json',
  accept: 'application/json',
  // Cloudflare/AniList podem bloquear requests sem UA identificável (comum em serverless).
  'user-agent': 'BuscaAnime/1.0 (+https://buscanime-winnin-web.vercel.app)',
};

/** Alinha Data Cache Next.js entre SSR e `/api/anilist`. */
export const ANILIST_REVALIDATE_SECONDS = 60;

/**
 * `RequestInit` para fetch SSR com Data Cache do Next.js.
 * `next.revalidate` não está nos tipos Node — tipamos localmente.
 */
export function anilistSsrFetchInit(body: unknown): RequestInit & {
  next?: { revalidate: number };
} {
  return {
    method: 'POST',
    headers: { ...ANILIST_JSON_HEADERS },
    body: JSON.stringify(body),
    next: { revalidate: ANILIST_REVALIDATE_SECONDS },
  };
}
