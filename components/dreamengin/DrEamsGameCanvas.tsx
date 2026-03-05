'use client';

// components/dreamengin/DrEamsGameCanvas.tsx
// Canvas 2D renderer — assembles Dr. Eams from real body-part assets:
//   head_transparent.png · coat_transparent.png · arm1/2_transparent.png · shoe1/2_transparent.png
// Uses Boogie1.PNG for enemies, logo-icon.png for coins, dr-eams-torus.jpeg for bg art.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  type GameState,
  type InputState,
  type Platform,
  type Coin,
  type Enemy,
  type Player,
  type Particle,
  CANVAS_W,
  CANVAS_H,
  createGameState,
  stepGame,
} from '@/lib/game/dreamengin-game';

// ── Image loader ──────────────────────────────────────────────────────────────
interface GameImages {
  head:     HTMLImageElement | null;  // head_transparent.png   702×560
  coat:     HTMLImageElement | null;  // coat_transparent.png   622×741
  arm1:     HTMLImageElement | null;  // arm1_transparent.png   245×683
  arm2:     HTMLImageElement | null;  // arm2_transparent.png   374×529
  shoe1:    HTMLImageElement | null;  // shoe1_transparent.png  295×362
  shoe2:    HTMLImageElement | null;  // shoe2_transparent.png  295×416
  enemy:    HTMLImageElement | null;  // images/Boogie1.PNG     246×760
  coin:     HTMLImageElement | null;  // logo-icon.png          512×512
  dreambg:  HTMLImageElement | null;  // dr-eams-torus.jpeg     536×524
  dreamtxt: HTMLImageElement | null;  // logo_DREAM_transparent.png
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => resolve(img); // guard: null-check before drawImage
    img.src = src;
  });
}

async function loadAllImages(): Promise<GameImages> {
  const [head, coat, arm1, arm2, shoe1, shoe2, enemy, coin, dreambg, dreamtxt] =
    await Promise.all([
      loadImg('/head_transparent.png'),
      loadImg('/coat_transparent.png'),
      loadImg('/arm1_transparent.png'),
      loadImg('/arm2_transparent.png'),
      loadImg('/shoe1_transparent.png'),
      loadImg('/shoe2_transparent.png'),
      loadImg('/images/Boogie1.PNG'),
      loadImg('/logo-icon.png'),
      loadImg('/dr-eams-torus.jpeg'),
      loadImg('/logo_DREAM_transparent.png'),
    ]);
  return { head, coat, arm1, arm2, shoe1, shoe2, enemy, coin, dreambg, dreamtxt };
}

// ── Draw-size constants (natural px × S) ──────────────────────────────────────
// Character scale S chosen so total visual height ≈ 64px (fits nicely over 40px hitbox).
const S    = 0.038;
const HEAD = { w: Math.round(702*S), h: Math.round(560*S) } as const; // 27×21
const COAT = { w: Math.round(622*S), h: Math.round(741*S) } as const; // 24×28
const ARM1 = { w: Math.round(245*S), h: Math.round(683*S) } as const; //  9×26
const ARM2 = { w: Math.round(374*S), h: Math.round(529*S) } as const; // 14×20
const SHO1 = { w: Math.round(295*S), h: Math.round(362*S) } as const; // 11×14
const SHO2 = { w: Math.round(295*S), h: Math.round(416*S) } as const; // 11×16

// Enemy: draw top 48% of Boogie1.PNG so face+torso visible at 36×53 px
const ENEMY_DRAW_W = 36;
const ENEMY_DRAW_H = Math.round(ENEMY_DRAW_W * (760 * 0.48) / 246); // ≈ 53

