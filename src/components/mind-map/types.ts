import type { Node, Edge } from '@xyflow/react';
import type { FeaturePriority } from '@/types';

export type MindMapNodeData = {
  label: string;
  color: string;
  type: string;
  featureId?: string;
  priority?: FeaturePriority | null;
  isRoot?: boolean;
  isNew?: boolean;
};

export type MindMapFlowNode = Node<MindMapNodeData>;
export type MindMapFlowEdge = Edge<{ label?: string }>;
