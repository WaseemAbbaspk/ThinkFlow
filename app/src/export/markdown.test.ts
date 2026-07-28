import { describe, it, expect } from 'vitest';
import { emptyProject } from '../model/types';
import { renderAll } from './markdown';

describe('renderAll', () => {
  it('produces the six expected files', () => {
    const files = renderAll(emptyProject('Todo App'));
    expect(files.map(f => f.name)).toEqual(
      ['01-vision.md','02-requirements.md','03-architecture.md','04-tasks.md','05-testing.md','README.md']);
  });
  it('renders a story and its criterion in the requirements file', () => {
    const p = emptyProject('Todo App');
    p.requirements.stories.push({ id:'US-1', role:'user', want:'add a task', benefit:'capture it', priority:'Must', servesGoalId:null });
    p.requirements.criteria.push({ id:'AC-1.1', storyId:'US-1', text:'Enter creates a task' });
    const req = renderAll(p).find(f => f.name === '02-requirements.md')!.content;
    expect(req).toContain('US-1');
    expect(req).toContain('As a **user**, I want **add a task**');
    expect(req).toContain('AC-1.1');
  });
  it('README includes a traceability matrix heading', () => {
    const readme = renderAll(emptyProject('X')).find(f => f.name === 'README.md')!.content;
    expect(readme).toContain('## Traceability');
  });
});
