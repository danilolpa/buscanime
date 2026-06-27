import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatList } from './stat-list';

const meta: Meta<typeof StatList> = {
  title: 'Composites/StatList',
  component: StatList,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StatList>;

export const Normal: Story = {
  args: {
    items: [
      { label: 'Episódios', value: 24 },
      { label: 'Status', value: 'Finalizado' },
      { label: 'Formato', value: 'TV' },
      { label: 'Temporada', value: 'Outono 2006' },
      { label: 'Fonte', value: null },
    ],
  },
};
