# .github/scripts/scan_dreamengin_context.py
import os
import json

# Roughly target up to ~100k characters total (model sees plenty, but we
# don't spam it with literally every byte).
MAX_TOTAL_CHARS = 100_000

# Max per-file snippet so no single file dominates.
MAX_CHARS_PER_FILE = 4000

ROOTS = ["README.md", "spec", "app", "engine", "scripts"]
EXTS = [".md", ".mjs", ".js", ".ts", ".tsx", ".css", ".json"]

def collect_files(roots, exts):
    out = []
    for root in roots:
        if os.path.isfile(root):
            if any(root.endswith(ext) for ext in exts):
                out.append(root)
            continue
        if not os.path.isdir(root):
            continue
        for base, _, files in os.walk(root):
            for f in files:
                if any(f.endswith(ext) for ext in exts):
                    out.append(os.path.join(base, f))
    # Stable order: README and spec first, then app/engine/scripts
    out = sorted(out, key=lambda p: (
        0 if p == "README.md" else
        1 if p.startswith("spec") else
        2 if p.startswith("app") else
        3 if p.startswith("engine") else
        4
    ))
    return out

def read_snippet(path, max_chars):
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as fh:
            return fh.read(max_chars)
    except Exception:
        return ""

files = collect_files(ROOTS, EXTS)

entries = []
remaining = MAX_TOTAL_CHARS

for path in files:
    if remaining <= 0:
        break

    # Try to take up to MAX_CHARS_PER_FILE, but cap by what's left
    take = min(MAX_CHARS_PER_FILE, remaining)
    snippet = read_snippet(path, take)
    if not snippet:
        continue

    remaining -= len(snippet)
    entries.append({
        "path": path,
        "snippet": snippet
    })

context = {
    "max_total_chars": MAX_TOTAL_CHARS,
    "max_chars_per_file": MAX_CHARS_PER_FILE,
    "files_scanned": len(files),
    "entries_included": len(entries),
    "entries": entries,
}

print("# DREAMengin Context (docs + code, large window)")
print()
print(json.dumps(context, indent=2))

# .github/workflows/spec-engin-ai-agent.yml
name: Spec-Engin AI Agent

on:
  workflow_dispatch:
  push:
    branches: [ main, develop ]
    paths:
      - 'app/**'
      - 'engine/**'
      - 'scripts/**'
      - 'spec/**'
      - 'README.md'
      - '.github/workflows/spec-engin-ai-agent.yml'

