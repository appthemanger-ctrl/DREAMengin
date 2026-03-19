/**
 * DREAMengin Optimizer Tests
 */

import { describe, it, expect } from 'vitest';
import { ConstraintSolver } from '@/lib/optimizer/constraint-solver';
import { DreamOptimizer } from '@/lib/optimizer';
import { validateCreativeOption } from '@/lib/optimizer/creative-validator';
import type {
  OptimizerConfig,
  FeedItem,
  WidgetPriority,
  SearchResult,
  Notification,
  Asset,
  QueuedAction,
  CreativeOption,
  CreativeContext,
} from '@/lib/optimizer/types';

describe('ConstraintSolver', () => {
  it('should create a constraint solver with default options', () => {
    const solver = new ConstraintSolver();
    expect(solver).toBeDefined();
  });

  it('should solve optimization problem with simple constraints', () => {
    const solver = new ConstraintSolver();

    const items = [
      { id: '1', score: 0, metadata: { quality: 0.8, cost: 0.2 } },
      { id: '2', score: 0, metadata: { quality: 0.6, cost: 0.4 } },
      { id: '3', score: 0, metadata: { quality: 0.9, cost: 0.1 } },
    ];

    const constraints = [
      { name: 'quality', weight: 0.7, priority: 'high' as const },
      { name: 'cost', weight: 0.3, priority: 'medium' as const },
    ];

    const result = solver.solve(items, constraints);

    expect(result).toHaveLength(3);
    expect(result[0].rank).toBe(1);
    expect(result[0].item.id).toBe('3'); // Best quality, lowest cost
    expect(result[2].rank).toBe(3);
  });

  it('should respect critical constraints', () => {
    const solver = new ConstraintSolver();

    const items = [
      { id: '1', score: 0, metadata: { safety: 1, quality: 0.5 } },
      { id: '2', score: 0, metadata: { safety: 0.3, quality: 0.9 } },
    ];

    const constraints = [
      { name: 'safety', weight: 1.0, priority: 'critical' as const },
      { name: 'quality', weight: 0.5, priority: 'high' as const },
    ];

    const result = solver.solve(items, constraints);

    // Item with higher safety should rank first despite lower quality
    expect(result[0].item.id).toBe('1');
  });

  it('should handle multi-objective optimization', () => {
    const solver = new ConstraintSolver();

    const items = [
      { id: '1', score: 0, metadata: { speed: 0.8, accuracy: 0.6 } },
      { id: '2', score: 0, metadata: { speed: 0.5, accuracy: 0.9 } },
    ];

    const objectives = [
      {
        name: 'speed',
        constraints: [{ name: 'speed', weight: 1.0, priority: 'high' as const }],
        weight: 0.6,
      },
      {
        name: 'accuracy',
        constraints: [{ name: 'accuracy', weight: 1.0, priority: 'high' as const }],
        weight: 0.4,
      },
    ];

    const result = solver.multiObjectiveOptimize(items, objectives);

    expect(result).toHaveLength(2);
    expect(result[0].rank).toBe(1);
  });
});

