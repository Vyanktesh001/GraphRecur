import type { Graph } from '../types/graph';
import { buildAdjacencyList } from './adjacency';

/**
 * Finds a cycle using depth-first search and returns its vertices in cycle order (the closing
 * edge from the last back to the first vertex is implied), or null if the graph is acyclic.
 *
 * - Undirected: a cycle is a closed walk with >= 3 distinct vertices. The edge used to arrive
 *   at a vertex is not counted as a back edge (tracked by edge id).
 * - Directed: a cycle is found when DFS meets a vertex that is still on the recursion stack.
 *   Two opposite edges A->B, B->A form a directed cycle of length 2.
 * Time O(V + E).
 */
export function findCycle(graph: Graph): string[] | null {
  const adj = buildAdjacencyList(graph);
  const state = new Map<string, 'active' | 'done'>();
  const parent = new Map<string, string | null>();
  const parentEdge = new Map<string, string | null>();
  let found: string[] | null = null;

  const walkUp = (from: string, to: string): string[] => {
    const cycle = [from];
    let x = from;
    while (x !== to) {
      x = parent.get(x) as string;
      cycle.push(x);
    }
    return cycle.reverse();
  };

  const visit = (u: string): void => {
    state.set(u, 'active');
    for (const { to: w, edgeId } of adj.get(u) ?? []) {
      if (found) return;
      if (!graph.directed && edgeId === parentEdge.get(u)) continue;
      if (!state.has(w)) {
        parent.set(w, u);
        parentEdge.set(w, edgeId);
        visit(w);
      } else if (state.get(w) === 'active') {
        found = walkUp(u, w);
        return;
      }
    }
    state.set(u, 'done');
  };

  for (const v of graph.vertices) {
    if (found) break;
    if (!state.has(v.id)) {
      parent.set(v.id, null);
      parentEdge.set(v.id, null);
      visit(v.id);
    }
  }
  return found;
}

export function hasCycle(graph: Graph): boolean {
  return findCycle(graph) !== null;
}
