import { cn } from '../../utils/cn';

// Paletas de cores vibrantes para o placeholder de loading (blobs com glow).
// Hex puro em inline style — fora do sistema de tokens porque é decoração
// aleatória, não cor semântica de UI.
const GLOW_PALETTES: [string, string, string][] = [
  ['#f43f5e', '#8b5cf6', '#06b6d4'], // rose → violet → cyan
  ['#f97316', '#ec4899', '#8b5cf6'], // orange → pink → violet
  ['#06b6d4', '#3b82f6', '#8b5cf6'], // cyan → blue → violet
  ['#10b981', '#06b6d4', '#6366f1'], // emerald → cyan → indigo
  ['#f59e0b', '#ef4444', '#ec4899'], // amber → red → pink
  ['#8b5cf6', '#ec4899', '#f43f5e'], // violet → pink → rose
  ['#06b6d4', '#10b981', '#84cc16'], // cyan → emerald → lime
  ['#f97316', '#fbbf24', '#84cc16'], // orange → yellow → lime
];

// Hash estável (número ou string) → índice de paleta. Determinístico para não
// gerar hydration mismatch entre server e client.
function seedToIndex(seed: number | string): number {
  if (typeof seed === 'number') return Math.abs(Math.trunc(seed));
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export interface GlowBackgroundProps {
  /** Semente determinística (id ou título) que escolhe a paleta. */
  seed: number | string;
  className?: string;
}

/**
 * Fundo colorido decorativo (gradiente + blobs com blur) exibido atrás de uma
 * imagem enquanto ela carrega — evita o flash branco e sinaliza que algo
 * surgirá ali. Preenche o container pai (`absolute inset-0`); o pai precisa ser
 * `relative` + `overflow-hidden`. Puramente CSS, sem JS de cliente.
 */
export function GlowBackground({ seed, className }: GlowBackgroundProps) {
  const [c0, c1, c2] =
    GLOW_PALETTES[seedToIndex(seed) % GLOW_PALETTES.length] ?? GLOW_PALETTES[0];

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        className,
      )}
      style={{
        background: `linear-gradient(135deg, ${c0}55, ${c1}44, ${c2}55)`,
      }}
      aria-hidden="true"
    >
      <div
        className="absolute -left-8 -top-8 h-36 w-36 rounded-full blur-2xl"
        style={{ background: c0 + 'cc' }}
      />
      <div
        className="absolute -right-8 top-1/4 h-44 w-44 rounded-full blur-2xl"
        style={{ background: c1 + 'cc' }}
      />
      <div
        className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full blur-xl"
        style={{ background: c2 + 'cc' }}
      />
    </div>
  );
}
