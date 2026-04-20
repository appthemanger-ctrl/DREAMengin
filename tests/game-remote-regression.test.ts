import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = process.cwd();

describe('existing PS5 remote usage', () => {
  it('keeps GameEngin wired to the universal HUD while the legacy remote stays archived', () => {
    const src = readFileSync(join(REPO_ROOT, 'engins/engin.GameEngin.tsx'), 'utf8');

    expect(src).toContain("import GameHUD from '@/components/games/dream.hud.GameHUD'");
    expect(src).toContain('<GameHUD');
    expect(src).not.toContain('GameRemote');
  });

  it('keeps the embedded shared remote generic instead of a MADMAXI controller deck', () => {
    const src = readFileSync(join(REPO_ROOT, 'components/games/dream.remote.LegacyGameRemote.tsx'), 'utf8');

    expect(src).toContain('Shared Remote');
    expect(src).toContain("Inline game controls");
    expect(src).not.toContain('controller deck');
    expect(src).not.toContain('Default Remote');
  });

  it('keeps the original remote layout with a larger right analog and wrapped action buttons', () => {
    const src = readFileSync(join(REPO_ROOT, 'components/games/dream.remote.LegacyGameRemote.tsx'), 'utf8');

    expect(src).toContain('const RIGHT_PAD_R   = 70');
    expect(src).toContain('const LEFT_PAD_R    = 52');
    expect(src).toContain('RIGHT_STICK_RING_BUTTONS');
    expect(src).toContain("{ sym: 'L1', label: 'J+Spin'");
    expect(src).toContain("{ sym: 'R2', label: 'J+Shot'");
    expect(src).toContain("{ sym: '△', label: 'Duck'");
    expect(src).toContain('REMOTE_ACTION_PILLS');
    expect(src).toContain("{ sym: 'R1', label: 'Dash'");
    expect(src).toContain("clickAction=\"l3\"");
    expect(src).toContain("clickAction=\"r3\"");
    expect(src).toContain("clickSym=\"R3 / ×\"");
  });

  it('does not reintroduce the old duplicate UniversalDPad controller in GamesHub', () => {
    const src = readFileSync(join(REPO_ROOT, 'components/games/dream.GamesHub.tsx'), 'utf8');

    expect(src).not.toContain('function UniversalDPad');
    expect(src).not.toContain('interface DPadState');
  });

  it('keeps immersive sessions on the universal GameHUD instead of the legacy expandable remote', () => {
    const shellSrc = readFileSync(join(REPO_ROOT, 'engins/engin.GameEngin.tsx'), 'utf8');
    const hudSrc = readFileSync(join(REPO_ROOT, 'components/games/dream.hud.GameHUD.tsx'), 'utf8');

    expect(shellSrc).toContain('mode={expandedPlayable.mobileHudMode ?? \'buttons\'}');
    expect(hudSrc).toContain('<MobileGameHUD');
    expect(hudSrc).not.toContain('<GameRemote');
  });

  it('removes per-game on-screen remote pads in favor of the shared GameRemote', () => {
    // Source-game files that previously hosted their own touch pads have been
    // removed in the fusion-cartridge migration. The only legacy file left to
    // assert against is BabylonSideScroller (kept as MADMAXI flagship).
    const babylon = readFileSync(join(REPO_ROOT, 'components/games/dream.BabylonSideScroller.tsx'), 'utf8');

    expect(babylon).not.toContain('Virtual D-Pad');
    expect(babylon).not.toContain("handleVpad('jump', true)");
  });

  it('keeps the new Voidline GP rhythm-fusion playable through shared remote-compatible inputs', () => {
    const src = readFileSync(join(REPO_ROOT, 'components/games/dream.VoidlineGP.tsx'), 'utf8');
    // Voidline GP listens for both keyboard and remote-compatible Arrow keys.
    expect(src).toContain('ArrowLeft');
    expect(src).toContain('ArrowRight');
  });
});
