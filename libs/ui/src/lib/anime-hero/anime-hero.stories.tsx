import type { Meta, StoryObj } from '@storybook/react-vite';
import { AnimeHero } from './anime-hero';

const meta: Meta<typeof AnimeHero> = {
  title: 'Detail/AnimeHero',
  component: AnimeHero,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AnimeHero>;

export const Normal: Story = {
  args: {
    title: 'Shingeki no Kyojin',
    nativeTitle: '進撃の巨人',
    coverImage: 'https://picsum.photos/seed/aot-cover/176/256',
    bannerImage: 'https://picsum.photos/seed/aot-banner/1280/256',
    score: 85,
    meta: ['TV', '25 eps', '2013'],
  },
};

export const NoBanner: Story = {
  args: {
    title: 'Fullmetal Alchemist: Brotherhood',
    nativeTitle: '鋼の錬金術師 FULLMETAL ALCHEMIST',
    coverImage: 'https://picsum.photos/seed/fma-cover/176/256',
    bannerImage: null,
    coverColor: '#b0360f',
    score: 92,
    meta: ['TV', '64 eps', '2009'],
  },
};
