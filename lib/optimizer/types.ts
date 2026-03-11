/**
 * DREAMengin Optimization Framework Types
 *
 * Core pattern:
 * - maximize usefulness
 * - minimize cost
 * - subject to constraints
 */

export type ConstraintPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Constraint {
  name: string;
  weight: number;
  priority: ConstraintPriority;
  value?: number;
  satisfied?: boolean;
}

export interface OptimizationTarget {
  enabled: boolean;
  constraints: Constraint[];
  output: string;
}

export interface OptimizerConfig {
  version: string;
  optimizer: {
    algorithm: string;
    max_iterations: number;
    convergence_threshold: number;
  };
  feed_selection?: OptimizationTarget;
  search_ranking?: OptimizationTarget;
  widget_priority?: OptimizationTarget;
  layout_balancing?: OptimizationTarget;
  asset_loading?: OptimizationTarget & { asset_types: string[] };
  render_budget?: OptimizationTarget;
  cache_strategy?: OptimizationTarget;
  notification_priority?: OptimizationTarget;
  offline_queue?: OptimizationTarget & { actions: string[] };
  ai_suggestions?: OptimizationTarget;
  system_routing?: OptimizationTarget;
  creative_options?: OptimizationTarget;
  performance: {
    max_optimization_time_ms: number;
    cache_results: boolean;
    cache_ttl_seconds: number;
    parallel_optimization: boolean;
    max_concurrent_optimizations: number;
  };
  logging: {
    enabled: boolean;
    level: string;
    log_optimizations: boolean;
    log_constraint_violations: boolean;
    output_path: string;
  };
}

export interface OptimizationResult {
  algorithm: string;
  target: string;
  objective_value: number;
  constraints_satisfied: number;
  optimization_score: number;
  optimizations: Array<{
    name: string;
    description: string;
    impact: number;
  }>;
  timestamp: string;
  duration_ms: number;
}

export interface OptimizationItem {
  id: string;
  score: number;
  metadata: Record<string, any>;
}

export interface ConstraintSolverOptions {
  maxIterations: number;
  convergenceThreshold: number;
  timeoutMs: number;
}

export interface RankedItem<T = any> {
  item: T;
  score: number;
  rank: number;
  metadata?: Record<string, any>;
}

// Feed selection types
export interface FeedItem {
  id: string;
  content: any;
  timestamp: Date;
  source: string;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
  };
  is_favorite?: boolean;
  privacy_level?: 'public' | 'followers' | 'private';
}

// Widget priority types
export interface WidgetPriority {
  widget_id: string;
  focus_rank: number;
  z_index: number;
  interaction_frequency: number;
  last_interaction?: Date;
}

// Search result types
export interface SearchResult {
  id: string;
  type: 'surface' | 'dream' | 'content' | 'user';
  relevance_score: number;
  name: string;
  metadata?: Record<string, any>;
}

// Asset loading types
export interface Asset {
  id: string;
  type: 'image' | 'model' | 'audio' | 'ui_element' | 'widget_data';
  size_bytes: number;
  priority: number;
  in_viewport?: boolean;
}

// Notification types
export interface Notification {
  id: string;
  type: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  sender_id?: string;
  timestamp: Date;
  interaction_history?: number;
}

// Offline queue types
export interface QueuedAction {
  id: string;
  type: 'message_send' | 'upload' | 'post_publish' | 'widget_update';
  priority: number;
  timestamp: Date;
  data_size_bytes: number;
  failure_count: number;
}

// Creative option types
export interface CreativeOption {
  id: string;
  content: string;
  variant_type?: string;
  tone?: string;
  style?: string;
  metadata?: Record<string, any>;
}

export interface CreativeContext {
  user_preferences?: Record<string, any>;
  topic?: string;
  style_guide?: string;
  constraints?: string[];
}

export interface CreativeScore {
  novelty: number;
  usefulness: number;
  delight: number;
  fit: number;
  cost: number;
  risk: number;
}

export interface HardFailureReason {
  type: 'breaks_build' | 'breaks_vercel' | 'breaks_privacy' | 'breaks_navigation' |
        'fake_action' | 'invalid_typescript' | 'invalid_imports' | 'infinite_loop' |
        'performance_regression';
  message: string;
}

export interface CreativeValidationResult {
  valid: boolean;
  failures?: HardFailureReason[];
}

export interface RankedCreativeOption extends CreativeOption {
  scores: CreativeScore;
  final_score: number;
  rank: number;
  validation: CreativeValidationResult;
}

export interface CreativeOptimizerResult {
  best_candidate: RankedCreativeOption | null;
  ranked_candidates: RankedCreativeOption[];
  rejected_candidates: Array<{
    option: CreativeOption;
    reasons: HardFailureReason[];
  }>;
}
