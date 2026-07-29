import { it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectProvider } from '../state/projectStore';
import { ExportPanel } from './ExportPanel';

it('previews a rendered markdown file', () => {
  render(<ProjectProvider><ExportPanel /></ProjectProvider>);
  expect(screen.getByText(/# Untitled Project — Vision/)).toBeInTheDocument();
});

it('keeps the preview select labelled', () => {
  render(<ProjectProvider><ExportPanel /></ProjectProvider>);
  const select = screen.getByLabelText(/preview file/i);
  expect(select.tagName).toBe('SELECT');
});
