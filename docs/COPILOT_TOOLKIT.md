# COPILOT TOOLKIT
## DREAMengin — Complete GitHub Actions Reference + Agent Self-Reminder

**Audience:** GitHub Copilot (me) working in this repository.  
**Purpose:** Every GitHub Actions action I could ever need, plus reminders about how this repo works.  
**Usage:** The user says "read the /docs" — I read this file first and operate from it.

---

## ⚠️ SELF-REMINDER (READ THIS FIRST)

Hey, me. Before touching a single line:

1. **Read `/docs/LAW.md`** — it is the front door. Priority order is defined there.
2. **Read `/docs/AXIOMS.md`** — five axioms that can never be violated.
3. **Read `/docs/IDARI_CONTRACT.md`** — operational contract for my autonomous improvement role.
4. **Read `/docs/ARCHITECTURE.md`** — stack, navigation model, performance rules.
5. **Read `/docs/FEATURE_STATUS.md`** — what is done vs what is mandatory work.
6. **Read `/docs/BUGS.md`** — auto-generated known issues; do not re-introduce them.

### Things I must NEVER do in this repo

- Modify anything in `/docs` (I read it, not write it)
- Modify `docs/LAW.md`, `docs/AXIOMS.md`, `docs/SECURITY.md`, or any policy file
- Modify `.github/agents/` files (those are instructions for agents, not mine to change)
- Ship AI API keys to the client (all AI is server-side only, Vercel env vars)
- Remove or weaken the BoogieMan policy gate
- Enable direct navigation in Home Buttons (they are lock/menu controls, not nav)
- Autoplay background video outside auth pages
- Add decorative JS animation loops
- Commit secrets into source code
- Push to any branch other than `completedream` during autonomous cycles

### Things I always do

- Make the smallest possible surgical change that fully solves the problem
- Run `pnpm typecheck` mentally before committing (check types are correct)
- Every API route that touches AI must go through BoogieMan policy gate
- Every admin route must check `isAdmin` before proceeding
- All intent types go through `validateWithIdari(intents, context)` where context is `'user'` or `'admin'`
- Commit messages must contain: reasoning + architecture justification + performance impact
- Update `docs/HANDOFF.md` and `docs/BUGS.md` via existing scripts after significant changes (they auto-run on push)

### Key file map

| What I need                          | Where to look                                  |
|--------------------------------------|------------------------------------------------|
| Governing law                        | `docs/LAW.md`                                  |
| Five axioms                          | `docs/AXIOMS.md`                               |
| Idari contract                       | `docs/IDARI_CONTRACT.md`                       |
| Architecture rules                   | `docs/ARCHITECTURE.md`                         |
| Feature status (done vs todo)        | `docs/FEATURE_STATUS.md`                       |
| Known bugs                           | `docs/BUGS.md`                                 |
| Security rules                       | `docs/SECURITY.md`                             |
| BoogieMan policy (100 rules)         | `docs/policy/theboogie.md`                     |
| AI triad wiring                      | `lib/ai/triad.ts`                              |
| Intent types (user)                  | `lib/ai/triad.ts` → `USER_ALLOWED_INTENT_TYPES`|
| Intent types (admin)                 | `lib/ai/triad.ts` → `ADMIN_ALLOWED_INTENT_TYPES`|
| Idari agent helpers (PatchPlan)      | `lib/agents/idari.ts`                          |
| BoogieMan policy engine              | `lib/ai/boogieman.ts`                          |
| Capability gate (RBAC)               | `lib/ai/capability-gate.ts`                    |
| Dr. Eams endpoint                    | `app/api/ai/eams/route.ts`                     |
| Idari endpoint                       | `app/api/ai/idari/route.ts`                    |
| BoogieMan endpoint                   | `app/api/ai/boogieman/route.ts`                |
| Unit tests                           | `tests/` — run with `pnpm test:unit`           |
| Existing CI workflows                | `.github/workflows/`                           |
| Idari daily cycle workflow           | `.github/workflows/idari-daily.yml`            |
| Environment variable template        | `.env.example`                                 |

---

## GITHUB ACTIONS — COMPLETE REFERENCE

All actions listed below are safe to use in `.github/workflows/` files.  
Pinned major versions are shown. Always check for security advisories before adding new ones.

---

### CORE / UNIVERSAL

