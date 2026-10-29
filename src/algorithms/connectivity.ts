import type { Graph } from '../types/graph';
import { buildAdjacencyList, buildUndirectedNeighbours } from './adjacency';
import { vertexIndexMap } from '../utils/graph';

/**
 * Connected components. For directed graphs this returns the WEAK components (edge
 * directions ignored). Each component lists its vertices in V order, and components are
 * ordered by their first vertex. Time O(V + E).
 */
export function connectedComponents(graph: Graph): string[][] {
  const neighbours = buildUndirectedNeighbours(graph);
  const seen = new Set<string>();
  const components: string[][] = [];
  const index = vertexIndexMap(graph);
  for (const v of graph.vertices) {
    if (seen.has(v.id)) continue;
    const comp: string[] = [];
    const queue = [v.id];
    seen.add(v.id);
    for (let head = 0; head < queue.length; head += 1) {
      const u = queue[head];
      comp.push(u);
      for (const w of neighbours.get(u) ?? []) {
        if (!seen.has(w)) {
          seen.add(w);
          queue.push(w);
        }
      }
    }
    comp.sort((a, b) => (index.get(a) as number) - (index.get(b) as number));
    components.push(comp);
  }
  return components;
}

/**
 * An undirected graph is connected iff it has exactly one component. For a directed graph
 * this tests WEAK connectivity. Convention: the empty graph (V = 0) is NOT reported as
 * connected, because it has zero components.
 */
export function isConnected(graph: Graph): boolean {
  return connectedComponents(graph).length === 1;
}

export function isolatedVertices(graph: Graph): string[] {
  const degree = new Map(graph.vertices.map((v) => [v.id, 0]));
  for (const e of graph.edges) {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
  }
  return graph.vertices.filter((v) => degree.get(v.id) === 0).map((v) => v.id);
}

/** Strongly connected components of a directed graph (Tarjan). For undirected graphs: the components. */
export function stronglyConnectedComponents(graph: Graph): string[][] {
  if (!graph.directed) return connectedComponents(graph);
  const adj = buildAdjacencyList(graph);
  const index = vertexIndexMap(graph);
  const idx = new Map<string, number>();
  const low = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const components: string[][] = [];
  let counter = 0;

  const strongConnect = (v: string): void => {
    idx.set(v, counter);
    low.set(v, counter);
    counter += 1;
    stack.push(v);
    onStack.add(v);
    for (const { to: w } of adj.get(v) ?? []) {
      if (!idx.has(w)) {
        strongConnect(w);
        low.set(v, Math.min(low.get(v) as number, low.get(w) as number));
      } else if (onStack.has(w)) {
        low.set(v, Math.min(low.get(v) as number, idx.get(w) as number));
      }
    }
    if (low.get(v) === idx.get(v)) {
      const comp: string[] = [];
      let w: string;
      do {
        w = stack.pop() as string;
        onStack.delete(w);
        comp.push(w);
      } while (w !== v);
      comp.sort((a, b) => (index.get(a) as number) - (index.get(b) as number));
      components.push(comp);
    }
  };

  for (const v of graph.vertices) if (!idx.has(v.id)) strongConnect(v.id);
  components.sort((a, b) => (index.get(a[0]) as number) - (index.get(b[0]) as number));
  return components;
}
