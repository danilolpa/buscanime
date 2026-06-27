import type { Meta, StoryObj } from '@storybook/react-vite';
import { GlowBackground } from './glow-background';

const meta: Meta<typeof GlowBackground> = {
  title: 'Primitives/GlowBackground',
  component: GlowBackground,
  tags: ['autodocs'],
  // O fundo preenche o pai; renderiza dentro de um container com tamanho.
  decorators: [
    (Story) => (
      <div className="relative h-64 w-96 overflow-hidden rounded-lg">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof GlowBackground>;

export const Default: Story = { args: { seed: 1 } };

export const FromTitle: Story = { args: { seed: 'Cowboy Bebop' } };

export const Palettes: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-2">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="relative h-24 w-24 overflow-hidden rounded-md">
          <GlowBackground seed={i} />
        </div>
      ))}
    </div>
  ),
};
