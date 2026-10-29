import type { AlgorithmTrace, PathResult } from '../types/algorithm';
import type { Graph } from '../types/graph';
import { AlgorithmError } from '../utils/errors';
import { edgeLabel, effectiveWeight, vertexIndexMap } from '../utils/graph';
import { MinHeap } from '../utils/minHeap';
import { buildAdjacencyList } from './adjacency';
import { reconstructPath } from './shortestPath';
import { assertStartVertex, TraceBuilder, vertexRecord } from './trace';

interface HeapItem {
  vertex: string;
  dist: number;
  index: number;
}

/**
 * Dijkstra's single-source shortest paths with a binary-heap priority queue (lazy deletion:
 * outdated heap entries are skipped when popped). REQUIRES non-negative edge weights; a
 * negative weight makes the algorithm unsound, so it is rejected with an AlgorithmError.
 * Unweighted graphs are treated as having weight 1 on every edge.
 *
 * Determinism: ties in distance are broken by the vertex's position in V, and a path only
 * replaces another when it is strictly shorter, so the first-found path wins.
 * Time O((V + E) log V). The algorithm runs to completion so every distance is available.
 */
export function dijkstra(graph: Graph, source: string, target: string): AlgorithmTrace<PathResult> {
  assertStartVertex(graph, source, 'source');
  assertStartVertex(graph, target, 'destination');
  for (const e of graph.edges) {
    const w = effectiveWeight(graph, e);
    if (w < 0) {
      throw new AlgorithmError(
        `Dijkstra's algorithm requires non-negative edge weights, but edge ${e.source}–${e.target} has weight ${w}. Remove or change this edge (Dijkstra can give wrong answers with negative weights).`,
      );
    }
  }

  const adj = buildAdjacencyList(graph);
  const index = vertexIndexMap(graph);
  const tb = new TraceBuilder();
  const dist = vertexRecord<number | null>(graph, null);
  const parents = vertexRecord<string | null>(graph, null);
  const parentEdges = vertexRecord<string | null>(graph, null);
  const settled: string[] = [];
  const settledSet = new Set<string>();
  const heap = new MinHeap<HeapItem>((a, b) => a.dist - b.dist || a.index - b.index);
  dist[source] = 0;
  heap.push({ vertex: source, dist: 0, index: index.get(source) as number });

  const fmt = (d: number | null) => (d === null ? '∞' : String(d));
  const frontier = () =>
    graph.vertices
      .filter((v) => dist[v.id] !== null && !settledSet.has(v.id))
      .sort((a, b) => (dist[a.id] as number) - (dist[b.id] as number) || (index.get(a.id) as number) - (index.get(b.id) as number))
      .map((v) => `${v.id} (${fmt(dist[v.id])})`);
  const treeEdges = () => graph.vertices.map((v) => parentEdges[v.id]).filter((id): id is string => id !== null);

  const snap = (explanation: string, currentVertex: string | null, currentEdge: string | null = null) =>
    tb.add({
      explanation,
      currentVertex,
      currentEdge,
      visited: settled,
      frontier: frontier(),
      frontierLabel: 'Tentative distances (priority queue, smallest first)',
      order: settled,
      treeEdges: treeEdges(),
      distances: dist,
      parents,
    });

  snap(`Initialise: dist(${source}) = 0 and dist(v) = ∞ for every other vertex. Push ${source} into the priority queue.`, source);

  for (let item = heap.pop(); item; item = heap.pop()) {
    const { vertex: u, dist: d } = item;
    if (settledSet.has(u) || d > (dist[u] as number)) continue; // outdated entry
    settledSet.add(u);
    settled.push(u);
    snap(`Settle ${u}: it has the smallest tentative distance (${d}) among unsettled vertices, so dist(${u}) = ${d} is final.`, u);
    for (const { to: v, edgeId, weight } of adj.get(u) ?? []) {
      const label = edgeLabel(graph, u, v);
      if (settledSet.has(v)) {
        snap(`Edge ${label} (weight ${weight}): ${v} is already settled → nothing to update.`, u, edgeId);
        continue;
      }
      const candidate = d + weight;
      const old = dist[v];
      if (old === null || candidate < old) {
        dist[v] = candidate;
        parents[v] = u;
        parentEdges[v] = edgeId;
        heap.push({ vertex: v, dist: candidate, index: index.get(v) as number });
        snap(
          `Relax edge ${label} (weight ${weight}): dist(${u}) + ${weight} = ${candidate} < ${fmt(old)} → update dist(${v}) = ${candidate}, parent(${v}) = ${u}.`,
          u,
          edgeId,
        );
      } else {
        snap(
          `Relax edge ${label} (weight ${weight}): dist(${u}) + ${weight} = ${candidate} ≥ ${fmt(old)} → no improvement for ${v}.`,
          u,
          edgeId,
        );
      }
    }
  }

  const { path, edgeIds } = reconstructPath(parents, parentEdges, source, target);
  const reachable = dist[target] !== null;
  const cost = dist[target];
  tb.add({
    explanation: reachable
      ? source === target
        ? `The source and destination are the same vertex: the shortest path is [${source}] with total cost 0.`
        : `Done. The shortest path from ${source} to ${target} is ${path.join(' → ')} with total cost ${cost}.`
      : `Done. ${target} is unreachable from ${source} (its distance stays ∞), so there is no path.`,
    visited: settled,
    frontier: [],
    frontierLabel: 'Tentative distances (priority queue, smallest first)',
    order: settled,
    treeEdges: treeEdges(),
    pathVertices: path,
    pathEdges: edgeIds,
    distances: dist,
    parents,
  });

  return {
    algorithm: 'dijkstra',
    title: `Dijkstra's algorithm ${source} → ${target}`,
    steps: tb.steps,
    result: { source, target, reachable, path, edgeIds, cost, costKind: 'weight', distances: dist, parents },
  };
}
