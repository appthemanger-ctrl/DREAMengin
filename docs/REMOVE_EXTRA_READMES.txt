Remove extra READMEs (keep ONLY the root README.md):

Option A (manual):
- Delete any README*.md under subfolders (e.g., components/, app/, docs/, etc.).
- Commit the deletions.

Option B (shell, macOS/Linux):
```bash
find . -type f -iname "readme*.md" ! -path "./README.md" -print -delete
git add -A && git commit -m "docs: slim to single README"
```

Option C (Working Copy on iOS):
- Search for "README" → select unwanted files → Delete → Commit.
