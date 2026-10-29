import type { Graph } from '../types/graph';
import { buildUndirectedNeighbours } from './adjacency';

export interface BipartiteResult {
  isBipartite: boolean;
  /** The two sides (each in V order) when bipartite, otherwise null. */
  partition: [string[], string[]] | null;
  /** When not bipartite: two adjacent vertices that received the same side (they lie on an odd cycle). */
  conflict: [string, string] | null;
}

/**
 * BFS 2-colouring of the underlying undirected graph (edge directions are ignored).
 * A graph is bipartite iff it has no odd cycle iff this colouring succeeds.
 * The empty graph and graphs without edges are bipartite. Time O(V + E).
 */
export function checkBipartite(graph: Graph): BipartiteResult {
  const neighbours = buildUndirectedNeighbours(graph);
  const side = new Map<string, 0 | 1>();
  for (const start of graph.vertices) {
    if (side.has(start.id)) continue;
    side.set(start.id, 0);
    const queue = [start.id];
    for (let head = 0; head < queue.length; head += 1) {
      const u = queue[head];
      for (const w of neighbours.get(u) ?? []) {
        if (!side.has(w)) {
          side.set(w, side.get(u) === 0 ? 1 : 0);
          queue.push(w);
        } else if (side.get(w) === side.get(u)) {
          return { isBipartite: false, partition: null, conflict: [u, w] };
        }
      }
    }
  }
  const left = graph.vertices.filter((v) => side.get(v.id) === 0).map((v) => v.id);
  const right = graph.vertices.filter((v) => side.get(v.id) === 1).map((v) => v.id);
  return { isBipartite: true, partition: [left, right], conflict: null };
}
