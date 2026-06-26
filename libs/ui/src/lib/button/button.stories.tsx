import type { Meta, StoryObj } from '@storybook/react-vite';
import { Plus, Search } from 'lucide-react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Solid: Story = {
  args: { children: 'Buscar anime' },
};

export const Outline: Story = {
  args: { children: 'Ver mais', variant: 'outline' },
};

export const Active: Story = {
  args: { children: 'TV', variant: 'outline', active: true },
};

export const SizeMd: Story = {
  name: 'Size md',
  args: { children: 'Médio', size: 'md' },
};

export const SizeLg: Story = {
  name: 'Size lg',
  args: { children: 'Grande', size: 'lg' },
};

export const WithIconPlus: Story = {
  name: 'With Icon Plus',
  args: { children: 'Adicionar', icon: <Plus size={16} /> },
};

export const WithIconSearch: Story = {
  name: 'With Icon Search',
  args: { children: 'Buscar', icon: <Search size={16} /> },
};

export const Loading: Story = {
  args: { children: 'Buscar', loading: true },
};
