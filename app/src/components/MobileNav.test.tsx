import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectProvider } from '@/state/projectStore';
import { MobileNav } from '@/components/MobileNav';

describe('MobileNav', () => {
  it('keeps the nav out of the DOM until opened', () => {
    render(<ProjectProvider><MobileNav /></ProjectProvider>);
    expect(screen.getByRole('button', { name: /open navigation/i })).toBeInTheDocument();
    // Critical: a closed sheet must not duplicate the stage buttons.
    expect(screen.queryByRole('button', { name: /^Requirements/i })).not.toBeInTheDocument();
  });

  it('reveals the stage nav when opened and closes it on navigation', async () => {
    render(<ProjectProvider><MobileNav /></ProjectProvider>);
    await userEvent.click(screen.getByRole('button', { name: /open navigation/i }));

    const requirements = await screen.findByRole('button', { name: /^Requirements/i });
    expect(requirements).toBeInTheDocument();

    await userEvent.click(requirements);
    expect(screen.queryByRole('button', { name: /^Requirements/i })).not.toBeInTheDocument();
  });
});
