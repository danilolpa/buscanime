import type { Meta, StoryObj } from '@storybook/react-vite';
import { TagList } from './tag-list';

const meta: Meta<typeof TagList> = {
  title: 'Detail/TagList',
  component: TagList,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TagList>;

export const Normal: Story = {
  args: {
    items: [
      'Action',
      'Adventure',
      'Drama',
      'Fantasy',
      'Shounen',
      'Supernatural',
    ],
  },
};

export const Empty: Story = {
  args: { items: [] },
};
