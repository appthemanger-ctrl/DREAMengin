export type DistrictId =
  | 'shoreline'
  | 'arts-district'
  | 'midcity'
  | 'studio-lot'
  | 'sunset-heights'
  | 'observatory';

export type LucidFlag = 'metRook' | 'tramPass' | 'junctionPowered' | 'skylineKey' | 'relayAligned';
type Requirement = LucidFlag | 'allShards';

export interface Position {
  x: number;
  y: number;
}

export interface DistrictExit {
  id: string;
  position: Position;
  to: DistrictId;
  spawn: Position;
  label: string;
  requirements?: Requirement[];
  blockedMessage?: string;
}

export interface PatrolRoute {
  id: string;
  name: string;
  path: Position[];
  emoji: string;
}

export interface ShardPickup {
  id: string;
  position: Position;
  label: string;
}

export interface CachePickup {
  id: string;
  position: Position;
  label: string;
  credits?: number;
  battery?: number;
}

export interface LucidNpc {
  id: string;
  name: string;
  emoji: string;
  position: Position;
  title: string;
}

export interface LucidTerminal {
  id: string;
  name: string;
  emoji: string;
  position: Position;
}

export interface DistrictLock {
  id: string;
  position: Position;
  requirements: Requirement[];
  blockedMessage: string;
  unlockedLabel: string;
}

export interface LucidDistrict {
  id: DistrictId;
  name: string;
  subtitle: string;
  color: string;
  map: string[];
  spawn: Position;
  atmosphere: string[];
  exits: DistrictExit[];
  patrols: PatrolRoute[];
  shards: ShardPickup[];
  caches: CachePickup[];
  npcs: LucidNpc[];
  terminals: LucidTerminal[];
  locks: DistrictLock[];
}

export interface LucidAvenueState {
  districtId: DistrictId;
  player: Position;
  turn: number;
  heat: number;
  battery: number;
  credits: number;
  scanTurns: number;
  shards: string[];
  caches: string[];
  flags: Record<LucidFlag, boolean>;
  patrolSteps: Record<string, number>;
  log: string[];
  message: string;
  outcome: 'playing' | 'win' | 'lose';
  visitedDistrictIds: DistrictId[];
}

const TOTAL_SHARDS = 6;
const MAX_HEAT = 6;
const MAX_LOG_ENTRIES = 6;

