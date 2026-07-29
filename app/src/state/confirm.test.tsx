import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmProvider, useConfirm } from '@/state/confirm';

function Harness({ onResult }: { onResult: (v: boolean) => void }) {
  const confirm = useConfirm();
  return (
    <button
      type="button"
      onClick={async () => onResult(await confirm({ title: 'Delete US-1?', description: 'This removes 2 criteria.' }))}
    >
      Delete
    </button>
  );
}

describe('useConfirm', () => {
  it('resolves true when confirmed', async () => {
    const onResult = vi.fn();
    render(<ConfirmProvider><Harness onResult={onResult} /></ConfirmProvider>);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Delete US-1?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^confirm$/i }));
    expect(onResult).toHaveBeenCalledWith(true);
  });

  it('resolves false when cancelled', async () => {
    const onResult = vi.fn();
    render(<ConfirmProvider><Harness onResult={onResult} /></ConfirmProvider>);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(await screen.findByRole('button', { name: /cancel/i }));
    expect(onResult).toHaveBeenCalledWith(false);
  });
});
