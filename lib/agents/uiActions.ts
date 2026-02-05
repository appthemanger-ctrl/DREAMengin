import { setDarkMode } from '@/lib/ui/theme';

export type UiActionResult = { handled: boolean; reply: string };

export type UiActionContext = {
  navigate: (path: string) => void;
};

type Action = {
  id: string;
  description: string;
  match: (q: string) => boolean;
  run: (q: string, ctx: UiActionContext) => UiActionResult;
};

const ACTIONS: Action[] = [
  {
    id: 'theme.dark',
    description: 'Turn on dark mode',
    match: (q) => /\b(dark mode|night mode)\b/.test(q) && !/\b(off|disable|light)\b/.test(q),
    run: (_q, _ctx) => {
      setDarkMode(true);
      return { handled: true, reply: 'Done. Dark mode is on.' };
    },
  },
  {
    id: 'theme.light',
    description: 'Turn on light mode',
    match: (q) => /\b(light mode)\b/.test(q) || (/\b(dark mode)\b/.test(q) && /\b(off|disable)\b/.test(q)),
    run: (_q, _ctx) => {
      setDarkMode(false);
      return { handled: true, reply: 'Done. Light mode is on.' };
    },
  },
  {
    id: 'theme.toggle',
    description: 'Toggle theme',
    match: (q) => /\b(toggle theme|switch theme|toggle dark)\b/.test(q),
    run: (_q, _ctx) => {
      const isDark = document.documentElement.classList.contains('dark');
      setDarkMode(!isDark);
      return { handled: true, reply: `Ok. Theme switched to ${!isDark ? 'Dark' : 'Light'} mode.` };
    },
  },
  {
    id: 'nav.common',
    description: 'Open a page (Home, Discover, Music, Lab, Messages, Analytics, Shop, Ads, Settings, Profile)',
    match: (q) => /\b(go to|open|take me to|navigate to|show me)\b/.test(q),
    run: (q, ctx) => {
      const routes: Array<{ k: RegExp; path: string; label: string }> = [
        { k: /\b(home|dashboard)\b/, path: '/home', label: 'Home' },
        { k: /\b(discover|search)\b/, path: '/discover', label: 'Discover' },
        { k: /\b(messages|dms|inbox|chat)\b/, path: '/messages', label: 'Messages' },
        { k: /\b(music|tracks|playlists)\b/, path: '/music', label: 'Music' },
        { k: /\b(lab|projects|science)\b/, path: '/lab', label: 'Lab' },
        { k: /\b(analytics|stats|metrics)\b/, path: '/analytics', label: 'Analytics' },
        { k: /\b(shop|merch|store)\b/, path: '/shop', label: 'Shop' },
        { k: /\b(ads|monetize|monetization)\b/, path: '/ads', label: 'Ads' },
        { k: /\b(settings|preferences)\b/, path: '/settings', label: 'Settings' },
        { k: /\b(profile|edit profile)\b/, path: '/edit-profile', label: 'Edit Profile' },
        { k: /\b(connectors|imports|youtube)\b/, path: '/connectors', label: 'Connectors' },
        { k: /\b(admin)\b/, path: '/admin', label: 'Admin' },
      ];
      const hit = routes.find((r) => r.k.test(q));
      if (!hit) return { handled: false, reply: '' };
      ctx.navigate(hit.path);
      return { handled: true, reply: `Opening ${hit.label}.` };
    },
  },
  {
    id: 'flow.create',
    description: 'Open the Create flow',
    match: (q) => /\b(create|new)\b/.test(q) && /\b(post|content)\b/.test(q),
    run: (_q, ctx) => {
      ctx.navigate('/home?modal=create');
      return { handled: true, reply: 'Opening Create.' };
    },
  },
  {
    id: 'theme.colors.help',
    description: 'Go to Settings for color customization',
    match: (q) => /\b(change|customize|edit)\b/.test(q) && /\b(colors?|palette|theme)\b/.test(q),
    run: (_q, ctx) => {
      ctx.navigate('/settings');
      return { handled: true, reply: 'Taking you to Settings for customization.' };
    },
  },
];

export function executeUiAction(query: string, ctx: UiActionContext): UiActionResult | null {
  const q = query.trim().toLowerCase();
  for (const a of ACTIONS) {
    if (a.match(q)) {
      const res = a.run(q, ctx);
      if (res.handled) return res;
    }
  }
  return null;
}

export function getUiCapabilities(): string {
  const lines = [
    'Here are safe UI actions I can do:',
    '- Navigate: Home, Discover, Music, Lab, Messages, Analytics, Shop, Ads, Settings, Profile, Connectors',
    '- Theme: dark mode, light mode, toggle theme',
    '- Create: open Create post flow',
    '',
    'Ask using phrases like: "open music" or "turn on dark mode".',
  ];
  return lines.join('\n');
}