export const LUCID_AVENUE_DISTRICTS: Record<DistrictId, LucidDistrict> = {
  shoreline: {
    id: 'shoreline',
    name: 'Shoreline',
    subtitle: 'Neon surf, quiet alleys, and the first stolen signal on the coast.',
    color: '#38bdf8',
    map: [
      '###############',
      '#.............#',
      '#.###.###.###.#',
      '#.#.........#.#',
      '#.#.#####.#.#.#',
      '#...#...#.#...#',
      '###.#.#.#.###.#',
      '#...#.#...#...#',
      '#.###.#####.#.#',
      '#.............#',
      '###############',
    ],
    spawn: { x: 1, y: 1 },
    atmosphere: [
      'Rook is waiting by the flood wall with your burner badge.',
      'The beach district is calm, but patrol loops already cut the side streets.',
      'Every shard you recover stabilizes the blackout rolling through Lucid Angeles.',
    ],
    exits: [
      {
        id: 'shoreline-to-arts',
        position: { x: 13, y: 1 },
        to: 'arts-district',
        spawn: { x: 1, y: 9 },
        label: 'Slip into the Arts District',
      },
    ],
    patrols: [
      {
        id: 'shoreline-patrol-1',
        name: 'Coastal scanner',
        emoji: '🚓',
        path: [
          { x: 11, y: 7 },
          { x: 12, y: 7 },
          { x: 13, y: 7 },
          { x: 12, y: 7 },
          { x: 11, y: 7 },
          { x: 11, y: 8 },
        ],
      },
    ],
    shards: [
      { id: 'shoreline-signal', position: { x: 11, y: 3 }, label: 'Pier shard' },
    ],
    caches: [
      { id: 'shoreline-cache', position: { x: 9, y: 7 }, label: 'Hidden boardwalk stash', credits: 10, battery: 1 },
    ],
    npcs: [
      { id: 'rook', name: 'Rook', emoji: '🧥', position: { x: 3, y: 1 }, title: 'Fixer' },
    ],
    terminals: [],
    locks: [],
  },
  'arts-district': {
    id: 'arts-district',
    name: 'Arts District',
    subtitle: 'Murals, rooftops, side lots, and the tram broker who knows every back channel.',
    color: '#f472b6',
    map: [
      '###############',
      '#....#....#...#',
      '#.##.#.##.#.#.#',
      '#.#..#....#.#.#',
      '#.#.#####.#.#.#',
      '#.#.....#.#...#',
      '#.#####.#.###.#',
      '#.....#.#.....#',
      '#.###.#.#####.#',
      '#...#.........#',
      '###############',
    ],
    spawn: { x: 1, y: 9 },
    atmosphere: [
      'Mika can put you on the tram network once you prove the signal job is real.',
      'The alleys here are narrow enough to hide, if you can read the patrol rhythm.',
      'Murals flicker between ad-tech and static because the grid is still unstable.',
    ],
    exits: [
      {
        id: 'arts-to-shoreline',
        position: { x: 1, y: 9 },
        to: 'shoreline',
        spawn: { x: 13, y: 1 },
        label: 'Back to Shoreline',
      },
      {
        id: 'arts-to-midcity',
        position: { x: 13, y: 1 },
        to: 'midcity',
        spawn: { x: 1, y: 9 },
        label: 'Ride toward Midcity',
        requirements: ['tramPass'],
        blockedMessage: 'The tram gates stay red until Mika trusts your badge.',
      },
    ],
    patrols: [
      {
        id: 'arts-patrol-1',
        name: 'Gallery sweep',
        emoji: '🛵',
        path: [
          { x: 9, y: 5 },
          { x: 10, y: 5 },
          { x: 11, y: 5 },
          { x: 12, y: 5 },
          { x: 11, y: 5 },
          { x: 10, y: 5 },
        ],
      },
    ],
    shards: [
      { id: 'arts-signal', position: { x: 5, y: 7 }, label: 'Gallery shard' },
    ],
    caches: [
      { id: 'arts-cache', position: { x: 11, y: 5 }, label: 'Freight elevator drop', credits: 25 },
    ],
    npcs: [
      { id: 'mika', name: 'Mika', emoji: '🎛️', position: { x: 7, y: 5 }, title: 'Tram broker' },
    ],
    terminals: [],
    locks: [],
  },
  midcity: {
    id: 'midcity',
    name: 'Midcity',
    subtitle: 'Transit cores, drone lanes, and the relay junction powering half the skyline.',
    color: '#60a5fa',
    map: [
      '###############',
      '#...#.....#...#',
      '#.#.#.###.#.#.#',
      '#.#...#...#.#.#',
      '#.#####.###.#.#',
      '#.....#.....#.#',
      '###.#.#####.#.#',
      '#...#...#...#.#',
      '#.#####.#.###.#',
      '#.............#',
      '###############',
    ],
    spawn: { x: 1, y: 9 },
    atmosphere: [
      'Ion is tracing the blackout back to a relay cluster under the avenue.',
      'This is the first district where patrols overlap enough to feel like a puzzle.',
      'Get the junction back online and the studio lot lifts its lockdown shutters.',
    ],
    exits: [
      {
        id: 'midcity-to-arts',
        position: { x: 1, y: 9 },
        to: 'arts-district',
        spawn: { x: 13, y: 1 },
        label: 'Back toward Arts District',
      },
      {
        id: 'midcity-to-studio',
        position: { x: 13, y: 5 },
        to: 'studio-lot',
        spawn: { x: 1, y: 9 },
        label: 'Cut through the Studio Lot',
        requirements: ['junctionPowered'],
        blockedMessage: 'Studio shutters are sealed until Midcity relay power comes back.',
      },
      {
        id: 'midcity-to-heights',
        position: { x: 13, y: 9 },
        to: 'sunset-heights',
        spawn: { x: 1, y: 1 },
        label: 'Climb into Sunset Heights',
      },
    ],
    patrols: [
      {
        id: 'midcity-patrol-1',
        name: 'Rail drone',
        emoji: '🚓',
        path: [
          { x: 9, y: 3 },
          { x: 9, y: 4 },
          { x: 9, y: 5 },
          { x: 9, y: 4 },
        ],
      },
      {
        id: 'midcity-patrol-2',
        name: 'Service cruiser',
        emoji: '🚔',
        path: [
          { x: 11, y: 9 },
          { x: 10, y: 9 },
          { x: 9, y: 9 },
          { x: 8, y: 9 },
          { x: 9, y: 9 },
          { x: 10, y: 9 },
        ],
      },
    ],
    shards: [
      { id: 'midcity-signal-east', position: { x: 9, y: 3 }, label: 'Transit shard' },
      { id: 'midcity-signal-south', position: { x: 11, y: 9 }, label: 'Underpass shard' },
    ],
    caches: [
      { id: 'midcity-cache', position: { x: 3, y: 5 }, label: 'Utility locker', credits: 15, battery: 1 },
    ],
    npcs: [
      { id: 'ion', name: 'Ion', emoji: '🛰️', position: { x: 5, y: 5 }, title: 'Signal mapper' },
    ],
    terminals: [
      { id: 'junction-core', name: 'Junction Core', emoji: '🖥️', position: { x: 7, y: 7 } },
    ],
    locks: [],
  },
  'studio-lot': {
    id: 'studio-lot',
    name: 'Studio Lot',
    subtitle: 'Sound stages, storage alleys, and a control key buried in old production space.',
    color: '#f59e0b',
    map: [
      '###############',
      '#.....#.......#',
      '#.###.#.#####.#',
      '#.#...#.....#.#',
      '#.#.#####.#.#.#',
      '#.#.....#.#.#.#',
      '#.#####.#.#.#.#',
      '#.....#.#...#.#',
      '#.###.#.#####.#',
      '#.............#',
      '###############',
    ],
    spawn: { x: 1, y: 9 },
    atmosphere: [
      'Sol keeps the archive doors open only for runners who have stabilized the grid.',
      'The lot is safer than Midcity, but its corridors make contact with patrols punishing.',
      'The skyline key here is what finally unlocks the observatory approach.',
    ],
    exits: [
      {
        id: 'studio-to-midcity',
        position: { x: 1, y: 9 },
        to: 'midcity',
        spawn: { x: 13, y: 5 },
        label: 'Return to Midcity',
      },
    ],
    patrols: [
      {
        id: 'studio-patrol-1',
        name: 'Backlot sweep',
        emoji: '🚐',
        path: [
          { x: 3, y: 7 },
          { x: 4, y: 7 },
          { x: 5, y: 7 },
          { x: 4, y: 7 },
        ],
      },
    ],
    shards: [
      { id: 'studio-signal', position: { x: 3, y: 7 }, label: 'Stage shard' },
    ],
    caches: [
      { id: 'studio-cache', position: { x: 9, y: 1 }, label: 'Prop cage stash', credits: 35 },
    ],
    npcs: [
      { id: 'sol', name: 'Sol', emoji: '🎬', position: { x: 11, y: 5 }, title: 'Archive keeper' },
    ],
    terminals: [],
    locks: [],
  },
  'sunset-heights': {
    id: 'sunset-heights',
    name: 'Sunset Heights',
    subtitle: 'Hill roads, private overlooks, and the last relay array before the observatory.',
    color: '#f97316',
    map: [
      '###############',
      '#........#....#',
      '#.######.#.##.#',
      '#.#......#..#.#',
      '#.#.######.#..#',
      '#.#........##.#',
      '#.########....#',
      '#........###..#',
      '#.######......#',
      '#.............#',
      '###############',
    ],
    spawn: { x: 1, y: 1 },
    atmosphere: [
      'Vera is holding the line at the hill relay while the observatory stays dark above.',
      'Once the skyline key is in hand, the array can open a clean route to the summit.',
      'The last shard sits in plain view, but the approach is exposed.',
    ],
    exits: [
      {
        id: 'heights-to-midcity',
        position: { x: 1, y: 9 },
        to: 'midcity',
        spawn: { x: 13, y: 9 },
        label: 'Drop back into Midcity',
      },
      {
        id: 'heights-to-observatory',
        position: { x: 13, y: 1 },
        to: 'observatory',
        spawn: { x: 1, y: 9 },
        label: 'Climb to the Observatory',
        requirements: ['junctionPowered', 'skylineKey', 'relayAligned', 'allShards'],
        blockedMessage: 'The summit gate will not open until every shard and relay is synced.',
      },
    ],
    patrols: [
      {
        id: 'heights-patrol-1',
        name: 'Hill watcher',
        emoji: '🚔',
        path: [
          { x: 11, y: 8 },
          { x: 12, y: 8 },
          { x: 13, y: 8 },
          { x: 12, y: 8 },
        ],
      },
    ],
    shards: [
      { id: 'heights-signal', position: { x: 11, y: 8 }, label: 'Skyline shard' },
    ],
    caches: [
      { id: 'heights-cache', position: { x: 5, y: 9 }, label: 'Lookout satchel', battery: 2, credits: 20 },
    ],
    npcs: [
      { id: 'vera', name: 'Vera', emoji: '🔭', position: { x: 9, y: 7 }, title: 'Relay keeper' },
    ],
    terminals: [
      { id: 'sky-array', name: 'Sky Array', emoji: '📡', position: { x: 3, y: 3 } },
    ],
    locks: [],
  },
  observatory: {
    id: 'observatory',
    name: 'Observatory',
    subtitle: 'The summit dome where the whole city can be stitched back together in one final sync.',
    color: '#fde68a',
    map: [
      '###############',
      '#.............#',
      '#.###########.#',
      '#.#.........#.#',
      '#.#.#######.#.#',
      '#.#.#.....#.#.#',
      '#.#.#.###.#.#.#',
      '#.#...#.#...#.#',
      '#.#####.#####.#',
      '#.............#',
      '###############',
    ],
    spawn: { x: 1, y: 9 },
    atmosphere: [
      'Aria is already inside the dome, holding the core online long enough for you to finish.',
      'There is no more scavenging here. The entire run comes down to one clean interaction.',
      'If you made it this far, the city is close to breathing again.',
    ],
    exits: [],
    patrols: [
      {
        id: 'observatory-patrol-1',
        name: 'Summit sentinel',
        emoji: '🤖',
        path: [
          { x: 9, y: 5 },
          { x: 9, y: 6 },
          { x: 9, y: 7 },
          { x: 9, y: 6 },
        ],
      },
    ],
    shards: [],
    caches: [],
    npcs: [
      { id: 'aria', name: 'Aria', emoji: '🌌', position: { x: 11, y: 3 }, title: 'Observatory anchor' },
    ],
    terminals: [
      { id: 'observatory-core', name: 'Observatory Core', emoji: '✨', position: { x: 7, y: 5 } },
    ],
    locks: [],
  },
};

