import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  LUCID_AVENUE_DISTRICTS,
  createInitialLucidAvenueState,
  getLucidAvenueHint,
  getLucidAvenueMissionChecklist,
  getLucidAvenueStoryBeat,
  interactInLucidAvenue,
  jamLucidAvenueGrid,
  moveLucidAvenuePlayer,
  requestLucidAvenueHint,
} from '@/lib/games/lucid-avenue-world';

const REPO_ROOT = process.cwd();

describe('Lucid Avenue game slice', () => {
  it('registers Lucid Avenue in the shared GamesHub catalog', () => {
    const src = readFileSync(join(REPO_ROOT, 'components/games/GamesHub.tsx'), 'utf8');

    expect(src).toContain("const LucidAvenue = dynamicImport(() => import('@/components/games/LucidAvenue')");
    expect(src).toContain("id: 'lucid-avenue'");
    expect(src).toContain("label: 'Lucid Avenue'");
    expect(src).toContain('Original LA-inspired retro city quest');
  });

  it('ships an original LA-inspired game flow instead of directly copying pokemon content', () => {
    const src = readFileSync(join(REPO_ROOT, 'components/games/LucidAvenue.tsx'), 'utf8');

    expect(src).toContain('Lucid Avenue');
    expect(src).toContain('original LA-inspired retro city quest');
    expect(src).toContain('not a copy of the archive’s copyrighted content');
    expect(src).toContain('eight connected districts, multiple west-side routes');
    expect(src).toContain('classic handheld-style sprite animation');
    expect(src).toContain('Trainer cam');
    expect(src).toContain('AI Hint');
    expect(src).toContain('3 runner outfits');
    expect(src).toContain('GameEngin uplink');
    expect(src).toContain('Jam Grid');
    expect(src).toContain('6900 Club');
    expect(src).toContain('Shared GameRemote directions work in the dedicated play session.');
  });

  it('starts on Shoreline with a larger multi-district mission arc instead of a single-room loop', () => {
    const state = createInitialLucidAvenueState();
    const checklist = getLucidAvenueMissionChecklist(state);

    expect(state.districtId).toBe('shoreline');
    expect(Object.keys(LUCID_AVENUE_DISTRICTS)).toHaveLength(8);
    expect(checklist).toContain('⬜ Meet Rook on Shoreline.');
    expect(checklist).toContain('⬜ Power the Midcity junction core.');
    expect(checklist).toContain('⬜ Help Dex patch the River Gates floodgrid.');
    expect(checklist).toContain('⬜ Secure Noa’s civic seal in Civic Center.');
    expect(checklist).toContain('⬜ Sync Vera’s sky array in Sunset Heights.');
  });

  it('lets the player meet Rook and recover the first shard through deterministic movement', () => {
    let state = createInitialLucidAvenueState();

    state = moveLucidAvenuePlayer(state, 1, 0);
    state = moveLucidAvenuePlayer(state, 1, 0);
    state = interactInLucidAvenue(state);
    expect(state.flags.metRook).toBe(true);

    state = {
      ...state,
      player: { x: 10, y: 3 },
    };
    state = moveLucidAvenuePlayer(state, 1, 0);

    expect(state.shards).toContain('shoreline-signal');
    expect(state.message).toContain('shard');
  });

  it('can complete the late-game objective chain and win at the observatory core', () => {
    let state = createInitialLucidAvenueState();
    state = {
      ...state,
      districtId: 'observatory',
      player: { x: 7, y: 5 },
      shards: [
        'shoreline-signal',
        'arts-signal',
        'midcity-signal-east',
        'midcity-signal-south',
        'river-signal-east',
        'studio-signal',
        'civic-signal',
        'heights-signal',
        'heights-signal-west',
      ],
      flags: {
        metRook: true,
        tramPass: true,
        junctionPowered: true,
        floodgatesPatched: true,
        skylineKey: true,
        civicSeal: true,
        relayAligned: true,
      },
    };

    state = interactInLucidAvenue(state);

    expect(state.outcome).toBe('win');
    expect(state.message).toContain('Lucid Angeles lights back up');
  });

  it('provides AI route hints and can surface them into the game log', () => {
    let state = createInitialLucidAvenueState();

    expect(getLucidAvenueHint(state)).toContain('talk to Rook');

    state = requestLucidAvenueHint(state);

    expect(state.message).toContain('AI route hint');
    expect(state.log[0]).toContain('AI route hint');
  });

  it('supports GameEngin-linked grid jamming and story beats for deeper system play', () => {
    let state = createInitialLucidAvenueState();

    const beat = getLucidAvenueStoryBeat(state);
    expect(beat.act).toContain('Act I');
    expect(beat.synopsis).toContain('Rook');

    state = jamLucidAvenueGrid(state);

    expect(state.jamTurns).toBeGreaterThan(0);
    expect(state.credits).toBe(0);
    expect(state.battery).toBe(1);
    expect(state.message).toContain('GameEngin uplink');
  });

  it('updates AI hints toward the expanded west-side mission chain', () => {
    let state = createInitialLucidAvenueState();
    state = {
      ...state,
      flags: {
        ...state.flags,
        metRook: true,
        tramPass: true,
        junctionPowered: true,
      },
      shards: ['shoreline-signal', 'arts-signal', 'midcity-signal-east'],
    };

    expect(getLucidAvenueHint(state)).toContain('River Gates');
  });
});
