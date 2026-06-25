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
  args: { children: 'Action', variant: 'default' },
};

export const OnImage: Story = {
  name: 'On Image',
  args: { children: 'Drama', variant: 'onImage' },
  decorators: [
    (Story) => (
      <div className="bg-gray-800 p-4 rounded">
        <Story />
      </div>
    ),
  ],
};
