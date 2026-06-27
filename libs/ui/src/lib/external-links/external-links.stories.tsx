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
        url: 'https://www.crunchyroll.com/naruto',
        site: 'Crunchyroll',
        color: '#f47521',
      },
      { url: 'https://naruto.com', site: 'Official Site', color: '#003087' },
      {
        url: 'https://www.funimation.com/shows/naruto',
        site: 'Funimation',
        color: null,
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    links: [],
  },
};
