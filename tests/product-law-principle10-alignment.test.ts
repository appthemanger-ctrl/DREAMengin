import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');

function read(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

describe('Product Law principle 10 alignment', () => {
  it('keeps README and LAW principle 10 language aligned', () => {
    const readme = read('README.md');
    const law = read('docs/LAW.md');
    const phrase = 'No artificial "repurpose before invent" rule.';

    expect(readme).toContain(phrase);
    expect(law).toContain(phrase);
  });

  it('does not contain legacy blanket repurpose-before-invent directives in guardrails docs', () => {
    const guardrails = read('docs/engineering/guardrails.md');
    const playbook = read('docs/AGENT_PLAYBOOK.md');
    const toolkit = read('docs/COPILOT_TOOLKIT.md');

    expect(guardrails).not.toContain('Repurpose existing systems before adding new ones.');
    expect(playbook).not.toContain('Repurpose existing systems before adding new ones');
    expect(toolkit).not.toContain('Rename and repurpose before rebuilding.');
  });
});
