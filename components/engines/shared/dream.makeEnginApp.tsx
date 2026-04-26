'use client';

/**
 * dream.makeEnginApp.tsx
 *
 * makeEnginApp — factory that converts an EnginRuleSet into a complete,
 * production-ready engine app component.
 *
 * Every Engin app is structurally identical: an EnginAppShell wrapping an
 * EnginNavBar and the domain-specific engin component. This factory owns
 * that structure once so individual engine files contain only their config.
 *
 * Usage:
 *   import { makeEnginApp } from '@/components/engines/shared';
 *   import StarMakerEngin from '@/engins/engin.StarMakerEngin';
 *
 *   export default makeEnginApp({
 *     id: 'music',
 *     name: 'StarMakerEngin',
 *     emoji: '🎵',
 *     accentColor: '#a855f7',
 *     backHref: '/daydream/music',
 *     backLabel: 'Music Daydream',
 *     nav: [...],
 *     EnginComponent: StarMakerEngin,
 *   });
 *
 * Architecture: docs/ARCHITECTURE.md §0 — stable core + swappable rule-sets.
 */

import { useRouter } from 'next/navigation';
import EnginAppShell from './dream.shell.EnginAppShell';
import EnginNavBar from './dream.bar.EnginNavBar';
import type { EnginRuleSet } from './dream.EnginRuleSet';

/**
 * Returns a React component that renders the full Engin shell for the given
 * ruleset. The returned component has no required props — all configuration
 * lives in the ruleset.
 */
export function makeEnginApp(ruleset: EnginRuleSet): () => React.JSX.Element {
  function EnginApp() {
    const router = useRouter();
    const { EnginComponent } = ruleset;
    return (
      <EnginAppShell
        engineName={ruleset.name}
        engineEmoji={ruleset.emoji}
        accentColor={ruleset.accentColor}
        backHref={ruleset.backHref}
        backLabel={ruleset.backLabel}
        nav={<EnginNavBar items={ruleset.nav} accentColor={ruleset.accentColor} />}
      >
        <div className="h-full overflow-y-auto">
          <EnginComponent onBack={() => router.push(ruleset.backHref)} />
        </div>
      </EnginAppShell>
    );
  }

  EnginApp.displayName = `EnginApp(${ruleset.id})`;
  return EnginApp;
}