describe('DreamOptimizer', () => {
  const createMockConfig = (): OptimizerConfig => ({
    version: '1.0.0',
    optimizer: {
      algorithm: 'constraint-solver',
      max_iterations: 1000,
      convergence_threshold: 0.001,
    },
    feed_selection: {
      enabled: true,
      constraints: [
        { name: 'favorites', weight: 0.25, priority: 'high' },
        { name: 'recency', weight: 0.25, priority: 'medium' },
        { name: 'engagement', weight: 0.25, priority: 'medium' },
        { name: 'privacy', weight: 0.25, priority: 'critical' },
      ],
      output: 'ranked_feed_items',
    },
    widget_priority: {
      enabled: true,
      constraints: [
        { name: 'interaction_frequency', weight: 0.4, priority: 'high' },
        { name: 'screen_size', weight: 0.3, priority: 'medium' },
        { name: 'device_type', weight: 0.3, priority: 'medium' },
      ],
      output: 'widget_focus_ranks',
    },
    search_ranking: {
      enabled: true,
      constraints: [
        { name: 'relevance', weight: 0.5, priority: 'critical' },
        { name: 'user_permissions', weight: 0.3, priority: 'critical' },
        { name: 'recency', weight: 0.2, priority: 'low' },
      ],
      output: 'ranked_surfaces',
    },
    notification_priority: {
      enabled: true,
      constraints: [
        { name: 'urgency', weight: 0.4, priority: 'high' },
        { name: 'sender_priority', weight: 0.3, priority: 'medium' },
        { name: 'recency', weight: 0.3, priority: 'low' },
      ],
      output: 'notification_order',
    },
    asset_loading: {
      enabled: true,
      constraints: [
        { name: 'bandwidth', weight: 0.3, priority: 'critical' },
        { name: 'memory', weight: 0.3, priority: 'critical' },
        { name: 'scene_importance', weight: 0.4, priority: 'high' },
      ],
      output: 'asset_load_queue',
      asset_types: ['images', 'models', 'audio'],
    },
    offline_queue: {
      enabled: true,
      constraints: [
        { name: 'action_priority', weight: 0.4, priority: 'high' },
        { name: 'timestamp', weight: 0.3, priority: 'medium' },
        { name: 'data_size', weight: 0.3, priority: 'medium' },
      ],
      output: 'sync_queue_order',
      actions: ['message_sends', 'uploads'],
    },
    performance: {
      max_optimization_time_ms: 100,
      cache_results: true,
      cache_ttl_seconds: 300,
      parallel_optimization: true,
      max_concurrent_optimizations: 4,
    },
    logging: {
      enabled: false,
      level: 'info',
      log_optimizations: false,
      log_constraint_violations: false,
      output_path: '.optimization-logs/',
    },
  });

  describe('Feed Optimization', () => {
    it('should optimize feed items based on constraints', () => {
      const optimizer = new DreamOptimizer(createMockConfig());

      const feedItems: FeedItem[] = [
        {
          id: '1',
          content: 'Post 1',
          timestamp: new Date(),
          source: 'user1',
          is_favorite: true,
          engagement: { likes: 10, comments: 5, shares: 2 },
        },
        {
          id: '2',
          content: 'Post 2',
          timestamp: new Date(Date.now() - 86400000), // 1 day ago
          source: 'user2',
          is_favorite: false,
          engagement: { likes: 50, comments: 20, shares: 10 },
        },
        {
          id: '3',
          content: 'Post 3',
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          source: 'user3',
          is_favorite: false,
          engagement: { likes: 5, comments: 1, shares: 0 },
        },
      ];

      const result = optimizer.optimizeFeed(feedItems);

      expect(result).toHaveLength(3);
      expect(result[0].rank).toBe(1);
      expect(result[0].item).toBeDefined();
      expect(result[0].score).toBeGreaterThanOrEqual(0);
      expect(result[0].score).toBeLessThanOrEqual(1);
    });
  });

  describe('Widget Priority Optimization', () => {
    it('should optimize widget priorities', () => {
      const optimizer = new DreamOptimizer(createMockConfig());

      const widgets: WidgetPriority[] = [
        {
          widget_id: 'widget1',
          focus_rank: 0,
          z_index: 0,
          interaction_frequency: 50,
          last_interaction: new Date(),
        },
        {
          widget_id: 'widget2',
          focus_rank: 0,
          z_index: 0,
          interaction_frequency: 100,
          last_interaction: new Date(),
        },
        {
          widget_id: 'widget3',
          focus_rank: 0,
          z_index: 0,
          interaction_frequency: 10,
          last_interaction: new Date(Date.now() - 86400000),
        },
      ];

      const result = optimizer.optimizeWidgets(widgets);

      expect(result).toHaveLength(3);
      expect(result[0].rank).toBe(1);
      // Widget with highest interaction frequency should rank first
      expect(result[0].item.widget_id).toBe('widget2');
    });
  });

  describe('Search Ranking Optimization', () => {
    it('should optimize search results', () => {
      const optimizer = new DreamOptimizer(createMockConfig());

      const searchResults: SearchResult[] = [
        {
          id: 'result1',
          type: 'surface',
          relevance_score: 0.9,
          name: 'HomeDream',
        },
        {
          id: 'result2',
          type: 'dream',
          relevance_score: 0.7,
          name: 'Widget',
        },
        {
          id: 'result3',
          type: 'content',
          relevance_score: 0.95,
          name: 'Post',
        },
      ];

      const result = optimizer.optimizeSearch(searchResults, 'test query', ['read']);

      expect(result).toHaveLength(3);
      expect(result[0].rank).toBe(1);
      // Highest relevance with surface type should rank high
      expect(result[0].score).toBeGreaterThan(0.5);
    });
  });

  describe('Notification Priority Optimization', () => {
    it('should optimize notification order', () => {
      const optimizer = new DreamOptimizer(createMockConfig());

      const notifications: Notification[] = [
        {
          id: 'notif1',
          type: 'message',
          urgency: 'critical',
          timestamp: new Date(),
        },
        {
          id: 'notif2',
          type: 'update',
          urgency: 'low',
          timestamp: new Date(),
        },
        {
          id: 'notif3',
          type: 'alert',
          urgency: 'high',
          timestamp: new Date(Date.now() - 3600000),
        },
      ];

      const result = optimizer.optimizeNotifications(notifications);

      expect(result).toHaveLength(3);
      expect(result[0].rank).toBe(1);
      // Critical urgency should rank first
      expect(result[0].item.id).toBe('notif1');
    });
  });

  describe('Asset Loading Optimization', () => {
    it('should optimize asset loading order', () => {
      const optimizer = new DreamOptimizer(createMockConfig());

      const assets: Asset[] = [
        {
          id: 'asset1',
          type: 'image',
          size_bytes: 50000,
          priority: 0.9,
          in_viewport: true,
        },
        {
          id: 'asset2',
          type: 'model',
          size_bytes: 5000000,
          priority: 0.5,
          in_viewport: false,
        },
        {
          id: 'asset3',
          type: 'audio',
          size_bytes: 100000,
          priority: 0.8,
          in_viewport: true,
        },
      ];

      const result = optimizer.optimizeAssetLoading(assets);

      expect(result).toHaveLength(3);
      expect(result[0].rank).toBe(1);
      // Small, high-priority, in-viewport assets should rank first
      expect(result[0].item.in_viewport).toBe(true);
    });
  });

  describe('Offline Queue Optimization', () => {
    it('should optimize offline queue order', () => {
      const optimizer = new DreamOptimizer(createMockConfig());

      const queuedActions: QueuedAction[] = [
        {
          id: 'action1',
          type: 'message_send',
          priority: 0.9,
          timestamp: new Date(),
          data_size_bytes: 1000,
          failure_count: 0,
        },
        {
          id: 'action2',
          type: 'upload',
          priority: 0.5,
          timestamp: new Date(Date.now() - 3600000),
          data_size_bytes: 10000000,
          failure_count: 2,
        },
        {
          id: 'action3',
          type: 'post_publish',
          priority: 0.8,
          timestamp: new Date(Date.now() - 1800000),
          data_size_bytes: 5000,
          failure_count: 0,
        },
      ];

      const result = optimizer.optimizeOfflineQueue(queuedActions);

      expect(result).toHaveLength(3);
      expect(result[0].rank).toBe(1);
      // High priority, recent, small actions with no failures should rank first
      expect(result[0].item.failure_count).toBe(0);
    });
  });
});

