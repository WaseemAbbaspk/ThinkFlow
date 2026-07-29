import React from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { ThemeProvider } from '@/state/theme';
import { ConfirmProvider } from '@/state/confirm';
import { ProjectProvider } from '@/state/projectStore';

export function renderWithProviders(ui: React.ReactElement): RenderResult {
  return render(
    <ThemeProvider>
      <ConfirmProvider>
        <ProjectProvider>{ui}</ProjectProvider>
      </ConfirmProvider>
    </ThemeProvider>,
  );
}
