# Repository State Analyzer Documentation

## Overview

The **Repository State Analyzer** is a comprehensive system that automatically analyzes every aspect of the DREAMengin codebase and generates a detailed markdown report (`REPO_STATE.md`). This system helps developers and AI agents understand the complete state of the repository, identify issues, and track compliance with 2026 standards.

## What It Analyzes

The analyzer examines **everything** in the repository:

### 1. Tech Stack & Dependencies
- All production and dev dependencies
- Package versions and compatibility
- Dependency health checks
- Outdated packages needing updates

### 2. Code Metrics
- Total lines of code
- File counts by type (TSX, TS, tests, etc.)
- Code size and distribution
- Component organization

### 3. API Routes
- All API endpoints in `/app/api`
- HTTP methods supported (GET, POST, PUT, DELETE, PATCH)
- Route files and their locations

### 4. Pages & Routes
- All Next.js App Router pages
- Route structure and organization
- Page file locations

### 5. Components
- Component categories and organization
- File counts per category
- Component distribution

### 6. Database Schema
- All Supabase migrations
- Migration history
- Schema file status

### 7. Tests
- Test file count
- Tests passing/failing
- Test coverage areas

### 8. Documentation
- All documentation files
- README, CHANGELOG, and other docs
- Documentation organization

### 9. CI/CD Workflows
- All GitHub Actions workflows
- Workflow purposes and triggers

### 10. Configuration Files
- Build configs (Next.js, TypeScript, Tailwind, etc.)
- Testing configs (Vitest, Playwright)
- Deployment configs (Vercel, Docker)

### 11. Architecture Patterns
- Server vs Client Components
- State management approach
- Backend services (Supabase)

### 12. Code Quality
- TypeScript strict mode status
- ESLint configuration
- Testing framework setup

### 13. Dependency Health
- Outdated packages
- Deprecated dependencies
- 2026 standards compliance

### 14. Redundancies & Technical Debt
- Duplicate component names
- Unused dependencies
- Code redundancies

### 15. 2026 Standards Compliance
- React 19 status
- Next.js 16+ status
- TypeScript 5.5+ status
- Modern testing frameworks

### 16. Action Items
- High-priority issues
- Medium-priority improvements
- Low-priority maintenance

## How to Use

### Manual Execution

Run the analyzer manually at any time:

```bash
# Using pnpm script
pnpm run repo-state

# Or directly
node scripts/analyze-repo-state.mjs
```

The script will:
1. Analyze the entire repository
2. Generate or update `REPO_STATE.md`
3. Display a summary in the console

### Automatic Updates

The repository state is automatically updated via GitHub Actions:

**Triggers:**
- ✅ On push to `main` branch (after PR merge)
- ✅ Daily at 2 AM UTC
- ✅ Manual workflow dispatch
- ✅ After PR merge

**What It Does:**
1. Runs the analyzer script
2. Checks if `REPO_STATE.md` changed
3. Commits and pushes changes if needed
4. Skips if no changes detected

**Workflow Location:** `.github/workflows/update-repo-state.yml`

### For AI Agents

When working on this repository, AI agents should:

1. **Read `REPO_STATE.md` first** - Get complete context about the codebase
2. **Check action items** - See what needs fixing or updating
3. **Verify connections** - Understand how components/APIs/pages relate
4. **Check standards compliance** - Ensure changes align with 2026 standards
5. **Update after changes** - Run `pnpm run repo-state` after significant changes

### For Developers

Use this system to:

1. **Onboard quickly** - Understand the entire codebase structure
2. **Track technical debt** - See redundancies and issues
3. **Monitor health** - Check dependency status and test results
4. **Plan refactoring** - Identify areas needing improvement
5. **Document state** - Keep stakeholders informed

## Output Format

The generated `REPO_STATE.md` includes:

- **Table of Contents** - Easy navigation
- **Overview** - Quick stats and summary
- **Detailed Sections** - Complete breakdown of each area
- **Action Items** - Prioritized tasks (High/Medium/Low)
- **Timestamps** - When the analysis was run
- **Git Info** - Branch, commit, total commits

## Customization

### Adding New Analyses

To add new analysis functions:

1. Open `scripts/analyze-repo-state.mjs`
2. Add a new `analyze*` function
3. Call it in the main `analyzeRepository()` function
4. Add the data to the markdown generator
5. Update the Table of Contents