jobs:
  spec-engin-ai-loop:
    name: Read World (Large) → Big Move v1 → Build+Test
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    env:
      OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      # 1. Read as much of DREAMengin as the model can handle
      - name: Scan DREAMengin docs and code (large context)
        run: |
          mkdir -p .github/generated
          python .github/scripts/scan_dreamengin_context.py > .github/generated/dreamengin-context.md || true

      # 2. AI: propose a creative, high-impact change within constraints
      - name: AI propose DREAMengin big move
        id: ai_spec
        uses: openai/completions@v1   # swap to your OpenAI action
        with:
          apiKey: ${{ env.OPENAI_API_KEY }}
          model: gpt-4.1
          prompt: |
            You are the Spec-Engin AI for DREAMengin.

            You have a large-context summary of docs and code:
            {{file:.github/generated/dreamengin-context.md}}

            Non-negotiable constraints:
            - Tech: Next.js 16 App Router, React 19, TypeScript, Tailwind.
            - 3D/visual: Babylon.js 8+ with WebGPU-first where used.
            - Data: Supabase with RLS; privacy-first, nothing public by default.
            - Structure: dual-runtime (SurfaceSpace / DreamSpace), Daydreams, Engins.

            SICC has TWO layers and both must be satisfied:
            - SICC (immersion): Super Immersive Creative Controls
              (users feel expressive, playful, deeply engaged).
            - SICC (clarity): Stylized, Intuitive, Cohesive, Coherent
              (strong visual identity, obvious affordances, no random systems).

            Task:
            1. Using the full context you have, design ONE creative, direction-setting
               change to DREAMengin itself (NOT game content), for example:
               - a new Daydream or a major evolution of an existing Daydream,
               - a new Engin / Dream Window primitive or navigation pattern,
               - a better way to traverse and orchestrate the dual-runtime.
            2. The change must materially increase BOTH SICC layers.
            3. Define the FIRST IMPLEMENTATION SLICE that:
               - compiles and runs in a single CI run,
               - is clearly visible or testable in the app,
               - is more than cosmetic.

            Output JSON only:
            {
              "title": "...",
              "big_idea": "...",
              "motivation": "...",
              "user_outcomes": ["...", "..."],
              "sicc_immersion": {
                "super_immersive_creative_controls": ["...", "..."]
              },
              "sicc_clarity": {
                "stylized": "...",
                "intuitive": "...",
                "cohesive": "...",
                "coherent": "..."
              },
              "constraints_respected": [
                "dual-runtime preserved",
                "privacy-first respected",
                "no new deps"
              ],
              "v1_scope": {
                "description": "what v1 of this idea delivers",
                "files_to_create": [
                  "spec/....md",
                  "app/....tsx",
                  "engine/....ts"
                ],
                "files_to_modify": [
                  "README.md",
                  "spec/....md",
                  "app/....tsx",
                  "engine/....ts"
                ],
                "test_plan": [
                  "describe Vitest suites / scenarios to add/modify"
                ]
              }
            }

      - name: Save DREAMengin big-move proposal
        run: |
          echo '${{ steps.ai_spec.outputs.completion }}' > .github/generated/dreamengin-spec.json

      # 3. AI: implement the first coherent slice of that big idea
      - name: AI implement DREAMengin big move v1
        id: ai_impl
        uses: openai/completions@v1
        with:
          apiKey: ${{ env.OPENAI_API_KEY }}
          model: gpt-4.1
          prompt: |
            You are the DREAMengin implementation AI.

            Tech + constraints:
            - Next.js 16 App Router, React 19, TypeScript.
            - Babylon.js 8+ WebGPU where relevant.
            - Supabase with RLS, privacy-first.
            - Vitest for tests.
            - Tailwind / CSS for styling.
            - NO new dependencies.

            SICC requirements:
            - Immersion: Super Immersive Creative Controls.
            - Clarity: Stylized, Intuitive, Cohesive, Coherent.

            Inputs:
            - Big-move proposal (including v1 scope and SICC notes):
              {{file:.github/generated/dreamengin-spec.json}}
            - Large-context docs + code snippets:
              {{file:.github/generated/dreamengin-context.md}}

            Goal:
            - Implement the FIRST COHERENT SLICE of the big idea:
              - creative, noticeable, and aligned with SICC (both layers),
              - within existing architecture and constraints,
              - still passes "pnpm run build" and "pnpm run test".

            Allowed changes:
            - Docs:
              - README.md
              - spec/**/*.md
            - Code:
              - app/**/*.{ts,tsx,js,mjs}
              - engine/**/*.{ts,tsx,js,mjs}
              - scripts/**/*.{js,mjs}
            - Styles:
              - **/*.css
            - Config/data:
              - **/*.json

            Rules:
            - Align with v1_scope.files_to_create/files_to_modify,
              plus necessary imports/exports.
            - Keep TypeScript strict, components clean and composable.
            - Add or modify Vitest tests when behavior changes.
            - Preserve dual-runtime and privacy model.
            - Make UX and naming feel SICC on both axes.

            Output:
            - Unified diff (git patch) ONLY.

      - name: Apply AI patch
        continue-on-error: true
        run: |
          mkdir -p .github/generated
          echo '${{ steps.ai_impl.outputs.completion }}' > .github/generated/dreamengin-patch.diff
          git apply .github/generated/dreamengin-patch.diff || true

      # 4. Build + test DREAMengin as the hard gate
      - name: Use Node.js 24
        uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install deps
        run: pnpm install --frozen-lockfile

      - name: Build DREAMengin (Next.js)
        run: pnpm run build

      - name: Run Vitest tests
        run: pnpm run test

      - name: Commit DREAMengin big-move v1 (if any)
        if: success()
        continue-on-error: true
        run: |
          if [ -n "$(git status --porcelain)" ]; then
            git config user.name "Spec-Engin AI Agent"
            git config user.email "spec-engin-ai@users.noreply.github.com"
            git commit -am "AI: big-move v1 for DREAMengin"
          fi

      - name: Push DREAMengin changes (same branch)
        if: success()
        continue-on-error: true
        run: |
          if [ -n "$(git log origin/${GITHUB_REF_NAME}..HEAD)" ]; then
            git push origin HEAD:${GITHUB_REF_NAME}
          fi

          # .github/workflows/spec-engin-ai-agent.yml