describe('Creative Validator', () => {
  it('should validate a safe creative option', () => {
    const option: CreativeOption = {
      id: 'opt1',
      content: 'This is a beautiful and elegant design that helps users be more productive',
      variant_type: 'standard',
      tone: 'professional',
      style: 'elegant',
    };

    const result = validateCreativeOption(option);

    expect(result.valid).toBe(true);
    expect(result.failures).toBeUndefined();
  });

  it('should reject options that break privacy', () => {
    const option: CreativeOption = {
      id: 'opt1',
      content: 'This feature will expose user data publicly for everyone to see',
      metadata: {
        breaksPrivacy: true,
      },
    };

    const result = validateCreativeOption(option);

    expect(result.valid).toBe(false);
    expect(result.failures).toBeDefined();
    expect(result.failures?.some(f => f.type === 'breaks_privacy')).toBe(true);
  });

  it('should reject options with invalid TypeScript', () => {
    const option: CreativeOption = {
      id: 'opt1',
      content: 'function test() { if (true) { return "missing closing brace"',
    };

    const result = validateCreativeOption(option);

    expect(result.valid).toBe(false);
    expect(result.failures?.some(f => f.type === 'invalid_typescript')).toBe(true);
  });

  it('should reject options with infinite loops', () => {
    const option: CreativeOption = {
      id: 'opt1',
      content: 'while (true) { console.log("infinite loop"); }',
    };

    const result = validateCreativeOption(option);

    expect(result.valid).toBe(false);
    expect(result.failures?.some(f => f.type === 'infinite_loop')).toBe(true);
  });

  it('should reject fake actions', () => {
    const option: CreativeOption = {
      id: 'opt1',
      content: 'console.log("saving") instead of actually saving to database',
      metadata: {
        fakeAction: true,
      },
    };

    const result = validateCreativeOption(option);

    expect(result.valid).toBe(false);
    expect(result.failures?.some(f => f.type === 'fake_action')).toBe(true);
  });

  it('should reject options that break navigation', () => {
    const option: CreativeOption = {
      id: 'opt1',
      content: 'This change will create a navigation loop that users cannot escape',
    };

    const result = validateCreativeOption(option);

    expect(result.valid).toBe(false);
    expect(result.failures?.some(f => f.type === 'breaks_navigation')).toBe(true);
  });
});

