import type { Graph } from '../types/graph';
import { createGraph, circularLayout, generateId } from '../utils/graph';

export interface ExampleGraph {
  id: string;
  name: string;
  description: string;
  directed: boolean;
  weighted: boolean;
  vertices: string[];
  /** [source, target, weight?] */
  edges: [string, string, number?][];
  /** Optional hand-placed positions (top-left corners); otherwise a circle is used. */
  positions?: Record<string, [number, number]>;
}

export const EXAMPLE_GRAPHS: ExampleGraph[] = [
  {
    id: 'simple-connected',
    name: 'Simple connected graph',
    description: 'V = {A,B,C,D,E}; edges A-B, A-C, B-D, C-D, D-E. Connected, contains the cycle A-B-D-C.',
    directed: false,
    weighted: false,
    vertices: ['A', 'B', 'C', 'D', 'E'],
    edges: [['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'D'], ['D', 'E']],
    positions: { A: [60, 160], B: [220, 60], C: [220, 260], D: [400, 160], E: [560, 160] },
  },
  {
    id: 'disconnected',
    name: 'Disconnected graph',
    description: 'V = {A,B,C,D}; edges A-B, C-D. Two connected components.',
    directed: false,
    weighted: false,
    vertices: ['A', 'B', 'C', 'D'],
    edges: [['A', 'B'], ['C', 'D']],
    positions: { A: [80, 100], B: [260, 100], C: [80, 280], D: [260, 280] },
  },
  {
    id: 'cycle',
    name: 'Cycle (triangle)',
    description: 'V = {A,B,C}; edges A-B, B-C, C-A. A cycle of odd length, so it is not bipartite and needs 3 colours.',
    directed: false,
    weighted: false,
    vertices: ['A', 'B', 'C'],
    edges: [['A', 'B'], ['B', 'C'], ['C', 'A']],
    positions: { A: [240, 60], B: [120, 260], C: [360, 260] },
  },
  {
    id: 'weighted',
    name: 'Weighted graph',
    description: 'V = {A,B,C,D}; A-B 2, A-C 4, B-C 1, B-D 7, C-D 3. Shortest A→D is A,B,C,D with cost 6; MST weight is 6.',
    directed: false,
    weighted: true,
    vertices: ['A', 'B', 'C', 'D'],
    edges: [['A', 'B', 2], ['A', 'C', 4], ['B', 'C', 1], ['B', 'D', 7], ['C', 'D', 3]],
    positions: { A: [60, 160], B: [240, 50], C: [240, 270], D: [440, 160] },
  },
  {
    id: 'tree',
    name: 'Tree',
    description: 'A connected acyclic graph on 7 vertices (6 edges = V − 1).',
    directed: false,
    weighted: false,
    vertices: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    edges: [['A', 'B'], ['A', 'C'], ['B', 'D'], ['B', 'E'], ['C', 'F'], ['C', 'G']],
    positions: { A: [280, 30], B: [140, 160], C: [420, 160], D: [60, 290], E: [220, 290], F: [340, 290], G: [500, 290] },
  },
  {
    id: 'bipartite',
    name: 'Bipartite graph K3,3',
    description: 'Complete bipartite graph: every vertex of {A,B,C} is joined to every vertex of {D,E,F}. 2-colourable.',
    directed: false,
    weighted: false,
    vertices: ['A', 'B', 'C', 'D', 'E', 'F'],
    edges: [['A', 'D'], ['A', 'E'], ['A', 'F'], ['B', 'D'], ['B', 'E'], ['B', 'F'], ['C', 'D'], ['C', 'E'], ['C', 'F']],
    positions: { A: [100, 40], B: [100, 160], C: [100, 280], D: [400, 40], E: [400, 160], F: [400, 280] },
  },
  {
    id: 'directed-weighted',
    name: 'Directed weighted graph',
    description: 'A→B 4, A→C 1, C→B 2, B→D 1, C→D 5, D→E 3. Dijkstra from A to E costs 7 via A,C,B,D,E.',
    directed: true,
    weighted: true,
    vertices: ['A', 'B', 'C', 'D', 'E'],
    edges: [['A', 'B', 4], ['A', 'C', 1], ['C', 'B', 2], ['B', 'D', 1], ['C', 'D', 5], ['D', 'E', 3]],
    positions: { A: [40, 160], B: [240, 60], C: [240, 270], D: [440, 160], E: [600, 160] },
  },
  {
    id: 'directed-cycle',
    name: 'Directed graph with a cycle',
    description: 'A→B, B→C, C→A, C→D. {A,B,C} is a strongly connected component; D is reachable but cannot return.',
    directed: true,
    weighted: false,
    vertices: ['A', 'B', 'C', 'D'],
    edges: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['C', 'D']],
    positions: { A: [100, 60], B: [300, 60], C: [200, 240], D: [400, 240] },
  },
  {
    id: 'negative-weight',
    name: 'Negative weight (Dijkstra demo)',
    description: 'A→B 4, A→C 2, C→B −3. Contains a negative edge, so Dijkstra refuses to run (try it in the simulator).',
    directed: true,
    weighted: true,
    vertices: ['A', 'B', 'C'],
    edges: [['A', 'B', 4], ['A', 'C', 2], ['C', 'B', -3]],
    positions: { A: [60, 160], B: [400, 160], C: [230, 40] },
  },
];

/** Builds a fresh Graph (new id) from an example definition. */
export function instantiateExample(example: ExampleGraph): Graph {
  const layout = circularLayout(example.vertices);
  return createGraph({
    name: example.name,
    directed: example.directed,
    weighted: example.weighted,
    vertices: example.vertices.map((id) => {
      const pos = example.positions?.[id];
      const fallback = layout.get(id) as { x: number; y: number };
      return { id, x: pos ? pos[0] : fallback.x, y: pos ? pos[1] : fallback.y };
    }),
    edges: example.edges.map(([source, target, weight]) => ({ id: generateId('e'), source, target, weight: weight ?? 1 })),
  });
}

export function getExample(id: string): ExampleGraph {
  const found = EXAMPLE_GRAPHS.find((e) => e.id === id);
  if (!found) throw new Error(`Unknown example graph ${id}`);
  return found;
}
