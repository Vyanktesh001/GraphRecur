/** A vertex. `x`/`y` is the top-left corner of the vertex on the canvas (purely visual). */
export interface Vertex {
  id: string;
  x: number;
  y: number;
}

/**
 * An edge. For undirected graphs the pair {source, target} is unordered; for directed
 * graphs the edge goes source -> target. `weight` is only meaningful when `graph.weighted`.
 */
export interface Edge {
  id: string;
  source: string;
  target: string;
  weight: number;
}

/**
 * A simple graph G = (V, E): no self-loops and no parallel edges
 * (a directed graph may contain both A->B and B->A).
 */
export interface Graph {
  id: string;
  name: string;
  directed: boolean;
  weighted: boolean;
  vertices: Vertex[];
  edges: Edge[];
}

export interface AdjacencyEntry {
  to: string;
  edgeId: string;
  /** Effective weight: the edge weight if the graph is weighted, otherwise 1. */
  weight: number;
}

/** Neighbours of each vertex, sorted by the position of the neighbour in V. */
export type AdjacencyList = Map<string, AdjacencyEntry[]>;

export interface AdjacencyMatrix {
  labels: string[];
  /** Unweighted: 1/0. Weighted: the weight, or null where there is no edge. */
  cells: (number | null)[][];
  weighted: boolean;
}

export interface VertexDegree {
  id: string;
  /** Undirected: number of incident edges. Directed: in-degree + out-degree. */
  degree: number;
  /** Equals `degree` for undirected graphs. */
  inDegree: number;
  /** Equals `degree` for undirected graphs. */
  outDegree: number;
}

export interface SavedGraph {
  graph: Graph;
  savedAt: string;
  lastUsedAt: string;
}