// ── roundRect helper — no prototype mutation ────────────────────────────────
function rrect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  r: number,
): void {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

// ── Background ────────────────────────────────────────────────────────────────
function drawBackground(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  imgs: GameImages,
): void {
  const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  sky.addColorStop(0,    '#07091e');
  sky.addColorStop(0.50, '#0f2a5c');
  sky.addColorStop(1,    '#1a3a6a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Parallax stars (deterministic seed-based positions)
  for (let i = 0; i < 65; i++) {
    const sx  = (i * 137.508 + 20) % CANVAS_W;
    const sy  = (i * 93.7   + 15) % (CANVAS_H * 0.72);
    const px  = ((sx - cameraX * 0.14) % CANVAS_W + CANVAS_W) % CANVAS_W;
    ctx.fillStyle = `rgba(200,220,255,${0.3 + (i % 4) * 0.12})`;
    ctx.fillRect(px, sy, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
  }

  // dr-eams-torus portal image — faint parallax art in sky
  if (imgs.dreambg?.complete && imgs.dreambg.naturalWidth) {
    const bx = ((640 - cameraX * 0.22) % (CANVAS_W + 160) + (CANVAS_W + 160)) % (CANVAS_W + 160) - 80;
    ctx.globalAlpha = 0.11;
    ctx.drawImage(imgs.dreambg, bx, 20, 120, 117);
    ctx.globalAlpha = 1;
  }

  // Cloud-like glows
  ctx.fillStyle = 'rgba(255,255,255,0.045)';
  for (let i = 0; i < 6; i++) {
    const cx = ((i * 340 + 80 - cameraX * 0.28) % (CANVAS_W + 220) + (CANVAS_W + 220)) % (CANVAS_W + 220) - 110;
    const cy = 38 + (i % 3) * 44;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 65 + (i%3)*30, 16 + (i%2)*10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Platform ──────────────────────────────────────────────────────────────────
function drawPlatform(ctx: CanvasRenderingContext2D, p: Platform, camX: number): void {
  const rx = p.x - camX;
  if (rx + p.w < -20 || rx > CANVAS_W + 20) return;

  if (p.type === 'goal') {
    const g = ctx.createLinearGradient(rx, p.y, rx, p.y + p.h);
    g.addColorStop(0, 'rgba(200,152,26,0.92)');
    g.addColorStop(1, 'rgba(200,152,26,0.55)');
    ctx.fillStyle = g;
    ctx.beginPath(); rrect(ctx, rx, p.y, p.w, p.h, 10); ctx.fill();
    ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 14;
    ctx.strokeStyle = 'rgba(255,220,80,0.85)'; ctx.lineWidth = 2;
    ctx.beginPath(); rrect(ctx, rx, p.y, p.w, p.h, 10); ctx.stroke();
    ctx.shadowBlur = 0;
    return;
  }

  if (p.type === 'moving') {
    const g = ctx.createLinearGradient(rx, p.y, rx, p.y + p.h);
    g.addColorStop(0, 'rgba(42,138,184,0.88)');
    g.addColorStop(1, 'rgba(20,80,130,0.55)');
    ctx.fillStyle = g;
    ctx.beginPath(); rrect(ctx, rx, p.y, p.w, p.h, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(130,210,255,0.75)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); rrect(ctx, rx, p.y, p.w, p.h, 10); ctx.stroke();
    return;
  }

  // Solid / ground
  const isGround = p.h > 30;
  if (isGround) {
    const g = ctx.createLinearGradient(rx, p.y, rx, p.y + p.h);
    g.addColorStop(0, 'rgba(42,100,160,0.88)');
    g.addColorStop(1, 'rgba(15,42,92,0.95)');
    ctx.fillStyle = g;
    ctx.fillRect(rx, p.y, p.w, p.h);
    ctx.fillStyle = 'rgba(42,200,120,0.60)';
    ctx.fillRect(rx, p.y, p.w, 5);          // grass stripe
    ctx.strokeStyle = 'rgba(130,180,255,0.25)';
    ctx.lineWidth = 1; ctx.strokeRect(rx, p.y, p.w, p.h);
  } else {
    const g = ctx.createLinearGradient(rx, p.y, rx, p.y + p.h);
    g.addColorStop(0, 'rgba(255,255,255,0.30)');
    g.addColorStop(1, 'rgba(160,195,240,0.36)');
    ctx.fillStyle = g;
    ctx.beginPath(); rrect(ctx, rx, p.y, p.w, p.h, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(160,195,240,0.55)'; ctx.lineWidth = 1;
    ctx.beginPath(); rrect(ctx, rx, p.y, p.w, p.h, 8); ctx.stroke();
  }
}

// ── Coin ──────────────────────────────────────────────────────────────────────
function drawCoin(
  ctx: CanvasRenderingContext2D,
  c: Coin,
  camX: number,
  imgs: GameImages,
): void {
  if (c.collected) return;
  const rx = c.x - camX + c.w / 2;
  if (rx < -30 || rx > CANVAS_W + 30) return;
  const ry = c.y + c.h / 2;

  if (c.isGoal) {
    // Goal star
    const t    = (c.animTick ?? 0) * 0.065;
    const r    = 17 * (1 + Math.sin(t) * 0.12);
    ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 20;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const ao = { x: rx + Math.cos(((i*2-0.5)*Math.PI)/5)*r,     y: ry + Math.sin(((i*2-0.5)*Math.PI)/5)*r };
      const ai = { x: rx + Math.cos(((i*2+0.5)*Math.PI)/5)*r*0.42, y: ry + Math.sin(((i*2+0.5)*Math.PI)/5)*r*0.42 };
      if (i === 0) ctx.moveTo(ao.x, ao.y); else ctx.lineTo(ao.x, ao.y);
      ctx.lineTo(ai.x, ai.y);
    }
    ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
    return;
  }

  // Dream coin — use logo-icon.png with squish animation
  const squish = Math.abs(Math.sin((c.animTick ?? 0) * 0.09)) * 0.28 + 0.85;
  ctx.save();
  ctx.translate(rx, ry);
  ctx.scale(squish, 1);

  if (imgs.coin?.complete && imgs.coin.naturalWidth) {
    ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 7;
    ctx.drawImage(imgs.coin, -10, -10, 20, 20);
    ctx.shadowBlur = 0;
  } else {
    // Fallback gold circle
    ctx.fillStyle = '#c8981a';
    ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff8dc'; ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('D', 0, 0.5);
  }
  ctx.restore();
}

// ── Enemy (BoogieMan) ─────────────────────────────────────────────────────────
function drawEnemy(
  ctx: CanvasRenderingContext2D,
  e: Enemy,
  camX: number,
  imgs: GameImages,
): void {
  if (!e.alive) return;
  const rx = e.x - camX;
  if (rx + e.w < -40 || rx > CANVAS_W + 40) return;

  const cx = rx + e.w / 2;
  const by = e.y + e.h; // feet level

  if (e.stomped) {
    // Flattened Boogie
    ctx.save();
    ctx.translate(cx, by);
    ctx.scale(1.4, 0.28);
    if (imgs.enemy?.complete && imgs.enemy.naturalWidth) {
      ctx.drawImage(imgs.enemy, 0, 0, 246, 365, -18, -32, ENEMY_DRAW_W, ENEMY_DRAW_H);
    } else {
      ctx.fillStyle = '#c0392b';
      ctx.beginPath(); ctx.ellipse(0, 0, 20, 6, 0, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
    return;
  }

  const walkBob = Math.sin(e.x * 0.05) * 3;

  if (imgs.enemy?.complete && imgs.enemy.naturalWidth) {
    ctx.save();
    // Flip if facing right
    if (e.facingRight) {
      ctx.translate(cx, 0);
      ctx.scale(-1, 1);
      ctx.translate(-cx, 0);
    }
    // Draw top 48% of Boogie1.PNG (head + torso + hands)
    // src: 0,0,246,365 → dest centered on hitbox, bottom=by
    const dx = cx - ENEMY_DRAW_W / 2;
    const dy = by - ENEMY_DRAW_H + walkBob * 0.5;
    ctx.shadowColor = 'rgba(200,0,0,0.45)'; ctx.shadowBlur = 10;
    ctx.drawImage(imgs.enemy, 0, 0, 246, 365, dx, dy, ENEMY_DRAW_W, ENEMY_DRAW_H);
    ctx.shadowBlur = 0;
    ctx.restore();
  } else {
    // Fallback: drawn enemy
    ctx.fillStyle = '#c0392b';
    ctx.shadowColor = 'rgba(200,0,0,0.4)'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.ellipse(cx, by - 18, 14, 18, 0, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'white';
    const ed = e.facingRight ? 1 : -1;
    ctx.beginPath(); ctx.arc(cx + ed*6, by - 22, 4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(cx + ed*7.5, by - 22, 2, 0, Math.PI*2); ctx.fill();
  }
}

// ── Player (assembled from body parts) ───────────────────────────────────────
function drawPlayer(
  ctx: CanvasRenderingContext2D,
  p: Player,
  camX: number,
  imgs: GameImages,
): void {
  if (!p.alive) return;
  const rx = p.x - camX;
  if (rx + p.w < -60 || rx > CANVAS_W + 60) return;
  if (p.invincible > 0 && Math.floor(p.invincible / 4) % 2 === 0) return;

  const cx = rx + p.w / 2;   // horizontal centre
  const by = p.y + p.h;      // feet level (bottom of hitbox)

  // Animation angles
  const walking    = Math.abs(p.vx) > 0.4;
  const jumping    = !p.onGround;
  const swing      = walking ? Math.sin(p.animTick * 0.30) * 0.38 : 0;
  const dir        = p.facingRight ? 1 : -1;

  // Arm angle: arms swing OPPOSITE to same-side leg
  const armSwing   = jumping ? -0.65 : -swing;
  // Jump pose: legs tuck slightly
  const legSwing   = jumping ? 0.30  :  swing;

  // Y positions stacked bottom-up:
  //   by → shoe bottom
  //   coatBottom = by - SHO1.h + 3 (slight overlap)
  //   headBottom = coatBottom - COAT.h + 5
  const shoeTopY   = by - SHO1.h;
  const coatBottomY = by - SHO1.h + 3;        // coat overlaps shoe top
  const coatTopY   = coatBottomY - COAT.h;
  const headBottomY = coatTopY + 5;            // head overlaps coat top
  const headTopY   = headBottomY - HEAD.h;
  const shoulderY  = coatTopY + 4;            // arm pivot = near coat top

  // Shadow underfoot
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(cx, by + 3, 16, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Helper: draw a part image horizontally flipped around cx when facing left
  const drawPart = (
    img: HTMLImageElement | null,
    pw: number, ph: number,
    dx: number, dy: number,
    pivotX: number, pivotY: number,
    angle: number,
    flipH: boolean,
  ) => {
    if (!img?.complete || !img.naturalWidth) return;
    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.rotate(angle);
    if (flipH) ctx.scale(-1, 1);
    ctx.drawImage(img, dx - pivotX, dy - pivotY, pw, ph);
    ctx.restore();
  };

  // ── 1. BACK ARM (behind torso) ───────────────────────────────────────────
  // When facing RIGHT: back arm = LEFT arm → pivot slightly left of centre
  // Swing angle is reversed relative to front arm
  drawPart(
    imgs.arm1, ARM1.w, ARM1.h,
    cx - dir * 7 - ARM1.w / 2,   // top-left x of arm
    shoulderY,                    // top-left y (shoulder)
    cx - dir * 7,                 // pivot x
    shoulderY,                    // pivot y (top of arm)
    armSwing * -dir,
    !p.facingRight,
  );

  // ── 2. BACK SHOE ─────────────────────────────────────────────────────────
  drawPart(
    imgs.shoe1, SHO1.w, SHO1.h,
    cx - dir * 5 - SHO1.w / 2,
    shoeTopY,
    cx - dir * 5,
    shoeTopY,
    -legSwing * dir,
    !p.facingRight,
  );

  // ── 3. COAT (torso) ──────────────────────────────────────────────────────
  // No rotation — torso stays upright
  if (imgs.coat?.complete && imgs.coat.naturalWidth) {
    ctx.save();
    if (!p.facingRight) {
      ctx.translate(cx, 0); ctx.scale(-1, 1); ctx.translate(-cx, 0);
    }
    ctx.drawImage(imgs.coat, cx - COAT.w / 2, coatTopY, COAT.w, COAT.h);
    ctx.restore();
  } else {
    // Fallback torso
    ctx.fillStyle = '#2a8ab8';
    ctx.beginPath();
    rrect(ctx, cx - 12, coatTopY + 3, 24, COAT.h - 3, 5);
    ctx.fill();
  }

  // ── 4. FRONT SHOE ────────────────────────────────────────────────────────
  drawPart(
    imgs.shoe2, SHO2.w, SHO2.h,
    cx + dir * 3 - SHO2.w / 2,
    shoeTopY,
    cx + dir * 3,
    shoeTopY,
    legSwing * dir,
    !p.facingRight,
  );

  // ── 5. HEAD ──────────────────────────────────────────────────────────────
  if (imgs.head?.complete && imgs.head.naturalWidth) {
    ctx.save();
    if (!p.facingRight) {
      ctx.translate(cx, 0); ctx.scale(-1, 1); ctx.translate(-cx, 0);
    }
    ctx.drawImage(imgs.head, cx - HEAD.w / 2, headTopY, HEAD.w, HEAD.h);
    ctx.restore();
  } else {
    // Fallback head circle
    ctx.fillStyle = '#3aabdc';
    ctx.beginPath(); ctx.arc(cx, headTopY + HEAD.h/2, HEAD.w/2, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(cx + dir*5, headTopY + HEAD.h/2, 4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#0d1f40';
    ctx.beginPath(); ctx.arc(cx + dir*6, headTopY + HEAD.h/2, 2, 0, Math.PI*2); ctx.fill();
  }

  // ── 6. FRONT ARM (in front of torso) ─────────────────────────────────────
  drawPart(
    imgs.arm2, ARM2.w, ARM2.h,
    cx + dir * 6 - ARM2.w / 2,
    shoulderY,
    cx + dir * 6,
    shoulderY,
    armSwing * dir,
    !p.facingRight,
  );
}

// ── Particles ─────────────────────────────────────────────────────────────────
function drawParticle(ctx: CanvasRenderingContext2D, p: Particle, camX: number): void {
  const rx = p.x - camX;
  if (rx < -20 || rx > CANVAS_W + 20) return;
  ctx.globalAlpha = p.life / p.maxLife;
  ctx.fillStyle = p.color;
  ctx.beginPath(); ctx.arc(rx, p.y, p.size * (p.life / p.maxLife), 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 1;
}

// ── HUD ───────────────────────────────────────────────────────────────────────
function drawHUD(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.fillStyle = 'rgba(0,0,0,0.40)';
  ctx.beginPath(); rrect(ctx, 12, 12, 290, 52, 12); ctx.fill();

  ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  ctx.font = 'bold 14px "Space Grotesk", sans-serif';
  ctx.fillStyle = '#c8981a';
  ctx.fillText(`✦ ${state.score.toLocaleString()}`, 24, 18);
  ctx.fillStyle = '#ff6b6b';
  ctx.fillText(`♥ × ${state.lives}`, 135, 18);
  ctx.fillStyle = '#7dd3fc';
  ctx.fillText(`LEVEL ${state.level}/3`, 218, 18);
  ctx.font = '12px "Space Grotesk", sans-serif';
  ctx.fillStyle = 'rgba(200,220,255,0.8)';
  ctx.fillText(
    `Coins: ${state.coins.filter(c=>!c.isGoal&&c.collected).length}/${state.coins.filter(c=>!c.isGoal).length}  ·  reach the ★ star`,
    24, 40,
  );
}

// ── Full-screen overlays ──────────────────────────────────────────────────────
function drawOverlay(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (state.status === 'playing' || state.status === 'playerDead') return;

  ctx.fillStyle = 'rgba(0,0,0,0.68)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

  if (state.status === 'levelComplete') {
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 44px "Space Grotesk", sans-serif';
    ctx.fillText('DREAM COMPLETE!', CANVAS_W/2, CANVAS_H/2 - 32);
    ctx.fillStyle = '#7dd3fc';
    ctx.font = '22px "Space Grotesk", sans-serif';
    ctx.fillText(`Score: ${state.score.toLocaleString()}`, CANVAS_W/2, CANVAS_H/2 + 18);
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = '16px "Space Grotesk", sans-serif';
    ctx.fillText('Next level loading…', CANVAS_W/2, CANVAS_H/2 + 52);
    return;
  }
  if (state.status === 'gameOver') {
    ctx.fillStyle = '#ff6b6b';
    ctx.font = 'bold 50px "Space Grotesk", sans-serif';
    ctx.fillText('GAME OVER', CANVAS_W/2, CANVAS_H/2 - 42);
    ctx.fillStyle = '#c8981a';
    ctx.font = '24px "Space Grotesk", sans-serif';
    ctx.fillText(`Final Score: ${state.score.toLocaleString()}`, CANVAS_W/2, CANVAS_H/2 + 12);
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = '16px "Space Grotesk", sans-serif';
    ctx.fillText('Press Space / Enter or tap to play again', CANVAS_W/2, CANVAS_H/2 + 52);
    return;
  }
  if (state.status === 'victory') {
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 40px "Space Grotesk", sans-serif';
    ctx.fillText('YOU DID IT, DR. EAMS!', CANVAS_W/2, CANVAS_H/2 - 52);
    ctx.fillStyle = '#7dd3fc';
    ctx.font = '24px "Space Grotesk", sans-serif';
    ctx.fillText('All 3 Levels Complete!', CANVAS_W/2, CANVAS_H/2 + 4);
    ctx.fillStyle = '#c8981a';
    ctx.font = '28px "Space Grotesk", sans-serif';
    ctx.fillText(`Total Score: ${state.score.toLocaleString()}`, CANVAS_W/2, CANVAS_H/2 + 44);
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = '16px "Space Grotesk", sans-serif';
    ctx.fillText('Press Space / Enter or tap to play again', CANVAS_W/2, CANVAS_H/2 + 84);
    return;
  }
}

// ── Virtual D-pad (touch) ─────────────────────────────────────────────────────
interface VPad { left: boolean; right: boolean; jump: boolean; }

function drawVPad(ctx: CanvasRenderingContext2D, pad: VPad): void {
  const base = 0.46;
  const BTN: [number, number, number, number, string, string][] = [
    [18,  CANVAS_H-76, 60, 54, '◀', '#2a8ab8'],
    [86,  CANVAS_H-76, 60, 54, '▶', '#2a8ab8'],
    [CANVAS_W-90, CANVAS_H-76, 72, 54, 'JUMP', '#c8981a'],
  ];
  const active = [pad.left, pad.right, pad.jump];

  BTN.forEach(([bx, by, bw, bh, label, color], i) => {
    ctx.globalAlpha = active[i] ? 0.82 : base;
    ctx.fillStyle = color;
    ctx.beginPath(); rrect(ctx, bx, by, bw, bh, 12); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'white';
    ctx.font = label === 'JUMP' ? 'bold 14px monospace' : 'bold 22px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, bx + bw/2, by + bh/2);
  });
}

// ── Title / start screen ──────────────────────────────────────────────────────
function drawTitleScreen(
  ctx: CanvasRenderingContext2D,
  imgs: GameImages,
  tick: number,
): void {
  drawBackground(ctx, 0, imgs);

  // Card bg
  ctx.fillStyle = 'rgba(7,9,30,0.72)';
  ctx.beginPath(); rrect(ctx, CANVAS_W/2-270, CANVAS_H/2-130, 540, 270, 28); ctx.fill();
  ctx.strokeStyle = 'rgba(200,152,26,0.4)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); rrect(ctx, CANVAS_W/2-270, CANVAS_H/2-130, 540, 270, 28); ctx.stroke();

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

  // DREAM text logo
  if (imgs.dreamtxt?.complete && imgs.dreamtxt.naturalWidth) {
    ctx.globalAlpha = 0.9;
    ctx.drawImage(imgs.dreamtxt, CANVAS_W/2 - 80, CANVAS_H/2 - 118, 160, 44);
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 46px "Space Grotesk", sans-serif';
  ctx.fillText('DR. EAMS', CANVAS_W/2, CANVAS_H/2 - 44);

  ctx.fillStyle = '#7dd3fc';
  ctx.font = 'bold 20px "Space Grotesk", sans-serif';
  ctx.fillText('Dream Platformer', CANVAS_W/2, CANVAS_H/2 + 2);

  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.font = '14px "Space Grotesk", sans-serif';
  ctx.fillText('Collect Dream Coins  ·  Stomp the BoogieMan  ·  Reach the ★ star', CANVAS_W/2, CANVAS_H/2 + 36);
  ctx.fillText('Arrow keys / WASD  +  Space to jump  ·  Double-jump in air', CANVAS_W/2, CANVAS_H/2 + 58);

  // Pulsing CTA
  ctx.globalAlpha = 0.72 + Math.sin(tick * 0.05) * 0.28;
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 18px "Space Grotesk", sans-serif';
  ctx.fillText('▶  Click or Press Space to Start', CANVAS_W/2, CANVAS_H/2 + 100);
  ctx.globalAlpha = 1;

  // Mini character preview (assembled from parts if available)
  const px = CANVAS_W/2 - 250, py = CANVAS_H/2 - 80;
  if (imgs.coat?.complete && imgs.coat.naturalWidth) {
    ctx.drawImage(imgs.coat,  px + 2,  py + 22, COAT.w * 2, COAT.h * 2);
    ctx.drawImage(imgs.head,  px - 2,  py,       HEAD.w * 2, HEAD.h * 2);
    ctx.drawImage(imgs.shoe1, px,      py + 22 + COAT.h*2 - 4, SHO1.w * 2, SHO1.h * 2);
    ctx.drawImage(imgs.shoe2, px + 12, py + 22 + COAT.h*2 - 4, SHO2.w * 2, SHO2.h * 2);
    ctx.drawImage(imgs.arm1,  px - 8,  py + 26,  ARM1.w * 2, ARM1.h * 2);
    ctx.drawImage(imgs.arm2,  px + 24, py + 28,  ARM2.w * 2, ARM2.h * 2);
  }

  // Mini enemy preview
  if (imgs.enemy?.complete && imgs.enemy.naturalWidth) {
    ctx.drawImage(imgs.enemy, 0, 0, 246, 365, CANVAS_W/2 + 210, CANVAS_H/2 - 70, 36, 56);
  }
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DrEamsGameCanvas() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const stateRef   = useRef<GameState>(createGameState(1));
  const inputRef   = useRef<InputState>({ left: false, right: false, jump: false, jumpJustPressed: false });
  const vpadRef    = useRef<VPad>({ left: false, right: false, jump: false });
  const rafRef     = useRef<number>(0);
  const imgsRef    = useRef<GameImages>({
    head: null, coat: null, arm1: null, arm2: null,
    shoe1: null, shoe2: null, enemy: null, coin: null,
    dreambg: null, dreamtxt: null,
  });
  const titleTickRef = useRef(0);
  const [started, setStarted]   = useState(false);
  const [imgsReady, setImgsReady] = useState(false);

  // Load images once
  useEffect(() => {
    loadAllImages().then(imgs => { imgsRef.current = imgs; setImgsReady(true); });
  }, []);

  const resetGame = useCallback(() => {
    stateRef.current = createGameState(1);
    setStarted(true);
  }, []);

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const inp = inputRef.current;
      if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') inp.left  = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') inp.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        if (!inp.jump) inp.jumpJustPressed = true;
        inp.jump = true;
      }
      if ((e.key === ' ' || e.key === 'Enter') && !started) { resetGame(); }
      if ((e.key === ' ' || e.key === 'Enter') &&
          (stateRef.current.status === 'gameOver' || stateRef.current.status === 'victory')) {
        stateRef.current = createGameState(1);
      }
      e.preventDefault();
    };
    const up = (e: KeyboardEvent) => {
      const inp = inputRef.current;
      if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') inp.left  = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') inp.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') inp.jump = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup',   up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [started, resetGame]);

  // GameRemote events — fired by components/games/GameRemote.tsx via CustomEvent('de-game-input')
  useEffect(() => {
    const handler = (e: Event) => {
      const { action, active } = (e as CustomEvent<{ action: string; active: boolean }>).detail;
      const inp = inputRef.current;
      if (action === 'move-left'  || action === 'move-up-left'   || action === 'move-down-left')  inp.left  = active;
      if (action === 'move-right' || action === 'move-up-right'  || action === 'move-down-right') inp.right = active;
      if (action === 'move-stop') { inp.left = false; inp.right = false; }
      if (action === 'jump' || action === 'jump-spin' || action === 'jump-shoot') {
        if (active && !inp.jump) inp.jumpJustPressed = true;
        inp.jump = active;
      }
    };
    window.addEventListener('de-game-input', handler);
    return () => window.removeEventListener('de-game-input', handler);
  }, []);

  // Touch virtual d-pad
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const zone = (touch: Touch): 'left' | 'right' | 'jump' | null => {
      const r  = canvas.getBoundingClientRect();
      const tx = (touch.clientX - r.left) * (CANVAS_W / r.width);
      const ty = (touch.clientY - r.top)  * (CANVAS_H / r.height);
      if (ty > CANVAS_H - 86) {
        if (tx >= 10  && tx <= 78)  return 'left';
        if (tx >= 78  && tx <= 156) return 'right';
        if (tx >= CANVAS_W - 100 && tx <= CANVAS_W - 10) return 'jump';
      }
      return null;
    };

    const apply = (touches: TouchList) => {
      const pad: VPad = { left: false, right: false, jump: false };
      for (let i = 0; i < touches.length; i++) {
        const z = zone(touches[i]);
        if (z === 'left')  pad.left  = true;
        else if (z === 'right') pad.right = true;
        else if (z === 'jump')  pad.jump  = true;
      }
      vpadRef.current = pad;
      const inp = inputRef.current;
      inp.left  = pad.left;
      inp.right = pad.right;
      if (pad.jump && !inp.jump) inp.jumpJustPressed = true;
      inp.jump  = pad.jump;
    };

    const onStart = (e: TouchEvent) => {
      e.preventDefault(); apply(e.touches);
      if (!started) resetGame();
      const s = stateRef.current;
      if (s.status === 'gameOver' || s.status === 'victory') stateRef.current = createGameState(1);
    };
    const onMove  = (e: TouchEvent) => { e.preventDefault(); apply(e.touches); };
    const onEnd   = (e: TouchEvent) => { e.preventDefault(); apply(e.touches); };

    canvas.addEventListener('touchstart', onStart, { passive: false });
    canvas.addEventListener('touchmove',  onMove,  { passive: false });
    canvas.addEventListener('touchend',   onEnd,   { passive: false });
    return () => {
      canvas.removeEventListener('touchstart', onStart);
      canvas.removeEventListener('touchmove',  onMove);
      canvas.removeEventListener('touchend',   onEnd);
    };
  }, [started, resetGame]);

  // Title screen loop (before game starts)
  useEffect(() => {
    if (started) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    

    let id: number;
    const loop = () => {
      titleTickRef.current++;
      drawTitleScreen(ctx, imgsRef.current, titleTickRef.current);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [started, imgsReady]);

  // Game loop
  useEffect(() => {
    if (!started) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    

    const tick = () => {
      const inp = inputRef.current;
      stateRef.current = stepGame(stateRef.current, inp);

      // Reset one-frame flags
      inp.jumpJustPressed = false;

      const s   = stateRef.current;
      const cam = s.cameraX;
      const imgs = imgsRef.current;

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      drawBackground(ctx, cam, imgs);
      for (const p of s.platforms) drawPlatform(ctx, p, cam);
      for (const c of s.coins)     drawCoin(ctx, c, cam, imgs);
      for (const e of s.enemies)   drawEnemy(ctx, e, cam, imgs);
      for (const p of s.particles) drawParticle(ctx, p, cam);
      drawPlayer(ctx, s.player, cam, imgs);
      drawHUD(ctx, s);
      drawVPad(ctx, vpadRef.current);
      drawOverlay(ctx, s);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [started]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="rounded-2xl shadow-2xl cursor-pointer focus:outline-none"
        style={{ maxWidth: '100%', touchAction: 'none' }}
        onClick={() => { if (!started) resetGame(); }}
        tabIndex={0}
        aria-label="Dr. Eams Dream Platformer Game"
      />
      <p className="text-xs text-slate-500 text-center">
        ← → / A D to move &nbsp;·&nbsp; ↑ / W / Space to jump (double-jump) &nbsp;·&nbsp; Stomp the BoogieMan &nbsp;·&nbsp; Reach the ★
      </p>
    </div>
  );
}
