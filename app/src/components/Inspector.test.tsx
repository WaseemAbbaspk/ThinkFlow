import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Inspector } from './Inspector';

describe('Inspector', () => {
  it('shows the id and title and renders children', () => {
    render(
      <Inspector id="US-1" title="User login" onClose={() => {}} onDelete={() => {}}>
        <p>body content</p>
      </Inspector>,
    );
    expect(screen.getByText('US-1')).toBeInTheDocument();
    expect(screen.getByText('User login')).toBeInTheDocument();
    expect(screen.getByText('body content')).toBeInTheDocument();
  });

  it('falls back to the id when the title is empty', () => {
    render(<Inspector id="US-1" title="" onClose={() => {}} onDelete={() => {}}><p>x</p></Inspector>);
    expect(screen.getByRole('heading', { name: 'US-1' })).toBeInTheDocument();
  });

  it('calls onClose from the close button', async () => {
    const onClose = vi.fn();
    render(<Inspector id="US-1" title="t" onClose={onClose} onDelete={() => {}}><p>x</p></Inspector>);
    await userEvent.click(screen.getByRole('button', { name: 'Close details' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('scopes the delete button name to the id so it cannot collide with a confirm dialog', async () => {
    const onDelete = vi.fn();
    render(<Inspector id="US-1" title="t" onClose={() => {}} onDelete={onDelete}><p>x</p></Inspector>);
    expect(screen.queryByRole('button', { name: /^delete$/i })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete US-1' }));
    expect(onDelete).toHaveBeenCalled();
  });

  it('omits the duplicate button when no handler is given', () => {
    render(<Inspector id="US-1" title="t" onClose={() => {}} onDelete={() => {}}><p>x</p></Inspector>);
    expect(screen.queryByRole('button', { name: /duplicate/i })).not.toBeInTheDocument();
  });

  it('calls onDuplicate when a handler is given', async () => {
    const onDuplicate = vi.fn();
    render(
      <Inspector id="US-1" title="t" onClose={() => {}} onDelete={() => {}} onDuplicate={onDuplicate}>
        <p>x</p>
      </Inspector>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Duplicate US-1' }));
    expect(onDuplicate).toHaveBeenCalled();
  });
});
