import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const validator = join(repoRoot, '.github/scripts/validate_report_agent_spec.py');
const reportProposer = join(repoRoot, '.github/scripts/ai_report_propose.py');
const implementer = join(repoRoot, '.github/scripts/ai_implement.py');
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

describe('report-driven AI scripts', () => {
  it('ai_report_propose.py uses the expanded default completion budget', () => {
    const dir = mkdtempSync(join(tmpdir(), 'dreamengin-report-propose-'));
    const contextPath = join(dir, 'context.md');
    const outPath = join(dir, 'spec.json');
    writeFileSync(contextPath, '# context\n\n<report>full report</report>\n');

    const python = `
import importlib.util
import json
import sys

script_path, context_path, out_path = sys.argv[1:4]
spec = importlib.util.spec_from_file_location("report_propose", script_path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class FakeResponse:
    def __init__(self, body):
        self.body = body
    def __enter__(self):
        return self
    def __exit__(self, exc_type, exc, tb):
        return False
    def read(self):
        return json.dumps(self.body).encode("utf-8")

def fake_urlopen(req, timeout=0):
    payload = json.loads(req.data.decode("utf-8"))
    print(payload["max_tokens"])
    return FakeResponse({
        "choices": [{
            "message": {
                "content": json.dumps({
                    "title": "ok",
                    "advanced_game_upgrade": {
                        "target_game_id": "babylon-side-scroller",
                        "target_file": "components/games/BabylonSideScroller.tsx"
                    },
                    "v1_scope": {
                        "files_to_create": [],
                        "files_to_modify": ["components/games/BabylonSideScroller.tsx"],
                        "files_to_delete": [],
                        "test_plan": []
                    }
                })
            }
        }]
    })

module.urllib.request.urlopen = fake_urlopen
sys.argv = [script_path, "--context", context_path, "--out", out_path]
module.main()
`;

    const stdout = execFileSync('python', ['-c', python, reportProposer, contextPath, outPath], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: { ...process.env, OPENAI_API_KEY: 'test-key' },
      stdio: 'pipe',
    });

    expect(stdout.trim()).toBe('16384');
    expect(JSON.parse(readFileSync(outPath, 'utf8'))).toMatchObject({
      title: 'ok',
      advanced_game_upgrade: {
        target_game_id: 'babylon-side-scroller',
      },
    });
  });

  it('ai_implement.py honors a larger explicit completion budget', () => {
    const dir = mkdtempSync(join(tmpdir(), 'dreamengin-report-implement-'));
    const contextPath = join(dir, 'context.md');
    const specPath = join(dir, 'spec.json');
    const outPath = join(dir, 'patch.diff');
    writeFileSync(contextPath, '# context\n');
    writeFileSync(specPath, JSON.stringify({ title: 'ok', v1_scope: { files_to_modify: [] } }));

    const python = `
import importlib.util
import json
import sys

script_path, context_path, spec_path, out_path = sys.argv[1:5]
spec = importlib.util.spec_from_file_location("report_implement", script_path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class FakeResponse:
    def __init__(self, body):
        self.body = body
    def __enter__(self):
        return self
    def __exit__(self, exc_type, exc, tb):
        return False
    def read(self):
        return json.dumps(self.body).encode("utf-8")

def fake_urlopen(req, timeout=0):
    payload = json.loads(req.data.decode("utf-8"))
    print(payload["max_tokens"])
    return FakeResponse({
        "choices": [{
            "message": {
                "content": "diff --git a/sample.txt b/sample.txt\\n"
            }
        }]
    })

module.urllib.request.urlopen = fake_urlopen
sys.argv = [script_path, "--context", context_path, "--spec", spec_path, "--out", out_path, "--max-tokens", "24576"]
module.main()
`;

    const stdout = execFileSync('python', ['-c', python, implementer, contextPath, specPath, outPath], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: { ...process.env, OPENAI_API_KEY: 'test-key' },
      stdio: 'pipe',
    });

    expect(stdout.trim()).toBe('24576');
    expect(readFileSync(outPath, 'utf8')).toBe('diff --git a/sample.txt b/sample.txt\n');
  });
});
