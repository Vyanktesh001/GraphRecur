import type { MstResult } from '../types/algorithm';
import type { Edge, Graph } from '../types/graph';
import { AlgorithmError } from '../utils/errors';
import { assertValidGraph, effectiveWeight } from '../utils/graph';

/** MST algorithms are defined for undirected graphs. Negative weights ARE allowed (see ALGORITHMS.md). */
export function assertMstGraph(graph: Graph): void {
  assertValidGraph(graph);
  if (graph.directed) {
    throw new AlgorithmError(
      'Minimum spanning trees are defined for undirected graphs. Switch the graph to undirected to use Kruskal or Prim.',
    );
  }
}

export function edgeText(e: Edge, graph: Graph): string {
  return `${e.source}–${e.target} (${effectiveWeight(graph, e)})`;
}

export function buildMstResult(graph: Graph, edgeIds: string[], componentCount: number): MstResult {
  const byId = new Map(graph.edges.map((e) => [e.id, e]));
  const totalWeight = edgeIds.reduce((s, id) => s + effectiveWeight(graph, byId.get(id) as Edge), 0);
  return {
    edgeIds,
    totalWeight,
    componentCount,
    isSpanningTree: graph.vertices.length > 0 && componentCount === 1,
  };
}

export function finalMstMessage(graph: Graph, result: MstResult, algorithm: string): string {
  const n = graph.vertices.length;
  if (n === 0) return 'The graph has no vertices, so there is nothing to span.';
  const k = result.componentCount;
  const edges = result.edgeIds.length;
  if (result.isSpanningTree) {
    return `${algorithm} is finished. The minimum spanning tree has ${edges} edge${edges === 1 ? '' : 's'} (V − 1 = ${n - 1}) and total weight ${result.totalWeight}.`;
  }
  return `${algorithm} is finished. The graph is disconnected (${k} components), so no spanning tree exists. The result is a minimum spanning FOREST with V − k = ${n} − ${k} = ${edges} edges and total weight ${result.totalWeight}.`;
}
