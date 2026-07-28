import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectProvider } from '../state/projectStore';
import { ExportPanel } from './ExportPanel';

it('previews a rendered markdown file', () => {
  render(<ProjectProvider><ExportPanel /></ProjectProvider>);
  expect(screen.getByText(/# Untitled Project — Vision/)).toBeInTheDocument();
});
