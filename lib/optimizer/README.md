# DREAMengin Optimization Framework

A constraint-based optimization system for DREAMengin that maximizes usefulness while minimizing cost, subject to constraints.

## Overview

The DREAMengin Optimization Framework provides a general-purpose constraint solver for all optimization needs across the platform. It follows the core pattern:

```
maximize usefulness
minimize cost
subject to constraints
```

## Architecture

### Core Components

- **ConstraintSolver** (`lib/optimizer/constraint-solver.ts`): Core optimization engine that solves multi-objective problems with weighted constraints
- **DreamOptimizer** (`lib/optimizer/index.ts`): High-level API for specific optimization use cases
- **Types** (`lib/optimizer/types.ts`): TypeScript type definitions for the optimization framework
- **Configuration** (`config/optimizer.yaml`): YAML configuration file defining constraints and weights for all optimization targets

### Command-Line Tool

- **optimize-dreamengin.mjs** (`scripts/optimize-dreamengin.mjs`): CLI tool for running optimizations

### CI/CD Integration

- **GitHub Actions Workflow** (`.github/workflows/optimize-dreamengin.yml`): Automated optimization runs on schedule or manual trigger

## Optimization Targets

The framework currently supports optimization for:

### 1. **Feed Selection**
Choose which posts appear first on HomeDream based on:
- Favorites (25% weight, high priority)
- Source preference (20% weight, high priority)
- Recency (20% weight, medium priority)
- Privacy (15% weight, **critical** priority)
- Engagement (15% weight, medium priority)
- User-selected sources (5% weight, high priority)

**Output**: `ranked_feed_items`

### 2. **Search Ranking**
When Dr. Eams searches the system:
- Relevance (40% weight, **critical** priority)
- User permissions (25% weight, **critical** priority)
- System location (15% weight, medium priority)
- Recency (10% weight, low priority)
- Content type (10% weight, low priority)

**Output**: `ranked_surfaces`

### 3. **Widget Priority**
Choose which Dreams appear most prominently:
- Interaction frequency (35% weight, high priority)
- Screen size (25% weight, medium priority)
- Device type (20% weight, medium priority)
- Layout density (20% weight, low priority)

**Output**: `widget_focus_ranks`

### 4. **Layout Balancing**
Decide best widget distribution on HomeDream:
- Screen space (30% weight, **critical** priority)
- Widget type (25% weight, high priority)
- Interaction cost (25% weight, medium priority)
- Visibility priority (20% weight, high priority)

**Output**: `layout_grid`

### 5. **Asset Loading Priority**
Decide which assets load first (images, models, audio, UI elements, widget data):
- Bandwidth (30% weight, **critical** priority)
- Memory (25% weight, **critical** priority)
- Scene importance (25% weight, high priority)
- User viewport (20% weight, high priority)

**Output**: `asset_load_queue`

### 6. **Render Budget Control**
Choose visual fidelity level dynamically:
- Device performance (30% weight, **critical** priority)
- Battery level (25% weight, high priority)
- Frame rate (25% weight, high priority)
- Thermal limits (20% weight, medium priority)

**Output**: `render_quality_level`

### 7. **Cache Decisions**
Decide what to keep cached:
- Storage space (30% weight, **critical** priority)
- Usage frequency (30% weight, high priority)
- Reload cost (25% weight, high priority)
- Expiration time (15% weight, medium priority)

**Output**: `cache_retention_policy`

### 8. **Notification Priority**
Order notifications in DreamDM Bar:
- Urgency (35% weight, high priority)
- Interaction history (25% weight, medium priority)
- Sender priority (25% weight, medium priority)
- Recency (15% weight, low priority)

**Output**: `notification_order`

### 9. **Offline Queue Order**
When connection returns, choose sync order:
- Action priority (35% weight, high priority)
- Timestamp (25% weight, medium priority)
- Data size (20% weight, medium priority)
- Failure count (20% weight, medium priority)

