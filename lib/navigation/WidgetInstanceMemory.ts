// WidgetInstanceMemory - Pre-allocated widget instances
// Mobile-optimized: no allocation, no destruction, O(1) switching

export enum WidgetPresentation {
  FLOATING = 'FLOATING',
  DOCKED = 'DOCKED',
  FULL = 'FULL',
}

export enum WidgetVisibility {
  ACTIVE = 'ACTIVE',
  BACKGROUND = 'BACKGROUND',
  PARKED = 'PARKED',
}

export enum WidgetBindingType {
  STATIC = 'STATIC',
  LIVE = 'LIVE',
  SNAPSHOT = 'SNAPSHOT',
}

export interface WidgetTransformState {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface WidgetInstanceRecord {
  instanceId: string;
  ownerId: string;
  context: 'HOME' | 'PROFILE' | 'OTHER';
  transformState: WidgetTransformState;
  zIndex: number;
  presentation: WidgetPresentation;
  bindingType: WidgetBindingType;
  bindingConfig: Record<string, unknown>;
  visibility: WidgetVisibility;
  internalState: Record<string, unknown>;
}

/**
 * WidgetInstanceMemory manages pre-allocated widget instances
 * All widgets exist for entire session - never created or destroyed
 */
export class WidgetInstanceMemory {
  private instances: WidgetInstanceRecord[];
  private homeIndices: number[];
  private profileIndices: number[];
  private activeIndicesPointer: number[]; // Points to either home or profile
  private sortedCache: WidgetInstanceRecord[] | null; // Cache for sorted widgets
  private sortedCacheDirty: boolean;
  
  constructor() {
    this.instances = [];
    this.homeIndices = [];
    this.profileIndices = [];
    this.activeIndicesPointer = this.homeIndices;
    this.sortedCache = null;
    this.sortedCacheDirty = true;
  }
  
  /**
   * Initialize with widget instances
   */
  initialize(instances: WidgetInstanceRecord[]): void {
    this.instances = instances;
    
    // Build index lists
    this.homeIndices = [];
    this.profileIndices = [];
    
    instances.forEach((instance, index) => {
      if (instance.context === 'HOME') {
        this.homeIndices.push(index);
      } else if (instance.context === 'PROFILE') {
        this.profileIndices.push(index);
      }
    });
    
    // Default to home
    this.activeIndicesPointer = this.homeIndices;
  }
  
  /**
   * Switch to Profile context (O(1) pointer swap)
   */
  switchToProfile(): void {
    this.activeIndicesPointer = this.profileIndices;
    this.sortedCacheDirty = true;
  }
  
  /**
   * Switch to Home context (O(1) pointer swap)
   */
  switchToHome(): void {
    this.activeIndicesPointer = this.homeIndices;
    this.sortedCacheDirty = true;
  }
  
  /**
   * Get active widget instances
   */
  getActiveWidgets(): WidgetInstanceRecord[] {
    return this.activeIndicesPointer.map(index => this.instances[index]);
  }
  
  /**
   * Get widget by instance ID
   */
  getWidget(instanceId: string): WidgetInstanceRecord | undefined {
    return this.instances.find(w => w.instanceId === instanceId);
  }
  
  /**
   * Update widget transform state
   */
  updateTransform(instanceId: string, transform: Partial<WidgetTransformState>): void {
    const widget = this.getWidget(instanceId);
    if (widget) {
      Object.assign(widget.transformState, transform);
      this.sortedCacheDirty = true;
    }
  }
  
  /**
   * Update widget presentation mode
   */
  updatePresentation(instanceId: string, presentation: WidgetPresentation): void {
    const widget = this.getWidget(instanceId);
    if (widget) {
      widget.presentation = presentation;
      this.sortedCacheDirty = true;
    }
  }
  
  /**
   * Get widgets sorted by z-index (cached)
   */
  getActiveWidgetsSorted(): WidgetInstanceRecord[] {
    if (!this.sortedCacheDirty && this.sortedCache) {
      return this.sortedCache;
    }
    
    const active = this.getActiveWidgets();
    this.sortedCache = active.slice().sort((a, b) => a.zIndex - b.zIndex);
    this.sortedCacheDirty = false;
    return this.sortedCache;
  }
  
  /**
   * Remove widget from active indices (for DOCKED presentation)
   */
  removeFromActive(instanceId: string): void {
    const widgetIndex = this.instances.findIndex(w => w.instanceId === instanceId);
    if (widgetIndex === -1) return;
    
    const activeIndex = this.activeIndicesPointer.indexOf(widgetIndex);
    if (activeIndex !== -1) {
      this.activeIndicesPointer.splice(activeIndex, 1);
      this.sortedCacheDirty = true;
    }
  }
  
  /**
   * Add widget to active indices
   */
  addToActive(instanceId: string): void {
    const widgetIndex = this.instances.findIndex(w => w.instanceId === instanceId);
    if (widgetIndex === -1) return;
    
    const widget = this.instances[widgetIndex];
    const targetIndices = widget.context === 'HOME' ? this.homeIndices : this.profileIndices;
    
    if (!targetIndices.includes(widgetIndex)) {
      targetIndices.push(widgetIndex);
      this.sortedCacheDirty = true;
    }
  }
}