const ALL_PATROLS = Object.values(LUCID_AVENUE_DISTRICTS).flatMap((district) => district.patrols);
const INITIAL_PATROL_STEPS = Object.fromEntries(ALL_PATROLS.map((patrol) => [patrol.id, 0])) as Record<string, number>;

export function createInitialLucidAvenueState(): LucidAvenueState {
  return {
    districtId: 'shoreline',
    player: { ...LUCID_AVENUE_DISTRICTS.shoreline.spawn },
    turn: 0,
    heat: 0,
    battery: 2,
    credits: 20,
    scanTurns: 0,
    shards: [],
    caches: [],
    flags: {
      metRook: false,
      tramPass: false,
      junctionPowered: false,
      skylineKey: false,
      relayAligned: false,
    },
    patrolSteps: { ...INITIAL_PATROL_STEPS },
    log: ['New route loaded. Recover every signal shard and relight the observatory.'],
    message: 'Collect every signal shard, stabilize the relays, and finish at the observatory core.',
    outcome: 'playing',
    visitedDistrictIds: ['shoreline'],
  };
}

export function getLucidAvenueDistrict(id: DistrictId) {
  return LUCID_AVENUE_DISTRICTS[id];
}

export function getLucidAvenuePatrolPositions(
  state: LucidAvenueState,
  districtId: DistrictId = state.districtId,
) {
  return getLucidAvenueDistrict(districtId).patrols.map((patrol) => ({
    ...patrol,
    position: patrol.path[state.patrolSteps[patrol.id] % patrol.path.length],
  }));
}

