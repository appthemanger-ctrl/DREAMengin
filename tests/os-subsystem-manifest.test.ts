import { describe, expect, it } from 'vitest';
import {
  DREAMENGIN_OS_SUBSYSTEM_MANIFEST,
  buildDreamenginOSSubsystemManifest,
} from '@/lib/dreamengin/osSubsystemManifest';

describe('DREAMengin OS subsystem manifest', () => {
  it('registers AI, daydream, engin, connector, and runtime families', () => {
    const manifest = buildDreamenginOSSubsystemManifest();
    const familyIds = manifest.families.map((family) => family.id);

    expect(familyIds).toContain('ai');
    expect(familyIds).toContain('daydreams');
    expect(familyIds).toContain('engins');
    expect(familyIds).toContain('connectors');
    expect(familyIds).toContain('runtime');
  });

  it('includes triad combined mode and all creative engins', () => {
    const labels = DREAMENGIN_OS_SUBSYSTEM_MANIFEST.nodes.map((node) => node.label);

    expect(labels).toContain('Triad Consensus');
    expect(labels).toContain('GameEngin');
    expect(labels).toContain('StarMakerEngin');
    expect(labels).toContain('CodeEngin');
    expect(labels).toContain('LabEngin');
    expect(labels).toContain('BrandingEngin');
    expect(labels).toContain('ContentEngin');
  });
});
