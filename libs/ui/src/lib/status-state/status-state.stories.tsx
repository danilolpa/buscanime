import type { Meta, StoryObj } from '@storybook/react-vite';
import { SearchX, ServerCrash } from 'lucide-react';
import { StatusState } from './status-state';
import { Button } from '../button/button';

const meta: Meta<typeof StatusState> = {
  title: 'Feedback/StatusState',
  component: StatusState,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StatusState>;

export const Empty: Story = {
  name: 'Vazio — Nada encontrado',
  args: {
    icon: <SearchX />,
    title: 'Nada encontrado',
    message: 'Nenhum anime corresponde à sua busca. Tente outro termo.',
  },
};

export const Error: Story = {
  name: 'Erro ao carregar',
  args: {
    icon: <ServerCrash />,
    title: 'Erro ao carregar',
    message: 'Não foi possível buscar os animes. Verifique sua conexão.',
    action: <Button>Tentar de novo</Button>,
  },
};
