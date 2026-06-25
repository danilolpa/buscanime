import type { Meta, StoryObj } from '@storybook/react-vite';
import { Search } from 'lucide-react';
import { Input } from './input';

const meta: Meta<typeof Input> = {
  title: 'Primitives/Input',
  component: Input,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Empty: Story = {
  args: {
    'aria-label': 'Buscar anime',
    placeholder: 'Buscar anime...',
    value: '',
  },
};

export const WithIcon: Story = {
  name: 'With Icon Search',
  args: {
    'aria-label': 'Buscar anime',
    placeholder: 'Buscar anime...',
    value: '',
    icon: <Search size={16} />,
  },
};