export function getLucidAvenueMissionChecklist(state: LucidAvenueState) {
  const checklist = [
    state.flags.metRook ? '✅ Rook briefed the run.' : '⬜ Meet Rook on Shoreline.',
    state.flags.tramPass ? '✅ Tram pass unlocked.' : '⬜ Earn Mika’s tram pass with 2 shards.',
    state.flags.junctionPowered ? '✅ Midcity relay junction online.' : '⬜ Power the Midcity junction core.',
    state.flags.skylineKey ? '✅ Skyline key recovered from Sol.' : '⬜ Convince Sol to hand over the skyline key.',
    state.flags.relayAligned ? '✅ Sunset relay aligned.' : '⬜ Sync Vera’s sky array in Sunset Heights.',
    state.shards.length >= TOTAL_SHARDS
      ? `✅ All ${TOTAL_SHARDS} signal shards recovered.`
      : `⬜ Recover all signal shards (${state.shards.length}/${TOTAL_SHARDS}).`,
  ];

  if (state.outcome === 'win') {
    checklist.push('✅ Observatory core stabilized. Lucid Angeles is glowing again.');
  } else if (
    state.flags.junctionPowered
    && state.flags.skylineKey
    && state.flags.relayAligned
    && state.shards.length >= TOTAL_SHARDS
  ) {
    checklist.push('⬜ Reach the observatory and trigger the final sync.');
  }

  return checklist;
}

