export type DistrictId =
  | 'shoreline'
  | 'arts-district'
  | 'midcity'
  | 'river-gates'
  | 'studio-lot'
  | 'civic-center'
  | 'sunset-heights'
  | 'observatory';

export type LucidFlag =
  | 'metRook'
  | 'tramPass'
  | 'junctionPowered'
  | 'floodgatesPatched'
  | 'skylineKey'
  | 'civicSeal'
  | 'relayAligned';
type Requirement = LucidFlag | 'allShards';
export type LucidAvenueMode = 'story' | 'sandbox';
export type LucidVehicleId = 'foot' | 'hoverbike' | 'tram-runner';
export type LucidContractId =
  | 'signal-cartography'
  | 'street-delivery'
  | 'night-circuit'
  | 'summit-license';

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
  mode: LucidAvenueMode;
  districtId: DistrictId;
  player: Position;
  turn: number;
  heat: number;
  battery: number;
  credits: number;
  scanTurns: number;
  jamTurns: number;
  shards: string[];
  caches: string[];
  flags: Record<LucidFlag, boolean>;
  patrolSteps: Record<string, number>;
  log: string[];
  message: string;
  outcome: 'playing' | 'win' | 'lose';
  visitedDistrictIds: DistrictId[];
  vehicleId: LucidVehicleId;
  vehicleBoostTurns: number;
  vehicleMoves: number;
  jamActivations: number;
  completedContractIds: LucidContractId[];
}

