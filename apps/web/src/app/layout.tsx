import './global.css';
import { Providers } from './providers';

export const metadata = {
  title: 'buscanime',
  description: 'Listagem de animes — AniList',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
