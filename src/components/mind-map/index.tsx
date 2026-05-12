'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  SelectionMode,
  MarkerType,
  type NodeOrigin,
  type OnConnectStart,
  type OnConnectEnd,
  type OnConnect,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Lightbulb, MousePointer2, Plus } from 'lucide-react';

import { MindMapNode } from './mind-map-node';
import { MindMapEdge } from './mind-map-edge';
import { MindMapToolbar } from './mind-map-toolbar';
import type { MindMapFlowNode, MindMapFlowEdge } from './types';

const nodeTypes = { mindmap: MindMapNode };
const edgeTypes = { mindmap: MindMapEdge };
const nodeOrigin: NodeOrigin = [0.5, 0.5];

// Default edge options with arrow markers
const defaultEdgeOptions = {
  type: 'mindmap',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 15,
    height: 15,
    color: 'rgba(148, 163, 184, 0.6)',
  },
  animated: false,
};

function uid() { return crypto.randomUUID(); }

// Empty state component
function EmptyState({ onAddNode }: { onAddNode: () => void }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <div className="text-center max-w-md px-8 py-10 bg-gradient-to-b from-[var(--card)]/80 to-[var(--card)]/40 backdrop-blur-sm rounded-2xl border border-[var(--border)] shadow-2xl pointer-events-auto animate-in fade-in zoom-in-95 duration-300">
        {/* Illustration */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-pink-500/20 rounded-full animate-pulse" />
          <div className="absolute inset-2 bg-gradient-to-br from-violet-500/30 to-pink-500/30 rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Lightbulb className="w-12 h-12 text-amber-400" strokeWidth={1.5} />
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
          Start Brainstorming
        </h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-6 leading-relaxed">
          Create your first idea node to begin mapping out your thoughts. 
          Connect nodes to build relationships between concepts.
        </p>
        
        {/* Action button */}
        <button
          onClick={onAddNode}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white rounded-xl font-medium shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          Add First Idea
        </button>
        
        {/* Tips */}
        <div className="mt-6 pt-6 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--muted-foreground)] flex items-center justify-center gap-2">
            <MousePointer2 className="w-3.5 h-3.5" />
            Double-click anywhere to add nodes
          </p>
        </div>
      </div>
    </div>
  );
}

interface MindMapCanvasProps {
  projectSlug: string;
  projectId: string | null;
}