```yaml
# Check out the repository
- uses: actions/checkout@v4
  with:
    fetch-depth: 0          # full history (for changelogs, blame, etc.)
    ref: completedream      # specific branch
    token: ${{ secrets.GITHUB_TOKEN }}

# Upload a file/folder as a workflow artifact
- uses: actions/upload-artifact@v4
  with:
    name: my-artifact
    path: dist/
    retention-days: 7

# Download a previously uploaded artifact
- uses: actions/download-artifact@v4
  with:
    name: my-artifact
    path: dist/

# Cache dependencies or build outputs
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-

# Read a file and set as output
- uses: actions/github-script@v7
  with:
    script: |
      const fs = require('fs');
      const content = fs.readFileSync('docs/LAW.md', 'utf8');
      core.setOutput('content', content);
```

---

### NODE / JAVASCRIPT / TYPESCRIPT

```yaml
# Setup Node.js
- uses: actions/setup-node@v4
  with:
    node-version: '20'        # or '24'
    cache: 'npm'              # or 'pnpm' or 'yarn'

# Setup pnpm
- uses: pnpm/action-setup@v4
  with:
    version: 10.4.0
    run_install: false

# Install with frozen lockfile (CI-safe)
- run: pnpm install --frozen-lockfile

# Type check
- run: pnpm typecheck

# Lint
- run: pnpm lint

# Unit tests (vitest)
- run: pnpm test:unit

# E2E tests (playwright)
- run: pnpm test

# Build Next.js
- run: pnpm build
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

# Audit dependencies
- run: npm audit --audit-level=high
```

---

### PYTHON

```yaml
- uses: actions/setup-python@v5
  with:
    python-version: '3.12'
    cache: 'pip'

- run: pip install -r requirements.txt
- run: python -m pytest
- run: python -m black --check .
- run: python -m mypy .
```

---

### GO

```yaml
- uses: actions/setup-go@v5
  with:
    go-version: '1.22'
    cache: true

- run: go build ./...
- run: go test ./...
- run: go vet ./...
```

---

### JAVA / KOTLIN

```yaml
- uses: actions/setup-java@v4
  with:
    java-version: '21'
    distribution: 'temurin'
    cache: 'maven'            # or 'gradle'

- run: mvn --no-transfer-progress verify
# or
- run: ./gradlew build
```

---

### RUST

```yaml
- uses: dtolnay/rust-toolchain@stable
  with:
    toolchain: stable
    components: clippy, rustfmt

- uses: Swatinem/rust-cache@v2

- run: cargo build --release
- run: cargo test
- run: cargo clippy -- -D warnings
- run: cargo fmt --check
```

---

### DOCKER

```yaml
# Set up Docker Buildx (multi-platform builds)
- uses: docker/setup-buildx-action@v3

# Login to GitHub Container Registry
- uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}

# Login to Docker Hub
- uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKERHUB_USERNAME }}
    password: ${{ secrets.DOCKERHUB_TOKEN }}

# Extract metadata (tags, labels) for Docker image
- uses: docker/metadata-action@v5
  id: meta
  with:
    images: ghcr.io/${{ github.repository }}
    tags: |
      type=ref,event=branch
      type=semver,pattern={{version}}
      type=sha,prefix={{branch}}-
      type=raw,value=latest,enable={{is_default_branch}}

# Build and push Docker image
- uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: ${{ steps.meta.outputs.tags }}
    labels: ${{ steps.meta.outputs.labels }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
    platforms: linux/amd64,linux/arm64
    build-args: |
      NODE_VERSION=20
      BUILD_DATE=${{ github.event.head_commit.timestamp }}

# Setup QEMU for multi-arch builds
- uses: docker/setup-qemu-action@v3
```

---

### SECURITY SCANNING

```yaml
# Trivy — filesystem/container vulnerability scanner
- uses: aquasecurity/trivy-action@master
  with:
    scan-type: 'fs'
    scan-ref: '.'
    format: 'sarif'
    output: 'trivy-results.sarif'
    severity: 'CRITICAL,HIGH'
    exit-code: '1'

# Upload SARIF results to GitHub Security tab
- uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: trivy-results.sarif

# CodeQL — static analysis
- uses: github/codeql-action/init@v3
  with:
    languages: javascript-typescript
- uses: github/codeql-action/autobuild@v3
- uses: github/codeql-action/analyze@v3

# Gitleaks — secrets detection
- uses: gitleaks/gitleaks-action@v2
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    GITLEAKS_CONFIG: .gitleaks.toml

# OSSF Scorecard
- uses: ossf/scorecard-action@v2.4.0
  with:
    results_file: results.sarif
    results_format: sarif
    publish_results: true

# Dependabot — managed via .github/dependabot.yml (not a direct action)
# snyk security
- uses: snyk/actions/node@master
  env:
    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
  with:
    args: --severity-threshold=high
```

