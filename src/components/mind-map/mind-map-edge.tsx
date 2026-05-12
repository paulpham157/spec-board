'use client';

import { memo } from 'react';
import { BaseEdge, getBezierPath, type EdgeProps, EdgeLabelRenderer } from '@xyflow/react';

function MindMapEdgeComponent(props: EdgeProps) {
  const { 
    id,
    sourceX, 
    sourceY, 
    targetX, 
    targetY,
    sourcePosition,
    targetPosition,
    selected,
    markerEnd,
  } = props;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.25,
  });

  return (
    <>
      {/* Animated gradient line */}
      <defs>
        <linearGradient id={`gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(168, 85, 247, 0.8)" />
          <stop offset="50%" stopColor="rgba(236, 72, 153, 0.8)" />
          <stop offset="100%" stopColor="rgba(251, 146, 60, 0.8)" />
        </linearGradient>
      </defs>
      
      {/* Shadow/glow effect underneath */}
      <path
        d={edgePath}
        fill="none"
        stroke="rgba(168, 85, 247, 0.2)"
        strokeWidth={selected ? 8 : 4}
        className="transition-all duration-200"
      />
      
      {/* Main edge path */}
      <BaseEdge 
        id={id}
        path={edgePath} 
        style={{
          stroke: selected ? `url(#gradient-${id})` : 'rgba(148, 163, 184, 0.6)',
          strokeWidth: selected ? 3 : 2,
          strokeLinecap: 'round',
          transition: 'all 0.2s ease',
        }}
        markerEnd={markerEnd}
      />
      
      {/* Animated flow dots */}
      <circle r="3" fill="rgba(168, 85, 247, 0.8)">
        <animateMotion
          dur="2s"
          repeatCount="indefinite"
          path={edgePath}
        />
      </circle>
      
      {/* Connection indicator on hover/select */}
      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="w-4 h-4 bg-violet-500 rounded-full border-2 border-white shadow-lg animate-pulse"
          />
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const MindMapEdge = memo(MindMapEdgeComponent);
