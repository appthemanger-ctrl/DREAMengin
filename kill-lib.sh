#!/usr/bin/env bash
set -euo pipefail

echo "💀 KILLING /lib – MOVING TO REAL DIRECTORIES"

if [[ ! -d "lib" ]]; then
  echo "No /lib directory found."
  exit 0
fi

# Ensure destination directories exist first
mkdir -p \
  engins \
  system/runtime \
  system/os \
  app/api/supabase \
  app/api/ai/agents \
  app/api/activity \
  app/api/admin \
  components/hooks \
  components/widgets \
  components/utils \
  lib_archive

# Backup
BACKUP="lib.backup.$(date +%Y%m%d_%H%M%S)"
cp -r lib "$BACKUP"

move_dir_contents() {
  local src="$1"
  local dst="$2"
  if [[ -d "$src" ]]; then
    mkdir -p "$dst"
    shopt -s dotglob nullglob
    for entry in "$src"/*; do
      mv "$entry" "$dst"/
    done
    shopt -u dotglob nullglob
    rmdir "$src" 2>/dev/null || true
  fi
}

# Move known categories
move_dir_contents "lib/gameengin" "engins/gameengin"
move_dir_contents "lib/runtime" "system/runtime"
move_dir_contents "lib/dreamenginOS" "system/os"
move_dir_contents "lib/supabase" "app/api/supabase"
move_dir_contents "lib/agents" "app/api/ai/agents"
move_dir_contents "lib/ai" "app/api/ai"
move_dir_contents "lib/hooks" "components/hooks"
move_dir_contents "lib/widgets" "components/widgets"
move_dir_contents "lib/activity" "app/api/activity"
move_dir_contents "lib/admin" "app/api/admin"

# Move loose .ts files from lib root
shopt -s nullglob
for f in lib/*.ts; do
  mv "$f" components/utils/
done
shopt -u nullglob

# Anything left in lib -> archive (preserve relative layout)
if [[ -d "lib" ]]; then
  find lib -type f | while read -r file; do
    rel="${file#lib/}"
    dest="lib_archive/$rel"
    mkdir -p "$(dirname "$dest")"
    mv "$file" "$dest"
  done
fi

# Delete empty lib if possible
rmdir lib 2>/dev/null || echo "lib not empty – review leftovers manually"

# Rewrite imports
find app components engins games hooks dreamdmbar tests -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec sed -i.bak \
  -e "s|@/lib/gameengin|@/engins/gameengin|g" \
  -e "s|@/lib/runtime|@/system/runtime|g" \
  -e "s|@/lib/dreamenginOS|@/system/os|g" \
  -e "s|@/lib/supabase|@/app/api/supabase|g" \
  -e "s|@/lib/agents|@/app/api/ai/agents|g" \
  -e "s|@/lib/ai|@/app/api/ai|g" \
  -e "s|@/lib/hooks|@/components/hooks|g" \
  -e "s|@/lib/widgets|@/components/widgets|g" \
  -e "s|@/lib/activity|@/app/api/activity|g" \
  -e "s|@/lib/admin|@/app/api/admin|g" \
  {} \;

find app components engins games hooks dreamdmbar tests -type f -name "*.bak" -delete

echo "✅ /lib migration script completed. Backup: $BACKUP | Archive: lib_archive"