export function calculateLucidAvenueScore(state: LucidAvenueState) {
  const flagCount = Object.values(state.flags).filter(Boolean).length;
  const base = (state.shards.length * 500)
    + (flagCount * 250)
    + (state.credits * 10)
    + (state.battery * 50)
    + Math.max(0, 1000 - state.turn * 8)
    - (state.heat * 120);

  return Math.max(0, base + (state.outcome === 'win' ? 2500 : 0));
}

export function getLucidAvenueCompletionPercent(state: LucidAvenueState) {
  const progress = state.shards.length
    + Object.values(state.flags).filter(Boolean).length
    + (state.outcome === 'win' ? 2 : 0);
  return Math.min(100, Math.round((progress / 13) * 100));
}

function keyForPosition(position: Position) {
  return `${position.x},${position.y}`;
}

export function isSamePosition(a: Position, b: Position) {
  return a.x === b.x && a.y === b.y;
}

function isAdjacent(a: Position, b: Position) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 1;
}

function meetsRequirements(state: LucidAvenueState, requirements: Requirement[] = []) {
  return requirements.every((requirement) => (
    requirement === 'allShards'
      ? state.shards.length >= TOTAL_SHARDS
      : state.flags[requirement]
  ));
}

function tileAt(district: LucidDistrict, position: Position) {
  return district.map[position.y]?.[position.x] ?? '#';
}

function appendLog(state: LucidAvenueState, text: string) {
  return {
    ...state,
    log: [text, ...state.log].slice(0, MAX_LOG_ENTRIES),
  };
}

function withMessage(state: LucidAvenueState, message: string, logText = message) {
  return appendLog({ ...state, message }, logText);
}

function isPassable(state: LucidAvenueState, district: LucidDistrict, position: Position) {
  if (tileAt(district, position) === '#') return false;
  const lock = district.locks.find((entry) => isSamePosition(entry.position, position));
  if (!lock) return true;
  return meetsRequirements(state, lock.requirements);
}

function collectAtCurrentPosition(state: LucidAvenueState) {
  const district = getLucidAvenueDistrict(state.districtId);
  let nextState = state;

  const shard = district.shards.find((entry) => isSamePosition(entry.position, nextState.player) && !nextState.shards.includes(entry.id));
  if (shard) {
    nextState = appendLog({
      ...nextState,
      shards: [...nextState.shards, shard.id],
      credits: nextState.credits + 15,
      message: `${shard.label} recovered. ${TOTAL_SHARDS - (nextState.shards.length + 1)} shard(s) left in the city.`,
    }, `✨ ${shard.label} recovered.`);
  }

  const cache = district.caches.find((entry) => isSamePosition(entry.position, nextState.player) && !nextState.caches.includes(entry.id));
  if (cache) {
    const creditGain = cache.credits ?? 0;
    const batteryGain = cache.battery ?? 0;
    nextState = appendLog({
      ...nextState,
      caches: [...nextState.caches, cache.id],
      credits: nextState.credits + creditGain,
      battery: nextState.battery + batteryGain,
      message: `${cache.label} cracked open. +${creditGain} credits${batteryGain ? `, +${batteryGain} battery` : ''}.`,
    }, `📦 ${cache.label} opened.`);
  }

  return nextState;
}

function warpIfStandingOnExit(state: LucidAvenueState) {
  const district = getLucidAvenueDistrict(state.districtId);
  const exit = district.exits.find((entry) => isSamePosition(entry.position, state.player));
  if (!exit) return state;
  if (!meetsRequirements(state, exit.requirements)) {
    return withMessage(state, exit.blockedMessage ?? 'That route is still sealed.', `🚫 ${exit.blockedMessage ?? 'Route sealed.'}`);
  }

  return appendLog({
    ...state,
    districtId: exit.to,
    player: { ...exit.spawn },
    visitedDistrictIds: state.visitedDistrictIds.includes(exit.to)
      ? state.visitedDistrictIds
      : [...state.visitedDistrictIds, exit.to],
    message: exit.label,
  }, `➡️ ${exit.label}`);
}

function resolvePatrolContact(state: LucidAvenueState, reason: string) {
  const nextHeat = Math.min(MAX_HEAT, state.heat + 2);
  const nextState = appendLog({
    ...state,
    heat: nextHeat,
    credits: Math.max(0, state.credits - 10),
    message: reason,
    outcome: nextHeat >= MAX_HEAT ? 'lose' : state.outcome,
  }, `🚨 ${reason}`);

  if (nextHeat >= MAX_HEAT) {
    return appendLog({
      ...nextState,
      message: 'Heat maxed out. The route is burned and the city shutters down around you.',
      outcome: 'lose',
    }, '💥 Route compromised.');
  }

  return nextState;
}