**Output**: `sync_queue_order`

### 10. **AI Suggestion Selection**
Dr. Eams deciding what to suggest:
- User intent (40% weight, **critical** priority)
- System context (25% weight, high priority)
- Available actions (20% weight, high priority)
- Permissions (15% weight, **critical** priority)

**Output**: `ranked_suggestions`

### 11. **System Routing**
Choose best surface to send user to:
- User intent (40% weight, **critical** priority)
- Surface availability (25% weight, high priority)
- Navigation cost (20% weight, medium priority)
- Context preservation (15% weight, medium priority)

**Output**: `target_surface`

### 12. **Creative Options (CREATIVE OPTIMIZERO Algorithm)**
Generate interesting options first, then keep only the ones that do not break the system:
- Novelty (30% weight, high priority)
- Usefulness (25% weight, high priority)
- Delight (20% weight, medium priority)
- Fit (15% weight, high priority)
- Cost (5% weight, medium priority)
- Risk (5% weight, medium priority)

**Algorithm**: Explore wildly, reject breakage, rank by interestingness + usefulness

**Hard Failure Rules** (automatic rejection):
- Breaks build
- Breaks Vercel
- Breaks privacy
- Breaks navigation continuity
- Fake action
- Invalid TypeScript
- Invalid imports
- Infinite loops
- Severe performance regression

**Soft Scores** (weighted ranking):
- **Novelty**: How unique and interesting is this option?
- **Usefulness**: How practical and valuable is this option?
- **Delight**: How visually appealing and emotionally engaging is this option?
- **Fit**: How well does this option fit the context?
- **Cost**: What is the implementation/maintenance cost? (minimized)
- **Risk**: What are the potential downsides? (minimized)

**Formula**:
```
final_score =
  (w_novelty × novelty) +
  (w_usefulness × usefulness) +
  (w_delight × delight) +
  (w_fit × fit) -
  (w_cost × cost) -
  (w_risk × risk)
```

**Selection Rule**:
1. Discard hard fails
2. Sort by final_score descending
3. Choose top item as best_candidate
4. Return all ranked options for review

**Tuning for Chaos vs Stability**:
- **More chaos**: Increase w_novelty and w_delight
- **More stability**: Increase w_fit and w_risk

**Output**: `ranked_creative_options` (best_candidate + alternatives + rejected_candidates)

## Usage

### CLI Tool

```bash
# Optimize a specific target
node scripts/optimize-dreamengin.mjs --target=feed --config=config/optimizer.yaml --output=results.json

# Optimize all targets
node scripts/optimize-dreamengin.mjs --target=all --config=config/optimizer.yaml --output=results.json
```

### Programmatic Usage

```typescript
import { DreamOptimizer } from '@/lib/optimizer';
import type { FeedItem, OptimizerConfig } from '@/lib/optimizer/types';

// Load configuration
const config: OptimizerConfig = loadConfig();

// Create optimizer
const optimizer = new DreamOptimizer(config);

// Optimize feed
const feedItems: FeedItem[] = [...];
const rankedFeed = optimizer.optimizeFeed(feedItems);

// Results are ranked by optimization score
rankedFeed.forEach(result => {
  console.log(`Rank ${result.rank}: ${result.item.id} (score: ${result.score})`);
});
```

### Creative Options Optimization