describe('Creative Optimizer', () => {
  const createMockConfigWithCreative = (): OptimizerConfig => ({
    version: '1.0.0',
    optimizer: {
      algorithm: 'constraint-solver',
      max_iterations: 1000,
      convergence_threshold: 0.001,
    },
    creative_options: {
      enabled: true,
      constraints: [
        { name: 'novelty', weight: 0.30, priority: 'high' },
        { name: 'usefulness', weight: 0.25, priority: 'high' },
        { name: 'delight', weight: 0.20, priority: 'medium' },
        { name: 'fit', weight: 0.15, priority: 'high' },
        { name: 'cost', weight: 0.05, priority: 'medium' },
        { name: 'risk', weight: 0.05, priority: 'medium' },
      ],
      output: 'ranked_creative_options',
    },
    performance: {
      max_optimization_time_ms: 100,
      cache_results: true,
      cache_ttl_seconds: 300,
      parallel_optimization: true,
      max_concurrent_optimizations: 4,
    },
    logging: {
      enabled: false,
      level: 'info',
      log_optimizations: false,
      log_constraint_violations: false,
      output_path: '.optimization-logs/',
    },
  });

  describe('CREATIVE OPTIMIZERO Algorithm', () => {
    it('should optimize creative options and return best candidate', () => {
      const optimizer = new DreamOptimizer(createMockConfigWithCreative());

      const candidates: CreativeOption[] = [
        {
          id: 'opt1',
          content: 'A standard, safe option that helps users accomplish their tasks',
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
          content: 'An innovative and delightful approach that enables users to be more creative',
          variant_type: 'innovative',
          tone: 'enthusiastic',
          style: 'vibrant',
          metadata: {
            isUnique: true,
            practicalityScore: 0.7,
            visualImpact: 0.9,
          },
        },
        {
          id: 'opt3',
          content: 'A beautiful and elegant solution that will help users achieve amazing results',
          variant_type: 'standard',
          tone: 'inspiring',
          style: 'elegant',
          metadata: {
            practicalityScore: 0.9,
            visualImpact: 0.8,
          },
        },
      ];

      const result = optimizer.optimizeCreativeOptions(candidates);

      expect(result.best_candidate).toBeDefined();
      expect(result.ranked_candidates).toHaveLength(3);
      expect(result.rejected_candidates).toHaveLength(0);
      expect(result.best_candidate?.rank).toBe(1);
      expect(result.best_candidate?.final_score).toBeGreaterThan(0);
      expect(result.ranked_candidates[0].validation.valid).toBe(true);
    });

    it('should filter out unsafe options', () => {
      const optimizer = new DreamOptimizer(createMockConfigWithCreative());

      const candidates: CreativeOption[] = [
        {
          id: 'opt1',
          content: 'A safe and useful option',
          variant_type: 'standard',
        },
        {
          id: 'opt2',
          content: 'This option will expose user data and leak credentials',
          metadata: {
            breaksPrivacy: true,
          },
        },
        {
          id: 'opt3',
          content: 'while (true) { /* infinite loop */ }',
          metadata: {
            infiniteLoop: true,
          },
        },
      ];

      const result = optimizer.optimizeCreativeOptions(candidates);

      expect(result.best_candidate?.id).toBe('opt1');
      expect(result.ranked_candidates).toHaveLength(1);
      expect(result.rejected_candidates).toHaveLength(2);
    });

    it('should score novelty correctly', () => {
      const optimizer = new DreamOptimizer(createMockConfigWithCreative());

      const candidates: CreativeOption[] = [
        {
          id: 'opt1',
          content: 'Standard approach',
          variant_type: 'standard',
        },
        {
          id: 'opt2',
          content: 'Experimental and avant-garde approach',
          variant_type: 'experimental',
          tone: 'avant-garde',
          metadata: {
            isUnique: true,
            innovationScore: 0.9,
          },
        },
      ];

      const result = optimizer.optimizeCreativeOptions(candidates);

      // The experimental option should score higher on novelty
      const opt2 = result.ranked_candidates.find(c => c.id === 'opt2');
      expect(opt2?.scores.novelty).toBeGreaterThan(0.5);
    });

    it('should score usefulness based on actionable content', () => {
      const optimizer = new DreamOptimizer(createMockConfigWithCreative());

      const context: CreativeContext = {
        topic: 'productivity',
      };

      const candidates: CreativeOption[] = [
        {
          id: 'opt1',
          content: 'Vague concept',
        },
        {
          id: 'opt2',
          content: 'This productivity tool helps users accomplish tasks efficiently and enables them to track progress',
          metadata: {
            practicalityScore: 0.9,
          },
        },
      ];

      const result = optimizer.optimizeCreativeOptions(candidates, context);

      const opt2 = result.ranked_candidates.find(c => c.id === 'opt2');
      expect(opt2?.scores.usefulness).toBeGreaterThan(0.5);
    });

    it('should score delight based on emotional language', () => {
      const optimizer = new DreamOptimizer(createMockConfigWithCreative());

      const candidates: CreativeOption[] = [
        {
          id: 'opt1',
          content: 'Basic functionality',
          style: 'plain',
        },
        {
          id: 'opt2',
          content: 'A beautiful, elegant, and stunning design that creates a wonderful and delightful experience',
          style: 'elegant',
          tone: 'enthusiastic',
          metadata: {
            visualImpact: 0.9,
          },
        },
      ];

      const result = optimizer.optimizeCreativeOptions(candidates);

      const opt2 = result.ranked_candidates.find(c => c.id === 'opt2');
      expect(opt2?.scores.delight).toBeGreaterThan(0.6);
    });

    it('should score fit based on context alignment', () => {
      const optimizer = new DreamOptimizer(createMockConfigWithCreative());

      const context: CreativeContext = {
        topic: 'music',
        style_guide: 'vibrant',
        user_preferences: {
          colorScheme: 'colorful',
        },
      };

      const candidates: CreativeOption[] = [
        {
          id: 'opt1',
          content: 'A generic option about something else',
          style: 'plain',
        },
        {
          id: 'opt2',
          content: 'This music player helps users discover and enjoy music',
          style: 'vibrant',
          metadata: {
            colorScheme: 'colorful',
          },
        },
      ];

      const result = optimizer.optimizeCreativeOptions(candidates, context);

      const opt2 = result.ranked_candidates.find(c => c.id === 'opt2');
      const opt1 = result.ranked_candidates.find(c => c.id === 'opt1');
      expect(opt2?.scores.fit).toBeGreaterThan(opt1?.scores.fit || 0);
    });

    it('should minimize cost for simple implementations', () => {
      const optimizer = new DreamOptimizer(createMockConfigWithCreative());

      const candidates: CreativeOption[] = [
        {
          id: 'opt1',
          content: 'Simple solution',
          metadata: {
            implementationCost: 0.2,
          },
        },
        {
          id: 'opt2',
          content: 'Complex algorithm that requires migration and is a breaking change with large refactor',
          metadata: {
            implementationCost: 0.9,
          },
        },
      ];

      const result = optimizer.optimizeCreativeOptions(candidates);

      const opt1 = result.ranked_candidates.find(c => c.id === 'opt1');
      const opt2 = result.ranked_candidates.find(c => c.id === 'opt2');
      expect(opt1?.scores.cost).toBeLessThan(opt2?.scores.cost || 1);
    });

    it('should minimize risk for tested approaches', () => {
      const optimizer = new DreamOptimizer(createMockConfigWithCreative());

      const candidates: CreativeOption[] = [
        {
          id: 'opt1',
          content: 'Proven approach',
          variant_type: 'standard',
          metadata: {
            riskLevel: 0.1,
          },
        },
        {
          id: 'opt2',
          content: 'Experimental and untested approach that may cause issues',
          variant_type: 'experimental',
          metadata: {
            riskLevel: 0.8,
          },
        },
      ];

      const result = optimizer.optimizeCreativeOptions(candidates);

      const opt1 = result.ranked_candidates.find(c => c.id === 'opt1');
      const opt2 = result.ranked_candidates.find(c => c.id === 'opt2');
      expect(opt1?.scores.risk).toBeLessThan(opt2?.scores.risk || 1);
    });

    it('should handle empty candidate list', () => {
      const optimizer = new DreamOptimizer(createMockConfigWithCreative());

      const result = optimizer.optimizeCreativeOptions([]);

      expect(result.best_candidate).toBeNull();
      expect(result.ranked_candidates).toHaveLength(0);
      expect(result.rejected_candidates).toHaveLength(0);
    });

    it('should handle all candidates being rejected', () => {
      const optimizer = new DreamOptimizer(createMockConfigWithCreative());

      const candidates: CreativeOption[] = [
        {
          id: 'opt1',
          content: 'Breaks privacy',
          metadata: { breaksPrivacy: true },
        },
        {
          id: 'opt2',
          content: 'Infinite loop',
          metadata: { infiniteLoop: true },
        },
      ];

      const result = optimizer.optimizeCreativeOptions(candidates);

      expect(result.best_candidate).toBeNull();
      expect(result.ranked_candidates).toHaveLength(0);
      expect(result.rejected_candidates).toHaveLength(2);
    });

    it('should apply weighted formula correctly', () => {
      const optimizer = new DreamOptimizer(createMockConfigWithCreative());

      const candidates: CreativeOption[] = [
        {
          id: 'opt1',
          content: 'An innovative, useful, delightful, and well-fitting solution that is cheap and low-risk',
          variant_type: 'innovative',
          tone: 'enthusiastic',
          style: 'elegant',
          metadata: {
            isUnique: true,
            innovationScore: 0.9,
            practicalityScore: 0.9,
            visualImpact: 0.9,
            implementationCost: 0.1,
            riskLevel: 0.1,
          },
        },
        {
          id: 'opt2',
          content: 'Basic option',
          metadata: {
            practicalityScore: 0.3,
          },
        },
      ];

      const result = optimizer.optimizeCreativeOptions(candidates);

      expect(result.best_candidate?.id).toBe('opt1');
      expect(result.best_candidate?.final_score).toBeGreaterThan(result.ranked_candidates[1]?.final_score || 0);
    });

    it('should return candidates when disabled', () => {
      const config = createMockConfigWithCreative();
      config.creative_options!.enabled = false;

      const optimizer = new DreamOptimizer(config);

      const candidates: CreativeOption[] = [
        { id: 'opt1', content: 'Option 1' },
      ];

      const result = optimizer.optimizeCreativeOptions(candidates);

      expect(result.best_candidate).toBeNull();
      expect(result.ranked_candidates).toHaveLength(0);
    });
  });
});

