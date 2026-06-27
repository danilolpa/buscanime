// Gera a imagem OG estática da home (1200×630) usada nos cards de
// compartilhamento. Rode após mudar a marca/tagline:
//   node apps/web/tools/generate-og.mjs
// Saída: apps/web/public/og-home.png
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, '..', 'public', 'og-home.png');

// Cores do tema (libs/ui/src/styles/theme.css)
const BRAND = '#6d28d9';
const ACCENT = '#fde047';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="55%" stop-color="${BRAND}"/>
      <stop offset="100%" stop-color="#4c1d95"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1040" cy="120" r="280" fill="${ACCENT}" opacity="0.10"/>
  <circle cx="160" cy="560" r="220" fill="${ACCENT}" opacity="0.08"/>
  <g font-family="Arial, Helvetica, sans-serif" text-anchor="middle">
    <text x="600" y="300" font-size="150" font-weight="800" letter-spacing="-2">
      <tspan fill="#ffffff">BUSC</tspan><tspan fill="${ACCENT}">ANIME</tspan>
    </text>
    <text x="600" y="385" font-size="40" font-weight="600" fill="#ffffff" opacity="0.92">
      Descubra, pesquise e explore animes
    </text>
    <text x="600" y="445" font-size="28" font-weight="400" fill="#ffffff" opacity="0.72">
      Notas, episódios, estúdios, gêneros e trailers · dados da AniList
    </text>
  </g>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(out);
console.log('Wrote', out);
