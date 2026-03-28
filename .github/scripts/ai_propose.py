# .github/scripts/ai_propose.py
#
# Reads the DREAMengin context snapshot and asks the OpenAI API to
# propose ONE creative, direction-setting "big move" for the platform.
#
# Usage (called by spec-engin-ai-agent.yml):
#   python .github/scripts/ai_propose.py \
#       --context .github/generated/dreamengin-context.md \
#       --out     .github/generated/dreamengin-spec.json \
#       --model   gpt-4.1
#
# Requires:  OPENAI_API_KEY env var
# Stdlib only — no extra dependencies.

import argparse
import json
import os
import sys
import urllib.error
import urllib.request


# ── Prompt ────────────────────────────────────────────────────────────────────

SYSTEM = """\
You are the Spec-Engin AI for DREAMengin.

Non-negotiable constraints:
- Tech: Next.js 16 App Router, React 19, TypeScript, Tailwind.
- 3D/visual: Babylon.js 8+ with WebGPU-first where used.
- Data: Supabase with RLS; privacy-first, nothing public by default.
- Structure: dual-runtime (SurfaceSpace / DreamSpace), Daydreams, Engins.

SICC has TWO canon meanings — both must be satisfied:
  SICC (immersion): Super Immersive Creative Controls
    Users feel expressive, playful, and deeply engaged.
  SICC (clarity):   Stylized · Intuitive · Cohesive · Coherent
    Strong visual identity, obvious affordances, no random systems.
"""

TASK_TEMPLATE = """\
You have a large-context summary of DREAMengin docs and code:

<context>
{context}
</context>

Task:
1. Using the full context above, design ONE creative, direction-setting change
   to DREAMengin itself (NOT game content), for example:
   - a new Daydream or a major evolution of an existing Daydream,
   - a new Engin / Dream Window primitive or navigation pattern,
   - a better way to traverse and orchestrate the dual-runtime.
2. The change must materially increase BOTH SICC layers.
3. Define the FIRST IMPLEMENTATION SLICE that:
   - compiles and runs in a single CI run,
   - is clearly visible or testable in the app,
   - is more than cosmetic.

Output JSON ONLY (no markdown fences, no prose outside the JSON):
{{
  "title": "...",
  "big_idea": "...",
  "motivation": "...",
  "user_outcomes": ["...", "..."],
  "sicc_immersion": {{
    "super_immersive_creative_controls": ["...", "..."]
  }},
  "sicc_clarity": {{
    "stylized": "...",
    "intuitive": "...",
    "cohesive": "...",
    "coherent": "..."
  }},
  "constraints_respected": [
    "dual-runtime preserved",
    "privacy-first respected",
    "no new deps"
  ],
  "v1_scope": {{
    "description": "what v1 of this idea delivers",
    "files_to_create": ["spec/....md", "app/....tsx"],
    "files_to_modify": ["README.md", "app/....tsx"],
    "test_plan": [
      "describe Vitest suites / scenarios to add/modify"
    ]
  }}
}}
"""


# ── OpenAI call ───────────────────────────────────────────────────────────────

def call_openai(api_key: str, model: str, system: str, user: str,
                max_tokens: int = 4096) -> str:
    payload = {
        "model":      model,
        "max_tokens": max_tokens,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
    }
    data = json.dumps(payload).encode("utf-8")
    req  = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data    = data,
        headers = {
            "Content-Type":  "application/json",
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


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="AI spec proposal for DREAMengin")
    parser.add_argument("--context", required=True,  help="Path to dreamengin-context.md")
    parser.add_argument("--out",     required=True,  help="Path to write dreamengin-spec.json")
    parser.add_argument("--model",   default="gpt-4.1", help="OpenAI model name")
    args = parser.parse_args()

    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        print("Error: OPENAI_API_KEY env var is not set.", file=sys.stderr)
        sys.exit(1)

    with open(args.context, "r", encoding="utf-8") as fh:
        context_text = fh.read()

    user_prompt = TASK_TEMPLATE.format(context=context_text)

    print(f"Calling {args.model} for spec proposal…", file=sys.stderr)
    raw = call_openai(api_key, args.model, SYSTEM, user_prompt, max_tokens=4096)

    # Strip optional markdown fences the model sometimes wraps around JSON.
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        cleaned = "\n".join(lines[1:-1] if lines[-1].startswith("```") else lines[1:])

    # Validate the response is parseable JSON before writing.
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        print(f"Warning: model output is not valid JSON ({exc}). Saving raw text.", file=sys.stderr)
        parsed = {"raw": cleaned, "parse_error": str(exc)}

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(parsed, fh, indent=2)

    print(f"Spec written to {args.out}", file=sys.stderr)


if __name__ == "__main__":
    main()