name: Spec-Engin AI Agent

on:
  workflow_dispatch:
  push:
    branches: [ main, develop ]
    paths:
      - '**'
      - '.github/workflows/spec-engin-ai-agent.yml'

jobs:
  spec-engin-ai-loop:
    name: Read World (Large) → Hyper-Creative Moves → Build+Test
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    env:
      OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      # 1. Read as much of DREAMengin as the model can handle
      - name: Scan DREAMengin docs and code (large context)
        run: |
          mkdir -p .github/generated
          python .github/scripts/scan_dreamengin_context.py > .github/generated/dreamengin-context.md || true

      # 2. AI: propose hyper-creative, platform-wide changes within repo constraints
      - name: AI propose DREAMengin hyper-creative moves
        id: ai_spec
        uses: openai/completions@v1   # swap to your OpenAI action
        with:
          apiKey: ${{ env.OPENAI_API_KEY }}
          model: gpt-4.1
          prompt: |
            You are the Spec-Engin AI for DREAMengin, with a mandate to push
            the entire platform and UI forward.

            You have a large-context summary of docs and code:
            {{file:.github/generated/dreamengin-context.md}}

            Hard constraints (you MUST obey these):
            - Work ONLY with what is already in this repo: existing languages,
              frameworks, libraries, and patterns. You cannot add new external
              dependencies or services.
            - Tech: Next.js 16 App Router, React 19, TypeScript, Tailwind.
            - 3D/visual: Babylon.js 8+ with WebGPU-first where used.
            - Data: Supabase with RLS; privacy-first, nothing public by default.
            - Structure: dual-runtime (SurfaceSpace / DreamSpace), Daydreams, Engins.

            SICC has TWO layers and both must be maximized:
            - SICC (immersion): Super Immersive Creative Controls
              (users feel expressive, playful, deeply engaged, in-flow).
            - SICC (clarity): Stylized, Intuitive, Cohesive, Coherent
              (strong visual identity, obvious affordances, no random systems).

            Your mandate:
            - Be hyper-creative and ambitious.
            - You are allowed to propose major shifts in UI, flows, layouts,
              and how Daydreams and Engins interoperate, as long as you stay
              inside the tech + repo constraints above.

            Task:
            1. Using the full context you have, propose BETWEEN 1 AND 3
               direction-setting changes to DREAMengin itself (NOT just games),
               for example:
               - a new or radically evolved Daydream (HomeDream, Games, Markets, Labs, etc.),
               - a new Engin or Dream Window primitive / orchestration pattern,
               - a new way to traverse and orchestrate the dual-runtime and the whole OS.
            2. Each change must clearly increase BOTH SICC layers.
            3. For EACH proposed change, define the FIRST IMPLEMENTATION SLICE
               that:
               - can compile and run in a single CI run,
               - is clearly visible or testable in the app,
               - is more than cosmetic.

            Output JSON only:
            {
              "moves": [
                {
                  "id": "move-1",
                  "title": "...",
                  "big_idea": "...",
                  "motivation": "...",
                  "user_outcomes": ["...", "..."],
                  "sicc_immersion": {
                    "super_immersive_creative_controls": ["...", "..."]
                  },
                  "sicc_clarity": {
                    "stylized": "...",
                    "intuitive": "...",
                    "cohesive": "...",
                    "coherent": "..."
                  },
                  "constraints_respected": [
                    "dual-runtime preserved",
                    "privacy-first respected",
                    "no new deps"
                  ],
                  "v1_scope": {
                    "description": "what v1 of this idea delivers",
                    "files_to_create": [
                      "spec/....md",
                      "app/....tsx",
                      "engine/....ts"
                    ],
                    "files_to_modify": [
                      "README.md",
                      "spec/....md",
                      "app/....tsx",
                      "engine/....ts"
                    ],
                    "test_plan": [
                      "describe Vitest suites / scenarios to add/modify"
                    ]
                  }
                }
              ]
            }

      - name: Save DREAMengin hyper-creative proposal
        run: |
          echo '${{ steps.ai_spec.outputs.completion }}' > .github/generated/dreamengin-spec.json

      # 3. AI: implement v1 slices of those moves
      - name: AI implement DREAMengin hyper-creative moves v1
        id: ai_impl
        uses: openai/completions@v1
        with:
          apiKey: ${{ env.OPENAI_API_KEY }}
          model: gpt-4.1
          prompt: |
            You are the DREAMengin implementation AI with a hyper-creative mandate.

            Tech + constraints:
            - Work ONLY with what is already in this repo: no new external
              dependencies or services.
            - Next.js 16 App Router, React 19, TypeScript.
            - Babylon.js 8+ WebGPU where relevant.
            - Supabase with RLS, privacy-first.
            - Vitest for tests.
            - Tailwind / CSS for styling.

            SICC you must maximize:
            - Immersion: Super Immersive Creative Controls.
            - Clarity: Stylized, Intuitive, Cohesive, Coherent.

            Inputs:
            - Hyper-creative moves proposal (with one or more moves):
              {{file:.github/generated/dreamengin-spec.json}}
            - Large-context docs + code snippets:
              {{file:.github/generated/dreamengin-context.md}}

            Goal:
            - For EACH proposed move in "moves", implement the FIRST COHERENT SLICE:
              - creative and noticeable changes to UI / flows / platform behavior,
              - clearly advancing both SICC layers,
              - strictly respecting the dual-runtime and privacy model,
              - still passing "pnpm run build" and "pnpm run test".

            Allowed changes (you may touch any file type, but NO new deps):
            - Docs:
              - README.md
              - spec/**/*
            - Code:
              - app/**/*
              - engine/**/*
              - scripts/**/*
            - Styles:
              - any existing CSS/Tailwind usage
            - Config/
              - any existing JSON/config files

            Rules:
            - You MAY create new files within existing directories if needed.
            - You MUST NOT add or require new npm packages or external services.
            - Keep TypeScript strict, components clean and composable.
            - Add or modify Vitest tests when behavior changes.
            - Prefer cohesive, well-named modules over ad-hoc hacks.
            - Make UX and naming feel SICC on both axes.

            Output:
            - Unified diff (git patch) ONLY, across all affected files.

      - name: Apply AI patch
        continue-on-error: true
        run: |
          mkdir -p .github/generated
          echo '${{ steps.ai_impl.outputs.completion }}' > .github/generated/dreamengin-patch.diff
          git apply .github/generated/dreamengin-patch.diff || true

      # 4. Build + test DREAMengin as the only hard gate
      - name: Use Node.js 24
        uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install deps
        run: pnpm install --frozen-lockfile

      - name: Build DREAMengin (Next.js)
        run: pnpm run build

      - name: Run Vitest tests
        run: pnpm run test

      - name: Commit DREAMengin hyper-creative moves v1 (if any)
        if: success()
        continue-on-error: true
        run: |
          if [ -n "$(git status --porcelain)" ]; then
            git config user.name "Spec-Engin AI Agent"
            git config user.email "spec-engin-ai@users.noreply.github.com"
            git commit -am "AI: hyper-creative DREAMengin moves v1"
          fi

      - name: Push DREAMengin changes (same branch)
        if: success()
        continue-on-error: true
        run: |
          if [ -n "$(git log origin/${GITHUB_REF_NAME}..HEAD)" ]; then
            git push origin HEAD:${GITHUB_REF_NAME}
          fi


