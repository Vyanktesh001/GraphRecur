import type { AdjacencyList, AdjacencyMatrix, Graph } from '../types/graph';
import { assertValidGraph, effectiveWeight, vertexIndexMap } from '../utils/graph';

/**
 * Adjacency list. NEIGHBOUR-ORDERING RULE (used by every algorithm in this project):
 * the neighbours of a vertex are listed in the order in which they appear in the vertex
 * list V. For a graph created with "A, B, C, D" this is alphabetical order.
 * Directed graphs list out-neighbours only.
 */
export function buildAdjacencyList(graph: Graph): AdjacencyList {
  assertValidGraph(graph);
  const index = vertexIndexMap(graph);
  const adj: AdjacencyList = new Map(graph.vertices.map((v) => [v.id, []]));
  for (const e of graph.edges) {
    const w = effectiveWeight(graph, e);
    (adj.get(e.source) ?? []).push({ to: e.target, edgeId: e.id, weight: w });
    if (!graph.directed) (adj.get(e.target) ?? []).push({ to: e.source, edgeId: e.id, weight: w });
  }
  for (const list of adj.values()) {
    list.sort((a, b) => (index.get(a.to) as number) - (index.get(b.to) as number));
  }
  return adj;
}

/** Distinct neighbours ignoring edge direction (the underlying undirected graph), in V order. */
export function buildUndirectedNeighbours(graph: Graph): Map<string, string[]> {
  assertValidGraph(graph);
  const index = vertexIndexMap(graph);
  const sets = new Map<string, Set<string>>(graph.vertices.map((v) => [v.id, new Set<string>()]));
  for (const e of graph.edges) {
    sets.get(e.source)?.add(e.target);
    sets.get(e.target)?.add(e.source);
  }
  const out = new Map<string, string[]>();
  for (const [v, s] of sets) {
    out.set(v, [...s].sort((a, b) => (index.get(a) as number) - (index.get(b) as number)));
  }
  return out;
}

export function buildAdjacencyMatrix(graph: Graph): AdjacencyMatrix {
  assertValidGraph(graph);
  const index = vertexIndexMap(graph);
  const n = graph.vertices.length;
  const fill = graph.weighted ? null : 0;
  const cells: (number | null)[][] = Array.from({ length: n }, () => Array<number | null>(n).fill(fill));
  for (const e of graph.edges) {
    const i = index.get(e.source) as number;
    const j = index.get(e.target) as number;
    const value = graph.weighted ? e.weight : 1;
    cells[i][j] = value;
    if (!graph.directed) cells[j][i] = value;
  }
  return { labels: graph.vertices.map((v) => v.id), cells, weighted: graph.weighted };
}
