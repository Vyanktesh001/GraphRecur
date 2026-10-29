import type { AlgorithmTrace, TraversalResult } from '../types/algorithm';
import type { Graph } from '../types/graph';
import { edgeLabel } from '../utils/graph';
import { buildAdjacencyList } from './adjacency';
import { assertStartVertex, listText, TraceBuilder, vertexRecord } from './trace';

/**
 * Breadth-first search from `start` using a FIFO queue. Neighbours are explored in V order
 * (see buildAdjacencyList). Only vertices reachable from `start` are visited.
 * A vertex is marked "visited" when it is first discovered (enqueued), which guarantees it
 * is enqueued at most once. Time O(V + E) with the adjacency list.
 */
export function bfs(graph: Graph, start: string): AlgorithmTrace<TraversalResult> {
  assertStartVertex(graph, start);
  const adj = buildAdjacencyList(graph);
  const tb = new TraceBuilder();

  const visited: string[] = [start];
  const seen = new Set<string>([start]);
  const parents = vertexRecord<string | null>(graph, null);
  const parentEdges = vertexRecord<string | null>(graph, null);
  const levels = vertexRecord<number | null>(graph, null);
  levels[start] = 0;
  const queue: string[] = [start];
  const order: string[] = [];
  const treeEdges: string[] = [];
  let head = 0;

  const snap = (explanation: string, currentVertex: string | null, currentEdge: string | null = null) =>
    tb.add({
      explanation,
      currentVertex,
      currentEdge,
      visited,
      frontier: queue.slice(head),
      frontierLabel: 'Queue (front → back)',
      order,
      treeEdges,
      distances: levels,
      parents,
    });

  snap(`Start: mark ${start} as visited and enqueue it. Queue = [${start}].`, start);

  while (head < queue.length) {
    const u = queue[head];
    head += 1;
    order.push(u);
    const neighbours = (adj.get(u) ?? []).map((n) => n.to);
    snap(
      `Dequeue ${u} and process it. Its neighbours in order: ${listText(neighbours)}.`,
      u,
    );
    for (const { to: v, edgeId } of adj.get(u) ?? []) {
      const e = edgeLabel(graph, u, v);
      if (!seen.has(v)) {
        seen.add(v);
        visited.push(v);
        parents[v] = u;
        parentEdges[v] = edgeId;
        levels[v] = (levels[u] as number) + 1;
        treeEdges.push(edgeId);
        queue.push(v);
        snap(`Edge ${e}: ${v} is not visited yet → mark it visited, set parent(${v}) = ${u}, enqueue it.`, u, edgeId);
      } else {
        snap(`Edge ${e}: ${v} is already visited → ignore it.`, u, edgeId);
      }
    }
  }

  const unreachable = graph.vertices.filter((v) => !seen.has(v.id)).map((v) => v.id);
  snap(
    unreachable.length === 0
      ? `The queue is empty: BFS is finished. All ${visited.length} vertices were visited. Order: ${order.join(' → ')}.`
      : `The queue is empty: BFS is finished. ${visited.length} vertices were reached; ${listText(unreachable)} cannot be reached from ${start}. Order: ${order.join(' → ')}.`,
    null,
  );

  return {
    algorithm: 'bfs',
    title: `Breadth-First Search from ${start}`,
    steps: tb.steps,
    result: { start, order: [...order], parents, parentEdges, levels, treeEdges: [...treeEdges], unreachable },
  };
}
