import type { AlgorithmKind, TraceStep } from '../types/algorithm';
import type { Graph } from '../types/graph';

export type VertexStatus = 'unvisited' | 'queued' | 'stacked' | 'current' | 'visited' | 'path' | 'colored';
export type EdgeStatus = 'default' | 'tree' | 'selected' | 'rejected' | 'path';

export interface VertexVisual {
  status: VertexStatus;
  /** Plain-text status shown next to / under the vertex (never colour alone). */
  label: string;
  /** Small marker on the vertex: visit order, distance or colour number. */
  badge?: string;
  /** 1-based colour number for coloured vertices. */
  colorIndex?: number;
  /** Extra tags such as "Source" / "Destination". */
  tags: string[];
}

export interface EdgeVisual {
  status: EdgeStatus;
  /** The edge examined in this step. */
  current: boolean;
}

export interface StepVisuals {
  vertices: Record<string, VertexVisual>;
  edges: Record<string, EdgeVisual>;
}

export interface VisualOptions {
  source?: string;
  target?: string;
}

const VISITED_LABEL: Record<AlgorithmKind, string> = {
  bfs: 'Visited',
  dfs: 'Visited (finished)',
  'bfs-shortest-path': 'Visited',
  dijkstra: 'Settled (distance final)',
  kruskal: 'Touched by a selected edge',
  prim: 'In the tree',
  coloring: 'Coloured',
};
const UNVISITED_LABEL: Record<AlgorithmKind, string> = {
  bfs: 'Unvisited',
  dfs: 'Unvisited',
  'bfs-shortest-path': 'Unvisited',
  dijkstra: 'Not settled',
  kruskal: 'Not connected yet',
  prim: 'Not in the tree',
  coloring: 'Not coloured yet',
};

/** Translates one recorded algorithm step into per-vertex / per-edge visual states. */
export function stepToVisuals(graph: Graph, algorithm: AlgorithmKind, step: TraceStep, options: VisualOptions = {}): StepVisuals {
  const visited = new Set(step.visited);
  const frontier = new Set(algorithm === 'bfs' || algorithm === 'dfs' || algorithm === 'bfs-shortest-path' ? step.frontier : []);
  const path = new Set(step.pathVertices);
  const vertices: Record<string, VertexVisual> = {};

  for (const v of graph.vertices) {
    const id = v.id;
    const tags: string[] = [];
    if (options.source === id) tags.push('Source');
    if (options.target === id) tags.push('Destination');
    let visual: VertexVisual = { status: 'unvisited', label: UNVISITED_LABEL[algorithm], tags };

    if (algorithm === 'coloring') {
      const color = step.colors?.[id];
      if (color !== undefined) visual = { status: 'colored', label: `Colour ${color}`, colorIndex: color, badge: String(color), tags };
    } else if (visited.has(id)) {
      visual = { status: 'visited', label: VISITED_LABEL[algorithm], tags };
    }
    if (frontier.has(id)) {
      visual = { status: algorithm === 'dfs' ? 'stacked' : 'queued', label: algorithm === 'dfs' ? 'On the stack' : 'In the queue', tags };
    }
    if (algorithm === 'dijkstra') {
      const d = step.distances?.[id];
      if (d !== null && d !== undefined && !visited.has(id)) visual = { status: 'queued', label: `Tentative distance ${d}`, tags };
      visual.badge = d === null || d === undefined ? '∞' : String(d);
    }
    if (path.has(id)) visual = { ...visual, status: 'path', label: `On the path${visual.badge && algorithm === 'dijkstra' ? ` (distance ${visual.badge})` : ''}` };
    if (step.currentVertex === id && algorithm !== 'coloring') {
      visual = { ...visual, status: 'current', label: `Current vertex` };
    } else if (step.currentVertex === id && algorithm === 'coloring') {
      visual = { ...visual, label: `Current vertex (colour ${visual.colorIndex ?? '?'})` };
    }
    if (algorithm === 'bfs' || algorithm === 'dfs' || algorithm === 'bfs-shortest-path') {
      const pos = step.order.indexOf(id);
      if (pos >= 0) visual.badge = String(pos + 1);
    }
    vertices[id] = visual;
  }

  const edges: Record<string, EdgeVisual> = {};
  const tree = new Set(step.treeEdges);
  const selected = new Set(step.selectedEdges);
  const rejected = new Set(step.rejectedEdges);
  const pathEdges = new Set(step.pathEdges);
  for (const e of graph.edges) {
    let status: EdgeStatus = 'default';
    if (tree.has(e.id)) status = 'tree';
    if (rejected.has(e.id)) status = 'rejected';
    if (selected.has(e.id)) status = 'selected';
    if (pathEdges.has(e.id)) status = 'path';
    edges[e.id] = { status, current: step.currentEdge === e.id };
  }
  return { vertices, edges };
}

/** All-default visuals, used by the editor and static demos. */
export function plainVisuals(graph: Graph): StepVisuals {
  return {
    vertices: Object.fromEntries(graph.vertices.map((v) => [v.id, { status: 'unvisited' as const, label: 'Vertex', tags: [] }])),
    edges: Object.fromEntries(graph.edges.map((e) => [e.id, { status: 'default' as const, current: false }])),
  };
}
