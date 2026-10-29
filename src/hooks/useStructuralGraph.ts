import { useState } from 'react';
import type { Graph } from '../types/graph';

/** Everything that matters to an algorithm (not the canvas positions or the name). */
export function structureKey(graph: Graph): string {
  return JSON.stringify([
    graph.directed,
    graph.weighted,
    graph.vertices.map((v) => v.id),
    graph.edges.map((e) => [e.id, e.source, e.target, graph.weighted ? e.weight : 1]),
  ]);
}

/**
 * Returns a graph object that only changes identity when the graph's structure changes.
 * Dragging a vertex on the canvas therefore does not re-run (and reset) an algorithm.
 */
export function useStructuralGraph(graph: Graph): Graph {
  const key = structureKey(graph);
  const [stable, setStable] = useState({ key, graph });
  if (stable.key !== key) {
    setStable({ key, graph });
    return graph;
  }
  return stable.graph;
}
