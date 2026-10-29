import type { StepInput, TraceStep } from '../types/algorithm';
import type { Graph } from '../types/graph';
import { AlgorithmError } from '../utils/errors';
import { assertValidGraph, hasVertex } from '../utils/graph';

/**
 * Records algorithm progress as a list of immutable snapshots. Algorithms call `add` after
 * every meaningful action; the builder deep-copies the arrays/records it is given, so later
 * mutation of the algorithm's working state can never corrupt an earlier step.
 */
export class TraceBuilder {
  readonly steps: TraceStep[] = [];

  add(input: StepInput): void {
    this.steps.push({
      index: this.steps.length,
      explanation: input.explanation,
      currentVertex: input.currentVertex ?? null,
      currentEdge: input.currentEdge ?? null,
      visited: [...(input.visited ?? [])],
      frontier: [...(input.frontier ?? [])],
      frontierLabel: input.frontierLabel ?? '',
      order: [...(input.order ?? [])],
      treeEdges: [...(input.treeEdges ?? [])],
      selectedEdges: [...(input.selectedEdges ?? [])],
      rejectedEdges: [...(input.rejectedEdges ?? [])],
      pathVertices: [...(input.pathVertices ?? [])],
      pathEdges: [...(input.pathEdges ?? [])],
      ...(input.distances ? { distances: { ...input.distances } } : {}),
      ...(input.parents ? { parents: { ...input.parents } } : {}),
      ...(input.colors ? { colors: { ...input.colors } } : {}),
      ...(input.totalWeight !== undefined ? { totalWeight: input.totalWeight } : {}),
    });
  }
}

export function assertStartVertex(graph: Graph, start: string, role = 'start'): void {
  assertValidGraph(graph);
  if (!hasVertex(graph, start)) {
    throw new AlgorithmError(`The ${role} vertex "${start}" is not in the graph.`);
  }
}

/** Builds a Record keyed by every vertex id, initialised with `value`. */
export function vertexRecord<T>(graph: Graph, value: T): Record<string, T> {
  const out: Record<string, T> = {};
  for (const v of graph.vertices) out[v.id] = value;
  return out;
}

/** Joins a list like [A, B, C] as "A, B, C", or "(empty)". */
export function listText(items: string[]): string {
  return items.length === 0 ? '(empty)' : items.join(', ');
}
