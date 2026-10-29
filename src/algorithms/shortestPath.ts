import type { AlgorithmTrace, PathResult, TraceStep } from '../types/algorithm';
import type { Graph } from '../types/graph';
import { bfs } from './bfs';
import { assertStartVertex } from './trace';

/** Follows parent pointers from `target` back to `source`. Returns empty arrays if unreachable. */
export function reconstructPath(
  parents: Record<string, string | null>,
  parentEdges: Record<string, string | null>,
  source: string,
  target: string,
): { path: string[]; edgeIds: string[] } {
  if (source === target) return { path: [source], edgeIds: [] };
  if (parents[target] === null || parents[target] === undefined) return { path: [], edgeIds: [] };
  const path = [target];
  const edgeIds: string[] = [];
  let cur = target;
  while (cur !== source) {
    edgeIds.push(parentEdges[cur] as string);
    cur = parents[cur] as string;
    path.push(cur);
  }
  return { path: path.reverse(), edgeIds: edgeIds.reverse() };
}

/**
 * Shortest path by NUMBER OF EDGES (hops), ignoring any weights. It runs the BFS of bfs.ts
 * from `source` (so BFS's neighbour ordering decides between equally short paths) and then
 * reads the path off the BFS tree. Time O(V + E).
 */
export function bfsShortestPath(graph: Graph, source: string, target: string): AlgorithmTrace<PathResult> {
  assertStartVertex(graph, source, 'source');
  assertStartVertex(graph, target, 'destination');
  const traversal = bfs(graph, source);
  const { parents, parentEdges, levels } = traversal.result;
  const { path, edgeIds } = reconstructPath(parents, parentEdges, source, target);
  const reachable = path.length > 0;
  const cost = reachable ? (levels[target] as number) : null;

  const last = traversal.steps[traversal.steps.length - 1];
  const finalStep: TraceStep = {
    ...last,
    index: traversal.steps.length,
    currentVertex: null,
    currentEdge: null,
    pathVertices: path,
    pathEdges: edgeIds,
    explanation: reachable
      ? source === target
        ? `The source and destination are the same vertex, so the shortest path is just [${source}] with 0 edges.`
        : `BFS reaches ${target} after ${cost} edge${cost === 1 ? '' : 's'}. Following the parent pointers back from ${target} gives the shortest path ${path.join(' → ')}.`
      : `${target} was never reached by BFS from ${source}: there is no path from ${source} to ${target}.`,
  };

  return {
    algorithm: 'bfs-shortest-path',
    title: `Shortest path (fewest edges) ${source} → ${target}`,
    steps: [...traversal.steps, finalStep],
    result: {
      source,
      target,
      reachable,
      path,
      edgeIds,
      cost,
      costKind: 'hops',
      distances: levels,
      parents,
    },
  };
}
