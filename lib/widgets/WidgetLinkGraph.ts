// WidgetLinkGraph - Persisted widget connection graph
// Supports widget-to-widget communication with capability-based permissions

export type CapabilityMask = 
  | 'CAN_SEND_TEXT'
  | 'CAN_SEND_MEDIA'
  | 'CAN_SEND_POST'
  | 'CAN_REQUEST_PUBLISH'
  | 'CAN_REQUEST_OPEN'
  | 'CAN_REQUEST_FOCUS';

export interface WidgetLink {
  linkId: string;
  targetWidgetId: string;
  capabilities: CapabilityMask[];
  actionMap: Record<string, string>; // e.g., "postToPlatform" -> "handlePlatformPost"
}

export interface WidgetLinkNode {
  widgetId: string;
  outgoingLinks: WidgetLink[];
  incomingLinks: string[]; // List of source widget IDs
}

/**
 * WidgetLinkGraph manages widget-to-widget connections
 * Persisted to storage, loaded at initialization
 */
export class WidgetLinkGraph {
  private nodes: Map<string, WidgetLinkNode>;
  
  constructor() {
    this.nodes = new Map();
  }
  
  /**
   * Initialize graph from persisted data
   */
  initialize(nodes: WidgetLinkNode[]): void {
    this.nodes.clear();
    nodes.forEach(node => {
      this.nodes.set(node.widgetId, node);
    });
  }
  
  /**
   * Add a widget to the graph
   */
  addWidget(widgetId: string): void {
    if (!this.nodes.has(widgetId)) {
      this.nodes.set(widgetId, {
        widgetId,
        outgoingLinks: [],
        incomingLinks: []
      });
    }
  }
  
  /**
   * Add a link from source to target with capabilities
   */
  addLink(
    sourceWidgetId: string,
    targetWidgetId: string,
    capabilities: CapabilityMask[],
    actionMap: Record<string, string> = {}
  ): string {
    // Ensure both widgets exist in graph
    this.addWidget(sourceWidgetId);
    this.addWidget(targetWidgetId);
    
    const linkId = `link_${sourceWidgetId}_${targetWidgetId}_${Date.now()}`;
    
    const sourceNode = this.nodes.get(sourceWidgetId)!;
    const targetNode = this.nodes.get(targetWidgetId)!;
    
    // Add outgoing link
    sourceNode.outgoingLinks.push({
      linkId,
      targetWidgetId,
      capabilities,
      actionMap
    });
    
    // Add incoming reference
    if (!targetNode.incomingLinks.includes(sourceWidgetId)) {
      targetNode.incomingLinks.push(sourceWidgetId);
    }
    
    return linkId;
  }
  
  /**
   * Remove a link by ID
   */
  removeLink(linkId: string): boolean {
    for (const [widgetId, node] of this.nodes) {
      const linkIndex = node.outgoingLinks.findIndex(link => link.linkId === linkId);
      if (linkIndex !== -1) {
        const link = node.outgoingLinks[linkIndex];
        node.outgoingLinks.splice(linkIndex, 1);
        
        // Remove incoming reference if no other links exist
        const targetNode = this.nodes.get(link.targetWidgetId);
        if (targetNode) {
          const hasOtherLinks = node.outgoingLinks.some(
            l => l.targetWidgetId === link.targetWidgetId
          );
          if (!hasOtherLinks) {
            targetNode.incomingLinks = targetNode.incomingLinks.filter(
              id => id !== widgetId
            );
          }
        }
        
        return true;
      }
    }
    return false;
  }
  
  /**
   * Check if a link exists with specific capability
   */
  hasCapability(
    sourceWidgetId: string,
    targetWidgetId: string,
    capability: CapabilityMask
  ): boolean {
    const sourceNode = this.nodes.get(sourceWidgetId);
    if (!sourceNode) return false;
    
    return sourceNode.outgoingLinks.some(
      link => 
        link.targetWidgetId === targetWidgetId &&
        link.capabilities.includes(capability)
    );
  }
  
  /**
   * Get all outgoing links for a widget
   */
  getOutgoingLinks(widgetId: string): WidgetLink[] {
    const node = this.nodes.get(widgetId);
    return node ? node.outgoingLinks : [];
  }
  
  /**
   * Get all incoming links for a widget
   */
  getIncomingLinks(widgetId: string): string[] {
    const node = this.nodes.get(widgetId);
    return node ? node.incomingLinks : [];
  }
  
  /**
   * Get action handler for a link
   */
  getActionHandler(
    sourceWidgetId: string,
    targetWidgetId: string,
    action: string
  ): string | null {
    const sourceNode = this.nodes.get(sourceWidgetId);
    if (!sourceNode) return null;
    
    const link = sourceNode.outgoingLinks.find(
      l => l.targetWidgetId === targetWidgetId
    );
    
    return link?.actionMap[action] || null;
  }
  
  /**
   * Validate a message can be sent
   */
  validateMessage(
    sourceWidgetId: string,
    targetWidgetId: string,
    requiredCapability: CapabilityMask
  ): boolean {
    return this.hasCapability(sourceWidgetId, targetWidgetId, requiredCapability);
  }
  
  /**
   * Export graph for persistence
   */
  export(): WidgetLinkNode[] {
    return Array.from(this.nodes.values());
  }
  
  /**
   * Clear all links (for testing)
   */
  clear(): void {
    this.nodes.clear();
  }
}
