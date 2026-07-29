import { it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

it('renders a button with its accessible name and variant classes', () => {
  render(<Button variant="ghost">Remove</Button>);
  const btn = screen.getByRole('button', { name: /remove/i });
  expect(btn).toBeInTheDocument();
  expect(btn.className).toContain('hover:bg-accent');
});