function advancePatrols(state: LucidAvenueState) {
  if (state.outcome !== 'playing') return state;
  const district = getLucidAvenueDistrict(state.districtId);
  const patrolSteps = { ...state.patrolSteps };

  district.patrols.forEach((patrol) => {
    patrolSteps[patrol.id] = (patrolSteps[patrol.id] + 1) % patrol.path.length;
  });

  const nextState = {
    ...state,
    patrolSteps,
    scanTurns: Math.max(0, state.scanTurns - 1),
  };

  const patrolContact = getLucidAvenuePatrolPositions(nextState).some((patrol) => isSamePosition(patrol.position, nextState.player));
  if (patrolContact) {
    return resolvePatrolContact(nextState, 'A patrol swept the lane exactly as you crossed it.');
  }

  return nextState;
}

function findNearbyNpc(state: LucidAvenueState) {
  return getLucidAvenueDistrict(state.districtId).npcs.find((npc) => isAdjacent(npc.position, state.player));
}

function findNearbyTerminal(state: LucidAvenueState) {
  return getLucidAvenueDistrict(state.districtId).terminals.find((terminal) => isAdjacent(terminal.position, state.player));
}

function handleNpcInteraction(state: LucidAvenueState, npc: LucidNpc) {
  switch (npc.id) {
    case 'rook':
      if (!state.flags.metRook) {
        return appendLog({
          ...state,
          flags: { ...state.flags, metRook: true },
          credits: state.credits + 10,
          message: 'Rook boots your runner badge and points you at the first shard on the pier grid.',
        }, '🧥 Rook: “Get me shards, not excuses.”');
      }
      if (state.shards.length < 2) {
        return withMessage(state, 'Rook wants two shards on the board before he vouches for you citywide.', '🧥 Rook: “Two shards first. Then you move deeper.”');
      }
      if (!state.flags.tramPass) {
        return withMessage(state, 'Rook tells you Mika will unlock the tram lines now that your signal count looks real.', '🧥 Rook: “Find Mika in Arts. She’ll clear the line.”');
      }
      if (!state.flags.junctionPowered) {
        return withMessage(state, 'Rook marks the Midcity junction on your route stack.', '🧥 Rook: “Midcity first. Power is the whole run.”');
      }
      return withMessage(state, 'Rook watches the coast and reminds you the observatory is the only finish that matters.', '🧥 Rook: “Keep climbing.”');

    case 'mika':
      if (!state.flags.metRook) {
        return withMessage(state, 'Mika ignores unknown runners. Talk to Rook on Shoreline first.', '🎛️ Mika: “No badge, no line.”');
      }
      if (!state.flags.tramPass && state.shards.length >= 2) {
        return appendLog({
          ...state,
          flags: { ...state.flags, tramPass: true },
          credits: state.credits + 15,
          battery: state.battery + 1,
          message: 'Mika flashes a tram pass into your badge. Midcity is open.',
        }, '🎛️ Mika: “Good. You’re not bluffing. Take the pass.”');
      }
      if (!state.flags.tramPass) {
        return withMessage(state, 'Mika wants to see two live shards before she opens the tram network.', '🎛️ Mika: “Bring me proof, not a pitch.”');
      }
      return withMessage(state, 'Mika keeps an eye on the transit cams and warns you Midcity patrols overlap in pairs.', '🎛️ Mika: “Count the patrol rhythm before you move.”');

    case 'ion':
      if (!state.flags.tramPass) {
        return withMessage(state, 'Ion refuses to discuss the relay map until you can legally reach Midcity.', '🛰️ Ion: “You need a pass before you need me.”');
      }
      if (!state.flags.junctionPowered) {
        return withMessage(state, 'Ion points at the Junction Core on the lower platform: restore that and the studio shutters lift.', '🛰️ Ion: “The core below us powers everything west.”');
      }
      if (state.shards.length < 4) {
        return withMessage(state, 'Ion says Sol will only trade the skyline key once the route looks recoverable.', '🛰️ Ion: “Four shards gets you in the archive room.”');
      }
      return withMessage(state, 'Ion pings Sunset Heights and says Vera can align the last relay once the skyline key is secured.', '🛰️ Ion: “Heights are next. Don’t stall.”');

    case 'sol':
      if (!state.flags.junctionPowered) {
        return withMessage(state, 'Sol keeps the archive cases sealed until city power returns.', '🎬 Sol: “No power, no key, no deal.”');
      }
      if (!state.flags.skylineKey && state.shards.length >= 4) {
        return appendLog({
          ...state,
          flags: { ...state.flags, skylineKey: true },
          credits: state.credits + 30,
          message: 'Sol slides the skyline key across the console. The hill locks will listen to it.',
        }, '🎬 Sol: “Four shards is enough. Take the skyline key.”');
      }
      if (!state.flags.skylineKey) {
        return withMessage(state, 'Sol wants four recovered shards before he risks opening summit infrastructure.', '🎬 Sol: “Recover more of the city before I unlock its crown.”');
      }
      return withMessage(state, 'Sol reminds you Vera still has to line up the hillside relay before the summit route opens.', '🎬 Sol: “Key gets you close. Vera gets you through.”');

    case 'vera':
      if (!state.flags.skylineKey) {
        return withMessage(state, 'Vera sees the dead locks on your badge and tells you to get Sol’s skyline key first.', '🔭 Vera: “Come back with the right key.”');
      }
      if (state.shards.length < 5) {
        return withMessage(state, 'Vera wants the city nearly whole before she risks aligning the hill array.', '🔭 Vera: “Bring me one more shard.”');
      }
      if (!state.flags.relayAligned) {
        return withMessage(state, 'Vera says the array terminal beside the overlook is ready for you now.', '🔭 Vera: “The sky array is primed. Finish the alignment yourself.”');
      }
      return withMessage(state, 'Vera watches the summit gate and says the observatory will open if your shard count is complete.', '🔭 Vera: “You’re almost there.”');

    case 'aria':
      if (!meetsRequirements(state, ['junctionPowered', 'skylineKey', 'relayAligned', 'allShards'])) {
        return withMessage(state, 'Aria says the observatory can only hold if the whole route is already stabilized.', '🌌 Aria: “No half-fixes at the summit.”');
      }
      return withMessage(state, 'Aria holds the dome steady. One last interaction with the core will relight the city.', '🌌 Aria: “I’ve held it long enough. Finish it.”');

    default:
      return state;
  }
}

