import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chip } from './chip';

const meta: Meta<typeof Chip> = {
  title: 'Primitives/Chip',
  component: Chip,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Chip>;

export const Default: Story = {
  args: { children: 'Action' },
};

export const Group: Story = {
  render: () => (
    <div className="flex flex-wrap gap-1">
      <Chip>Action</Chip>
      <Chip>Adventure</Chip>
      <Chip>Fantasy</Chip>
    </div>
  ),
};
