import type { Meta, StoryObj } from '@storybook/react-vite';
import { DescriptionText } from './description-text';

const meta: Meta<typeof DescriptionText> = {
  title: 'Composites/DescriptionText',
  component: DescriptionText,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DescriptionText>;

export const Normal: Story = {
  args: {
    html: 'In a world torn apart by war, a young soldier fights for survival.<br><br>After losing everything, he discovers an ancient power hidden within him.<br><br>Now he must choose between <i>vengeance</i> and <b>redemption</b> — before time runs out.',
  },
};

export const Empty: Story = {
  args: { html: null },
};