---

### DEPLOY — VERCEL

```yaml
- name: Install Vercel CLI
  run: npm install --global vercel@latest

- name: Pull Vercel Environment
  run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

- name: Build
  run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

- name: Deploy
  run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

### DEPLOY — SUPABASE

```yaml
- uses: supabase/setup-cli@v1
  with:
    version: latest

- name: Link project
  run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

- name: Push migrations
  run: supabase db push
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

- name: Generate types
  run: supabase gen types typescript --linked > types/supabase.ts
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

---

### DEPLOY — AWS

```yaml
# Configure AWS credentials
- uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: us-east-1

# Login to Amazon ECR
- uses: aws-actions/amazon-ecr-login@v2

# Deploy to ECS
- uses: aws-actions/amazon-ecs-deploy-task-definition@v1
  with:
    task-definition: task-definition.json
    service: my-service
    cluster: my-cluster
    wait-for-service-stability: true

# Lambda deploy
- run: |
    zip -r function.zip .
    aws lambda update-function-code \
      --function-name my-function \
      --zip-file fileb://function.zip
```

---

### DEPLOY — GOOGLE CLOUD

```yaml
- uses: google-github-actions/auth@v2
  with:
    credentials_json: ${{ secrets.GCP_CREDENTIALS }}

- uses: google-github-actions/deploy-cloudrun@v2
  with:
    service: my-service
    image: gcr.io/my-project/my-image:latest
    region: us-central1

- uses: google-github-actions/setup-gcloud@v2
```

---

### KUBERNETES

```yaml
- uses: azure/setup-kubectl@v3

- name: Configure kubeconfig
  run: |
    mkdir -p ~/.kube
    echo "${{ secrets.KUBE_CONFIG }}" | base64 -d > ~/.kube/config

- name: Apply manifests
  run: kubectl apply -f kubernetes/

- name: Wait for rollout
  run: kubectl rollout status deployment/dreamengin-app -n dreamengin

# Helm
- uses: azure/setup-helm@v3
  with:
    version: v3.12.0

- run: helm upgrade --install my-release ./chart --namespace production
```

---

### GIT — AUTO-COMMIT / PR CREATION

```yaml
# Auto-commit changed files back to the branch
- uses: stefanzweifel/git-auto-commit-action@v5
  with:
    commit_message: "chore: auto-update [skip ci]"
    branch: completedream
    file_pattern: 'docs/*.md'

# Create a pull request from current branch changes
- uses: peter-evans/create-pull-request@v6
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    commit-message: 'feat: automated improvement'
    branch: idari/auto-improve-${{ github.run_number }}
    base: completedream
    title: 'Idari: automated improvement cycle'
    body: |
      Automated changes from Idari daily improvement cycle.
      Architecture verification: passed.
    labels: idari, automated

# Manual git commit pattern (used in this repo)
- name: Commit and push
  run: |
    git config user.name  "github-actions[bot]"
    git config user.email "github-actions[bot]@users.noreply.github.com"
    git add .
    if git diff --cached --quiet; then
      echo "Nothing to commit."
      exit 0
    fi
    git commit -m "Idari daily improvement: $MESSAGE"
    git push origin completedream
```

---

### RELEASES

```yaml
# Create a GitHub Release
- uses: softprops/action-gh-release@v2
  with:
    tag_name: v${{ steps.version.outputs.version }}
    name: Release v${{ steps.version.outputs.version }}
    body_path: CHANGELOG.md
    files: |
      dist/*.zip
      dist/*.tar.gz
    draft: false
    prerelease: false
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

# Semantic release (automatic versioning)
- run: npx semantic-release
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

### NOTIFICATIONS

```yaml
# Slack notification
- uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "Deployment ${{ job.status }}: ${{ github.repository }}@${{ github.sha }}"
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

# Discord notification
- name: Discord notification
  run: |
    curl -H "Content-Type: application/json" \
      -d '{"content":"Deployment '${{ job.status }}': ${{ github.repository }}"}' \
      ${{ secrets.DISCORD_WEBHOOK_URL }}

# GitHub issue on failure
- uses: actions/github-script@v7
  if: failure()
  with:
    script: |
      github.rest.issues.create({
        owner: context.repo.owner,
        repo: context.repo.repo,
        title: `CI failure on ${context.ref}`,
        body: `Workflow: ${context.workflow}\nRun: ${context.runId}`,
        labels: ['bug', 'ci']
      })
