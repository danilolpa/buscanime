import type { Meta, StoryObj } from '@storybook/react-vite';
import { Header } from './header';

const meta: Meta<typeof Header> = {
  title: 'Layout/Header',
  component: Header,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Header>;

export const Default: Story = {
  name: 'Padrão',
};

export const WithNav: Story = {
  name: 'Com navegação',
  render: () => (
    <Header>
      <nav className="flex gap-4">
        <a href="/" className="text-white text-sm hover:text-accent">
          Início
        </a>
        <a href="/animes" className="text-white text-sm hover:text-accent">
          Animes
        </a>
      </nav>
    </Header>
  ),
};
