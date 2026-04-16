#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

# Allowed root entries (exact names)
ALLOWED_ROOT=(
    ".github"
    ".git"
    ".gitignore"
    ".npmrc"
    ".nvmrc"
    ".prettierrc"
    ".env.local"
    ".env.example"
    "app"
    "components"
    "lib"
    "engins"
    "games"
    "core"
    "system"
    "agents"
    "docs"
    "assets"
    "public"
    "styles"
    "tests"
    "scripts"
    "package.json"
    "pnpm-lock.yaml"
    "pnpm-workspace.yaml"
    "next.config.mjs"
    "tsconfig.json"
    "eslint.config.mjs"
    "postcss.config.js"
    "tailwind.config.ts"
    "README.md"
    "LICENSE"
    "vercel.json"
    "instrumentation.ts"
    "middleware.ts"
)

# Forbidden patterns
FORBIDDEN_PATTERNS=(
    "*.log"
    "*.tmp"
    "*.swp"
    "*.bak"
    "*.old"
    "*.draft"
    "*.txt"
    "*.md"
    "*.json"
    "*.yaml"
    "*.yml"
    "*.sh"
    "*.py"
    "*.rb"
    "*.ps1"
    "test-*"
    "temp-*"
    "backup-*"
    "*.xlsx"
    "*.csv"
    "*.PNG"
    "*.png"
    "*.jpg"
    "*.jpeg"
)

is_allowed() {
    local item="$1"
    for allowed in "${ALLOWED_ROOT[@]}"; do
        [[ "$item" == "$allowed" ]] && return 0
    done
    return 1
}

is_forbidden() {
    local file="$1"
    for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
        [[ "$file" == $pattern ]] && return 0
    done
    return 1
}

echo -e "${YELLOW}Checking root directory hygiene (canonical structure)...${NC}"

for item in *; do
    if [[ "$item" == .* ]] && ! is_allowed "$item"; then
        echo -e "${RED}ERROR: Disallowed dotfile/directory: $item${NC}"
        ERRORS=$((ERRORS + 1))
        continue
    fi
    if is_allowed "$item"; then
        continue
    fi
    if [[ -f "$item" ]]; then
        if is_forbidden "$item"; then
            echo -e "${RED}ERROR: Forbidden file type: $item${NC}"
            ERRORS=$((ERRORS + 1))
        else
            echo -e "${RED}ERROR: Unknown file (not in allowed list): $item${NC}"
            ERRORS=$((ERRORS + 1))
        fi
    elif [[ -d "$item" ]]; then
        echo -e "${RED}ERROR: Unknown directory: $item/${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

shopt -s dotglob nullglob
for hidden in .*; do
    [[ "$hidden" == "." || "$hidden" == ".." ]] && continue
    if ! is_allowed "$hidden"; then
        echo -e "${RED}ERROR: Disallowed hidden file/directory: $hidden${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done
shopt -u dotglob nullglob

if [[ $ERRORS -eq 0 ]]; then
    echo -e "${GREEN}✅ Root hygiene check passed.${NC}"
    exit 0
else
    echo -e "${RED}❌ Root hygiene check failed with $ERRORS error(s).${NC}"
    exit 1
fi
