import type { Meta, StoryObj } from '@storybook/react-vite';
import { ExternalLinks } from './external-links';

const meta: Meta<typeof ExternalLinks> = {
  title: 'Detail/ExternalLinks',
  component: ExternalLinks,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ExternalLinks>;

export const Normal: Story = {
  args: {
    links: [
      {
        url: 'https://www.youtube.com/watch?v=abc123',
        site: 'YouTube',
        color: '#ff0000',
      },
      {
        url: 'https://www.amazon.com/dp/B09XYZ',
        site: 'Amazon',
        color: '#ff9900',
      },
      {
        url: 'https://www.crunchyroll.com/naruto',
        site: 'Crunchyroll',
        color: '#f47521',
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    links: [],
  },
};
