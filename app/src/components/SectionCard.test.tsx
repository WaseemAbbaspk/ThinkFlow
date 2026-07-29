import { it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SectionCard } from '@/components/SectionCard';

it('renders the title, the count, and collapses its body', async () => {
  render(<SectionCard title="Goals" count={3}><p>body content</p></SectionCard>);
  expect(screen.getByText('Goals')).toBeInTheDocument();
  expect(screen.getByText('3')).toBeInTheDocument();
  expect(screen.getByText('body content')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /collapse goals/i }));
  expect(screen.queryByText('body content')).not.toBeInTheDocument();
});
