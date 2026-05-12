# Mind Map Directory

## Purpose
Interactive mind map brainstorming tool using React Flow (@xyflow/react).

## Overview
Provides a visual mind map for brainstorming feature ideas within a project. Nodes and edges are persisted to the database (MindMapNode, MindMapEdge models). Users can create, edit, move, and delete nodes with colored labels.

## Key Files

| File | Purpose |
|------|---------|
| `index.tsx` | Main MindMap component with React Flow canvas |
| `mind-map-node.tsx` | Custom node component (editable label, color) |
| `mind-map-edge.tsx` | Custom edge component with labels |
| `mind-map-store.ts` | Zustand store for mind map state |
| `mind-map-toolbar.tsx` | Toolbar with add/delete/color actions |
| `types.ts` | Flow node/edge type definitions |

## Architecture

```
MindMap (index.tsx)
├── ReactFlow canvas
│   ├── MindMapNode (custom node)
│   └── MindMapEdge (custom edge)
├── MindMapToolbar
└── MindMapStore (Zustand)
```

## Types

```typescript
type MindMapFlowNode = Node<{ label: string; color: string; type: string; featureId?: string }>;
type MindMapFlowEdge = Edge<{ label?: string }>;
```

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/projects/[name]/mind-map` | Load all nodes and edges |
| POST | `/api/projects/[name]/mind-map/nodes` | Create node |
| PATCH | `/api/projects/[name]/mind-map/nodes/[id]` | Update node |
| DELETE | `/api/projects/[name]/mind-map/nodes/[id]` | Delete node |
| POST | `/api/projects/[name]/mind-map/edges` | Create edge |
| DELETE | `/api/projects/[name]/mind-map/edges/[id]` | Delete edge |

## Patterns & Conventions

- Uses `@xyflow/react` (React Flow v12) for the canvas
- Zustand store manages local node/edge state
- Changes are persisted to database via API calls
- Custom node rendering with editable text
- Color picker for node customization

## Dependencies

- **Internal**: `@/types` (MindMapNodeData, MindMapEdgeData)
- **External**: `@xyflow/react`, `zustand`, `lucide-react`
