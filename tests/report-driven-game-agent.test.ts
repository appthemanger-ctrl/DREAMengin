import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const validator = join(repoRoot, '.github/scripts/validate_report_agent_spec.py');
const targets = join(repoRoot, 'config/advanced-game-targets.json');

function runValidator(spec: unknown) {
  const dir = mkdtempSync(join(tmpdir(), 'dreamengin-report-agent-'));
  const specPath = join(dir, 'spec.json');
  writeFileSync(specPath, JSON.stringify(spec, null, 2));
  return () =>
    execFileSync('python', [validator, '--spec', specPath, '--targets', targets], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: 'pipe',
    });
}

describe('validate_report_agent_spec.py', () => {
  it('accepts specs that include a known advanced game upgrade and game file touch', () => {
    const invoke = runValidator({
      title: 'Upgrade GameEngin depth',
      advanced_game_upgrade: {
        target_game_id: 'babylon-side-scroller',
        target_file: 'components/games/BabylonSideScroller.tsx',
      },
      v1_scope: {
        files_to_create: [],
        files_to_modify: ['components/games/BabylonSideScroller.tsx'],
      },
    });

    expect(invoke).not.toThrow();
  });

  it('rejects specs that skip the mandatory advanced game slice', () => {
    const invoke = runValidator({
      title: 'Only docs',
      v1_scope: {
        files_to_create: [],
        files_to_modify: ['docs/GITHUB_CODING_AGENT.md'],
      },
    });

    expect(invoke).toThrow(/advanced_game_upgrade/i);
  });
});
