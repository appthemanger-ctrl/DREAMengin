/**
 * DREAMengin Optimizer Tests
 */

import { describe, it, expect } from 'vitest';
import { ConstraintSolver } from '@/lib/optimizer/constraint-solver';
import { DreamOptimizer } from '@/lib/optimizer';
import type {
  OptimizerConfig,
  FeedItem,
  WidgetPriority,
  SearchResult,
  Notification,
  Asset,
  QueuedAction,
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
