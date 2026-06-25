import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { FormatFilter } from './format-filter';

const options = [
  { label: 'Todos', value: 'ALL' },
  { label: 'TV', value: 'TV' },
  { label: 'Filme', value: 'MOVIE' },
  { label: 'OVA', value: 'OVA' },
  { label: 'ONA', value: 'ONA' },
  { label: 'Especial', value: 'SPECIAL' },
];

const meta: Meta<typeof FormatFilter> = {
  title: 'Composites/FormatFilter',
  component: FormatFilter,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FormatFilter>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('ALL');
    return <FormatFilter options={options} value={value} onChange={setValue} />;
  },
};

export const TVSelected: Story = {
  name: 'TV Selected',
  args: {
    options,
    value: 'TV',
    onChange: () => undefined,
  },
};
