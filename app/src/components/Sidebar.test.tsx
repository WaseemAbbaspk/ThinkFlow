import { it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectProvider } from '../state/projectStore';
import { Sidebar } from './Sidebar';

it('renders all stage nav items', () => {
  render(<ProjectProvider><Sidebar /></ProjectProvider>);
  ['Vision','Requirements','Architecture','Tasks','Testing','Traceability','Export']
    .forEach(label => expect(screen.getByRole('button', { name: new RegExp(label,'i') })).toBeInTheDocument());
});

it('keeps stage labels at the start of the accessible name', () => {
  render(<ProjectProvider><Sidebar /></ProjectProvider>);
  expect(screen.getByRole('button', { name: /^Tasks/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^Vision/i })).toBeInTheDocument();
});
