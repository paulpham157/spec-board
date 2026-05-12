'use client';

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, useReactFlow, useEdges, type NodeProps } from '@xyflow/react';
import { Sparkles, Trash2, LinkIcon, Star, XCircle, AlertTriangle, Zap, Minus } from 'lucide-react';
import type { FeaturePriority } from '@/types';

// Priority configurations with glow effects
const PRIORITY_CONFIG: Record<string, { border: string; glow: string; bg: string; icon: typeof Star }> = {
  must_have: { 
    border: 'border-red-500', 
    glow: 'shadow-[0_0_15px_rgba(239,68,68,0.5)]',
    bg: 'bg-red-500',
    icon: AlertTriangle,
  },
  nice_to_have: { 
    border: 'border-amber-400', 
    glow: 'shadow-[0_0_12px_rgba(251,191,36,0.4)]',
    bg: 'bg-amber-400',
    icon: Zap,
  },
  no_need: { 
    border: 'border-slate-400', 
    glow: 'shadow-[0_0_8px_rgba(148,163,184,0.3)]',
    bg: 'bg-slate-400',
    icon: Minus,
  },
};

// Node size based on importance (connection count)
const NODE_SIZES = {
  root: 'min-w-[160px] px-6 py-4 text-base',
  parent: 'min-w-[130px] px-5 py-3 text-sm',
  leaf: 'min-w-[100px] px-4 py-2 text-sm',
};

interface MindMapNodeData {
  label: string;
  color: string;
  type: string;
  featureId?: string;
  priority?: FeaturePriority | null;
  isRoot?: boolean;
}

function MindMapNodeComponent({ id, data, selected }: NodeProps & { data: MindMapNodeData }) {
  const { setNodes } = useReactFlow();
  const edges = useEdges();
  const [isEditing, setIsEditing] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isFeature = data.type === 'feature';

  // Calculate node size based on connections (more connections = larger node)
  const outgoingEdges = edges.filter(e => e.source === id).length;
  const incomingEdges = edges.filter(e => e.target === id).length;
  const isRoot = data.isRoot || (outgoingEdges > 0 && incomingEdges === 0);
  const isParent = outgoingEdges > 0;
  const nodeSize = isRoot ? NODE_SIZES.root : isParent ? NODE_SIZES.parent : NODE_SIZES.leaf;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [contextMenu]);

  const updateLabel = useCallback((label: string) => {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, label } } : n));
  }, [id, setNodes]);

  const handleDoubleClick = useCallback(() => setIsEditing(true), []);
  const handleBlur = useCallback(() => setIsEditing(false), []);
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') setIsEditing(false);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX - e.currentTarget.getBoundingClientRect().left, y: e.clientY - e.currentTarget.getBoundingClientRect().top });
  }, []);

  const handleDelete = useCallback(() => {
    setContextMenu(null);
    setNodes(nds => nds.filter(n => n.id !== id));
  }, [id, setNodes]);

  // Get priority config
  const priorityConf = data.priority ? PRIORITY_CONFIG[data.priority] : null;
  const PriorityIcon = priorityConf?.icon;

  // Build class names
  const borderClass = selected 
    ? 'border-[var(--ring)] ring-2 ring-[var(--ring)]/30' 
    : priorityConf
      ? `${priorityConf.border} border-[3px]`
      : isFeature 
        ? 'border-[var(--foreground)]/30 border-dashed border-2' 
        : 'border-white/20 border-2';

  const glowClass = !selected && priorityConf ? priorityConf.glow : '';

  return (
    <div
      className={`relative rounded-xl text-center transition-all duration-200 ease-out 
        ${nodeSize} ${borderClass} ${glowClass}
        hover:scale-105 hover:shadow-lg
        animate-in fade-in zoom-in-95 duration-200`}
      style={{ backgroundColor: data.color }}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    >
      {/* Connection handles with better styling */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-3 !h-3 !bg-white/80 !border-2 !border-[var(--border)] hover:!bg-white hover:!scale-125 transition-all" 
      />
      
      {/* Priority badge with icon */}
      {data.priority && PriorityIcon && (
        <div 
          className={`absolute -top-3 -left-3 w-6 h-6 rounded-full flex items-center justify-center 
            ${priorityConf?.bg} shadow-md ring-2 ring-white/20
            animate-in zoom-in duration-150`}
          title={
            data.priority === 'must_have' ? 'Must Have - Critical' : 
            data.priority === 'nice_to_have' ? 'Nice to Have' : 
            'No Need'
          }
        >
          <PriorityIcon className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
        </div>
      )}
      
      {/* Feature link indicator */}
      {isFeature && (
        <div 
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-md ring-2 ring-white/20" 
          title="Linked to feature"
        >
          <LinkIcon className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
        </div>
      )}

      {/* Root node indicator */}
      {isRoot && !data.priority && (
        <div 
          className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center shadow-md" 
          title="Root node"
        >
          <Star className="w-3 h-3 text-white fill-white" />
        </div>
      )}

      {/* Label */}
      {isEditing ? (
        <input 
          ref={inputRef} 
          value={data.label}
          onChange={(e) => updateLabel(e.target.value)}
          onBlur={handleBlur} 
          onKeyDown={handleKeyDown}
          className="bg-transparent border-none outline-none text-center font-semibold w-full"
          style={{ color: 'var(--foreground)' }} 
        />
      ) : (
        <span 
          className="font-semibold select-none block truncate" 
          style={{ color: 'var(--foreground)' }}
        >
          {data.label}
        </span>
      )}

      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-3 !h-3 !bg-white/80 !border-2 !border-[var(--border)] hover:!bg-white hover:!scale-125 transition-all" 
      />

      {/* Context menu */}
      {contextMenu && (
        <div 
          className="absolute z-50 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl py-1.5 min-w-[180px] animate-in fade-in zoom-in-95 duration-150"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {!isFeature && (
            <button 
              onClick={() => setContextMenu(null)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-400" /> Convert to Feature
            </button>
          )}
          <button 
            onClick={handleDelete}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete Node
          </button>
        </div>
      )}
    </div>
  );
}

export const MindMapNode = memo(MindMapNodeComponent);