function handleTerminalInteraction(state: LucidAvenueState, terminal: LucidTerminal) {
  switch (terminal.id) {
    case 'junction-core':
      if (!state.flags.tramPass) {
        return withMessage(state, 'The Junction Core rejects you without Mika’s transit clearance.', '🖥️ Junction Core: access denied.');
      }
      if (state.flags.junctionPowered) {
        return withMessage(state, 'The Junction Core is already humming. Midcity power is stable.', '🖥️ Junction Core: stable output.');
      }
      return appendLog({
        ...state,
        flags: { ...state.flags, junctionPowered: true },
        battery: state.battery + 1,
        message: 'Midcity relay power comes back online. Studio shutters are unlocked.',
      }, '🖥️ Junction Core restored.');

    case 'sky-array':
      if (!state.flags.skylineKey) {
        return withMessage(state, 'The Sky Array needs Sol’s skyline key before it will unlock calibration controls.', '📡 Sky Array: skyline key missing.');
      }
      if (state.shards.length < 5) {
        return withMessage(state, 'The array wants more network stability before it risks a summit handoff.', '📡 Sky Array: insufficient city sync.');
      }
      if (state.flags.relayAligned) {
        return withMessage(state, 'The Sky Array is already aligned and feeding the summit gate.', '📡 Sky Array: alignment locked.');
      }
      return appendLog({
        ...state,
        flags: { ...state.flags, relayAligned: true },
        battery: Math.max(1, state.battery),
        message: 'The hillside relay locks onto the skyline. The observatory route is almost open.',
      }, '📡 Sky Array aligned.');

    case 'observatory-core':
      if (!meetsRequirements(state, ['junctionPowered', 'skylineKey', 'relayAligned', 'allShards'])) {
        return withMessage(state, 'The observatory core flickers but refuses the sync. Something on the route is still missing.', '✨ Observatory Core: sync rejected.');
      }
      return appendLog({
        ...state,
        outcome: 'win',
        message: 'Observatory synced. Lucid Angeles lights back up block by block across the horizon.',
      }, '✨ Final city sync complete.');

    default:
      return state;
  }
}