function MindMapCanvas({ projectSlug, projectId }: MindMapCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<MindMapFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<MindMapFlowEdge>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { screenToFlowPosition } = useReactFlow();
  const connectingNodeId = useRef<string | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  // Load from server
  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setIsLoading(true);
    fetch(`/api/projects/${projectSlug}/mind-map`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setNodes((data.nodes || []).map((n: { id: string; positionX: number; positionY: number; label: string; color: string; type: string; priority?: string; metadata?: { featureId?: string } }) => ({
            id: n.id,
            type: 'mindmap' as const,
            position: { x: n.positionX, y: n.positionY },
            data: { label: n.label, color: n.color, type: n.type, featureId: n.metadata?.featureId, priority: n.priority || null },
          })));
          setEdges((data.edges || []).map((e: { id: string; sourceId: string; targetId: string }) => ({
            id: e.id,
            source: e.sourceId,
            target: e.targetId,
            type: 'mindmap' as const,
          })));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [projectSlug, setNodes, setEdges]);

  // Debounced save
  const saveToServer = useCallback((currentNodes: MindMapFlowNode[], currentEdges: MindMapFlowEdge[]) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      setSaveError(null);
      try {
        const res = await fetch(`/api/projects/${projectSlug}/mind-map`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nodes: currentNodes.map(n => ({
              id: n.id, label: n.data.label, color: n.data.color,
              positionX: n.position.x, positionY: n.position.y,
              type: n.data.type,
              metadata: n.data.featureId ? { featureId: n.data.featureId } : null,
            })),
            edges: currentEdges.map(e => ({ id: e.id, sourceId: e.source, targetId: e.target })),
          }),
        });
        if (!res.ok) setSaveError('Failed to save');
      } catch { setSaveError('Failed to save'); }
      finally { setIsSaving(false); }
    }, 1500);
  }, [projectSlug]);

  // Wrap change handlers to trigger save
  const handleNodesChange = useCallback((changes: NodeChange<MindMapFlowNode>[]) => {
    onNodesChange(changes);
    const hasMeaningfulChange = changes.some(c =>
      c.type === 'remove' || c.type === 'add' ||
      (c.type === 'position' && 'dragging' in c && !c.dragging && c.position)
    );
    if (hasMeaningfulChange) {
      saveToServer(nodesRef.current, edgesRef.current);
    }
  }, [onNodesChange, saveToServer]);

  const handleEdgesChange = useCallback((changes: EdgeChange<MindMapFlowEdge>[]) => {
    onEdgesChange(changes);
    const hasMeaningfulChange = changes.some(c => c.type === 'remove' || c.type === 'add');
    if (hasMeaningfulChange) {
      saveToServer(nodesRef.current, edgesRef.current);
    }
  }, [onEdgesChange, saveToServer]);

  const handleConnect: OnConnect = useCallback((connection) => {
    setEdges(eds => {
      const newEdges = addEdge({ ...connection, id: uid(), type: 'mindmap' }, eds);
      saveToServer(nodesRef.current, newEdges);
      return newEdges;
    });
  }, [setEdges, saveToServer]);

  const addNewNode = useCallback((position: { x: number; y: number }, parentId?: string) => {
    const newNode: MindMapFlowNode = {
      id: uid(), type: 'mindmap', position,
      data: { label: 'New Idea', color: '#f6ad55', type: 'default' },
    };
    setNodes(nds => {
      const updated = [...nds, newNode];
      if (parentId) {
        setEdges(eds => {
          const newEdges = [...eds, { id: uid(), source: parentId, target: newNode.id, type: 'mindmap' }];
          saveToServer(updated, newEdges);
          return newEdges;
        });
      } else {
        saveToServer(updated, edgesRef.current);
      }
      return updated;
    });
  }, [setNodes, setEdges, saveToServer]);

  const onConnectStart: OnConnectStart = useCallback((_, { nodeId }) => {
    connectingNodeId.current = nodeId;
  }, []);

  const onConnectEnd: OnConnectEnd = useCallback((event) => {
    const target = event.target as Element;
    if (target.classList.contains('react-flow__pane') && connectingNodeId.current) {
      const position = screenToFlowPosition({
        x: (event as MouseEvent).clientX,
        y: (event as MouseEvent).clientY,
      });
      addNewNode(position, connectingNodeId.current);
    }
    connectingNodeId.current = null;
  }, [screenToFlowPosition, addNewNode]);

  const handlePaneDoubleClick = useCallback((event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest('.react-flow__node')) return;
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    addNewNode(position);
  }, [screenToFlowPosition, addNewNode]);

  // Handler for empty state button
  const handleAddFirstNode = useCallback(() => {
    const position = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    addNewNode(position);
  }, [screenToFlowPosition, addNewNode]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-[var(--muted-foreground)]">Loading mind map...</span>
        </div>
      </div>
    );
  }

  const isEmpty = nodes.length === 0;

  return (
    <div className="w-full h-full relative">
      {/* Empty state overlay */}
      {isEmpty && <EmptyState onAddNode={handleAddFirstNode} />}
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onDoubleClick={handlePaneDoubleClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodeOrigin={nodeOrigin}
        defaultEdgeOptions={defaultEdgeOptions}
        selectionMode={SelectionMode.Partial}
        zoomOnDoubleClick={false}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        deleteKeyCode="Delete"
        className="bg-[var(--background)]"
        connectionLineStyle={{ stroke: 'rgba(168, 85, 247, 0.5)', strokeWidth: 2 }}
      >
        {/* Background with subtle gradient */}
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={24} 
          size={1.5} 
          color="rgba(148, 163, 184, 0.15)" 
        />
        
        {/* MiniMap in bottom right */}
        <MiniMap 
          nodeColor={(node) => (node.data as MindMapFlowNode['data'])?.color || '#f6ad55'}
          nodeStrokeWidth={3}
          nodeBorderRadius={8}
          maskColor="rgba(0, 0, 0, 0.7)"
          className="!bg-[var(--card)] !border !border-[var(--border)] !rounded-xl !shadow-lg"
          style={{ 
            width: 150, 
            height: 100,
          }}
        />
        
        {/* Hide default controls, we use custom toolbar */}
        <Controls 
          showInteractive={false} 
          className="!bg-transparent !border-none !shadow-none [&>button]:hidden"
        />
        
        <MindMapToolbar
          nodes={nodes}
          setNodes={setNodes}
          edges={edges}
          setEdges={setEdges}
          projectId={projectId}
          addNode={addNewNode}
          saveToServer={() => saveToServer(nodesRef.current, edgesRef.current)}
          isSaving={isSaving}
        />
        
        {/* Status indicators */}
        <Panel position="bottom-left" className="!mb-2 !ml-2">
          <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
            <span>{nodes.length} node{nodes.length !== 1 ? 's' : ''}</span>
            <span className="text-[var(--border)]">•</span>
            <span>{edges.length} connection{edges.length !== 1 ? 's' : ''}</span>
          </div>
        </Panel>
        
        {isSaving && (
          <Panel position="bottom-right" className="!mb-28 !mr-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              <span className="text-xs text-[var(--muted-foreground)]">Saving...</span>
            </div>
          </Panel>
        )}
        {saveError && (
          <Panel position="bottom-right" className="!mb-28 !mr-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg">
              <span className="text-xs text-red-400">{saveError}</span>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

export function MindMapView({ projectSlug, projectId }: { projectSlug: string; projectId: string | null }) {
  return (
    <ReactFlowProvider>
      <MindMapCanvas projectSlug={projectSlug} projectId={projectId} />
    </ReactFlowProvider>
  );
}