export const LUCID_AVENUE_TOTAL_SHARDS = 8;
export const LUCID_AVENUE_TOTAL_FLAGS = 7;
export const LUCID_AVENUE_TOTAL_CONTRACTS = 4;
const MAX_HEAT = 6;
const MAX_LOG_ENTRIES = 6;
export const LUCID_AVENUE_6900_TARGET = 6900;

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
        id: 'midcity-to-river',
        position: { x: 13, y: 5 },
        to: 'river-gates',
        spawn: { x: 1, y: 9 },
        label: 'Drop into River Gates',
        requirements: ['junctionPowered'],
        blockedMessage: 'River Gate locks stay shut until Midcity relay power comes back.',
      },
      {
        id: 'midcity-to-heights',
        position: { x: 13, y: 9 },
        to: 'sunset-heights',
        spawn: { x: 1, y: 1 },
        label: 'Climb into Sunset Heights',
        requirements: ['civicSeal'],
        blockedMessage: 'The upper hill corridor stays dark until Civic Center certifies your badge.',
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
  'river-gates': {
    id: 'river-gates',
    name: 'River Gates',
    subtitle: 'Concrete channels, flood tunnels, and a pump lattice that keeps half the avenue from drowning.',
    color: '#14b8a6',
    map: [
      '###############',
      '#....#....#...#',
      '#.##.#.##.#.#.#',
      '#.#..#....#.#.#',
      '#.#.#####.#.#.#',
      '#...#...#.#...#',
      '###.#.#.#.###.#',
      '#...#.#...#...#',
      '#.###.#####.#.#',
      '#.............#',
      '###############',
    ],
    spawn: { x: 1, y: 9 },
    atmosphere: [
      'Dex has been keeping the flood pumps barely alive while the blackout chews through the lower canals.',
      'The district is wider than it looks because every safe lane is split by maintenance barriers and water locks.',
      'Patch the floodgate controller and the western studio corridor will finally stay open.',
    ],
    exits: [
      {
        id: 'river-to-midcity',
        position: { x: 1, y: 9 },
        to: 'midcity',
        spawn: { x: 13, y: 5 },
        label: 'Climb back into Midcity',
      },
      {
        id: 'river-to-studio',
        position: { x: 13, y: 1 },
        to: 'studio-lot',
        spawn: { x: 1, y: 9 },
        label: 'Thread through the studio service road',
        requirements: ['floodgatesPatched'],
        blockedMessage: 'The studio service road is still underwater until Dex patches the floodgates.',
      },
    ],
    patrols: [
      {
        id: 'river-patrol-1',
        name: 'Canal scanner',
        emoji: '🚤',
        path: [
          { x: 11, y: 5 },
          { x: 12, y: 5 },
          { x: 13, y: 5 },
          { x: 12, y: 5 },
          { x: 11, y: 5 },
        ],
      },
      {
        id: 'river-patrol-2',
        name: 'Pump inspector',
        emoji: '🚓',
        path: [
          { x: 7, y: 1 },
          { x: 7, y: 2 },
          { x: 7, y: 3 },
          { x: 7, y: 2 },
        ],
      },
    ],
    shards: [
      { id: 'river-signal-east', position: { x: 11, y: 5 }, label: 'Canal shard' },
    ],
    caches: [
      { id: 'river-cache', position: { x: 3, y: 5 }, label: 'Maintenance crate', credits: 20, battery: 1 },
    ],
    npcs: [
      { id: 'dex', name: 'Dex', emoji: '🛠️', position: { x: 5, y: 9 }, title: 'Flood runner' },
    ],
    terminals: [
      { id: 'floodgate-controller', name: 'Floodgate Controller', emoji: '🌊', position: { x: 9, y: 1 } },
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
        id: 'studio-to-river',
        position: { x: 1, y: 9 },
        to: 'river-gates',
        spawn: { x: 13, y: 1 },
        label: 'Return to River Gates',
      },
      {
        id: 'studio-to-civic',
        position: { x: 13, y: 9 },
        to: 'civic-center',
        spawn: { x: 1, y: 9 },
        label: 'Slip into Civic Center',
        requirements: ['skylineKey'],
        blockedMessage: 'Civic security will not even open the trench route without Sol’s skyline key.',
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
  'civic-center': {
    id: 'civic-center',
    name: 'Civic Center',
    subtitle: 'Civic archives, courthouse plazas, and the sealed access ring that certifies summit traffic.',
    color: '#8b5cf6',
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
      'Noa runs the civic archive loop and knows which summit corridors are still under lock.',
      'The plaza is open, but the interior pathways are full of slow-moving watchers that punish sloppy timing.',
      'Without the civic seal, Sunset Heights stays detached from the rest of the route.',
    ],
    exits: [
      {
        id: 'civic-to-studio',
        position: { x: 1, y: 9 },
        to: 'studio-lot',
        spawn: { x: 13, y: 9 },
        label: 'Fall back toward the Studio Lot',
      },
      {
        id: 'civic-to-heights',
        position: { x: 13, y: 1 },
        to: 'sunset-heights',
        spawn: { x: 1, y: 1 },
        label: 'Push up the certified hill route',
        requirements: ['civicSeal'],
        blockedMessage: 'The certified hill route is locked until Noa clears you with the civic seal.',
      },
    ],
    patrols: [
      {
        id: 'civic-patrol-1',
        name: 'Archive marshal',
        emoji: '🚔',
        path: [
          { x: 9, y: 5 },
          { x: 10, y: 5 },
          { x: 11, y: 5 },
          { x: 10, y: 5 },
        ],
      },
      {
        id: 'civic-patrol-2',
        name: 'Plaza watcher',
        emoji: '🛰️',
        path: [
          { x: 11, y: 9 },
          { x: 10, y: 9 },
          { x: 9, y: 9 },
          { x: 10, y: 9 },
        ],
      },
    ],
    shards: [
      { id: 'civic-signal', position: { x: 11, y: 9 }, label: 'Archive shard' },
    ],
    caches: [
      { id: 'civic-cache', position: { x: 3, y: 5 }, label: 'Clerk vault stash', credits: 25, battery: 1 },
    ],
    npcs: [
      { id: 'noa', name: 'Noa', emoji: '📜', position: { x: 5, y: 5 }, title: 'Civic archivist' },
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
        id: 'heights-to-civic',
        position: { x: 1, y: 9 },
        to: 'civic-center',
        spawn: { x: 13, y: 1 },
        label: 'Drop back into Civic Center',
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
      { id: 'heights-signal-west', position: { x: 7, y: 1 }, label: 'Ridgeline shard' },
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

const LUCID_CONTRACT_DEFS: Array<{
  id: LucidContractId;
  title: string;
  description: string;
  reward: { credits?: number; battery?: number };
  completeWhen: (state: LucidAvenueState) => boolean;
}> = [
  {
    id: 'signal-cartography',
    title: 'Signal cartography',
    description: 'Recover 4 shards and bring Midcity relay power online.',
    reward: { credits: 20, battery: 1 },
    completeWhen: (state) => state.shards.length >= 4 && state.flags.junctionPowered,
  },
  {
    id: 'street-delivery',
    title: 'Street delivery',
    description: 'Visit 4 districts and crack 3 caches while keeping the west-side route moving.',
    reward: { credits: 35 },
    completeWhen: (state) => state.visitedDistrictIds.length >= 4 && state.caches.length >= 3,
  },
  {
    id: 'night-circuit',
    title: 'Night circuit',
    description: 'Deploy a vehicle, run at least 4 boosted blocks, and jam the district net once.',
    reward: { credits: 30, battery: 1 },
    completeWhen: (state) => state.vehicleMoves >= 4 && state.jamActivations >= 1,
  },
  {
    id: 'summit-license',
    title: 'Summit license',
    description: 'Secure the civic seal and align the final relay for summit-class clearance.',
    reward: { credits: 45, battery: 1 },
    completeWhen: (state) => state.flags.civicSeal && state.flags.relayAligned,
  },
];

export function createInitialLucidAvenueState(options: { mode?: LucidAvenueMode } = {}): LucidAvenueState {
  const mode = options.mode ?? 'story';
  return {
    mode,
    districtId: 'shoreline',
    player: { ...LUCID_AVENUE_DISTRICTS.shoreline.spawn },
    turn: 0,
    heat: 0,
    battery: mode === 'sandbox' ? 4 : 2,
    credits: mode === 'sandbox' ? 80 : 20,
    scanTurns: 0,
    jamTurns: 0,
    shards: [],
    caches: [],
    flags: {
      metRook: mode === 'sandbox',
      tramPass: mode === 'sandbox',
      junctionPowered: false,
      floodgatesPatched: false,
      skylineKey: false,
      civicSeal: false,
      relayAligned: false,
    },
    patrolSteps: { ...INITIAL_PATROL_STEPS },
    log: [mode === 'sandbox'
      ? 'Free-roam sandbox loaded. Jump districts, deploy vehicles, and clear route contracts in any order.'
      : 'New route loaded. Recover every signal shard and relight the observatory.'],
    message: mode === 'sandbox'
      ? 'Sandbox live. The whole city is open for free-roam routes, vehicle runs, and persistent contracts.'
      : 'Collect every signal shard, stabilize the relays, and finish at the observatory core.',
    outcome: 'playing',
    visitedDistrictIds: ['shoreline'],
    vehicleId: 'foot',
    vehicleBoostTurns: 0,
    vehicleMoves: 0,
    jamActivations: 0,
    completedContractIds: [],
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
    state.mode === 'sandbox'
      ? `🟦 Free-roam sandbox live (${state.completedContractIds.length}/${LUCID_AVENUE_TOTAL_CONTRACTS} route contracts banked).`
      : '🛣️ Story route live. Push the city back online in sequence.',
    state.flags.metRook ? '✅ Rook briefed the run.' : '⬜ Meet Rook on Shoreline.',
    state.flags.tramPass ? '✅ Tram pass unlocked.' : '⬜ Earn Mika’s tram pass with 2 shards.',
    state.flags.junctionPowered ? '✅ Midcity relay junction online.' : '⬜ Power the Midcity junction core.',
    state.flags.floodgatesPatched ? '✅ River Gates floodgrid patched.' : '⬜ Help Dex patch the River Gates floodgrid.',
    state.flags.skylineKey ? '✅ Skyline key recovered from Sol.' : '⬜ Convince Sol to hand over the skyline key.',
    state.flags.civicSeal ? '✅ Civic seal cleared by Noa.' : '⬜ Secure Noa’s civic seal in Civic Center.',
    state.flags.relayAligned ? '✅ Sunset relay aligned.' : '⬜ Sync Vera’s sky array in Sunset Heights.',
    state.shards.length >= LUCID_AVENUE_TOTAL_SHARDS
      ? `✅ All ${LUCID_AVENUE_TOTAL_SHARDS} signal shards recovered.`
      : `⬜ Recover all signal shards (${state.shards.length}/${LUCID_AVENUE_TOTAL_SHARDS}).`,
  ];

  if (state.outcome === 'win') {
    checklist.push('✅ Observatory core stabilized. Lucid Angeles is glowing again.');
  } else if (
    state.flags.junctionPowered
    && state.flags.floodgatesPatched
    && state.flags.skylineKey
    && state.flags.civicSeal
    && state.flags.relayAligned
    && state.shards.length >= LUCID_AVENUE_TOTAL_SHARDS
  ) {
    checklist.push('⬜ Reach the observatory and trigger the final sync.');
  }

  return checklist;
}

export function getLucidAvenueRouteContracts(state: LucidAvenueState) {
  return LUCID_CONTRACT_DEFS.map((contract) => ({
    id: contract.id,
    title: contract.title,
    description: contract.description,
    completed: state.completedContractIds.includes(contract.id),
  }));
}

export function calculateLucidAvenueScore(state: LucidAvenueState) {
  const flagCount = Object.values(state.flags).filter(Boolean).length;
  const base = (state.shards.length * 500)
    + (flagCount * 250)
    + (state.completedContractIds.length * 225)
    + (state.credits * 10)
    + (state.battery * 50)
    + Math.max(0, 1000 - state.turn * 8)
    + (state.jamTurns * 60)
    + (state.vehicleMoves * 25)
    - (state.heat * 120);

  return Math.max(0, base + (state.outcome === 'win' ? 2500 : 0));
}

export function getLucidAvenueCompletionPercent(state: LucidAvenueState) {
  const progress = state.shards.length
    + Object.values(state.flags).filter(Boolean).length
    + state.completedContractIds.length
    + (state.outcome === 'win' ? 2 : 0);
  return Math.min(100, Math.round((progress / (LUCID_AVENUE_TOTAL_SHARDS + LUCID_AVENUE_TOTAL_FLAGS + LUCID_AVENUE_TOTAL_CONTRACTS + 2)) * 100));
}

export function getLucidAvenueStoryBeat(state: LucidAvenueState) {
  if (state.mode === 'sandbox') {
    return {
      act: 'Sandbox · Lucid free roam',
      title: 'The whole city is yours to route',
      synopsis: 'GameEngin has dropped you into a freer systemic layer: jump districts from the atlas, deploy vehicles for boosted movement, and bank persistent route contracts in any order.',
    };
  }
  if (!state.flags.metRook) {
    return {
      act: 'Act I · Shoreline ignition',
      title: 'The blackout starts at the coast',
      synopsis: 'Rook has the first lead, but Lucid Angeles is still dark and fragmented. Boot the run, meet the fixer, and prove this route is real.',
    };
  }
  if (!state.flags.junctionPowered) {
    return {
      act: 'Act II · Transit under pressure',
      title: 'The city opens when the rails wake up',
      synopsis: 'Mika and Ion push you deeper into Midcity. Patrols overlap harder now, and the whole west side waits on restored junction power.',
    };
  }
  if (!state.flags.floodgatesPatched || !state.flags.skylineKey) {
    return {
      act: 'Act III · Skyline conspiracy',
      title: 'Flood tunnels and studio secrets',
      synopsis: 'Dex is holding the lower city together while Sol guards the skyline key. Patch the River Gates and push the route farther west.',
    };
  }
  if (!state.flags.relayAligned || !state.flags.civicSeal) {
    return {
      act: 'Act IV · Civic lockdown',
      title: 'Archive seals and hill relays',
      synopsis: 'Noa and Vera now control the climb. Secure the civic seal, finish the expanded shard hunt, and align the hill array for summit access.',
    };
  }
  if (state.outcome === 'win') {
    return {
      act: 'Finale · City relit',
      title: 'Lucid Angeles comes back online',
      synopsis: 'The observatory sync lands and the skyline breathes again. GameEngin logs this run as a full-city recovery.',
    };
  }
  return {
    act: 'Finale · Summit drive',
    title: 'Everything points uphill now',
    synopsis: 'The route is stabilized. Every remaining move is about finishing the climb and landing the final observatory sync.',
  };
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
  if (state.mode === 'sandbox') return true;
  return requirements.every((requirement) => (
    requirement === 'allShards'
      ? state.shards.length >= LUCID_AVENUE_TOTAL_SHARDS
      : state.flags[requirement]
  ));
}

function syncContracts(state: LucidAvenueState) {
  let nextState = state;

  for (const contract of LUCID_CONTRACT_DEFS) {
    if (nextState.completedContractIds.includes(contract.id) || !contract.completeWhen(nextState)) continue;
    const creditGain = contract.reward.credits ?? 0;
    const batteryGain = contract.reward.battery ?? 0;
    nextState = appendLog({
      ...nextState,
      completedContractIds: [...nextState.completedContractIds, contract.id],
      credits: nextState.credits + creditGain,
      battery: nextState.battery + batteryGain,
      message: nextState.outcome === 'playing'
        ? `${contract.title} banked. +${creditGain} credits${batteryGain ? `, +${batteryGain} battery` : ''}.`
        : nextState.message,
    }, `🗺️ ${contract.title} complete.`);
  }

  return nextState;
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
      message: `${shard.label} recovered. ${LUCID_AVENUE_TOTAL_SHARDS - (nextState.shards.length + 1)} shard(s) left in the city.`,
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
  const nextHeat = state.mode === 'sandbox'
    ? Math.min(MAX_HEAT - 1, state.heat + 1)
    : Math.min(MAX_HEAT, state.heat + 2);
  const nextState = appendLog({
    ...state,
    heat: nextHeat,
    credits: Math.max(0, state.credits - 10),
    message: reason,
    outcome: nextHeat >= MAX_HEAT ? 'lose' : state.outcome,
  }, `🚨 ${reason}`);

  if (state.mode !== 'sandbox' && nextHeat >= MAX_HEAT) {
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
    jamTurns: Math.max(0, state.jamTurns - 1),
    scanTurns: Math.max(0, state.scanTurns - 1),
  };

  if (state.jamTurns > 0) {
    return appendLog({
      ...nextState,
      message: 'GameEngin uplink is flooding the patrol net. Their route timing stalls for another beat.',
    }, '🛰️ Patrol grid jam held.');
  }

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
      if (!state.flags.floodgatesPatched) {
        return withMessage(state, 'Ion reroutes your badge to River Gates and says Dex needs the floodgrid patched before the western districts stay stable.', '🛰️ Ion: “River Gates first. No stable pumps, no west-side route.”');
      }
      if (state.shards.length < 5) {
        return withMessage(state, 'Ion says Sol will only trade the skyline key once the route looks recoverable.', '🛰️ Ion: “Five shards gets you in the archive room.”');
      }
      return withMessage(state, 'Ion pings Studio Lot and Civic Center: Sol has the skyline key, but Noa still controls the certified hill lanes.', '🛰️ Ion: “Get the key, then get Noa.”');

    case 'dex':
      if (!state.flags.junctionPowered) {
        return withMessage(state, 'Dex will not crack the flood lattice while Midcity is still dark.', '🛠️ Dex: “Bring the junction back before you ask me for miracles.”');
      }
      if (!state.flags.floodgatesPatched) {
        return withMessage(state, 'Dex slaps the floodgate controller and says the console on the upper catwalk is ready for you now.', '🛠️ Dex: “Patch the controller and I can hold the lower city.”');
      }
      return withMessage(state, 'Dex says the studio road is finally dry enough for a full run and reminds you to keep collecting shards.', '🛠️ Dex: “West side is open. Don’t waste it.”');

    case 'sol':
      if (!state.flags.junctionPowered) {
        return withMessage(state, 'Sol keeps the archive cases sealed until city power returns.', '🎬 Sol: “No power, no key, no deal.”');
      }
      if (!state.flags.floodgatesPatched) {
        return withMessage(state, 'Sol wants the flood tunnels stabilized before he risks opening the skyline archive.', '🎬 Sol: “Patch River Gates. Then we talk.”');
      }
      if (!state.flags.skylineKey && state.shards.length >= 5) {
        return appendLog({
          ...state,
          flags: { ...state.flags, skylineKey: true },
          credits: state.credits + 30,
          message: 'Sol slides the skyline key across the console. The hill locks will listen to it.',
        }, '🎬 Sol: “Five shards is enough. Take the skyline key.”');
      }
      if (!state.flags.skylineKey) {
        return withMessage(state, 'Sol wants five recovered shards before he risks opening summit infrastructure.', '🎬 Sol: “Recover more of the city before I unlock its crown.”');
      }
      if (!state.flags.civicSeal) {
        return withMessage(state, 'Sol points you toward Civic Center and says Noa is the only one who can certify the upper corridor.', '🎬 Sol: “Key gets you in. Noa gets you higher.”');
      }
      return withMessage(state, 'Sol reminds you Vera still has to line up the hillside relay before the summit route opens.', '🎬 Sol: “You’ve got the paperwork. Finish the sky.”');

    case 'noa':
      if (!state.flags.skylineKey) {
        return withMessage(state, 'Noa refuses to certify an unknown route without Sol’s skyline key on your badge.', '📜 Noa: “Bring valid skyline credentials.”');
      }
      if (!state.flags.civicSeal && state.shards.length >= 6) {
        return appendLog({
          ...state,
          flags: { ...state.flags, civicSeal: true },
          credits: state.credits + 25,
          battery: state.battery + 1,
          message: 'Noa stamps your badge with a civic seal. The upper hill corridor is officially yours.',
        }, '📜 Noa: “Certified. Use the corridor well.”');
      }
      if (!state.flags.civicSeal) {
        return withMessage(state, 'Noa wants six recovered shards on the board before certifying a summit corridor.', '📜 Noa: “Bring me a city worth certifying.”');
      }
      return withMessage(state, 'Noa confirms Sunset Heights is the last clean approach and tells you Vera is waiting.', '📜 Noa: “The hills are open. Finish the climb.”');

    case 'vera':
      if (!state.flags.civicSeal) {
        return withMessage(state, 'Vera sees the uncertified locks on your badge and tells you to get Noa’s civic seal first.', '🔭 Vera: “Come back with the right clearance.”');
      }
      if (state.shards.length < 7) {
        return withMessage(state, 'Vera wants the city nearly whole before she risks aligning the hill array.', '🔭 Vera: “Bring me one more block of the city.”');
      }
      if (!state.flags.relayAligned) {
        return withMessage(state, 'Vera says the array terminal beside the overlook is ready for you now.', '🔭 Vera: “The sky array is primed. Finish the alignment yourself.”');
      }
      return withMessage(state, 'Vera watches the summit gate and says the observatory will open if your shard count is complete.', '🔭 Vera: “You’re almost there.”');

    case 'aria':
      if (!meetsRequirements(state, ['junctionPowered', 'floodgatesPatched', 'skylineKey', 'civicSeal', 'relayAligned', 'allShards'])) {
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

    case 'floodgate-controller':
      if (!state.flags.junctionPowered) {
        return withMessage(state, 'The floodgate controller is offline until Midcity relay power is restored.', '🌊 Floodgate Controller: waiting for upstream power.');
      }
      if (state.flags.floodgatesPatched) {
        return withMessage(state, 'The floodgate controller is already stabilized. River Gates is finally holding.', '🌊 Floodgate Controller: stable flow.');
      }
      return appendLog({
        ...state,
        flags: { ...state.flags, floodgatesPatched: true },
        battery: state.battery + 1,
        credits: state.credits + 20,
        message: 'River Gates pumps stabilize and the western studio road clears out.',
      }, '🌊 Floodgate Controller patched.');

    case 'sky-array':
      if (!state.flags.civicSeal) {
        return withMessage(state, 'The Sky Array needs Noa’s civic seal before it will unlock calibration controls.', '📡 Sky Array: civic seal missing.');
      }
      if (state.shards.length < 7) {
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
      if (!meetsRequirements(state, ['junctionPowered', 'floodgatesPatched', 'skylineKey', 'civicSeal', 'relayAligned', 'allShards'])) {
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
  const burst = state.vehicleBoostTurns > 0
    ? state.vehicleId === 'tram-runner' ? 3 : 2
    : 1;
  let nextState: LucidAvenueState = {
    ...state,
    turn: state.turn + 1,
    message: `${getLucidAvenueDistrict(state.districtId).name}: move carefully and keep the patrol rhythm in your head.`,
  };

  for (let step = 0; step < burst; step += 1) {
    const district = getLucidAvenueDistrict(nextState.districtId);
    const nextPosition = { x: nextState.player.x + dx, y: nextState.player.y + dy };

    if (!isPassable(nextState, district, nextPosition)) {
      if (step === 0) {
        const lock = district.locks.find((entry) => isSamePosition(entry.position, nextPosition));
        return withMessage(nextState, lock?.blockedMessage ?? 'That path is walled off by towers and traffic.', `🧱 ${lock?.blockedMessage ?? 'Blocked.'}`);
      }
      break;
    }

    nextState = {
      ...nextState,
      player: nextPosition,
      vehicleMoves: nextState.vehicleMoves + (nextState.vehicleBoostTurns > 0 ? 1 : 0),
      message: nextState.vehicleBoostTurns > 0
        ? `${district.name}: ${nextState.vehicleId === 'tram-runner' ? 'Tram-runner' : 'Hoverbike'} run active.`
        : `${district.name}: move carefully and keep the patrol rhythm in your head.`,
    };

    const directContact = getLucidAvenuePatrolPositions(nextState).some((patrol) => isSamePosition(patrol.position, nextPosition));
    if (directContact) {
      if (nextState.vehicleBoostTurns > 0) {
        nextState = appendLog({
          ...nextState,
          heat: Math.max(0, nextState.heat - 1),
          message: `${nextState.vehicleId === 'tram-runner' ? 'Tram-runner' : 'Hoverbike'} burst ghosted a patrol lane before it locked on.`,
        }, '🏍️ Vehicle burst slipped the patrol lane.');
      } else {
        nextState = resolvePatrolContact(nextState, 'You walked straight into a patrol lane.');
        if (nextState.outcome !== 'playing') return syncContracts(nextState);
      }
    }

    const previousDistrictId = nextState.districtId;
    nextState = collectAtCurrentPosition(nextState);
    nextState = warpIfStandingOnExit(nextState);
    if (nextState.districtId !== previousDistrictId) break;
  }

  if (nextState.vehicleBoostTurns > 0) {
    const nextBoostTurns = nextState.vehicleBoostTurns - 1;
    nextState = appendLog({
      ...nextState,
      vehicleBoostTurns: nextBoostTurns,
      vehicleId: nextBoostTurns <= 0 ? 'foot' : nextState.vehicleId,
      message: nextBoostTurns <= 0
        ? 'Vehicle run spent. Your runner drops back to foot control.'
        : nextState.message,
    }, nextBoostTurns <= 0 ? '🦶 Vehicle run finished.' : `🏍️ ${nextState.vehicleId} boost held.`);
  }

  nextState = advancePatrols(syncContracts(nextState));
  return syncContracts(nextState);
}

export function waitLucidAvenueTurn(state: LucidAvenueState) {
  if (state.outcome !== 'playing') return state;
  return syncContracts(advancePatrols(appendLog({
    ...state,
    turn: state.turn + 1,
    message: 'You hold position and let the patrol pattern reveal itself.',
  }, '⏱️ Waited one beat.')));
}

export function scanLucidAvenue(state: LucidAvenueState) {
  if (state.outcome !== 'playing') return state;
  if (state.battery <= 0) {
    return withMessage(state, 'Battery dry. You need another cache before running a city scan.', '🔋 No battery left for scan.');
  }

  return syncContracts(advancePatrols(appendLog({
    ...state,
    turn: state.turn + 1,
    battery: state.battery - 1,
    heat: Math.max(0, state.heat - 1),
    scanTurns: 3,
    message: 'Pulse scan active. Patrol routes flare in your visor and the heat drops a notch.',
  }, '📡 Scan pulse fired.')));
}

export function jamLucidAvenueGrid(state: LucidAvenueState) {
  if (state.outcome !== 'playing') return state;
  if (state.battery <= 0) {
    return withMessage(state, 'Battery too low. You need charge before pushing a district-wide GameEngin jam.', '🔋 No battery left for jam.');
  }
  if (state.credits < 20) {
    return withMessage(state, 'You need 20 credits to flood the district net with a GameEngin jam.', '💸 Not enough credits for jam.');
  }

  return syncContracts(advancePatrols(appendLog({
    ...state,
    turn: state.turn + 1,
    battery: state.battery - 1,
    credits: state.credits - 20,
    heat: Math.max(0, state.heat - 2),
    jamTurns: Math.max(state.jamTurns, 2),
    jamActivations: state.jamActivations + 1,
    message: 'GameEngin uplink floods the district grid. Patrol timing desyncs and the city goes quiet for a moment.',
  }, '🛰️ District patrol grid jammed.')));
}

export function deployLucidAvenueVehicle(state: LucidAvenueState, vehicleId: Exclude<LucidVehicleId, 'foot'>) {
  if (state.outcome !== 'playing') return state;
  if (state.battery <= 0) {
    return withMessage(state, 'Battery too low to deploy a city vehicle.', '🔋 No battery left for vehicle deployment.');
  }

  if (vehicleId === 'tram-runner' && !state.flags.tramPass && state.mode !== 'sandbox') {
    return withMessage(state, 'The tram-runner refuses to sync until Mika clears your badge.', '🚋 Tram-runner: transit clearance missing.');
  }

  const cost = vehicleId === 'tram-runner' ? 30 : 20;
  if (state.credits < cost) {
    return withMessage(state, `You need ${cost} credits to deploy the ${vehicleId === 'tram-runner' ? 'tram-runner' : 'hoverbike'}.`, '💸 Vehicle deployment denied.');
  }

  return syncContracts(appendLog({
    ...state,
    credits: state.credits - cost,
    battery: state.battery - 1,
    vehicleId,
    vehicleBoostTurns: vehicleId === 'tram-runner' ? 3 : 4,
    message: `${vehicleId === 'tram-runner' ? 'Tram-runner' : 'Hoverbike'} deployed. Your next route inputs burst across the city grid.`,
  }, `🏍️ ${vehicleId === 'tram-runner' ? 'Tram-runner' : 'Hoverbike'} deployed.`));
}

export function fastTravelLucidAvenue(state: LucidAvenueState, districtId: DistrictId) {
  if (state.outcome !== 'playing') return state;
  if (districtId === state.districtId) {
    return withMessage(state, `${getLucidAvenueDistrict(districtId).name} already loaded.`, '🗺️ Already in that district.');
  }
  if (state.mode !== 'sandbox' && !state.visitedDistrictIds.includes(districtId)) {
    return withMessage(state, 'Atlas jump locks to districts you have already reached in story mode.', '🗺️ Story atlas cannot jump there yet.');
  }
  const travelCost = state.mode === 'sandbox' ? 0 : 10;
  if (travelCost > 0 && state.credits < travelCost) {
    return withMessage(state, 'You need 10 credits to atlas-jump in story mode.', '💸 Not enough credits for atlas jump.');
  }

  const target = getLucidAvenueDistrict(districtId);
  return syncContracts(appendLog({
    ...state,
    districtId,
    player: { ...target.spawn },
    turn: state.turn + 1,
    credits: state.credits - travelCost,
    heat: Math.max(0, state.heat - 1),
    visitedDistrictIds: state.visitedDistrictIds.includes(districtId)
      ? state.visitedDistrictIds
      : [...state.visitedDistrictIds, districtId],
    message: `Atlas jump complete. ${target.name} is live on the GameEngin uplink.`,
  }, `🗺️ Atlas jumped to ${target.name}.`));
}

export function getLucidAvenueHint(state: LucidAvenueState) {
  if (state.mode === 'sandbox' && state.completedContractIds.length < LUCID_AVENUE_TOTAL_CONTRACTS) {
    return 'AI sandbox hint: jump districts from the atlas, deploy a vehicle, and clear route contracts in any order.';
  }
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
  if (!state.flags.floodgatesPatched) {
    return 'AI route hint: head into River Gates, find Dex, and patch the floodgate controller before pushing west.';
  }
  if (!state.flags.skylineKey) {
    return state.shards.length >= 5
      ? 'AI route hint: visit Sol in the Studio Lot for the skyline key.'
      : 'AI route hint: recover five total shards so Sol will trust the route enough to trade the skyline key.';
  }
  if (!state.flags.civicSeal) {
    return state.shards.length >= 6
      ? 'AI route hint: visit Noa in Civic Center to secure the civic seal.'
      : 'AI route hint: recover six total shards so Noa will certify your hill corridor.';
  }
  if (!state.flags.relayAligned) {
    return state.shards.length >= 7
      ? 'AI route hint: align Vera’s Sky Array in Sunset Heights.'
      : 'AI route hint: recover enough remaining shards before trying to align the hill relay.';
  }
  if (state.shards.length < LUCID_AVENUE_TOTAL_SHARDS) {
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
  return syncContracts(appendLog({
    ...state,
    message: hint,
  }, `🧠 ${hint}`));
}

export function interactInLucidAvenue(state: LucidAvenueState) {
  if (state.outcome !== 'playing') return state;
  const npc = findNearbyNpc(state);
  if (npc) return syncContracts(handleNpcInteraction(state, npc));

  const terminal = findNearbyTerminal(state);
  if (terminal) return syncContracts(handleTerminalInteraction(state, terminal));

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
