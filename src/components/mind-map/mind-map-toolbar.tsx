'use client';

import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Plus, Trash2, Save, Sparkles, ZoomIn, ZoomOut, Maximize2, Palette, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import type { MindMapFlowNode, MindMapFlowEdge } from './types';

// Extended color palette with named colors
const NODE_COLORS = [
  { value: '#f6ad55', name: 'Orange', category: 'warm' },
  { value: '#fc8181', name: 'Red', category: 'warm' },
  { value: '#f687b3', name: 'Pink', category: 'warm' },
  { value: '#68d391', name: 'Green', category: 'cool' },
  { value: '#4fd1c5', name: 'Teal', category: 'cool' },
  { value: '#63b3ed', name: 'Blue', category: 'cool' },
  { value: '#7f9cf5', name: 'Indigo', category: 'cool' },
  { value: '#b794f4', name: 'Purple', category: 'cool' },
  { value: '#a0aec0', name: 'Gray', category: 'neutral' },
  { value: '#faf089', name: 'Yellow', category: 'warm' },
];

interface MindMapToolbarProps {
  nodes: MindMapFlowNode[];
  setNodes: Dispatch<SetStateAction<MindMapFlowNode[]>>;
  edges: MindMapFlowEdge[];
  setEdges: Dispatch<SetStateAction<MindMapFlowEdge[]>>;
  projectId: string | null;
  addNode: (position: { x: number; y: number }) => void;
  saveToServer: () => void;
  isSaving: boolean;
}

