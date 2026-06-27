import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ToggleGroup } from './toggle-group';

const options = [
  { label: 'Todos', value: 'ALL' },
  { label: 'TV', value: 'TV' },
  { label: 'Filme', value: 'MOVIE' },
  { label: 'OVA', value: 'OVA' },
  { label: 'ONA', value: 'ONA' },
  { label: 'Especial', value: 'SPECIAL' },
];

const meta: Meta<typeof ToggleGroup> = {
  title: 'Composites/ToggleGroup',
  component: ToggleGroup,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ToggleGroup>;

function ToggleGroupInteractive() {
  const [value, setValue] = useState('ALL');
  return <ToggleGroup options={options} value={value} onChange={setValue} />;
}

export const Default: Story = {
  render: () => <ToggleGroupInteractive />,
};

export const TVSelected: Story = {
  name: 'TV Selected',
  args: {
    options,
    value: 'TV',
    onChange: () => undefined,
  },
};
