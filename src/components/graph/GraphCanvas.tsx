import { useCallback, useEffect, useMemo, type MouseEvent as ReactMouseEvent } from 'react';
import {
  Background,
  BackgroundVariant,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useInternalNode,
  useReactFlow,
  ConnectionMode,
  type Connection,
  type Edge as RFEdge,
  type EdgeChange,
  type EdgeProps,
  type Node as RFNode,
  type NodeChange,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Graph } from '../../types/graph';
import { moveVertex, NODE_SIZE } from '../../utils/graph';
import { formatNumber } from '../../utils/format';
import type { EdgeStatus, StepVisuals, VertexStatus, VertexVisual } from '../../utils/stepVisuals';

export interface CanvasSelection {
  vertices: string[];
  edges: string[];
}

export const EMPTY_SELECTION: CanvasSelection = { vertices: [], edges: [] };

/** Pastel palette for graph colouring; the colour NUMBER is always printed on the vertex too. */
export const COLOR_PALETTE = ['#fca5a5', '#fcd34d', '#86efac', '#93c5fd', '#c4b5fd', '#f9a8d4', '#fdba74', '#5eead4', '#a5b4fc', '#d9f99d'];
export const colorFor = (index: number) => COLOR_PALETTE[(index - 1) % COLOR_PALETTE.length];

interface VertexNodeData extends Record<string, unknown> {
  label: string;
  visual: VertexVisual;
  showStatusText: boolean;
  editable: boolean;
}
type VertexNode = RFNode<VertexNodeData, 'vertex'>;

interface GraphEdgeData extends Record<string, unknown> {
  weightText: string | null;
  directed: boolean;
  status: EdgeStatus;
  current: boolean;
  /** Perpendicular shift (px) so that A→B and B→A do not overlap. */
  offset: number;
}
type GraphEdgeType = RFEdge<GraphEdgeData, 'graph'>;

const NODE_STYLES: Record<VertexStatus, string> = {
  unvisited: 'border-slate-400 bg-white text-slate-800',
  queued: 'border-blue-600 border-dashed bg-blue-50 text-navy-900',
  stacked: 'border-blue-600 border-dashed bg-blue-50 text-navy-900',
  visited: 'border-navy-700 bg-blue-200 text-navy-950',
  current: 'border-amber-400 bg-navy-800 text-white ring-4 ring-amber-300/60',
  path: 'border-emerald-700 bg-emerald-200 text-emerald-950',
  colored: 'border-slate-700 text-slate-900',
};

