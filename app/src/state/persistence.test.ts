import { describe, it, expect, beforeEach } from 'vitest';
import { emptyProject } from '../model/types';
import { saveProject, loadProject, clearProject, STORAGE_KEY } from './persistence';

describe('persistence', () => {
  beforeEach(() => localStorage.clear());
  it('returns empty when nothing saved', () => {
    expect(loadProject()).toEqual({ ok: 'empty' });
  });
  it('saves and loads a project', () => {
    saveProject(emptyProject('Saved'));
    const r = loadProject();
    expect(r).toMatchObject({ ok: true });
    if (r.ok === true) expect(r.project.meta.name).toBe('Saved');
  });
  it('reports failure on corrupt data', () => {
    localStorage.setItem(STORAGE_KEY, '{bad json');
    const r = loadProject();
    expect(r.ok).toBe(false);
  });
  it('clears saved project', () => {
    saveProject(emptyProject('x')); clearProject();
    expect(loadProject()).toEqual({ ok: 'empty' });
  });
});
