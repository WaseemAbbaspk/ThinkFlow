import { it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SaveStatus } from '@/components/SaveStatus';

it('renders each of the three states', () => {
  const { rerender } = render(<SaveStatus state="saving" />);
  expect(screen.getByText(/saving/i)).toBeInTheDocument();

  rerender(<SaveStatus state="saved" />);
  expect(screen.getByText(/^saved$/i)).toBeInTheDocument();

  rerender(<SaveStatus state="error" />);
  expect(screen.getByText(/not saved/i)).toBeInTheDocument();
  expect(screen.getByRole('status')).toBeInTheDocument();
});
