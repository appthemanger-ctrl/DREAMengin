import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('DreamR direct page route', () => {
  it('renders DreamRSection from app/dreamr/page.tsx', () => {
    const page = readFileSync(resolve(__dirname, '../app/dreamr/page.tsx'), 'utf8');

    expect(page).toContain("import DreamRSection from '@/dreamdmbar/homedream/dreamr/dreamsurface.dreamr'");
    expect(page).toContain('<DreamRSection');
    expect(page).toContain("redirect('/login')");
  });

  it('exposes DreamR from Discover so it is reachable on screen', () => {
    const discover = readFileSync(resolve(__dirname, '../app/discover/page.tsx'), 'utf8');

    expect(discover).toContain('href="/dreamr"');
    expect(discover).toContain('Open the human media feed');
  });
});