export function moveLucidAvenuePlayer(state: LucidAvenueState, dx: number, dy: number) {
  if (state.outcome !== 'playing') return state;
  const district = getLucidAvenueDistrict(state.districtId);
  const nextPosition = { x: state.player.x + dx, y: state.player.y + dy };

  if (!isPassable(state, district, nextPosition)) {
    const lock = district.locks.find((entry) => isSamePosition(entry.position, nextPosition));
    return withMessage(state, lock?.blockedMessage ?? 'That path is walled off by towers and traffic.', `🧱 ${lock?.blockedMessage ?? 'Blocked.'}`);
  }

  let nextState = {
    ...state,
    player: nextPosition,
    turn: state.turn + 1,
    message: `${district.name}: move carefully and keep the patrol rhythm in your head.`,
  };

  const directContact = getLucidAvenuePatrolPositions(nextState).some((patrol) => isSamePosition(patrol.position, nextPosition));
  if (directContact) {
    nextState = resolvePatrolContact(nextState, 'You walked straight into a patrol lane.');
    if (nextState.outcome !== 'playing') return nextState;
  }

  nextState = collectAtCurrentPosition(nextState);
  nextState = warpIfStandingOnExit(nextState);
  nextState = advancePatrols(nextState);
  return nextState;
}

export function waitLucidAvenueTurn(state: LucidAvenueState) {
  if (state.outcome !== 'playing') return state;
  return advancePatrols(appendLog({
    ...state,
    turn: state.turn + 1,
    message: 'You hold position and let the patrol pattern reveal itself.',
  }, '⏱️ Waited one beat.'));
}

export function scanLucidAvenue(state: LucidAvenueState) {
  if (state.outcome !== 'playing') return state;
  if (state.battery <= 0) {
    return withMessage(state, 'Battery dry. You need another cache before running a city scan.', '🔋 No battery left for scan.');
  }

  return advancePatrols(appendLog({
    ...state,
    turn: state.turn + 1,
    battery: state.battery - 1,
    heat: Math.max(0, state.heat - 1),
    scanTurns: 3,
    message: 'Pulse scan active. Patrol routes flare in your visor and the heat drops a notch.',
  }, '📡 Scan pulse fired.'));
}

export function getLucidAvenueHint(state: LucidAvenueState) {
  if (!state.flags.metRook) {
    return 'AI route hint: move along Shoreline and talk to Rook before chasing deeper objectives.';
  }
  if (!state.flags.tramPass) {
    return state.shards.length >= 2
      ? 'AI route hint: return to Mika in the Arts District to unlock the tram pass.'
      : 'AI route hint: recover two shards before asking Mika to open the transit line.';
  }
  if (!state.flags.junctionPowered) {
    return 'AI route hint: reach the Midcity Junction Core and bring the relay back online.';
  }
  if (!state.flags.skylineKey) {
    return state.shards.length >= 4
      ? 'AI route hint: visit Sol in the Studio Lot for the skyline key.'
      : 'AI route hint: recover four total shards so Sol will trust the route enough to trade the skyline key.';
  }
  if (!state.flags.relayAligned) {
    return state.shards.length >= 5
      ? 'AI route hint: align Vera’s Sky Array in Sunset Heights.'
      : 'AI route hint: recover one more shard before trying to align the hill relay.';
  }
  if (state.shards.length < TOTAL_SHARDS) {
    return 'AI route hint: the summit can wait — finish recovering every remaining shard first.';
  }
  if (state.districtId !== 'observatory') {
    return 'AI route hint: your route is stable enough now. Climb to the observatory for the final sync.';
  }
  return 'AI route hint: interact with the Observatory Core to finish the run.';
}

export function requestLucidAvenueHint(state: LucidAvenueState) {
  if (state.outcome !== 'playing') return state;
  const hint = getLucidAvenueHint(state);
  return appendLog({
    ...state,
    message: hint,
  }, `🧠 ${hint}`);
}

export function interactInLucidAvenue(state: LucidAvenueState) {
  if (state.outcome !== 'playing') return state;
  const npc = findNearbyNpc(state);
  if (npc) return handleNpcInteraction(state, npc);

  const terminal = findNearbyTerminal(state);
  if (terminal) return handleTerminalInteraction(state, terminal);

  return withMessage(state, 'No terminal handshake and no one close enough to talk to.', '… Nothing to interact with here.');
}

export function getLucidAvenuePatrolPathKeys(districtId: DistrictId) {
  const district = getLucidAvenueDistrict(districtId);
  return new Set(district.patrols.flatMap((patrol) => patrol.path.map(keyForPosition)));
}

export function getLucidAvenueObjectiveKeys(state: LucidAvenueState) {
  const district = getLucidAvenueDistrict(state.districtId);
  const keys = new Set<string>();

  district.shards
    .filter((shard) => !state.shards.includes(shard.id))
    .forEach((shard) => keys.add(keyForPosition(shard.position)));

  district.terminals.forEach((terminal) => keys.add(keyForPosition(terminal.position)));
  district.exits.forEach((exit) => keys.add(keyForPosition(exit.position)));
  return keys;
}