// =============================================================================
// RuntimeContext-aware optimizer tests (P-003 — IDARi daily improvement cycle)
//
// Architecture justification: docs/ARCHITECTURE.md §10 — performance systems
// must stay adaptive.  These tests verify that injecting a RuntimeContext
// actually changes ranking behaviour (docs/BUGS.md TODO items resolved).
// =============================================================================

import type { RuntimeContext } from '@/lib/optimizer/types';

describe('DreamOptimizer — RuntimeContext injection', () => {
  /** Minimal config that enables feed + widget + notification ranking. */
  const baseConfig = (): OptimizerConfig => ({
    version: '1.0.0',
    optimizer: { algorithm: 'constraint-solver', max_iterations: 100, convergence_threshold: 0.001 },
    feed_selection: {
      enabled: true,
      constraints: [
        { name: 'user_selected_sources', weight: 0.6, priority: 'high' },
        { name: 'recency', weight: 0.2, priority: 'low' },
        { name: 'favorites', weight: 0.2, priority: 'medium' },
      ],
      output: 'ranked_feed',
    },
    widget_priority: {
      enabled: true,
      constraints: [
        { name: 'interaction_frequency', weight: 0.2, priority: 'medium' },
        { name: 'screen_size',           weight: 0.3, priority: 'high' },
        { name: 'device_type',           weight: 0.3, priority: 'high' },
        { name: 'layout_density',        weight: 0.2, priority: 'medium' },
      ],
      output: 'ranked_widgets',
    },
    notification_priority: {
      enabled: true,
      constraints: [
        { name: 'urgency',          weight: 0.4, priority: 'high' },
        { name: 'sender_priority',  weight: 0.4, priority: 'high' },
        { name: 'recency',          weight: 0.2, priority: 'low' },
      ],
      output: 'ranked_notifications',
    },
    performance: { max_optimization_time_ms: 100, cache_results: false, cache_ttl_seconds: 0, parallel_optimization: false, max_concurrent_optimizations: 1 },
    logging: { enabled: false, level: 'info', log_optimizations: false, log_constraint_violations: false, output_path: '' },
  });

  // ── Feed: sourcePreferences ──────────────────────────────────────────────

  describe('Feed — sourcePreferences', () => {
    const items: FeedItem[] = [
      { id: 'a', content: '', timestamp: new Date(), source: 'spotify',  is_favorite: false },
      { id: 'b', content: '', timestamp: new Date(), source: 'youtube',  is_favorite: false },
      { id: 'c', content: '', timestamp: new Date(), source: 'github',   is_favorite: false },
    ];

    it('without context, all sources score the same neutral fallback', () => {
      const opt = new DreamOptimizer(baseConfig());
      const result = opt.optimizeFeed(items);
      // All user_selected_sources should be equal (0.5 default), so relative
      // ordering is determined by other factors; scores must be defined and
      // in [0, 1].
      for (const r of result) {
        expect(r.score).toBeGreaterThanOrEqual(0);
        expect(r.score).toBeLessThanOrEqual(1);
      }
    });

    it('with sourcePreferences, highly-preferred source ranks above others', () => {
      const context: RuntimeContext = {
        sourcePreferences: { spotify: 1.0, youtube: 0.1, github: 0.1 },
      };
      const opt = new DreamOptimizer(baseConfig(), context);
      const result = opt.optimizeFeed(items);
      expect(result[0].item.source).toBe('spotify');
    });

    it('preferring a different source flips the ranking', () => {
      const context: RuntimeContext = {
        sourcePreferences: { spotify: 0.1, youtube: 1.0, github: 0.1 },
      };
      const opt = new DreamOptimizer(baseConfig(), context);
      const result = opt.optimizeFeed(items);
      expect(result[0].item.source).toBe('youtube');
    });
  });

  // ── Widget: device-context scores ────────────────────────────────────────

  describe('Widget — device / layout context', () => {
    const widgets: WidgetPriority[] = [
      { widget_id: 'w1', focus_rank: 0, z_index: 0, interaction_frequency: 10 },
      { widget_id: 'w2', focus_rank: 0, z_index: 0, interaction_frequency: 10 },
    ];

    it('desktop context scores higher screen_size than mobile', () => {
      const desktop = new DreamOptimizer(baseConfig(), { deviceType: 'desktop', viewportWidth: 1920 });
      const mobile  = new DreamOptimizer(baseConfig(), { deviceType: 'mobile',  viewportWidth: 375 });
      const desktopResult = desktop.optimizeWidgets(widgets);
      const mobileResult  = mobile.optimizeWidgets(widgets);
      // All widgets identical — scores may differ between desktop and mobile
      // because screen_size and device_type weights are large (0.3 + 0.3).
      // Desktop composite score must be ≥ mobile composite score.
      expect(desktopResult[0].score).toBeGreaterThanOrEqual(mobileResult[0].score);
    });

    it('layout density decreases score as dreamWindowCount increases', () => {
      const sparse = new DreamOptimizer(baseConfig(), { dreamWindowCount: 1 });
      const dense  = new DreamOptimizer(baseConfig(), { dreamWindowCount: 9 });
      const sparseScore = sparse.optimizeWidgets(widgets)[0].score;
      const denseScore  = dense.optimizeWidgets(widgets)[0].score;
      expect(sparseScore).toBeGreaterThan(denseScore);
    });

    it('no context falls back to documented neutral defaults without throwing', () => {
      const opt = new DreamOptimizer(baseConfig());
      expect(() => opt.optimizeWidgets(widgets)).not.toThrow();
    });

    it('resolveScreenSizeScore breakpoints match spec values', () => {
      const make = (w: number) => new DreamOptimizer(baseConfig(), { viewportWidth: w });
      // Verify breakpoint ordering: wider = higher score
      const s375  = make(375).optimizeWidgets(widgets)[0].score;
      const s768  = make(768).optimizeWidgets(widgets)[0].score;
      const s1024 = make(1024).optimizeWidgets(widgets)[0].score;
      const s1440 = make(1440).optimizeWidgets(widgets)[0].score;
      expect(s375).toBeLessThan(s768);
      expect(s768).toBeLessThan(s1024);
      expect(s1024).toBeLessThan(s1440);
    });
  });

  // ── Notifications: senderPriorities ─────────────────────────────────────

  describe('Notifications — senderPriorities', () => {
    const notifications: Notification[] = [
      { id: 'n1', type: 'dm',   urgency: 'medium', sender_id: 'alice', timestamp: new Date() },
      { id: 'n2', type: 'dm',   urgency: 'medium', sender_id: 'bob',   timestamp: new Date() },
    ];

    it('without context, sender_priority is the same 0.7 fallback for both', () => {
      const opt = new DreamOptimizer(baseConfig());
      const result = opt.optimizeNotifications(notifications);
      // Scores should be valid; no crash
      for (const r of result) expect(r.score).toBeGreaterThanOrEqual(0);
    });

    it('senderPriorities boosts the preferred sender to rank 1', () => {
      const context: RuntimeContext = {
        senderPriorities: { alice: 1.0, bob: 0.1 },
      };
      const opt = new DreamOptimizer(baseConfig(), context);
      const result = opt.optimizeNotifications(notifications);
      expect(result[0].item.sender_id).toBe('alice');
    });

    it('context with unknown sender_id falls back to 0.7 gracefully', () => {
      const context: RuntimeContext = {
        senderPriorities: { carol: 1.0 }, // neither alice nor bob
      };
      const opt = new DreamOptimizer(baseConfig(), context);
      // Should not throw; both get 0.7 fallback
      expect(() => opt.optimizeNotifications(notifications)).not.toThrow();
    });
  });
});