```typescript
import { DreamOptimizer } from '@/lib/optimizer';
import type { CreativeOption, CreativeContext, OptimizerConfig } from '@/lib/optimizer/types';

// Load configuration
const config: OptimizerConfig = loadConfig();

// Create optimizer
const optimizer = new DreamOptimizer(config);

// Define candidate options
const candidates: CreativeOption[] = [
  {
    id: 'opt1',
    content: 'A standard, safe approach that helps users accomplish tasks',
    variant_type: 'standard',
    tone: 'professional',
    style: 'clean',
    metadata: {
      practicalityScore: 0.8,
      visualImpact: 0.5,
    },
  },
  {
    id: 'opt2',
    content: 'An innovative and delightful approach that enables creativity',
    variant_type: 'innovative',
    tone: 'enthusiastic',
    style: 'vibrant',
    metadata: {
      isUnique: true,
      practicalityScore: 0.7,
      visualImpact: 0.9,
      implementationCost: 0.3,
      riskLevel: 0.2,
    },
  },
];

// Optional context for better fit scoring
const context: CreativeContext = {
  topic: 'user interface',
  style_guide: 'vibrant',
  user_preferences: {
    colorScheme: 'colorful',
  },
  constraints: ['avoid complexity', 'maintain simplicity'],
};

// Optimize
const result = optimizer.optimizeCreativeOptions(candidates, context);

// Access results
console.log('Best Option:', result.best_candidate);
console.log('All Ranked Options:', result.ranked_candidates);
console.log('Rejected Options:', result.rejected_candidates);

// Each ranked option includes:
// - All original option fields (id, content, variant_type, etc.)
// - scores: { novelty, usefulness, delight, fit, cost, risk }
// - final_score: weighted combined score
// - rank: 1, 2, 3, etc.
// - validation: { valid: true }
```

### Low-Level Constraint Solver

```typescript
import { ConstraintSolver } from '@/lib/optimizer/constraint-solver';
import type { OptimizationItem, Constraint } from '@/lib/optimizer/types';

const solver = new ConstraintSolver({
  maxIterations: 1000,
  convergenceThreshold: 0.001,
  timeoutMs: 100,
});

const items: OptimizationItem[] = [
  { id: '1', score: 0, metadata: { quality: 0.9, cost: 0.1 } },
  { id: '2', score: 0, metadata: { quality: 0.7, cost: 0.3 } },
];

const constraints: Constraint[] = [
  { name: 'quality', weight: 0.7, priority: 'high' },
  { name: 'cost', weight: 0.3, priority: 'medium' },
];

const ranked = solver.solve(items, constraints);
```

## Configuration

Edit `config/optimizer.yaml` to customize:
- Constraint weights
- Priority levels (critical, high, medium, low)
- Performance thresholds
- Logging options

## GitHub Actions

The optimizer runs automatically:
- Daily at 3 AM UTC (scheduled)
- On-demand via workflow dispatch
- Configurable target selection

To trigger manually:
1. Go to Actions → DREAMengin Optimization
2. Click "Run workflow"
3. Select target (all, feed, search, widgets, etc.)
4. View results in workflow summary and artifacts

## Testing

```bash
# Run optimizer tests
pnpm exec vitest run tests/optimizer.test.ts

# Run all tests
pnpm test
```

## Priority Levels

- **Critical**: 2.0x weight multiplier - Must be satisfied (e.g., privacy, security)
- **High**: 1.5x weight multiplier - Should be optimized (e.g., relevance, user preferences)
- **Medium**: 1.0x weight multiplier - Normal optimization target
- **Low**: 0.5x weight multiplier - Nice to have

## Performance

- Target optimization time: < 100ms per optimization
- Constraint evaluation: O(n × m) where n = items, m = constraints
- Sorting: O(n log n)
- Memory: O(n) where n = number of items

## Extending the Framework

To add a new optimization target:

1. Add configuration to `config/optimizer.yaml`
2. Define types in `lib/optimizer/types.ts`
3. Implement optimizer method in `lib/optimizer/index.ts`
4. Add tests in `tests/optimizer.test.ts`
5. Update this README

## Related Documentation

- [AGENT_PLAYBOOK.md](../docs/AGENT_PLAYBOOK.md) - Main development guide
- [ARCHITECTURE.md](../docs/ARCHITECTURE.md) - System architecture
- [FEATURE_STATUS.md](../docs/FEATURE_STATUS.md) - Feature completion status
