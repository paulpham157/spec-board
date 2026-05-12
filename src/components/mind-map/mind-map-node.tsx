'use client';

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react';
import { Sparkles, Trash2, LinkIcon, Star, XCircle } from 'lucide-react';
import type { FeaturePriority } from '@/types';

// Priority border colors
const PRIORITY_BORDERS: Record<string, string> = {
  must_have: 'border-red-500',
  nice_to_have: 'border-yellow-500',
  no_need: 'border-gray-500',
};

// Priority icons
const PRIORITY_ICONS: Record<string, typeof Star> = {
  must_have: Star,
  nice_to_have: Sparkles,
  no_need: XCircle,
};

interface MindMapNodeData {
  label: string;
  color: string;
  type: string;
  featureId?: string;
  priority?: FeaturePriority | null;
}

function MindMapNodeComponent({ id, data, selected }: NodeProps & { data: MindMapNodeData }) {
  const { setNodes } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isFeature = data.type === 'feature';

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

  // Determine border class based on priority or selection
  const priorityBorder = data.priority ? PRIORITY_BORDERS[data.priority] : '';
  const PriorityIcon = data.priority ? PRIORITY_ICONS[data.priority] : null;

  return (
    <div
      className={`relative px-4 py-2 rounded-lg border-2 shadow-sm min-w-[100px] text-center transition-all ${
        selected 
          ? 'border-[var(--ring)] shadow-md' 
          : priorityBorder
            ? priorityBorder
            : isFeature 
              ? 'border-[var(--foreground)]/30 border-dashed' 
              : 'border-transparent'
      }`}
      style={{ backgroundColor: data.color }}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-[var(--muted-foreground)]" />
      
      {/* Priority icon indicator */}
      {data.priority && PriorityIcon && (
        <div 
          className={`absolute -top-2 -left-2 w-5 h-5 rounded-full flex items-center justify-center ${
            data.priority === 'must_have' ? 'bg-red-500' :
            data.priority === 'nice_to_have' ? 'bg-yellow-500' :
            'bg-gray-500'
          }`}
          title={data.priority === 'must_have' ? 'Must Have' : data.priority === 'nice_to_have' ? 'Nice to Have' : 'No Need'}
        >
          <PriorityIcon className="w-3 h-3 text-white" />
        </div>
      )}
      
      {/* Feature link indicator */}
      {isFeature && (
        <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[var(--foreground)] flex items-center justify-center" title="Linked to feature">
          <LinkIcon className="w-3 h-3 text-[var(--background)]" />
        </div>
      )}
      {isEditing ? (
        <input ref={inputRef} value={data.label}
          onChange={(e) => updateLabel(e.target.value)}
          onBlur={handleBlur} onKeyDown={handleKeyDown}
          className="bg-transparent border-none outline-none text-center text-sm font-medium w-full"
          style={{ color: 'var(--foreground)' }} />
      ) : (
        <span className="text-sm font-medium select-none" style={{ color: 'var(--foreground)' }}>{data.label}</span>
      )}
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-[var(--muted-foreground)]" />
      {contextMenu && (
        <div className="absolute z-50 bg-[var(--card)] border border-[var(--border)] rounded-md shadow-lg py-1 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}>
          {!isFeature && (
            <button onClick={() => setContextMenu(null)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors">
              <Sparkles className="w-3.5 h-3.5" /> Convert to Feature
            </button>
          )}
          <button onClick={handleDelete}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-[var(--secondary)] transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export const MindMapNode = memo(MindMapNodeComponent);
