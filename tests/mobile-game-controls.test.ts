import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getLegacyMoveAction,
  MOBILE_HUD_BUTTON_RING,
  normalizeStickVector,
} from '@/lib/games/mobileControls';

const REPO_ROOT = process.cwd();

describe('shared mobile game controls', () => {
  it('normalizes joystick drags into a capped unit vector', () => {
    expect(normalizeStickVector(30, 0, 30)).toEqual({ x: 1, y: 0 });
    expect(normalizeStickVector(60, 0, 30)).toEqual({ x: 1, y: 0 });
    expect(normalizeStickVector(15, 15, 30)).toEqual({ x: 0.5, y: 0.5 });
  });

  it('maps analog motion back to the legacy movement actions for existing games', () => {
    expect(getLegacyMoveAction({ x: -1, y: 0 })).toBe('move-left');
    expect(getLegacyMoveAction({ x: 0, y: -1 })).toBe('move-up');
    expect(getLegacyMoveAction({ x: 0.8, y: 0.8 })).toBe('move-down-right');
    expect(getLegacyMoveAction({ x: 0.08, y: 0.04 })).toBeNull();
  });

  it('renders the corrected right-side action symbol as a circle', () => {
    expect(MOBILE_HUD_BUTTON_RING.find((button) => button.id === 'action')?.symbol).toBe('⭕️');
  });

  it('wires the immersive shell to the shared mobile HUD modes for example games', () => {
    const shellSrc = readFileSync(join(REPO_ROOT, 'components/daydream/GameEngin.tsx'), 'utf8');
    const hudSrc = readFileSync(join(REPO_ROOT, 'components/games/GameHUD.tsx'), 'utf8');
    const gamesSrc = readFileSync(join(REPO_ROOT, 'components/games/GamesHub.tsx'), 'utf8');
    const echoSrc = readFileSync(join(REPO_ROOT, 'components/games/EchoArena.tsx'), 'utf8');

    expect(shellSrc).toContain('<GameHUD');
    expect(hudSrc).toContain('<MobileGameHUD');
    expect(gamesSrc).toContain("mobileHudMode: 'buttons'");
    expect(gamesSrc).toContain("mobileHudMode: 'joystick'");
    expect(echoSrc).toContain('useRegisterMobileGameControls');
  });

  it('keeps the immersive mobile HUD tuned for faster thumb response and symmetric dual-stick layout', () => {
    const hudSrc = readFileSync(join(REPO_ROOT, 'components/games/MobileGameHUD.tsx'), 'utf8');
    const hudCss = readFileSync(join(REPO_ROOT, 'components/games/MobileGameHUD.module.css'), 'utf8');

    expect(hudSrc).toContain('leftCapRef.current');
    expect(hudSrc).toContain('rightCapRef.current');
    expect(hudSrc).toContain('function getStickTransform(vector: MobileControlVector)');
    // Both sticks are now the same size (symmetric dual-joystick layout)
    expect(hudCss).toContain('--dock-size: clamp(102px, 27vw, 136px);');
    // Face buttons live in a separate cluster, not the dock
    expect(hudCss).toContain('faceButtonCluster');
    expect(hudCss).toContain('will-change: transform;');
    expect(hudCss).toContain('transition: none;');
  });

  it('keeps fullscreen game sessions able to hide the messaging bar behind a tiny reopen pill', () => {
    const shellSrc = readFileSync(join(REPO_ROOT, 'components/daydream/GameEngin.tsx'), 'utf8');

    expect(shellSrc).toContain('const [sessionUtilityBarRevealed, setSessionUtilityBarRevealed] = useState(false);');
    expect(shellSrc).toContain("const SESSION_BAR_HIDE_COVER_HEIGHT = 122;");
    expect(shellSrc).toContain("aria-label={sessionUtilityBarRevealed ? 'Hide game chat bar' : 'Open game chat bar'}");
    expect(shellSrc).toContain("pointerEvents: sessionUtilityBarRevealed ? 'none' : 'auto'");
  });
});
