import { createServer } from 'node:http';

const port = Number(process.env.MOCK_ANILIST_PORT ?? 4010);

function resolveAnimeDetail(id) {
  return {
    id,
    title: { romaji: 'Naruto', english: 'Naruto', native: 'ナルト' },
    description: 'Um ninja determinado a se tornar Hokage.',
    coverImage: { extraLarge: 'https://picsum.photos/seed/naruto/300/400', large: null, color: '#6d28d9' },
    bannerImage: null,
    averageScore: 80,
    meanScore: 80,
    popularity: 1000,
    favourites: 100,
    episodes: 220,
    duration: 23,
    status: 'FINISHED',
    season: 'FALL',
    seasonYear: 2002,
    format: 'TV',
    source: 'MANGA',
    startDate: { year: 2002, month: 10, day: 3 },
    endDate: { year: 2007, month: 2, day: 8 },
    genres: ['Action', 'Adventure'],
    tags: [{ name: 'Ninja', rank: 95 }],
    studios: { nodes: [{ name: 'Pierrot' }] },
    trailer: null,
    externalLinks: [],
  };
}

createServer((req, res) => {
  // Playwright probes with GET to detect when the server is ready; return 200 OK.
  if (req.method !== 'POST') {
    res.writeHead(200, { 'content-type': 'text/plain' }).end('ok');
    return;
  }
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const { variables } = JSON.parse(body || '{}');
    const id = Number(variables?.id);
    const media = id > 0 && id < 100000000 ? resolveAnimeDetail(id) : null;
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ data: { Media: media } }));
  });
}).listen(port, () => console.log(`anilist-mock on :${port}`));
