export type AlgorithmKind =
  | 'bfs'
  | 'dfs'
  | 'bfs-shortest-path'
  | 'dijkstra'
  | 'kruskal'
  | 'prim'
  | 'coloring';

/**
 * One recorded state of an algorithm run. Every step is a full, independent snapshot, so the
 * UI can move forwards AND backwards by simply changing an index (nothing is recomputed).
 */
export interface TraceStep {
  index: number;
  explanation: string;
  currentVertex: string | null;
  /** Edge id being examined in this step. */
  currentEdge: string | null;
  /** Vertices marked visited / discovered (BFS, DFS), settled (Dijkstra) or in the tree (Prim). */
  visited: string[];
  /** Contents of the queue / stack / priority queue (display strings), front or bottom first. */
  frontier: string[];
  frontierLabel: string;
  /** Traversal order so far. */
  order: string[];
  /** Edge ids of the traversal / shortest-path tree. */
  treeEdges: string[];
  /** MST edges chosen so far. */
  selectedEdges: string[];
  rejectedEdges: string[];
  pathVertices: string[];
  pathEdges: string[];
  /** Distances (null = infinity / not yet reached). */
  distances?: Record<string, number | null>;
  parents?: Record<string, string | null>;
  /** Vertex -> colour number (1-based). */
  colors?: Record<string, number>;
  totalWeight?: number;
}

export type StepInput = Partial<Omit<TraceStep, 'index' | 'explanation'>> & { explanation: string };

export interface AlgorithmTrace<R> {
  algorithm: AlgorithmKind;
  title: string;
  steps: TraceStep[];
  result: R;
}

export interface TraversalResult {
  start: string;
  /** Order in which vertices were dequeued (BFS) / first visited (DFS). */
  order: string[];
  parents: Record<string, string | null>;
  parentEdges: Record<string, string | null>;
  /** BFS only: hop distance (level) from the start; null if unreachable. */
  levels: Record<string, number | null>;
  treeEdges: string[];
  unreachable: string[];
}

export interface PathResult {
  source: string;
  target: string;
  reachable: boolean;
  path: string[];
  edgeIds: string[];
  /** Total weight (Dijkstra) or number of edges (BFS). null if unreachable. */
  cost: number | null;
  /** 'hops' for BFS (weights ignored), 'weight' for Dijkstra. */
  costKind: 'hops' | 'weight';
  distances: Record<string, number | null>;
  parents: Record<string, string | null>;
}

export interface MstResult {
  edgeIds: string[];
  totalWeight: number;
  componentCount: number;
  /** true if the graph is connected and non-empty, so the result is a spanning tree. */
  isSpanningTree: boolean;
}

export interface ColoringResult {
  ordering: 'given' | 'degree';
  order: string[];
  colors: Record<string, number>;
  colorCount: number;
  isProper: boolean;
  /** Exact chromatic number, only when the graph is small enough to compute it. */
  chromaticNumber: number | null;
}
