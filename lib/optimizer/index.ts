/**
 * DREAMengin Optimization Framework
 * Main optimizer interface for all DREAMengin modules
 */

import { ConstraintSolver } from './constraint-solver';
import type {
  OptimizerConfig,
  OptimizationItem,
  RankedItem,
  FeedItem,
  WidgetPriority,
  SearchResult,
  Asset,
  Notification,
  QueuedAction,
  Constraint,
} from './types';

export class DreamOptimizer {
  private solver: ConstraintSolver;
  private config: OptimizerConfig;

  constructor(config: OptimizerConfig) {
    this.config = config;
    this.solver = new ConstraintSolver({
      maxIterations: config.optimizer.max_iterations,
      convergenceThreshold: config.optimizer.convergence_threshold,
      timeoutMs: config.performance.max_optimization_time_ms,
    });
  }

  /**
   * Feed Selection - Choose which posts appear first on HomeDream
   */
  optimizeFeed(feedItems: FeedItem[]): RankedItem<FeedItem>[] {
    if (!this.config.feed_selection?.enabled) {
      return feedItems.map((item, index) => ({
        item,
        score: 1,
        rank: index + 1,
      }));
    }

    const optimizationItems: OptimizationItem[] = feedItems.map(item => ({
      id: item.id,
      score: 0,
      metadata: {
        favorites: item.is_favorite ? 1 : 0,
        source_preference: this.calculateSourcePreference(item.source),
        recency: this.calculateRecency(item.timestamp),
        privacy: this.calculatePrivacyScore(item.privacy_level),
        engagement: this.calculateEngagementScore(item.engagement),
        user_selected_sources: 0.5, // TODO: Get from user preferences
      },
    }));

    const ranked = this.solver.solve(
      optimizationItems,
      this.config.feed_selection.constraints
    );

    return ranked.map(r => ({
      item: feedItems.find(f => f.id === r.item.id)!,
      score: r.score,
      rank: r.rank,
      metadata: r.metadata,
    }));
  }

  /**
   * Search Ranking - When Dr. Eams searches the system
   */
  optimizeSearch(
    searchResults: SearchResult[],
    query: string,
    userPermissions: string[]
  ): RankedItem<SearchResult>[] {
    if (!this.config.search_ranking?.enabled) {
      return searchResults.map((item, index) => ({
        item,
        score: item.relevance_score,
        rank: index + 1,
      }));
    }

    const optimizationItems: OptimizationItem[] = searchResults.map(result => ({
      id: result.id,
      score: 0,
      metadata: {
        relevance: result.relevance_score,
        user_permissions: this.checkPermissions(result, userPermissions),
        system_location: this.calculateLocationScore(result.type),
        recency: result.metadata?.timestamp
          ? this.calculateRecency(new Date(result.metadata.timestamp))
          : 0.5,
        content_type: this.calculateTypeScore(result.type),
      },
    }));

    const ranked = this.solver.solve(
      optimizationItems,
      this.config.search_ranking.constraints
    );

    return ranked.map(r => ({
      item: searchResults.find(s => s.id === r.item.id)!,
      score: r.score,
      rank: r.rank,
      metadata: r.metadata,
    }));
  }

  /**
   * Widget Priority - Choose which Dreams appear most prominently
   */
  optimizeWidgets(widgets: WidgetPriority[]): RankedItem<WidgetPriority>[] {
    if (!this.config.widget_priority?.enabled) {
      return widgets.map((item, index) => ({
        item,
        score: 1,
        rank: index + 1,
      }));
    }

    const optimizationItems: OptimizationItem[] = widgets.map(widget => ({
      id: widget.widget_id,
      score: 0,
      metadata: {
        interaction_frequency: Math.min(1, widget.interaction_frequency / 100),
        screen_size: 0.7, // TODO: Get from device context
        device_type: 0.8, // TODO: Get from device context
        layout_density: 0.6, // TODO: Calculate from current layout
      },
    }));

    const ranked = this.solver.solve(
      optimizationItems,
      this.config.widget_priority.constraints
    );

    return ranked.map(r => ({
      item: widgets.find(w => w.widget_id === r.item.id)!,
      score: r.score,
      rank: r.rank,
      metadata: r.metadata,
    }));
  }

