# ============================================================
# .github/workflows/gameengin-ai-agent.yml
# ============================================================
name: GameEngin AI Agent

on:
  workflow_dispatch:
  push:
    branches: [ main, develop ]
    paths:
      - 'engine/**'
      - 'games/**'
      - '.github/workflows/gameengin-ai-agent.yml'

jobs:
  gameengin-ai-loop:
    name: Design + Generate + Validate Game for GameEngin
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    env:
      OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      # 1. Scan current GameEngin + Games context (DREAMengin-aware)
      - name: Scan GameEngin + Games context
        run: |
          mkdir -p .github/generated
          python .github/scripts/scan_gameengin_context.py > .github/generated/gameengin-context.md || true

      # 2. AI: propose ONE new SICC, genre-mix game that mounts on GameEngin
      - name: AI propose SICC genre-mix game
        id: ai_propose
        uses: openai/completions@v1   # replace with your real AI action
        with:
          apiKey: ${{ env.OPENAI_API_KEY }}
          model: gpt-4.1
          prompt: |
            You are the GameEngin design+runtime AI agent inside DREAMengin.

            Platform:
            - Dual-runtime: SurfaceSpace (upper) + DreamSpace (lower).
            - Daydream: Games (/daydream/games).
            - Engin: GameEngin (Side B control/runtime).
            - Rendering: Babylon.js 8+ with WebGPU-first pipeline.
            - Frontend: Next.js 16 App Router, React 19, TypeScript, Tailwind.
            - Data: Supabase (Postgres, RLS, Storage).

            Rules:
            - Game must run on existing GameEngin runtime and Babylon WebGPU scene model.
            - Game must mount as a Dream Window on Games Daydream and be reachable from the Games Daydream surface.
            - Game code must ONLY be invoked through GameEngin (like inserting a disc into a console).
              No standalone Next.js routes may run the game directly.
            - It must be a **unique** genre combination relative to existing games.
            - It must be SICC:
              - Stylized: strong visual identity that can map to Babylon materials / post FX.
              - Intuitive: controls and goals obvious from moment 1.
              - Cohesive: mechanics, UI, and feedback reinforce same idea.
              - Coherent: no random systems; everything supports the core loop.
            - It must be fun: tight core loop, clear reward structure, readable fail states.

            Current engine + games context (truncated):
            {{file:.github/generated/gameengin-context.md}}

            Task:
            1. Invent exactly ONE new game.
            2. Define:
               - title
               - slug (filesystem-safe, lowercase, hyphen separated)
               - entrypoint path under games/ (e.g. games/{slug})
               - route mount relative to Games Daydream (e.g. /daydream/games/{slug})
               - core loop
               - camera + controls (keyboard/gamepad; map to Babylon input)
               - win / lose / progression
               - SICC notes
               - how it uses Dream Windows (at least one GameEngin Dream Window)
               - how it respects privacy model (no public-by-default states)

            Output JSON only:
            {
              "title": "...",
              "slug": "unique_slug",
              "entrypoint": "games/unique_slug",
              "route": "/daydream/games/unique_slug",
              "summary": "...",
              "core_loop": "...",
              "camera": "...",
              "controls": { "keyboard": "...", "gamepad": "..." },
              "win_state": "...",
              "lose_state": "...",
              "progression": "...",
              "genres": ["...", "..."],
              "sicc": {
                "stylized": "...",
                "intuitive": "...",
                "cohesive": "...",
                "coherent": "..."
              },
              "dream_windows": [
                "game world Dream Window",
                "player state Dream Window"
              ],
              "privacy_notes": "..."
            }

      - name: Save game design spec
        run: |
          echo '${{ steps.ai_propose.outputs.completion }}' > .github/generated/game-design.json

      # 3. Character generation (original characters, context-aware)
      - name: AI generate original game characters
        id: ai_characters
        uses: openai/completions@v1
        with:
          apiKey: ${{ env.OPENAI_API_KEY }}
          model: gpt-4.1
          prompt: |
            You are the character design AI inside DREAMengin / GameEngin.

            Design JSON:
            {{file:.github/generated/game-design.json}}

            Rules:
            - Generate original characters only; no references or clones of existing IP.
            - Characters must fit:
              - the genres
              - the SICC notes
              - the core loop and mechanics
              - DREAMengin's privacy-first, user-first ethos
            - At least:
              - 1 main playable character (if applicable)
              - 1–3 key secondary characters
              - 2–5 enemy / obstacle archetypes
            - Include visual style hooks that can map to Babylon materials, lighting, and animation behavior.
            - Include personality, goals, and how they interact with Dream Windows.

            Output JSON only:
            {
              "main": {
                "name": "...",
                "role": "...",
                "visual_style": "...",
                "abilities": ["..."],
                "personality": "...",
                "dream_window_signals": ["health", "state", "progress"]
              },
              "secondary": [{ ... }],
              "enemies": [{ ... }]
            }

      - name: Save character spec
        run: |
          echo '${{ steps.ai_characters.outputs.completion }}' > .github/generated/game-characters.json

      # 4. Game logic design (systems & state, not code yet)
      - name: AI design game logic from context
        id: ai_logic
        uses: openai/completions@v1
        with:
          apiKey: ${{ env.OPENAI_API_KEY }}
          model: gpt-4.1
          prompt: |
            You are the systems designer AI for GameEngin.

            Inputs:
            - Game design:
              {{file:.github/generated/game-design.json}}
            - Characters:
              {{file:.github/generated/game-characters.json}}

            Task:
            - Define the core game logic in a way that can be implemented on:
              - GameEngin runtime (entities, systems, events)
              - Dream Windows (state exposure)
              - Babylon.js WebGPU scenes (spatial states, interactions)
            - Focus on:
              - state variables
              - events
              - progression rules
              - win/lose checks
              - how different systems interact
            - Keep it SICC and coherent with narrative.

            Output JSON only:
            {
              "state": {
                "player": { "fields": ["..."] },
                "world": { "fields": ["..."] },
                "enemies": { "fields": ["..."] }
              },
              "events": [
                { "name": "...", "triggers": ["..."], "effects": ["..."] }
              ],
              "systems": [
                { "name": "...", "description": "...", "update_rate": "frame|tick|event" }
              ],
              "win_conditions": ["..."],
              "lose_conditions": ["..."],
              "progression_rules": ["..."]
            }

      - name: Save game logic spec
        run: |
          echo '${{ steps.ai_logic.outputs.completion }}' > .github/generated/game-logic.json

      # 5. Full story / mythology / plot
      - name: AI write full game story and world
        id: ai_story
        uses: openai/completions@v1
        with:
          apiKey: ${{ env.OPENAI_API_KEY }}
          model: gpt-4.1
          prompt: |
            You are the narrative design AI for DREAMengin's Games Daydream.

            Inputs:
            - Game design:
              {{file:.github/generated/game-design.json}}
            - Characters:
              {{file:.github/generated/game-characters.json}}
            - Logic:
              {{file:.github/generated/game-logic.json}}

            Rules:
            - Write an original, non-derivative story.
            - Cover:
              - world background + mythology
              - current conflict or driving problem
              - main character's arc
              - key secondary character arcs
              - how gameplay actions reflect story beats
            - Narrative must:
              - match SICC tone
              - be coherent with mechanics and Dream Window states
              - be implementable as in-game text, VO, or environmental storytelling
            - DO NOT output code here, only structured narrative.

            Output JSON only:
            {
              "world_background": "...",
              "mythology": "...",
              "setup": "...",
              "chapters": [
                {
                  "id": 1,
                  "title": "...",
                  "summary": "...",
                  "key_gameplay_beats": ["..."]
                }
              ],
              "character_arcs": {
                "main": "...",
                "secondary": [{ "name": "...", "arc": "..." }]
              },
              "ending_variants": [
                { "id": "good", "conditions": ["..."], "summary": "..." },
                { "id": "bad", "conditions": ["..."], "summary": "..." }
              ]
            }

      - name: Save game narrative
        run: |
          echo '${{ steps.ai_story.outputs.completion }}' > .github/generated/game-story.json

      # 6. AI generate GameEngin-compatible game code
      - name: AI generate GameEngin-compatible game code
        id: ai_generate
        uses: openai/completions@v1
        with:
          apiKey: ${{ env.OPENAI_API_KEY }}
          model: gpt-4.1
          prompt: |
            You are the GameEngin implementation AI for DREAMengin.

            Tech:
            - Next.js 16 App Router, React 19, TypeScript.
            - Babylon.js 8+ with WebGPU-first rendering.
            - GameEngin runtime APIs and Dream Windows.
            - Supabase for persistence with RLS.

            Inputs:
            - design: {{file:.github/generated/game-design.json}}
            - characters: {{file:.github/generated/game-characters.json}}
            - logic: {{file:.github/generated/game-logic.json}}
            - story: {{file:.github/generated/game-story.json}}

            Rules:
            - Implement or extend the game at "entrypoint" under games/**.
            - Only touch:
              - games/**
              - engine/gameengin/**
            - Use TS/TSX with strict types.
            - Bind logic state to Babylon scenes and Dream Windows.
            - Reflect story beats via HUD, events, or environmental cues.
            - Uphold SICC and fun; if a mechanic conflicts with narrative or coherence, favor coherence.

            Output:
            - Unified diff (git patch) only.

      - name: Apply AI patch
        continue-on-error: true
        run: |
          mkdir -p .github/generated
          echo '${{ steps.ai_generate.outputs.completion }}' > .github/generated/game-patch.diff
          git apply .github/generated/game-patch.diff || true

      # 7. Disc-only sandbox rule: games must only run via GameEngin
      - name: Validate game sandbox rules (disc-only via GameEngin)
        run: |
          python .github/scripts/validate_game_sandbox.py

      # 8. Game-only build gate: do not commit if games break the engine/games build
      - name: Use Node.js 24 (game gate)
        uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm

      - name: Install pnpm (game gate)
        run: npm install -g pnpm

      - name: Install deps (game gate)
        run: pnpm install --frozen-lockfile

      - name: Build GameEngin + games (gate)
        run: pnpm run build:gamesengin

      - name: Test games (gate)
        run: pnpm run test:games

      - name: Commit AI changes (if any)
        if: success()
        continue-on-error: true
        run: |
          if [ -n "$(git status --porcelain)" ]; then
            git config user.name "GameEngin AI Agent"
            git config user.email "gameengin-ai@users.noreply.github.com"
            git commit -am "AI: add/update SICC game for GameEngin"
          fi

      - name: Push AI changes (same branch)
        if: success()
        continue-on-error: true
        run: |
          if [ -n "$(git log origin/${GITHUB_REF_NAME}..HEAD)" ]; then
            git push origin HEAD:${GITHUB_REF_NAME}
          fi

      # 9. Optional: global build + tests, non-blocking
      - name: Build DREAMengin (full app)
        continue-on-error: true
        env:
          NEXT_TELEMETRY_DISABLED: 1
        run: pnpm build

      - name: Run full test suite
        continue-on-error: true
        run: pnpm test

# ============================================================
# .github/workflows/games-library-ai-agent.yml
# ============================================================
name: Games Library AI Agent

on:
  workflow_dispatch:
  schedule:
    - cron: '0 4 * * *'  # nightly evolution

jobs:
  evolve-games-library:
    name: Combine Genres + Polish SICC Games
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    env:
      OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      # 1. Catalog existing games with brief metadata
      - name: Catalog games
        run: |
          mkdir -p .github/generated
          python .github/scripts/catalog_games_for_ai.py >
# Fill in the fields below to create a basic custom agent for your repository.
# The Copilot CLI can be used for local testing: https://gh.io/customagents/cli
# To make this agent available, merge this file into the default repository branch.
# For format details, see: https://gh.io/customagents/config

name:
description:
---

# My Agent

Describe what your agent does here.
