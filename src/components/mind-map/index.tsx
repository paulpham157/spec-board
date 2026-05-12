'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  SelectionMode,
  type NodeOrigin,
  type OnConnectStart,
  type OnConnectEnd,
  type OnConnect,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { MindMapNode } from './mind-map-node';
import { MindMapEdge } from './mind-map-edge';
import { MindMapToolbar } from './mind-map-toolbar';
import type { MindMapFlowNode, MindMapFlowEdge } from './types';

const nodeTypes = { mindmap: MindMapNode };
const edgeTypes = { mindmap: MindMapEdge };
const nodeOrigin: NodeOrigin = [0.5, 0.5];

function uid() { return crypto.randomUUID(); }

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

  if (isLoading) {
    return <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)]">Loading mind map...</div>;
  }

  return (
    <div className="w-full h-full relative">
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
        selectionMode={SelectionMode.Partial}
        zoomOnDoubleClick={false}
        fitView
        deleteKeyCode="Delete"
        className="bg-[var(--background)]"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border)" />
        <Controls showInteractive={false} />
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
        {isSaving && (
          <Panel position="bottom-right">
            <span className="text-xs text-[var(--muted-foreground)]">Saving...</span>
          </Panel>
        )}
        {saveError && (
          <Panel position="bottom-right">
            <span className="text-xs text-red-400">{saveError}</span>
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