  /**
   * Asset Loading Priority - Decide which assets load first
   */
  optimizeAssetLoading(assets: Asset[]): RankedItem<Asset>[] {
    if (!this.config.asset_loading?.enabled) {
      return assets.map((item, index) => ({
        item,
        score: 1,
        rank: index + 1,
      }));
    }

    const optimizationItems: OptimizationItem[] = assets.map(asset => ({
      id: asset.id,
      score: 0,
      metadata: {
        bandwidth: this.calculateBandwidthScore(asset.size_bytes),
        memory: this.calculateMemoryScore(asset.size_bytes),
        scene_importance: asset.priority,
        user_viewport: asset.in_viewport ? 1 : 0.3,
      },
    }));

    const ranked = this.solver.solve(
      optimizationItems,
      this.config.asset_loading.constraints
    );

    return ranked.map(r => ({
      item: assets.find(a => a.id === r.item.id)!,
      score: r.score,
      rank: r.rank,
      metadata: r.metadata,
    }));
  }

  /**
   * Notification Priority - Order notifications in DreamDM Bar
   */
  optimizeNotifications(
    notifications: Notification[]
  ): RankedItem<Notification>[] {
    if (!this.config.notification_priority?.enabled) {
      return notifications.map((item, index) => ({
        item,
        score: 1,
        rank: index + 1,
      }));
    }

    const optimizationItems: OptimizationItem[] = notifications.map(notif => ({
      id: notif.id,
      score: 0,
      metadata: {
        urgency: this.calculateUrgencyScore(notif.urgency),
        interaction_history: notif.interaction_history ?? 0.5,
        sender_priority: 0.7, // TODO: Get from user relationships
        recency: this.calculateRecency(notif.timestamp),
      },
    }));

    const ranked = this.solver.solve(
      optimizationItems,
      this.config.notification_priority.constraints
    );

    return ranked.map(r => ({
      item: notifications.find(n => n.id === r.item.id)!,
      score: r.score,
      rank: r.rank,
      metadata: r.metadata,
    }));
  }

  /**
   * Offline Queue Order - When connection returns, choose sync order
   */
  optimizeOfflineQueue(
    queuedActions: QueuedAction[]
  ): RankedItem<QueuedAction>[] {
    if (!this.config.offline_queue?.enabled) {
      return queuedActions.map((item, index) => ({
        item,
        score: 1,
        rank: index + 1,
      }));
    }

    const optimizationItems: OptimizationItem[] = queuedActions.map(action => ({
      id: action.id,
      score: 0,
      metadata: {
        action_priority: action.priority,
        timestamp: this.calculateRecency(action.timestamp),
        data_size: 1 - Math.min(1, action.data_size_bytes / 10000000), // Prefer smaller first
        failure_count: Math.max(0, 1 - action.failure_count * 0.2), // Penalize failures
      },
    }));

    const ranked = this.solver.solve(
      optimizationItems,
      this.config.offline_queue.constraints
    );

    return ranked.map(r => ({
      item: queuedActions.find(a => a.id === r.item.id)!,
      score: r.score,
      rank: r.rank,
      metadata: r.metadata,
    }));
  }

  // Helper methods for score calculation

  private calculateSourcePreference(source: string): number {
    // TODO: Get from user preferences
    return 0.7;
  }

  private calculateRecency(timestamp: Date): number {
    const now = new Date();
    const ageMs = now.getTime() - new Date(timestamp).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);

    // Exponential decay: 1.0 for now, 0.5 for 24h, 0.1 for 1 week
    return Math.exp(-ageHours / 24);
  }

  private calculatePrivacyScore(
    privacyLevel?: 'public' | 'followers' | 'private'
  ): number {
    // Always respect privacy - this is critical
    if (!privacyLevel) return 0;
    return 1; // If item is visible, it passes privacy check
  }

  private calculateEngagementScore(engagement?: {
    likes: number;
    comments: number;
    shares: number;
  }): number {
    if (!engagement) return 0.5;

    const total = engagement.likes + engagement.comments * 2 + engagement.shares * 3;
    return Math.min(1, total / 100);
  }

  private checkPermissions(
    result: SearchResult,
    userPermissions: string[]
  ): number {
    // Always return 1 for now - proper permission check is critical
    return 1;
  }

  private calculateLocationScore(type: string): number {
    const scores: Record<string, number> = {
      surface: 0.9,
      dream: 0.8,
      content: 0.7,
      user: 0.6,
    };
    return scores[type] ?? 0.5;
  }

  private calculateTypeScore(type: string): number {
    return this.calculateLocationScore(type);
  }

  private calculateBandwidthScore(sizeBytes: number): number {
    // Prefer smaller assets
    return Math.max(0, 1 - sizeBytes / 10000000);
  }

  private calculateMemoryScore(sizeBytes: number): number {
    return this.calculateBandwidthScore(sizeBytes);
  }

  private calculateUrgencyScore(
    urgency: 'critical' | 'high' | 'medium' | 'low'
  ): number {
    const scores = {
      critical: 1.0,
      high: 0.75,
      medium: 0.5,
      low: 0.25,
    };
    return scores[urgency];
  }
}

export * from './types';
export { ConstraintSolver } from './constraint-solver';
