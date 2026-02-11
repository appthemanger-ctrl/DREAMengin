// types/ccc.ts
// Section 14: CCC Metaphor — Connected Chaos Core
//
// System mirrors CCC Physics:
//   - Information flows
//   - Memory persists
//   - No loss, no breaks, only transformations
//
// UI behaves like nested cubes / nested fields / nested realities
// Like spacetime navigation.

export interface CCCNode {
  id: string;
  depth: number;
  parent_id?: string;
  children_ids: string[];
  state: Record<string, unknown>;
}

export interface CCCField {
  id: string;
  nodes: CCCNode[];
  // Information flows: every transformation is recorded
  transformations: CCCTransformation[];
}

export interface CCCTransformation {
  id: string;
  source_node_id: string;
  target_node_id: string;
  payload: unknown;
  timestamp: string;
}

// Nested reality layer (cube-within-cube metaphor)
export interface CCCLayer {
  id: string;
  depth: number;
  label?: string;
  parent_layer_id?: string;
  child_layer_ids: string[];
  field: CCCField;
}
