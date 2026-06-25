import type { Meta, StoryObj } from '@storybook/react-vite';
import { Logo } from './logo';

const meta: Meta<typeof Logo> = {
  title: 'Primitives/Logo',
  component: Logo,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="bg-brand inline-block p-4 rounded-md">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Logo>;

export const SizeMd: Story = {
  name: 'Size — md',
  args: { size: 'md' },
};

export const SizeLg: Story = {
  name: 'Size — lg',
  args: { size: 'lg' },
};

export const AsLink: Story = {
  name: 'As anchor link',
  args: { as: 'a', href: '/', size: 'md' },
};
