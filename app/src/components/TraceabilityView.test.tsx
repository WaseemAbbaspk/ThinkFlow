import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectProvider } from '../state/projectStore';
import { TraceabilityView } from './TraceabilityView';

it('shows the no-gaps message for an empty project', () => {
  render(<ProjectProvider><TraceabilityView /></ProjectProvider>);
  expect(screen.getByText(/No gaps/i)).toBeInTheDocument();
});
