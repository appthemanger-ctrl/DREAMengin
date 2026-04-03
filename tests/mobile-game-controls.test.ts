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

  it('maps jump to the X face button in the mobile HUD ring', () => {
    const jumpButton = MOBILE_HUD_BUTTON_RING.find((button) => button.id === 'jump');

    expect(jumpButton?.symbol).toBe('×');
    expect(jumpButton?.slotClassName).toBe('slotX');
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

  it('keeps the immersive mobile HUD with right dock combining button ring and embedded joystick', () => {
    const hudSrc = readFileSync(join(REPO_ROOT, 'components/games/MobileGameHUD.tsx'), 'utf8');
    const hudCss = readFileSync(join(REPO_ROOT, 'components/games/MobileGameHUD.module.css'), 'utf8');
    const immersiveShellSrc = readFileSync(join(REPO_ROOT, 'app/daydream/game/ImmersiveGameShell.tsx'), 'utf8');

    expect(hudSrc).toContain('leftCapRef.current');
    expect(hudSrc).toContain('rightCapRef.current');
    expect(hudSrc).toContain('function getStickTransform(vector: MobileControlVector)');
    expect(hudSrc).toContain("loadPersisted('de:hud:offsetY', DEFAULT_REMOTE_OFFSET_Y");
    // Left dock is smaller; right dock is larger to fit button ring + joystick
    expect(hudCss).toContain('--dock-size: clamp(102px, 27vw, 136px);');
    expect(hudCss).toContain('--dock-size: clamp(180px, 46vw, 252px);');
    expect(hudCss).toContain("bottom: calc(env(safe-area-inset-bottom, 0px) + 26px);");
    // Right dock has both button ring slots and embedded joystick cap
    expect(hudCss).toContain('buttonCluster');
    expect(hudCss).toContain('rightJoyCap');
    expect(hudCss).toContain('will-change: transform;');
    expect(hudCss).toContain('transition: none;');
    expect(immersiveShellSrc).toContain('max(var(--de-hud-bottom');
  });

  it('keeps fullscreen game sessions able to hide the messaging bar behind a tiny reopen pill', () => {
    const shellSrc = readFileSync(join(REPO_ROOT, 'components/daydream/GameEngin.tsx'), 'utf8');

    expect(shellSrc).toContain('const [sessionUtilityBarRevealed, setSessionUtilityBarRevealed] = useState(false);');
    expect(shellSrc).toContain("const SESSION_BAR_HIDE_COVER_HEIGHT = 122;");
    expect(shellSrc).toContain("aria-label={sessionUtilityBarRevealed ? 'Hide game chat bar' : 'Open game chat bar'}");
    expect(shellSrc).toContain("pointerEvents: sessionUtilityBarRevealed ? 'none' : 'auto'");
  });
});
