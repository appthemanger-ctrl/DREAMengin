import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('landing hero speech bubble copy', () => {
  it('uses updated wording without "deciding or pretending"', () => {
    const source = readFileSync(resolve(__dirname, '../components/LandingHero.tsx'), 'utf-8');
    expect(source).toContain('you paused there… deciding, pretending to decide');
    expect(source).not.toContain('you paused there… deciding or pretending to decide');
  });
});
