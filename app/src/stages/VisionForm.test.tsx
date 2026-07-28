import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectProvider } from '../state/projectStore';
import { VisionForm } from './VisionForm';

describe('VisionForm', () => {
  it('edits the vision statement', async () => {
    render(<ProjectProvider><VisionForm /></ProjectProvider>);
    const field = screen.getByLabelText(/Vision statement/i);
    await userEvent.type(field, 'A trustworthy tool');
    expect((field as HTMLTextAreaElement).value).toBe('A trustworthy tool');
  });
});
