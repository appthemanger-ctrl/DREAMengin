/**
 * DREAMengin Optimization Framework
 * Main optimizer interface for all DREAMengin modules
 */

import { ConstraintSolver } from './constraint-solver';
import { validateCreativeOption } from './creative-validator';
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
  CreativeOption,
  CreativeScore,
  RankedCreativeOption,
  CreativeOptimizerResult,
  CreativeContext,
  RuntimeContext,
} from './types';

export class DreamOptimizer {
  private solver: ConstraintSolver;
  private config: OptimizerConfig;
  /** Optional caller-provided runtime signals (device, user prefs, social graph). */
  private context: RuntimeContext;

  constructor(config: OptimizerConfig, context: RuntimeContext = {}) {
    this.config = config;
    this.context = context;
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
        user_selected_sources: this.context.sourcePreferences?.[item.source] ?? 0.5,
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
        screen_size: this.resolveScreenSizeScore(),
        device_type: this.resolveDeviceTypeScore(),
        layout_density: this.resolveLayoutDensityScore(),
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
        sender_priority: this.context.senderPriorities?.[notif.sender_id ?? ''] ?? 0.7,
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

  /**
   * Creative Options Optimizer - CREATIVE OPTIMIZERO Algorithm
   *
   * Purpose: Generate interesting options first, then keep only the ones that do not break the system.
   *
   * Steps:
   * 1. Generate candidate options
   * 2. Score each option for novelty
   * 3. Score each option for usefulness
   * 4. Score each option for delight / visual impact
   * 5. Apply hard safety checks
   * 6. Remove anything that fails
   * 7. Rank remaining options
   * 8. Return best option + top alternatives
   *
   * Formula:
   * final_score = (w_novelty * novelty) + (w_usefulness * usefulness) +
   *               (w_delight * delight) + (w_fit * fit) - (w_cost * cost) - (w_risk * risk)
   */
  optimizeCreativeOptions(
    candidates: CreativeOption[],
    context?: CreativeContext
  ): CreativeOptimizerResult {
    if (!this.config.creative_options?.enabled) {
      return {
        best_candidate: null,
        ranked_candidates: [],
        rejected_candidates: [],
      };
    }

    const rejected: Array<{ option: CreativeOption; reasons: any[] }> = [];
    const validCandidates: Array<{
      option: CreativeOption;
      scores: CreativeScore;
    }> = [];

    // Step 1-4: Score each candidate and validate
    for (const candidate of candidates) {
      // Score for novelty, usefulness, delight, fit, cost, risk
      const scores = this.scoreCreativeOption(candidate, context);

      // Step 5: Apply hard safety checks
      const validation = validateCreativeOption(candidate);

      // Step 6: Remove anything that fails
      if (!validation.valid) {
        rejected.push({
          option: candidate,
          reasons: validation.failures || [],
        });
        continue;
      }

      // Add to valid candidates
      validCandidates.push({
        option: candidate,
        scores,
      });
    }

    // Step 7: Rank remaining options
    const constraints = this.config.creative_options.constraints;
    const rankedOptions: RankedCreativeOption[] = validCandidates.map(
      ({ option, scores }) => {
        const final_score = this.calculateCreativeFinalScore(scores, constraints);
        return {
          ...option,
          scores,
          final_score,
          rank: 0, // Will be set after sorting
          validation: { valid: true },
        };
      }
    );

    // Sort by final score descending
    rankedOptions.sort((a, b) => b.final_score - a.final_score);

    // Assign ranks
    rankedOptions.forEach((option, index) => {
      option.rank = index + 1;
    });

    // Step 8: Return best option + top alternatives
    const best_candidate = rankedOptions.length > 0 ? rankedOptions[0] : null;

    return {
      best_candidate,
      ranked_candidates: rankedOptions,
      rejected_candidates: rejected,
    };
  }

  /**
   * Score a creative option across all dimensions
   */
  private scoreCreativeOption(
    option: CreativeOption,
    context?: CreativeContext
  ): CreativeScore {
    return {
      novelty: this.scoreNovelty(option, context),
      usefulness: this.scoreUsefulness(option, context),
      delight: this.scoreDelight(option, context),
      fit: this.scoreFit(option, context),
      cost: this.scoreCost(option, context),
      risk: this.scoreRisk(option, context),
    };
  }

  /**
   * Calculate final score using weighted formula
   */
  private calculateCreativeFinalScore(
    scores: CreativeScore,
    constraints: Constraint[]
  ): number {
    let totalScore = 0;

    for (const constraint of constraints) {
      const weight = constraint.weight;
      const priorityMultiplier = this.getWeightMultiplier(constraint.priority);
      const scoreValue = (scores as any)[constraint.name] || 0;

      // Negative weights for cost and risk (we want to minimize these)
      if (constraint.name === 'cost' || constraint.name === 'risk') {
        totalScore -= scoreValue * weight * priorityMultiplier;
      } else {
        totalScore += scoreValue * weight * priorityMultiplier;
      }
    }

    // Normalize to 0-1 range
    return Math.max(0, Math.min(1, totalScore));
  }

  /**
   * Score novelty - how unique and interesting is this option?
   */
  private scoreNovelty(option: CreativeOption, context?: CreativeContext): number {
    let score = 0.5; // Default neutral

    // Check for novel patterns in content
    if (option.variant_type && option.variant_type !== 'standard') {
      score += 0.2;
    }

    // Check metadata for novelty indicators
    if (option.metadata?.isUnique === true) {
      score += 0.2;
    }

    if (option.metadata?.innovationScore) {
      score += option.metadata.innovationScore * 0.2;
    }

    // Novel tone or style
    const uncommonTones = ['experimental', 'avant-garde', 'unconventional', 'playful'];
    if (option.tone && uncommonTones.includes(option.tone.toLowerCase())) {
      score += 0.1;
    }

    return Math.min(1, score);
  }

  /**
   * Score usefulness - how practical and valuable is this option?
   */
  private scoreUsefulness(option: CreativeOption, context?: CreativeContext): number {
    let score = 0.5; // Default neutral

    // Check for usefulness indicators in metadata
    if (option.metadata?.practicalityScore) {
      score += option.metadata.practicalityScore * 0.3;
    }

    // Content length can indicate thoroughness
    if (option.content.length > 100) {
      score += 0.1;
    }

    // Context fit
    if (context?.topic && option.content.toLowerCase().includes(context.topic.toLowerCase())) {
      score += 0.2;
    }

    // Check for actionable content
    const actionablePatterns = [
      /\bcan\b/i,
      /\bwill\b/i,
      /\bhelps?\b/i,
      /\benables?\b/i,
      /\ballows?\b/i,
    ];
    if (actionablePatterns.some(p => p.test(option.content))) {
      score += 0.1;
    }

    return Math.min(1, score);
  }

  /**
   * Score delight - how visually appealing and emotionally engaging is this option?
   */
  private scoreDelight(option: CreativeOption, context?: CreativeContext): number {
    let score = 0.5; // Default neutral

    // Check for delight indicators in metadata
    if (option.metadata?.visualImpact) {
      score += option.metadata.visualImpact * 0.3;
    }

    // Emotional language
    const delightfulWords = [
      'beautiful', 'elegant', 'stunning', 'amazing', 'wonderful',
      'delightful', 'charming', 'vibrant', 'exciting', 'inspiring'
    ];
    const wordCount = delightfulWords.filter(word =>
      option.content.toLowerCase().includes(word)
    ).length;
    score += Math.min(0.2, wordCount * 0.05);

    // Style considerations
    if (option.style === 'elegant' || option.style === 'vibrant') {
      score += 0.1;
    }

    // Tone considerations
    if (option.tone === 'enthusiastic' || option.tone === 'playful') {
      score += 0.1;
    }

    return Math.min(1, score);
  }

  /**
   * Score fit - how well does this option fit the context?
   */
  private scoreFit(option: CreativeOption, context?: CreativeContext): number {
    let score = 0.5; // Default neutral

    if (!context) {
      return score;
    }

    // Check topic alignment
    if (context.topic && option.content.toLowerCase().includes(context.topic.toLowerCase())) {
      score += 0.2;
    }

    // Check style guide compliance
    if (context.style_guide && option.style === context.style_guide) {
      score += 0.2;
    }

    // Check user preferences
    if (context.user_preferences) {
      const prefKeys = Object.keys(context.user_preferences);
      const matchingPrefs = prefKeys.filter(key => {
        const prefValue = context.user_preferences![key];
        return option.metadata?.[key] === prefValue;
      }).length;
      score += Math.min(0.3, matchingPrefs * 0.1);
    }

    // Check constraint compliance
    if (context.constraints) {
      const violations = context.constraints.filter(constraint =>
        option.content.toLowerCase().includes(constraint.toLowerCase())
      ).length;
      score -= violations * 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Score cost - what is the implementation/maintenance cost?
   */
  private scoreCost(option: CreativeOption, context?: CreativeContext): number {
    let cost = 0.3; // Default low-medium cost

    // Check for cost indicators in metadata
    if (option.metadata?.implementationCost) {
      cost = option.metadata.implementationCost;
    } else {
      // Estimate based on content complexity
      const contentLength = option.content.length;
      if (contentLength > 1000) {
        cost += 0.2;
      } else if (contentLength > 500) {
        cost += 0.1;
      }

      // Check for expensive patterns
      const expensivePatterns = [
        /complex\s+algorithm/i,
        /requires\s+migration/i,
        /breaking\s+change/i,
        /large\s+refactor/i,
      ];
      if (expensivePatterns.some(p => p.test(option.content))) {
        cost += 0.2;
      }
    }

    return Math.min(1, cost);
  }

  /**
   * Score risk - what are the potential downsides?
   */
  private scoreRisk(option: CreativeOption, context?: CreativeContext): number {
    let risk = 0.2; // Default low risk

    // Check for risk indicators in metadata
    if (option.metadata?.riskLevel) {
      risk = option.metadata.riskLevel;
    } else {
      // Check for risky patterns
      const riskyPatterns = [
        /experimental/i,
        /untested/i,
        /may\s+cause/i,
        /potential\s+issue/i,
        /not\s+recommended/i,
      ];
      if (riskyPatterns.some(p => p.test(option.content))) {
        risk += 0.2;
      }

      // Novel options carry some risk
      if (option.variant_type === 'experimental') {
        risk += 0.1;
      }
    }

    return Math.min(1, risk);
  }

  /**
   * Get weight multiplier based on priority (from constraint solver)
   */
  private getWeightMultiplier(priority: string): number {
    switch (priority) {
      case 'critical':
        return 2.0;
      case 'high':
        return 1.5;
      case 'medium':
        return 1.0;
      case 'low':
        return 0.5;
      default:
        return 1.0;
    }
  }

  // Helper methods for score calculation

  private calculateSourcePreference(source: string): number {
    // Use caller-supplied preference weight when available; neutral 0.7 otherwise.
    return this.context.sourcePreferences?.[source] ?? 0.7;
  }

  // ---------------------------------------------------------------------------
  // RuntimeContext helpers — derive normalised 0–1 scores from the injected
  // signals.  Each method documents its fallback so callers know what value
  // to expect when the corresponding RuntimeContext field is absent.
  // ---------------------------------------------------------------------------

  /**
   * Screen-size score derived from `viewportWidth`.
   * Larger viewports can surface more Dream Windows, so they score higher.
   *
   * Breakpoints (CSS px):
   *   ≥ 1440 → 1.0  (wide desktop)
   *   ≥ 1024 → 0.85 (standard desktop / landscape tablet)
   *   ≥ 768  → 0.7  (portrait tablet) ← fallback when width unknown
   *    < 768  → 0.5  (mobile)
   */
  private resolveScreenSizeScore(): number {
    if (this.context.viewportWidth === undefined) return 0.7;
    if (this.context.viewportWidth >= 1440) return 1.0;
    if (this.context.viewportWidth >= 1024) return 0.85;
    if (this.context.viewportWidth >= 768) return 0.7;
    return 0.5;
  }

  /**
   * Device-type score derived from `deviceType`.
   * Desktop sessions can render the most Dream Windows concurrently.
   *
   *   'desktop' → 1.0
   *   'tablet'  → 0.8  ← fallback when deviceType unknown
   *   'mobile'  → 0.5
   */
  private resolveDeviceTypeScore(): number {
    switch (this.context.deviceType) {
      case 'desktop': return 1.0;
      case 'tablet':  return 0.8;
      case 'mobile':  return 0.5;
      default:        return 0.8;
    }
  }

  /**
   * Layout-density score derived from `dreamWindowCount`.
   * More Dream Windows in the layout means less room per window → lower score.
   *
   * Formula: max(0.2, 1 - (count - 1) × 0.1)
   *   count 1 → 1.0, count 4 → 0.7, count 9 → 0.2
   *
   * Fallback when dreamWindowCount is absent or 0: 0.6.
   */
  private resolveLayoutDensityScore(): number {
    const count = this.context.dreamWindowCount;
    if (!count || count <= 0) return 0.6;
    return Math.max(0.2, 1 - (count - 1) * 0.1);
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
