import type { AlgorithmTrace, MstResult } from '../types/algorithm';
import type { Edge, Graph } from '../types/graph';
import { effectiveWeight } from '../utils/graph';
import { MinHeap } from '../utils/minHeap';
import { assertMstGraph, buildMstResult, edgeText, finalMstMessage } from './mstCommon';
import { assertStartVertex, TraceBuilder } from './trace';

interface Candidate {
  edge: Edge;
  weight: number;
  order: number;
  from: string;
  to: string;
}

/**
 * Prim's algorithm (lazy version with a binary heap): grow a tree from `start`; repeatedly
 * pop the cheapest edge leaving the tree. If both endpoints are already in the tree the edge
 * is discarded (it would create a cycle), otherwise it is added. Ties are broken by the
 * position of the edge in the edge list. If the graph is disconnected, Prim restarts from the
 * first unvisited vertex (in V order) and the result is a spanning forest.
 * Works with negative weights. Time O((V + E) log V).
 */
export function prim(graph: Graph, start?: string): AlgorithmTrace<MstResult> {
  assertMstGraph(graph);
  const tb = new TraceBuilder();
  const n = graph.vertices.length;
  if (start !== undefined && n > 0) assertStartVertex(graph, start);
  const edgeOrder = new Map(graph.edges.map((e, i) => [e.id, i]));
  const incident = new Map<string, Edge[]>(graph.vertices.map((v) => [v.id, []]));
  for (const e of graph.edges) {
    incident.get(e.source)?.push(e);
    incident.get(e.target)?.push(e);
  }
  for (const list of incident.values()) {
    list.sort((a, b) => (edgeOrder.get(a.id) as number) - (edgeOrder.get(b.id) as number));
  }

  const heap = new MinHeap<Candidate>((a, b) => a.weight - b.weight || a.order - b.order);
  const inTree = new Set<string>();
  const treeOrder: string[] = [];
  const selected: string[] = [];
  const rejected: string[] = [];
  let total = 0;
  let components = 0;

  const snap = (explanation: string, currentVertex: string | null, currentEdge: string | null) =>
    tb.add({
      explanation,
      currentVertex,
      currentEdge,
      visited: treeOrder,
      frontier: heap.toSortedArray().map((c) => `${c.from}–${c.to} (${c.weight})`),
      frontierLabel: 'Candidate edges (priority queue, cheapest first)',
      selectedEdges: selected,
      rejectedEdges: rejected,
      totalWeight: total,
    });

  const addVertex = (v: string) => {
    inTree.add(v);
    treeOrder.push(v);
    for (const e of incident.get(v) ?? []) {
      const other = e.source === v ? e.target : e.source;
      if (!inTree.has(other)) {
        heap.push({ edge: e, weight: effectiveWeight(graph, e), order: edgeOrder.get(e.id) as number, from: v, to: other });
      }
    }
  };

  if (n === 0) {
    const result = buildMstResult(graph, [], 0);
    snap(finalMstMessage(graph, result, "Prim's algorithm"), null, null);
    return { algorithm: 'prim', title: "Prim's algorithm", steps: tb.steps, result };
  }

  const roots = [start ?? graph.vertices[0].id, ...graph.vertices.map((v) => v.id)];
  for (const root of roots) {
    if (inTree.has(root)) continue;
    components += 1;
    addVertex(root);
    snap(
      components === 1
        ? `Start the tree at ${root}. Add every edge leaving ${root} to the priority queue.`
        : `The queue is empty but ${root} is not reached yet, so the graph is disconnected. Start a new tree (component ${components}) at ${root}.`,
      root,
      null,
    );
    for (let c = heap.pop(); c; c = heap.pop()) {
      const { edge, from, to } = c;
      const text = edgeText(edge, graph);
      if (inTree.has(to)) {
        rejected.push(edge.id);
        snap(`Pop ${text}: both ${from} and ${to} are already in the tree, so adding it would create a cycle → REJECT.`, from, edge.id);
      } else {
        selected.push(edge.id);
        total += c.weight;
        addVertex(to);
        snap(
          `Pop ${text}: it is the cheapest edge leaving the tree and ${to} is new → SELECT it, add ${to} to the tree, and queue the edges leaving ${to}. Total weight = ${total}.`,
          to,
          edge.id,
        );
      }
    }
  }

  const result = buildMstResult(graph, [...selected], components);
  snap(finalMstMessage(graph, result, "Prim's algorithm"), null, null);
  return { algorithm: 'prim', title: "Prim's algorithm", steps: tb.steps, result };
}
