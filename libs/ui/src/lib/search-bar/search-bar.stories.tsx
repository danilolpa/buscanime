import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { SearchBar } from './search-bar';

const meta: Meta<typeof SearchBar> = {
  title: 'Composites/SearchBar',
  component: SearchBar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SearchBar>;

export const Empty: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <SearchBar
        value={value}
        onChange={setValue}
        onSearch={() => alert(`Buscando: ${value}`)}
      />
    );
  },
};

export const Filled: Story = {
  render: () => {
    const [value, setValue] = useState('Naruto');
    return (
      <SearchBar
        value={value}
        onChange={setValue}
        onSearch={() => alert(`Buscando: ${value}`)}
      />
    );
  },
};
