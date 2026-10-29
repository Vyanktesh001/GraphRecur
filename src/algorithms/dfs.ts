import type { AlgorithmTrace, TraversalResult } from '../types/algorithm';
import type { Graph } from '../types/graph';
import { edgeLabel } from '../utils/graph';
import { buildAdjacencyList } from './adjacency';
import { assertStartVertex, listText, TraceBuilder, vertexRecord } from './trace';

/**
 * Recursive depth-first search from `start`. Neighbours are explored in V order
 * (see buildAdjacencyList), so the result is deterministic. Only vertices reachable from
 * `start` are visited. The "stack" shown in each step is the recursion stack (the current
 * path from `start`). Time O(V + E) with the adjacency list.
 */
export function dfs(graph: Graph, start: string): AlgorithmTrace<TraversalResult> {
  assertStartVertex(graph, start);
  const adj = buildAdjacencyList(graph);
  const tb = new TraceBuilder();

  const visited: string[] = [];
  const seen = new Set<string>();
  const stack: string[] = [];
  const order: string[] = [];
  const treeEdges: string[] = [];
  const parents = vertexRecord<string | null>(graph, null);
  const parentEdges = vertexRecord<string | null>(graph, null);

  const snap = (explanation: string, currentVertex: string | null, currentEdge: string | null = null) =>
    tb.add({
      explanation,
      currentVertex,
      currentEdge,
      visited,
      frontier: stack,
      frontierLabel: 'Recursion stack (bottom → top)',
      order,
      treeEdges,
      parents,
    });

  const visit = (u: string, via: { from: string; edgeId: string } | null): void => {
    seen.add(u);
    visited.push(u);
    order.push(u);
    stack.push(u);
    if (via) {
      parents[u] = via.from;
      parentEdges[u] = via.edgeId;
      treeEdges.push(via.edgeId);
      snap(
        `Follow edge ${edgeLabel(graph, via.from, u)} to the unvisited vertex ${u}: mark it visited, set parent(${u}) = ${via.from}, push it on the stack (go deeper).`,
        u,
        via.edgeId,
      );
    } else {
      snap(`Start: visit ${u}, mark it visited and push it on the stack.`, u);
    }
    for (const { to: v, edgeId } of adj.get(u) ?? []) {
      if (!seen.has(v)) {
        visit(v, { from: u, edgeId });
      } else {
        snap(`Back at ${u}: edge ${edgeLabel(graph, u, v)} leads to ${v}, which is already visited → skip it.`, u, edgeId);
      }
    }
    stack.pop();
    const top = stack.length > 0 ? stack[stack.length - 1] : null;
    snap(
      top
        ? `All neighbours of ${u} have been explored → backtrack: pop ${u} and return to ${top}.`
        : `All neighbours of ${u} have been explored → pop ${u}. The stack is empty.`,
      top,
    );
  };

  visit(start, null);

  const unreachable = graph.vertices.filter((v) => !seen.has(v.id)).map((v) => v.id);
  snap(
    unreachable.length === 0
      ? `DFS is finished. All ${order.length} vertices were visited. Order: ${order.join(' → ')}.`
      : `DFS is finished. ${order.length} vertices were reached; ${listText(unreachable)} cannot be reached from ${start}. Order: ${order.join(' → ')}.`,
    null,
  );

  return {
    algorithm: 'dfs',
    title: `Depth-First Search from ${start}`,
    steps: tb.steps,
    result: {
      start,
      order: [...order],
      parents,
      parentEdges,
      levels: vertexRecord<number | null>(graph, null),
      treeEdges: [...treeEdges],
      unreachable,
    },
  };
}
