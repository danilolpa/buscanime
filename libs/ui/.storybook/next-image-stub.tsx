/**
 * Storybook stub for `next/image`.
 *
 * `libs/ui` é renderizada por dois builders: o Next (app) e o Vite (Storybook).
 * O `next/image` real depende do runtime do Next (loader `/_next/image`), que
 * não existe no Storybook. Este stub é aliasado no lugar dele em `main.ts` e
 * só renderiza um `<img>` simples — props exclusivas do `next/image`
 * (`fill`/`priority`/`sizes`) são aceitas no tipo, mas ignoradas na renderização
 * para não vazarem como atributos inválidos no DOM.
 */
import type { ImgHTMLAttributes } from 'react';

interface NextImageStubProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fill?: boolean;
  priority?: boolean;
}

export default function NextImageStub(props: NextImageStubProps) {
  const { src, alt, className, width, height } = props;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
    />
  );
}
