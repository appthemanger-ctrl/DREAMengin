// AnchorWidgetStorage - Persistent storage for anchor widget state
// Manages HomeSlotWidgetIds, PriorityWidgetIds, and link graph

export interface HomeSlotMapping {
  slotIndex: number; // 0-7
  widgetId: string | null; // null = blank slot
}

export interface PriorityWidget {
  widgetId: string;
  lastFocused: number; // timestamp
  pinned: boolean;
  usageCount?: number;
}

export interface AnchorWidgetState {
  mode: number;
  prevMode: number;
  isOpen: boolean;
  homeSlots: HomeSlotMapping[];
  priorityWidgets: PriorityWidget[];
  navSnapshot: Int32Array | null;
}

/**
 * AnchorWidgetStorage manages persistent state for the anchor widget
 * Uses localStorage/IndexedDB for persistence
 */
export class AnchorWidgetStorage {
  private static readonly STORAGE_KEY = 'anchor_widget_state';
  private static readonly HOME_SLOTS_COUNT = 8;
  private static readonly PRIORITY_WIDGETS_COUNT = 12;
  
  /**
   * Initialize default home slots (all blank)
   */
  private static createDefaultHomeSlots(): HomeSlotMapping[] {
    return Array.from({ length: this.HOME_SLOTS_COUNT }, (_, index) => ({
      slotIndex: index,
      widgetId: null
    }));
  }
  
  /**
   * Load anchor widget state from storage
   */
  static async load(): Promise<AnchorWidgetState | null> {
    try {
      if (typeof window === 'undefined') return null;
      
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      
      const data = JSON.parse(stored);
      
      // Reconstruct Int32Array if present
      if (data.navSnapshot) {
        data.navSnapshot = new Int32Array(data.navSnapshot);
      }
      
      return data;
    } catch (error) {
      console.error('Failed to load anchor widget state:', error);
      return null;
    }
  }
  
  /**
   * Save anchor widget state to storage
   */
  static async save(state: AnchorWidgetState): Promise<void> {
    try {
      if (typeof window === 'undefined') return;
      
      // Convert Int32Array to regular array for JSON
      const stateToStore = {
        ...state,
        navSnapshot: state.navSnapshot ? Array.from(state.navSnapshot) : null
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stateToStore));
    } catch (error) {
      console.error('Failed to save anchor widget state:', error);
    }
  }
  
  /**
   * Save state with idle callback (non-blocking)
   */
  static saveIdle(state: AnchorWidgetState): void {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => this.save(state));
    } else {
      // Fallback to timeout
      setTimeout(() => this.save(state), 100);
    }
  }
  
  /**
   * Get widget ID for a home slot
   */
  static getSlotWidget(state: AnchorWidgetState, slotIndex: number): string | null {
    const slot = state.homeSlots.find(s => s.slotIndex === slotIndex);
    return slot?.widgetId || null;
  }
  
  /**
   * Set widget ID for a home slot
   */
  static setSlotWidget(
    state: AnchorWidgetState,
    slotIndex: number,
    widgetId: string | null
  ): void {
    const slot = state.homeSlots.find(s => s.slotIndex === slotIndex);
    if (slot) {
      slot.widgetId = widgetId;
    } else {
      state.homeSlots.push({ slotIndex, widgetId });
    }
  }
  
  /**
   * Update priority widgets based on focus and usage
   */
  static updatePriorities(state: AnchorWidgetState, focusedWidgetId: string): void {
    const existing = state.priorityWidgets.find(w => w.widgetId === focusedWidgetId);
    
    if (existing) {
      existing.lastFocused = Date.now();
      existing.usageCount = (existing.usageCount || 0) + 1;
    } else {
      state.priorityWidgets.push({
        widgetId: focusedWidgetId,
        lastFocused: Date.now(),
        pinned: false,
        usageCount: 1
      });
    }
    
    // Sort by pinned first, then by lastFocused
    state.priorityWidgets.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.lastFocused - a.lastFocused;
    });
    
    // Keep only top N
    state.priorityWidgets = state.priorityWidgets.slice(
      0,
      this.PRIORITY_WIDGETS_COUNT
    );
  }
  
  /**
   * Create initial state
   */
  static createInitialState(): AnchorWidgetState {
    return {
      mode: 0, // MODE_HOME
      prevMode: 0,
      isOpen: false,
      homeSlots: this.createDefaultHomeSlots(),
      priorityWidgets: [],
      navSnapshot: null
    };
  }
  
  /**
   * Clear all stored state (for testing)
   */
  static clear(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }
}
