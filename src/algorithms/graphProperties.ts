import type { Graph, VertexDegree } from '../types/graph';
import { assertValidGraph } from '../utils/graph';
import { checkBipartite, type BipartiteResult } from './bipartite';
import { connectedComponents, isolatedVertices, stronglyConnectedComponents } from './connectivity';
import { findCycle } from './cycleDetection';

/** Degree of every vertex. Undirected: deg(v). Directed: in-degree, out-degree and their sum. */
export function computeDegrees(graph: Graph): VertexDegree[] {
  assertValidGraph(graph);
  const table = new Map<string, VertexDegree>(
    graph.vertices.map((v) => [v.id, { id: v.id, degree: 0, inDegree: 0, outDegree: 0 }]),
  );
  for (const e of graph.edges) {
    const s = table.get(e.source) as VertexDegree;
    const t = table.get(e.target) as VertexDegree;
    s.outDegree += 1;
    t.inDegree += 1;
  }
  for (const d of table.values()) {
    // Every edge was counted once at its source ("out") and once at its target ("in"), so for an
    // undirected graph each incident edge of v is counted exactly once in inDegree + outDegree.
    d.degree = d.inDegree + d.outDegree;
    if (!graph.directed) {
      d.inDegree = d.degree;
      d.outDegree = d.degree;
    }
  }
  return graph.vertices.map((v) => table.get(v.id) as VertexDegree);
}

export interface GraphProperties {
  vertexCount: number;
  edgeCount: number;
  directed: boolean;
  weighted: boolean;
  degrees: VertexDegree[];
  isolatedVertices: string[];
  /** Undirected: sum of degrees vs 2|E|. Directed: sum of in-degrees, out-degrees vs |E|. */
  handshake: { sumDegrees: number; sumIn: number; sumOut: number; edgeCount: number; holds: boolean };
  /** Connected components (weak components when the graph is directed). */
  components: string[][];
  /** Undirected: connected. Directed: weakly connected. */
  isConnected: boolean;
  /** Directed graphs only. */
  stronglyConnectedComponents: string[][] | null;
  isStronglyConnected: boolean | null;
  hasCycle: boolean;
  cycle: string[] | null;
  /** Undirected graphs only (null = not applicable). Tree = connected, acyclic, V >= 1. */
  isTree: boolean | null;
  /** Directed graphs only: acyclic digraph (DAG). */
  isDag: boolean | null;
  /** Bipartiteness of the graph (edge directions ignored for directed graphs). */
  bipartite: BipartiteResult;
}

export function analyzeGraph(graph: Graph): GraphProperties {
  assertValidGraph(graph);
  const degrees = computeDegrees(graph);
  const components = connectedComponents(graph);
  const cycle = findCycle(graph);
  const sumDegrees = degrees.reduce((s, d) => s + d.degree, 0);
  const sumIn = graph.directed ? degrees.reduce((s, d) => s + d.inDegree, 0) : sumDegrees;
  const sumOut = graph.directed ? degrees.reduce((s, d) => s + d.outDegree, 0) : sumDegrees;
  const edgeCount = graph.edges.length;
  const holds = graph.directed ? sumIn === edgeCount && sumOut === edgeCount : sumDegrees === 2 * edgeCount;
  const scc = graph.directed ? stronglyConnectedComponents(graph) : null;
  const connected = components.length === 1;
  return {
    vertexCount: graph.vertices.length,
    edgeCount,
    directed: graph.directed,
    weighted: graph.weighted,
    degrees,
    isolatedVertices: isolatedVertices(graph),
    handshake: { sumDegrees, sumIn, sumOut, edgeCount, holds },
    components,
    isConnected: connected,
    stronglyConnectedComponents: scc,
    isStronglyConnected: scc ? scc.length === 1 : null,
    hasCycle: cycle !== null,
    cycle,
    isTree: graph.directed ? null : connected && cycle === null,
    isDag: graph.directed ? cycle === null : null,
    bipartite: checkBipartite(graph),
  };
}
