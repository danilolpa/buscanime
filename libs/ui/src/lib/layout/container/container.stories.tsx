import type { Meta, StoryObj } from '@storybook/react-vite';
import { Container } from './container';

const meta: Meta<typeof Container> = {
  title: 'Layout/Container',
  component: Container,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Container>;

export const Default: Story = {
  render: () => (
    <div className="bg-gray-100 w-full">
      <Container>
        <div className="border border-dashed border-gray-400 p-4 rounded">
          <p className="text-sm text-gray-600">
            Conteúdo dentro do Container, centralizado com largura máxima de 6xl
            (72rem) e padding horizontal de 1rem.
          </p>
        </div>
      </Container>
    </div>
  ),
};

export const WithMultipleChildren: Story = {
  name: 'Com múltiplos filhos',
  render: () => (
    <div className="bg-gray-100 w-full">
      <Container>
        <div className="border border-dashed border-gray-400 p-4 rounded mb-2">
          Bloco 1
        </div>
        <div className="border border-dashed border-gray-400 p-4 rounded mb-2">
          Bloco 2
        </div>
        <div className="border border-dashed border-gray-400 p-4 rounded">
          Bloco 3
        </div>
      </Container>
    </div>
  ),
};
