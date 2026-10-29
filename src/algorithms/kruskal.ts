import type { AlgorithmTrace, MstResult } from '../types/algorithm';
import type { Graph } from '../types/graph';
import { effectiveWeight } from '../utils/graph';
import { DisjointSet } from '../utils/disjointSet';
import { assertMstGraph, buildMstResult, edgeText, finalMstMessage } from './mstCommon';
import { TraceBuilder } from './trace';

/**
 * Kruskal's algorithm: sort the edges by weight (ties keep the order in which the edges
 * were added, because Array.prototype.sort is stable), then scan them and keep an edge iff
 * its endpoints are in different components (checked with a disjoint-set / union-find).
 * Works with negative weights. For a disconnected graph the result is a spanning forest.
 * Time O(E log E) (sorting dominates; union-find is near-linear).
 */
export function kruskal(graph: Graph): AlgorithmTrace<MstResult> {
  assertMstGraph(graph);
  const tb = new TraceBuilder();
  const n = graph.vertices.length;
  const sorted = [...graph.edges].sort((a, b) => effectiveWeight(graph, a) - effectiveWeight(graph, b));
  const dsu = new DisjointSet(graph.vertices.map((v) => v.id));
  const selected: string[] = [];
  const rejected: string[] = [];
  const connectedVertices = new Set<string>();
  let total = 0;

  const snap = (explanation: string, currentEdge: string | null, remaining: string[]) =>
    tb.add({
      explanation,
      currentEdge,
      visited: [...connectedVertices],
      frontier: remaining,
      frontierLabel: 'Remaining edges, sorted by weight',
      selectedEdges: selected,
      rejectedEdges: rejected,
      totalWeight: total,
    });

  if (n === 0) {
    const result = buildMstResult(graph, [], 0);
    snap(finalMstMessage(graph, result, "Kruskal's algorithm"), null, []);
    return { algorithm: 'kruskal', title: "Kruskal's algorithm", steps: tb.steps, result };
  }

  snap(
    sorted.length === 0
      ? 'The graph has no edges, so every vertex is its own component and no edge can be chosen.'
      : `Sort all edges by weight (ties keep input order): ${sorted.map((e) => edgeText(e, graph)).join(', ')}. Start with every vertex in its own component.`,
    null,
    sorted.map((e) => edgeText(e, graph)),
  );

  for (let i = 0; i < sorted.length; i += 1) {
    if (dsu.componentCount === 1) break;
    const e = sorted[i];
    const remaining = sorted.slice(i + 1).map((r) => edgeText(r, graph));
    const w = effectiveWeight(graph, e);
    if (dsu.connected(e.source, e.target)) {
      rejected.push(e.id);
      snap(
        `Consider ${edgeText(e, graph)}: ${e.source} and ${e.target} are already in the same component, so adding it would create a cycle → REJECT.`,
        e.id,
        remaining,
      );
    } else {
      dsu.union(e.source, e.target);
      selected.push(e.id);
      connectedVertices.add(e.source);
      connectedVertices.add(e.target);
      total += w;
      snap(
        `Consider ${edgeText(e, graph)}: ${e.source} and ${e.target} are in different components → SELECT it and merge the components. Total weight = ${total}.`,
        e.id,
        remaining,
      );
    }
  }

  const result = buildMstResult(graph, [...selected], dsu.componentCount);
  const leftover = sorted.length - selected.length - rejected.length;
  const extra =
    leftover > 0 && dsu.componentCount === 1
      ? ` The remaining ${leftover} edge${leftover === 1 ? '' : 's'} would only create cycles, so scanning stops early.`
      : '';
  snap(finalMstMessage(graph, result, "Kruskal's algorithm") + extra, null, []);
  return { algorithm: 'kruskal', title: "Kruskal's algorithm", steps: tb.steps, result };
}
