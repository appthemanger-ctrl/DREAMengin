import { describe, expect, it } from 'vitest';

import {
  SECTION_REGISTRY,
  computeAffected,
  replaceSection,
  upsertSubsectionInSection,
  type SectionDescriptor,
  type SubsectionDescriptor,
} from '../scripts/readme-autosync';

describe('readme-autosync section targeting', () => {
  it('maps a single Engin file change to the parent section and targeted subsection only', () => {
    const affected = computeAffected(['engins/engin.CodeEngin.tsx'], SECTION_REGISTRY);
    const entry = affected.get('the-engins');

    expect(entry).toBeDefined();
    expect(entry?.subsections.has('code-engin')).toBe(true);
    expect(entry?.subsections.has('branding-engin')).toBe(false);
  });

  it('allows one file to affect multiple sections', () => {
    const affected = computeAffected(['.github/workflows/preflight.yml'], SECTION_REGISTRY);

    expect(affected.has('agents-workflow')).toBe(true);
    expect(affected.has('infra-ops')).toBe(true);
  });
});

describe('readme-autosync section rewriting helpers', () => {
  const section: SectionDescriptor = {
    id: 'testing',
    title: 'Testing',
    globs: ['tests/**'],
  };

  const subsection: SubsectionDescriptor = {
    id: 'code-engin',
    title: 'CodeEngin',
    globs: ['engins/engin.CodeEngin.tsx'],
  };

  it('replaces only the targeted section block', () => {
    const input = `# Demo\n\n## Testing\nOld content\n\n## License\nKeep\n`;
    const output = replaceSection(input, section, '## Testing\nNew content');

    expect(output).toContain('## Testing\nNew content');
    expect(output).toContain('## License\nKeep');
    expect(output).not.toContain('Old content');
  });

  it('updates a single subsection without touching sibling subsection blocks', () => {
    const input = `## The Engins\n\n### BrandingEngin\nBranding block\n\n### CodeEngin\nOld code block\n\n### LabEngin\nLab block\n`;

    const output = upsertSubsectionInSection(input, subsection, '### CodeEngin\nFresh code block');

    expect(output).toContain('### BrandingEngin\nBranding block');
    expect(output).toContain('### CodeEngin\nFresh code block');
    expect(output).toContain('### LabEngin\nLab block');
    expect(output).not.toContain('Old code block');
  });
});
