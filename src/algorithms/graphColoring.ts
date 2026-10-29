import type { AlgorithmTrace, ColoringResult } from '../types/algorithm';
import type { Graph } from '../types/graph';
import { vertexIndexMap } from '../utils/graph';
import { buildUndirectedNeighbours } from './adjacency';
import { TraceBuilder } from './trace';

/** Exact chromatic numbers are only computed up to this many vertices (the search is exponential). */
export const EXACT_CHROMATIC_LIMIT = 12;

/** True if no two adjacent vertices (edge directions ignored) share a colour and every vertex is coloured. */
export function isProperColoring(graph: Graph, colors: Record<string, number>): boolean {
  if (graph.vertices.some((v) => !Number.isInteger(colors[v.id]) || colors[v.id] < 1)) return false;
  return graph.edges.every((e) => colors[e.source] !== colors[e.target]);
}

/**
 * Greedy colouring: take the vertices in a fixed order and give each the smallest colour
 * (1, 2, 3, ...) not used by its already-coloured neighbours. Edge directions are ignored.
 * - 'given': the order of the vertex list V.
 * - 'degree': Welsh–Powell order, i.e. decreasing degree (ties by position in V).
 * The result is always a PROPER colouring and uses at most Δ+1 colours, but it is a
 * heuristic: it does NOT necessarily use the minimum number of colours (the chromatic
 * number χ(G)), and a different vertex order can give a different count.
 * Time O(V + E) for a given order (+ O(V log V) to sort by degree).
 */
export function greedyColoring(graph: Graph, ordering: 'given' | 'degree' = 'given'): AlgorithmTrace<ColoringResult> {
  const neighbours = buildUndirectedNeighbours(graph);
  const index = vertexIndexMap(graph);
  const tb = new TraceBuilder();
  const ids = graph.vertices.map((v) => v.id);
  const order =
    ordering === 'degree'
      ? [...ids].sort(
          (a, b) =>
            (neighbours.get(b)?.length ?? 0) - (neighbours.get(a)?.length ?? 0) ||
            (index.get(a) as number) - (index.get(b) as number),
        )
      : ids;
  const colors: Record<string, number> = {};
  const done: string[] = [];

  const snap = (explanation: string, currentVertex: string | null) =>
    tb.add({
      explanation,
      currentVertex,
      visited: done,
      frontier: order.filter((v) => !Object.hasOwn(colors, v)),
      frontierLabel: 'Vertices still to colour (in processing order)',
      order: done,
      colors,
    });

  snap(
    order.length === 0
      ? 'The graph has no vertices, so no colours are needed.'
      : `Processing order (${ordering === 'degree' ? 'decreasing degree, ties by input order' : 'input order'}): ${order.join(', ')}. Each vertex gets the smallest colour not used by a coloured neighbour.`,
    null,
  );

  let colorCount = 0;
  for (const v of order) {
    const nbs = neighbours.get(v) ?? [];
    const used = new Set<number>();
    for (const w of nbs) if (Object.hasOwn(colors, w)) used.add(colors[w]);
    let c = 1;
    while (used.has(c)) c += 1;
    colors[v] = c;
    done.push(v);
    colorCount = Math.max(colorCount, c);
    const coloredNbs = nbs.filter((w) => Object.hasOwn(colors, w) && w !== v).map((w) => `${w}:${colors[w]}`);
    snap(
      coloredNbs.length === 0
        ? `Vertex ${v} has no coloured neighbour yet → give it colour ${c}.`
        : `Vertex ${v}: coloured neighbours are ${coloredNbs.join(', ')} (colours in use: ${[...used].sort((a, b) => a - b).join(', ')}) → smallest free colour is ${c}.`,
      v,
    );
  }

  const exact = exactChromaticNumber(graph);
  const proper = isProperColoring(graph, colors);
  const note =
    exact === null
      ? `The exact chromatic number was not computed (graph has more than ${EXACT_CHROMATIC_LIMIT} vertices), so we cannot tell whether ${colorCount} is optimal.`
      : exact === colorCount
        ? `For this small graph an exhaustive search shows χ(G) = ${exact}, so greedy happened to be optimal here.`
        : `An exhaustive search shows χ(G) = ${exact}, so greedy used ${colorCount - exact} more colour${colorCount - exact === 1 ? '' : 's'} than necessary.`;
  snap(
    order.length === 0
      ? 'Done. 0 colours used.'
      : `Done. The colouring is ${proper ? 'proper' : 'NOT proper'} and uses ${colorCount} colour${colorCount === 1 ? '' : 's'}. Greedy colouring does not guarantee the minimum. ${note}`,
    null,
  );

  return {
    algorithm: 'coloring',
    title: `Greedy colouring (${ordering === 'degree' ? 'Welsh–Powell order' : 'input order'})`,
    steps: tb.steps,
    result: { ordering, order: [...order], colors: { ...colors }, colorCount, isProper: proper, chromaticNumber: exact },
  };
}

/**
 * Exact chromatic number χ(G) by exhaustive backtracking (tries k = 1, 2, ... colours).
 * Returns null if the graph has more than EXACT_CHROMATIC_LIMIT vertices. Exponential time.
 */
export function exactChromaticNumber(graph: Graph): number | null {
  const n = graph.vertices.length;
  if (n > EXACT_CHROMATIC_LIMIT) return null;
  if (n === 0) return 0;
  const neighbours = buildUndirectedNeighbours(graph);
  const ids = graph.vertices.map((v) => v.id);
  const ordered = [...ids].sort((a, b) => (neighbours.get(b)?.length ?? 0) - (neighbours.get(a)?.length ?? 0));
  const colorOf = new Map<string, number>();

  const tryColor = (pos: number, k: number, usedMax: number): boolean => {
    if (pos === ordered.length) return true;
    const v = ordered[pos];
    // Symmetry breaking: a vertex may only open the next unused colour.
    for (let c = 1; c <= Math.min(k, usedMax + 1); c += 1) {
      if ((neighbours.get(v) ?? []).some((w) => colorOf.get(w) === c)) continue;
      colorOf.set(v, c);
      if (tryColor(pos + 1, k, Math.max(usedMax, c))) return true;
      colorOf.delete(v);
    }
    return false;
  };

  for (let k = 1; k <= n; k += 1) {
    colorOf.clear();
    if (tryColor(0, k, 0)) return k;
  }
  return n;
}
