import { it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectProvider } from '../state/projectStore';
import { Sidebar } from './Sidebar';

it('renders all stage nav items', () => {
  render(<ProjectProvider><Sidebar /></ProjectProvider>);
  ['Vision','Requirements','Architecture','Tasks','Testing','Traceability','Export']
    .forEach(label => expect(screen.getByRole('button', { name: new RegExp(label,'i') })).toBeInTheDocument());
});