function VertexNodeView({ data, selected }: NodeProps<VertexNode>) {
  const { visual } = data;
  const style = visual.status === 'colored' && visual.colorIndex ? { backgroundColor: colorFor(visual.colorIndex) } : undefined;
  return (
    <div
      className={`relative flex items-center justify-center rounded-full border-2 text-sm font-bold ${NODE_STYLES[visual.status]} ${
        selected ? 'outline-3 outline-offset-2 outline-blue-500' : ''
      }`}
      style={{ width: NODE_SIZE, height: NODE_SIZE, ...style }}
      title={`${data.label}: ${visual.label}${visual.tags.length ? ` (${visual.tags.join(', ')})` : ''}`}
    >
      <span className="max-w-[40px] truncate">{data.label}</span>
      {visual.badge && (
        <span className="absolute -right-2 -top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full border border-slate-500 bg-white px-1 text-[10px] font-semibold text-slate-800">
          {visual.badge}
        </span>
      )}
      {data.showStatusText && (
        <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-white/90 px-1 text-[10px] font-medium text-slate-700">
          {visual.tags.length > 0 ? `${visual.tags.join('/')} · ` : ''}
          {visual.label}
        </span>
      )}
      {/* Tiny invisible target handle at the centre: React Flow snaps a dropped connection to the nearest handle within connectionRadius. */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectableStart={false}
        isConnectable={data.editable}
        style={{ width: 2, height: 2, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0, border: 'none', minWidth: 0, minHeight: 0 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={data.editable}
        aria-label={`Drag from vertex ${data.label} to another vertex to add an edge`}
        style={data.editable ? { width: 12, height: 12, right: -6, background: '#1f3d6e', border: '2px solid white' } : { opacity: 0, width: 1, height: 1, pointerEvents: 'none' }}
      />
    </div>
  );
}

const EDGE_STROKE: Record<EdgeStatus, { color: string; width: number; dash?: string }> = {
  default: { color: '#64748b', width: 2 },
  tree: { color: '#2563eb', width: 3.5 },
  selected: { color: '#047857', width: 4 },
  rejected: { color: '#dc2626', width: 2, dash: '6 5' },
  path: { color: '#c2410c', width: 4.5 },
};
const EDGE_STATUS_TEXT: Record<EdgeStatus, string> = {
  default: '',
  tree: 'tree edge',
  selected: 'selected',
  rejected: 'rejected',
  path: 'on path',
};

function GraphEdgeView({ source, target, markerEnd, data, selected }: EdgeProps<GraphEdgeType>) {
  const s = useInternalNode(source);
  const t = useInternalNode(target);
  if (!s || !t || !data) return null;
  const R = NODE_SIZE / 2;
  const sx = s.internals.positionAbsolute.x + R;
  const sy = s.internals.positionAbsolute.y + R;
  const tx = t.internals.positionAbsolute.x + R;
  const ty = t.internals.positionAbsolute.y + R;
  const len = Math.hypot(tx - sx, ty - sy) || 1;
  const ux = (tx - sx) / len;
  const uy = (ty - sy) / len;
  const px = -uy * data.offset;
  const py = ux * data.offset;
  const x1 = sx + ux * (R + 1) + px;
  const y1 = sy + uy * (R + 1) + py;
  const x2 = tx - ux * (R + (data.directed ? 3 : 1)) + px;
  const y2 = ty - uy * (R + (data.directed ? 3 : 1)) + py;
  const stroke = EDGE_STROKE[data.status];
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const statusText = EDGE_STATUS_TEXT[data.status];
  const label = [data.weightText, statusText && !data.weightText ? statusText : ''].filter(Boolean).join(' ');

  return (
    <>
      {data.current && <path d={`M${x1},${y1} L${x2},${y2}`} stroke="#f59e0b" strokeWidth={stroke.width + 7} strokeOpacity={0.4} strokeLinecap="round" fill="none" />}
      <BaseEdge
        path={`M${x1},${y1} L${x2},${y2}`}
        markerEnd={markerEnd}
        interactionWidth={22}
        style={{
          stroke: selected ? '#1d4ed8' : stroke.color,
          strokeWidth: selected ? stroke.width + 1.5 : stroke.width,
          strokeDasharray: stroke.dash,
        }}
      />
      {(label || statusText) && (
        <EdgeLabelRenderer>
          <div
            style={{ transform: `translate(-50%, -50%) translate(${mx}px, ${my}px)` }}
            className="nodrag nopan pointer-events-none absolute whitespace-nowrap rounded border border-slate-300 bg-white px-1 text-[11px] font-semibold text-slate-800"
          >
            {data.weightText ?? ''}
            {data.weightText && statusText ? ' · ' : ''}
            {statusText}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const nodeTypes = { vertex: VertexNodeView };
const edgeTypes = { graph: GraphEdgeView };

interface GraphCanvasProps {
  graph: Graph;
  visuals: StepVisuals;
  /** Allows selecting, deleting, connecting and double-click-to-add. */
  editable?: boolean;
  /** Called when vertices are dragged or deleted. */
  onGraphChange?: (updater: (g: Graph) => Graph) => void;
  onConnectVertices?: (source: string, target: string) => void;
  onAddVertexAt?: (position: { x: number; y: number }) => void;
  onDeleteSelection?: (selection: CanvasSelection) => void;
  selection?: CanvasSelection;
  onSelectionChange?: (updater: (s: CanvasSelection) => CanvasSelection) => void;
  showStatusText?: boolean;
  className?: string;
  ariaLabel?: string;
}

function CanvasInner({
  graph,
  visuals,
  editable = false,
  onGraphChange,
  onConnectVertices,
  onAddVertexAt,
  onDeleteSelection,
  selection = EMPTY_SELECTION,
  onSelectionChange,
  showStatusText = false,
  className = 'h-[420px]',
  ariaLabel = 'Graph drawing',
}: GraphCanvasProps) {
  const { fitView, screenToFlowPosition } = useReactFlow();

  const nodes = useMemo<VertexNode[]>(
    () =>
      graph.vertices.map((v) => ({
        id: v.id,
        type: 'vertex',
        position: { x: v.x, y: v.y },
        width: NODE_SIZE,
        height: NODE_SIZE,
        selected: selection.vertices.includes(v.id),
        selectable: editable,
        data: {
          label: v.id,
          visual: visuals.vertices[v.id] ?? { status: 'unvisited', label: 'Vertex', tags: [] },
          showStatusText,
          editable,
        },
      })),
    [graph.vertices, visuals.vertices, selection.vertices, showStatusText, editable],
  );

  const edges = useMemo<GraphEdgeType[]>(() => {
    const pairs = new Set(graph.edges.map((e) => `${e.source}>${e.target}`));
    return graph.edges.map((e) => {
      const visual = visuals.edges[e.id] ?? { status: 'default' as const, current: false };
      const hasReverse = graph.directed && pairs.has(`${e.target}>${e.source}`);
      const color = EDGE_STROKE[visual.status].color;
      return {
        id: e.id,
        type: 'graph',
        source: e.source,
        target: e.target,
        selected: selection.edges.includes(e.id),
        selectable: editable,
        markerEnd: graph.directed ? { type: MarkerType.ArrowClosed, color, width: 16, height: 16 } : undefined,
        data: {
          weightText: graph.weighted ? formatNumber(e.weight) : null,
          directed: graph.directed,
          status: visual.status,
          current: visual.current,
          offset: hasReverse ? 7 : 0,
        },
      };
    });
  }, [graph.edges, graph.directed, graph.weighted, visuals.edges, selection.edges, editable]);

  const onNodesChange = useCallback(
    (changes: NodeChange<VertexNode>[]) => {
      let selectionChanged = false;
      const selected = new Set(selection.vertices);
      for (const c of changes) {
        if (c.type === 'position' && c.position && onGraphChange) {
          const { x, y } = c.position;
          onGraphChange((g) => moveVertex(g, c.id, x, y));
        } else if (c.type === 'select') {
          selectionChanged = true;
          if (c.selected) selected.add(c.id);
          else selected.delete(c.id);
        }
      }
      if (selectionChanged && onSelectionChange) onSelectionChange((s) => ({ ...s, vertices: [...selected] }));
    },
    [onGraphChange, onSelectionChange, selection.vertices],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<GraphEdgeType>[]) => {
      let selectionChanged = false;
      const selected = new Set(selection.edges);
      for (const c of changes) {
        if (c.type === 'select') {
          selectionChanged = true;
          if (c.selected) selected.add(c.id);
          else selected.delete(c.id);
        }
      }
      if (selectionChanged && onSelectionChange) onSelectionChange((s) => ({ ...s, edges: [...selected] }));
    },
    [onSelectionChange, selection.edges],
  );

  const onConnect = useCallback(
    (c: Connection) => {
      if (c.source && c.target) onConnectVertices?.(c.source, c.target);
    },
    [onConnectVertices],
  );

  const onDoubleClick = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (!editable || !onAddVertexAt) return;
      if (!(e.target as HTMLElement).classList.contains('react-flow__pane')) return;
      const p = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      onAddVertexAt({ x: p.x - NODE_SIZE / 2, y: p.y - NODE_SIZE / 2 });
    },
    [editable, onAddVertexAt, screenToFlowPosition],
  );

  // Keep new vertices in view (only when the number of vertices changes).
  const vertexCount = graph.vertices.length;
  useEffect(() => {
    const id = window.setTimeout(() => void fitView({ padding: 0.25, duration: 200, maxZoom: 1.25 }), 30);
    return () => window.clearTimeout(id);
  }, [vertexCount, fitView]);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl border border-slate-200 bg-white ${className}`}
      role="group"
      aria-label={ariaLabel}
      onDoubleClick={onDoubleClick}
    >
      <ReactFlow<VertexNode, GraphEdgeType>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={({ nodes: n, edges: e }) => onDeleteSelection?.({ vertices: n.map((x) => x.id), edges: e.map((x) => x.id) })}
        deleteKeyCode={editable ? ['Delete', 'Backspace'] : null}
        connectionMode={ConnectionMode.Loose}
        connectionRadius={40}
        nodesConnectable={editable}
        elementsSelectable={editable}
        zoomOnDoubleClick={false}
        fitView
        fitViewOptions={{ padding: 0.25, maxZoom: 1.25 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color="#cbd5e1" />
        <Controls showInteractive={false} aria-label="Zoom controls" />
      </ReactFlow>
      {graph.vertices.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-slate-500">
          This graph has no vertices yet. {editable ? 'Add some with the controls, or double-click the canvas.' : 'Add vertices in the Graph Explorer.'}
        </div>
      )}
    </div>
  );
}

export function GraphCanvas(props: GraphCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner key={props.graph.id} {...props} />
    </ReactFlowProvider>
  );
}