```

---

### ENVIRONMENT / SECRETS MANAGEMENT

```yaml
# Set environment variables from secrets
env:
  NODE_ENV: production
  AI_API_KEY: ${{ secrets.AI_API_KEY }}         # server-side only
  AI_PROVIDER: ${{ secrets.AI_PROVIDER }}
  OWNER_EMAIL: ${{ secrets.OWNER_EMAIL }}
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
  VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}

# Mask a value so it never appears in logs
- run: echo "::add-mask::${{ secrets.SENSITIVE_VALUE }}"
```

---

### MATRIX BUILDS / REUSABLE WORKFLOWS

```yaml
# Matrix build — test across multiple Node versions
strategy:
  matrix:
    node: [18, 20, 22]
    os: [ubuntu-latest, windows-latest, macos-latest]
  fail-fast: false

# Call a reusable workflow
- uses: ./.github/workflows/preflight.yml
  with:
    environment: production
  secrets: inherit

# Concurrency — cancel in-progress runs on the same branch
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

---

### GITHUB PAGES

```yaml
- uses: actions/configure-pages@v4
- uses: actions/upload-pages-artifact@v3
  with:
    path: out/
- uses: actions/deploy-pages@v4

# Permissions needed
permissions:
  pages: write
  id-token: write
```

---

### COMMON WORKFLOW TRIGGERS

```yaml
on:
  push:
    branches: [main, completedream, develop]
    paths-ignore: ['docs/**', '*.md']

  pull_request:
    branches: [main, completedream]
    types: [opened, synchronize, reopened]

  schedule:
    - cron: '0 0 * * *'   # midnight UTC daily (Idari cycle)
    - cron: '0 6 * * 1'   # 06:00 UTC every Monday

  workflow_dispatch:        # manual trigger from GitHub UI
    inputs:
      reason:
        description: 'Reason for manual run'
        required: false
        default: 'manual'
      dry_run:
        description: 'Dry run (no commit)'
        type: boolean
        default: false

  workflow_run:             # trigger after another workflow completes
    workflows: ['Preflight (staging)']
    types: [completed]

  release:
    types: [published]

  issue_comment:
    types: [created]
```

---

### PERMISSIONS REFERENCE

```yaml
permissions:
  contents: write       # push commits, create releases
  pull-requests: write  # create/update PRs
  issues: write         # create/close issues
  packages: write       # push to GHCR
  id-token: write       # OIDC (cloud deploys)
  pages: write          # GitHub Pages
  security-events: write # upload SARIF
  actions: read         # read workflow runs
  checks: write         # create check runs
  statuses: write       # commit status
```

---

### WORKFLOW BEST PRACTICES (for me)

1. **Pin action versions** — use `@v4` not `@master` (security).
2. **Use `[skip ci]`** in bot commit messages to avoid recursive triggers.
3. **`if: failure()`** — always add notification steps on failure.
4. **`continue-on-error: true`** — use for non-blocking checks (like placeholder scans).
5. **Secrets never in logs** — use `::add-mask::` or env vars.
6. **`concurrency`** — add to every workflow to prevent duplicate runs.
7. **`permissions`** — always declare minimal needed permissions.
8. **`fetch-depth: 0`** — needed for changelog scripts (`update-handoff.mjs`, `update-bugs.mjs`).
9. **`cache:`** — always cache package manager deps to save minutes.
10. **Idari commits go to `completedream`** — never to `main` directly.

---

## KEY ENVIRONMENT VARIABLES FOR THIS REPO

| Variable                        | Where used              | Side     |
|---------------------------------|-------------------------|----------|
| `AI_API_KEY`                    | All AI endpoints        | Server   |
| `AI_PROVIDER`                   | `lib/ai/groq.ts`        | Server   |
| `AI_MODEL_EAMS`                 | Dr. Eams model override | Server   |
| `AI_MODEL_IDARI`                | Idari model override    | Server   |
| `AI_MODEL_BOOGIEMAN`            | BoogieMan model override| Server   |
| `OWNER_EMAIL`                   | `lib/ai/triad.ts`       | Server   |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase client         | Public   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client         | Public   |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server-side Supabase    | Server   |
| `VERCEL_TOKEN`                  | Vercel deploys          | CI only  |
| `NEXT_PUBLIC_DEV_BYPASS_AUTH`   | Dev auth bypass         | Dev only |
| `DEV_ADMIN`                     | Dev admin bypass        | Dev only |
| `BOOGIE_SIMULATION_MODE`        | BoogieMan sim mode      | Dev only |

---

## END OF COPILOT TOOLKIT