export function MindMapToolbar({ nodes, setNodes, edges, setEdges, projectId, addNode, saveToServer, isSaving }: MindMapToolbarProps) {
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow();
  const [showColorPicker, setShowColorPicker] = useState(false);

  const selectedNodes = nodes.filter(n => n.selected);
  const selectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;
  const hasSelection = selectedNodes.length > 0;
  const canConvert = hasSelection && selectedNodes.some(n => n.data.type !== 'feature') && !!projectId;

  const handleAddNode = useCallback(() => {
    const position = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    addNode(position);
  }, [addNode, screenToFlowPosition]);

  const handleDelete = useCallback(() => {
    const ids = new Set(selectedNodes.map(n => n.id));
    setNodes(nds => nds.filter(n => !ids.has(n.id)));
    setEdges(eds => eds.filter(e => !ids.has(e.source) && !ids.has(e.target)));
  }, [selectedNodes, setNodes, setEdges]);

  const handleColorChange = useCallback((color: string) => {
    const ids = new Set(selectedNodes.map(n => n.id));
    setNodes(nds => nds.map(n => ids.has(n.id) ? { ...n, data: { ...n.data, color } } : n));
    setShowColorPicker(false);
  }, [selectedNodes, setNodes]);

  const handleConvert = useCallback(async () => {
    if (!canConvert || !projectId) return;
    const convertible = selectedNodes.filter(n => n.data.type !== 'feature');
    if (convertible.length === 0) return;

    const primary = convertible[0];
    const children = convertible.slice(1);
    const description = children.length > 0
      ? children.map(n => `- ${n.data.label}`).join('\n')
      : primary.data.label;

    try {
      const res = await fetch('/api/features/backlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, name: primary.data.label, description }),
      });
      if (!res.ok) { toast.error('Failed to create feature'); return; }
      const data = await res.json();
      const featureId = data.featureIdDb || data.featureId || data.id;

      const ids = new Set(convertible.map(n => n.id));
      setNodes(nds => nds.map(n => ids.has(n.id) ? { ...n, data: { ...n.data, type: 'feature', featureId } } : n));
      toast.success('Feature created from mind map');
    } catch { toast.error('Failed to create feature'); }
  }, [canConvert, projectId, selectedNodes, setNodes]);

  const handleZoomIn = useCallback(() => zoomIn({ duration: 200 }), [zoomIn]);
  const handleZoomOut = useCallback(() => zoomOut({ duration: 200 }), [zoomOut]);
  const handleFitView = useCallback(() => fitView({ padding: 0.2, duration: 300 }), [fitView]);

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
      {/* Main toolbar */}
      <div className="flex items-center gap-1 bg-[var(--card)] border border-[var(--border)] rounded-xl p-1.5 shadow-lg backdrop-blur-sm">
        <button onClick={handleAddNode} className="btn-icon hover:bg-emerald-500/20 hover:text-emerald-400" title="Add node (double-click canvas)">
          <Plus className="w-4 h-4" />
        </button>
        <button onClick={handleDelete} className="btn-icon hover:bg-red-500/20 hover:text-red-400" disabled={!hasSelection} title="Delete selected">
          <Trash2 className="w-4 h-4" />
        </button>
        
        <div className="w-px h-5 bg-[var(--border)] mx-0.5" />
        
        {/* Zoom controls */}
        <button onClick={handleZoomOut} className="btn-icon" title="Zoom out">
          <ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={handleZoomIn} className="btn-icon" title="Zoom in">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={handleFitView} className="btn-icon" title="Fit to view">
          <Maximize2 className="w-4 h-4" />
        </button>

        {canConvert && (
          <>
            <div className="w-px h-5 bg-[var(--border)] mx-0.5" />
            <button onClick={handleConvert} className="btn-icon hover:bg-amber-500/20 hover:text-amber-400" title={selectedNodes.length > 1 ? 'Convert group to feature' : 'Convert to feature'}>
              <Sparkles className="w-4 h-4" />
            </button>
          </>
        )}
        
        <div className="w-px h-5 bg-[var(--border)] mx-0.5" />
        
        <button 
          onClick={saveToServer} 
          className={`btn-icon ${isSaving ? 'animate-pulse' : ''}`} 
          disabled={isSaving} 
          title="Save"
        >
          <Save className="w-4 h-4" />
        </button>
      </div>

      {/* Color picker - shown when node selected */}
      {hasSelection && (
        <div className="relative">
          <button 
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] rounded-xl px-3 py-2 shadow-lg backdrop-blur-sm hover:bg-[var(--secondary)] transition-colors"
          >
            <Palette className="w-4 h-4" />
            <span className="text-xs font-medium">Color</span>
            <div 
              className="w-4 h-4 rounded-full border border-white/20" 
              style={{ backgroundColor: selectedNode?.data.color || '#f6ad55' }} 
            />
            <ChevronDown className={`w-3 h-3 transition-transform ${showColorPicker ? 'rotate-180' : ''}`} />
          </button>
          
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-2 bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 shadow-xl backdrop-blur-sm animate-in fade-in zoom-in-95 duration-150 min-w-[200px]">
              {/* Warm colors */}
              <div className="mb-2">
                <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] mb-1.5 block">Warm</span>
                <div className="flex gap-1.5">
                  {NODE_COLORS.filter(c => c.category === 'warm').map(color => (
                    <button 
                      key={color.value} 
                      onClick={() => handleColorChange(color.value)}
                      className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 hover:shadow-md ${
                        selectedNode?.data.color === color.value 
                          ? 'border-white ring-2 ring-white/30 scale-110' 
                          : 'border-white/20'
                      }`}
                      style={{ backgroundColor: color.value }} 
                      title={color.name} 
                    />
                  ))}
                </div>
              </div>
              
              {/* Cool colors */}
              <div className="mb-2">
                <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] mb-1.5 block">Cool</span>
                <div className="flex gap-1.5">
                  {NODE_COLORS.filter(c => c.category === 'cool').map(color => (
                    <button 
                      key={color.value} 
                      onClick={() => handleColorChange(color.value)}
                      className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 hover:shadow-md ${
                        selectedNode?.data.color === color.value 
                          ? 'border-white ring-2 ring-white/30 scale-110' 
                          : 'border-white/20'
                      }`}
                      style={{ backgroundColor: color.value }} 
                      title={color.name} 
                    />
                  ))}
                </div>
              </div>
              
              {/* Neutral */}
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] mb-1.5 block">Neutral</span>
                <div className="flex gap-1.5">
                  {NODE_COLORS.filter(c => c.category === 'neutral').map(color => (
                    <button 
                      key={color.value} 
                      onClick={() => handleColorChange(color.value)}
                      className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 hover:shadow-md ${
                        selectedNode?.data.color === color.value 
                          ? 'border-white ring-2 ring-white/30 scale-110' 
                          : 'border-white/20'
                      }`}
                      style={{ backgroundColor: color.value }} 
                      title={color.name} 
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
