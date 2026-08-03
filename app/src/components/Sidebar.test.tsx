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

/* The collapsed rail hides labels with sr-only, never display:none, so every stage stays
   reachable by name — both for screen readers and for the queries the other suites use. */
it('keeps every stage name accessible while collapsed', () => {
  render(<ProjectProvider><Sidebar collapsible /></ProjectProvider>);
  ['Vision', 'Requirements', 'Architecture', 'Tasks', 'Testing', 'Traceability', 'Export']
    .forEach(label =>
      expect(screen.getByRole('button', { name: new RegExp(`^${label}`, 'i') })).toBeInTheDocument());
});

/* Guards the mobile sheet: it renders Sidebar with no group/rail ancestor, so if the
   collapsed styles were unconditional its labels would be sr-only with nothing to lift them. */
it('only collapses its labels when asked to', () => {
  const { unmount } = render(<ProjectProvider><Sidebar /></ProjectProvider>);
  expect(screen.getByRole('button', { name: /^Vision/i }).querySelector('.sr-only')).toBeNull();

  unmount();
  render(<ProjectProvider><Sidebar collapsible /></ProjectProvider>);
  expect(screen.getByRole('button', { name: /^Vision/i }).querySelector('.sr-only')).not.toBeNull();
});
