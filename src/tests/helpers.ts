import type { Graph } from '../types/graph';

/** Test helper: builds a graph from vertex names and [source, target, weight?] triples. */
export function makeGraph(
  vertices: string[],
  edges: [string, string, number?][],
  options: { directed?: boolean; weighted?: boolean } = {},
): Graph {
  return {
    id: 'test',
    name: 'test',
    directed: options.directed ?? false,
    weighted: options.weighted ?? edges.some((e) => e[2] !== undefined),
    vertices: vertices.map((id, i) => ({ id, x: i * 80, y: 0 })),
    edges: edges.map(([source, target, weight], i) => ({ id: `e${i}`, source, target, weight: weight ?? 1 })),
  };
}