Example:

```javascript
async function analyzeMyNewThing() {
  // Your analysis logic here
  return {
    // Your data structure
  };
}

// In analyzeRepository():
analysis.myNewThing = await analyzeMyNewThing();

// In generateMarkdown():
lines.push('## My New Thing');
lines.push('');
// Generate markdown from analysis.myNewThing
```

### Modifying the Report Format

The `generateMarkdown()` function controls output:

- Add/remove sections
- Change table formats
- Adjust styling
- Modify action item prioritization

### Adjusting Workflow Triggers

Edit `.github/workflows/update-repo-state.yml`:

```yaml
on:
  push:
    branches:
      - main
  schedule:
    - cron: '0 2 * * *'  # Change schedule here
  workflow_dispatch:  # Keep for manual runs
```

## Performance

The analyzer is optimized for speed:

- **Typical run time:** 5-15 seconds
- **Scans:** 478+ code files
- **Analyzes:** 104K+ lines of code
- **Memory usage:** ~100MB

For large repositories, the script uses:
- Efficient file walking (excludes `node_modules`, `.git`)
- Parallel analysis where possible
- Streaming for large files

## Troubleshooting

### Script Fails to Run

```bash
# Check Node.js version (needs 18+)
node --version

# Ensure dependencies are installed
pnpm install

# Check script permissions
chmod +x scripts/analyze-repo-state.mjs
```

### GitHub Action Not Triggering

- Check workflow file syntax
- Ensure branch protection rules allow bot commits
- Verify `[skip ci]` isn't in commit message
- Check GitHub Actions are enabled for repo

### Inaccurate Test Counts

The script runs `pnpm run test` to get test results. If tests fail to run:

- Ensure test suite is working locally
- Check test configuration
- Review test command in `package.json`

### Large Output File

If `REPO_STATE.md` becomes too large:

- Reduce number of items shown in tables (adjust `.slice()` limits)
- Move detailed lists to separate files
- Summarize instead of listing everything

## Integration with Other Tools

### With IDARi (Admin AI)

IDARi can use `REPO_STATE.md` to:
- Identify optimization opportunities
- Track system health
- Plan maintenance tasks
- Generate reports

### With Dr. Eams (User AI)

Dr. Eams can reference state data to:
- Answer questions about codebase
- Suggest features based on current state
- Explain architecture to users

### With TheBoogieMan.Ai (Policy Enforcement)

TheBoogieMan can verify:
- Security compliance
- Privacy standards
- Policy adherence

## Best Practices

### When to Run Manually

Run `pnpm run repo-state` after:

- ✅ Major refactoring
- ✅ Dependency updates
- ✅ Structural changes
- ✅ Before important demos/releases
- ✅ When debugging build issues

### When to Check the Report

Review `REPO_STATE.md`:

- 📖 Before starting new features
- 📖 During code reviews
- 📖 When onboarding new developers
- 📖 During sprint planning
- 📖 For technical debt assessments

### Maintaining Accuracy

To keep the analyzer accurate:

1. **Update analysis logic** when adding new patterns
2. **Add new sections** for new architectural areas
3. **Adjust thresholds** for warnings/recommendations
4. **Keep dependencies updated** so analyzer can run

## Security Considerations

The analyzer:

- ✅ Runs in a safe read-only mode
- ✅ Doesn't execute untrusted code
- ✅ Doesn't expose secrets (uses `.env.example`)
- ✅ Doesn't modify source files (only generates report)
- ✅ Can be safely run in CI/CD

## Future Enhancements

Planned improvements:

- 🔮 Dependency vulnerability scanning
- 🔮 Performance metrics tracking
- 🔮 Bundle size analysis
- 🔮 API endpoint documentation generation
- 🔮 Visual dependency graphs
- 🔮 Trend tracking over time
- 🔮 Integration with Lighthouse CI
- 🔮 Automatic PR comments with state changes

## Support

For issues or questions:

1. Check this documentation
2. Review `scripts/analyze-repo-state.mjs` comments
3. Check GitHub Actions logs
4. Open an issue in the repository

## License

This analyzer is part of the DREAMengin project and follows the same license.

---

**Last Updated:** 2026-03-29
**Maintainer:** DREAMengin Development Team
**Version:** 1.0.0
