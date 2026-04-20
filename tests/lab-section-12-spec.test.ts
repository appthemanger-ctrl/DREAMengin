import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();

describe('README §12 Lab / LabEngin alignment', () => {
  it('keeps Side A Lab capabilities visible in the Lab daydream widgets', () => {
    const source = readFileSync(join(root, 'app/daydream/lab/page.tsx'), 'utf-8');

    expect(source).toContain('New Experiment');
    expect(source).toContain('Prototypes');
    expect(source).toContain('Test Runs');
    expect(source).toContain('Models');
    expect(source).toContain('Scenarios');
    expect(source).toContain('Simulation Viewer');
  });

  it('keeps Side B LabEngin capabilities and specialized dream windows visible', () => {
    const source = readFileSync(join(root, 'engins/engin.LabEngin.tsx'), 'utf-8');

    expect(source).toContain('State modeling');
    expect(source).toContain('System rules');
    expect(source).toContain('Simulation control');
    expect(source).toContain('Test orchestration');
    expect(source).toContain('Iteration environments');
    expect(source).toContain('Lab tool configuration');

    expect(source).toContain('Experiment Dream Window');
    expect(source).toContain('State Dream Window');
    expect(source).toContain('Model Dream Window');
    expect(source).toContain('Results Dream Window');
    expect(source).toContain('Parameter Dream Window');
    expect(source).toContain('Simulation Viewer Dream Window');
  });
});
