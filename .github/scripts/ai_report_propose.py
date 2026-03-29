#!/usr/bin/env python3
#
# Reads a report-aware context document and asks the OpenAI API to create a
# coherent implementation spec for a GitHub coding agent run.
#
# Usage:
#   python .github/scripts/ai_report_propose.py \
#       --context .github/generated/report-agent-context.md \
#       --out     .github/generated/report-agent-spec.json \
#       --model   gpt-4.1
#
# Requires: OPENAI_API_KEY

import argparse
import json
import os
import sys
import urllib.error
import urllib.request


SYSTEM = """\
You are the DREAMengin GitHub Coding Agent.

You convert repository reports into the SMALLEST COHERENT implementation plan
that a follow-up implementation model can apply safely in one CI run.

Non-negotiable constraints:
- Tech: Next.js 16 App Router, React 19, TypeScript, Tailwind.
- Data + auth: Supabase with RLS, privacy-first defaults.
- No new npm dependencies.
- Preserve existing architecture unless the report explicitly requires changes.
- Prefer modifying existing files over introducing new runtime surfaces.
- The clarified request is NOT for an in-app help widget. It is for GitHub-based
  automation that can act on a report.
- Every run must also upgrade at least one advanced game or GameEngin experience.
- The mandatory game upgrade must target a non-trivial experience, not a simple
  tap-only loop.

Your plan must:
- address the report as completely as possible in a single coherent slice,
- avoid unrelated cleanup,
- be buildable and testable in CI,
- be specific about which files to create/modify,
- explicitly name the advanced game target being upgraded.
"""


TASK_TEMPLATE = """\
You have a report and repository context:

<context>
{context}
</context>

Task:
1. Interpret the report and identify the real implementation target.
2. Design the smallest complete change set that addresses it.
3. Prefer GitHub workflows/scripts/docs when the report is about repo automation.
4. If previously-added work appears misaligned with the report, include reverting
   that work in the plan.
5. Even if the report is not game-specific, include a second slice that upgrades
   at least one advanced game target from the provided manifest or game catalog.
6. Favor upgrades that deepen GameEngin standards: richer systems, better AI,
   better progression, better rendering, better feel, or more advanced encounters.

Output JSON ONLY:
{{
  "title": "...",
  "report_summary": "...",
  "implementation_goal": "...",
  "motivation": "...",
  "advanced_game_upgrade": {{
    "target_game_id": "...",
    "target_file": "...",
    "why_this_game": "...",
    "upgrade_type": "...",
    "player_value": "...",
    "engine_value": "..."
  }},
  "constraints_respected": [
    "no new deps",
    "existing repo automation reused",
    "minimal unrelated churn",
    "at least one advanced game upgraded"
  ],
  "v1_scope": {{
    "description": "...",
    "files_to_create": ["..."],
    "files_to_modify": ["..."],
    "files_to_delete": ["..."],
    "test_plan": [
      "specific validation commands or checks"
    ]
  }}
}}
"""


def call_openai(api_key: str, model: str, system: str, user: str, max_tokens: int = 4096) -> str:
    payload = {
        "model": model,
        "max_tokens": max_tokens,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        print(f"OpenAI API error {exc.code}: {body}", file=sys.stderr)
        sys.exit(1)

    return result["choices"][0]["message"]["content"]


def main() -> None:
    parser = argparse.ArgumentParser(description="AI implementation proposal from a report")
    parser.add_argument("--context", required=True, help="Path to report-agent-context.md")
    parser.add_argument("--out", required=True, help="Path to write report-agent-spec.json")
    parser.add_argument("--model", default="gpt-4.1", help="OpenAI model name")
    args = parser.parse_args()

    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        print("Error: OPENAI_API_KEY env var is not set.", file=sys.stderr)
        sys.exit(1)

    with open(args.context, "r", encoding="utf-8") as fh:
        context_text = fh.read()

    user_prompt = TASK_TEMPLATE.format(context=context_text)
    print(f"Calling {args.model} for report-agent proposal…", file=sys.stderr)
    raw = call_openai(api_key, args.model, SYSTEM, user_prompt, max_tokens=4096)

    cleaned = raw.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        cleaned = "\n".join(lines[1:-1] if lines[-1].startswith("```") else lines[1:])

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        print(f"Warning: model output is not valid JSON ({exc}). Saving raw text.", file=sys.stderr)
        parsed = {"raw": cleaned, "parse_error": str(exc)}

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(parsed, fh, indent=2)

    print(f"Report-agent spec written to {args.out}", file=sys.stderr)


if __name__ == "__main__":
    main()
