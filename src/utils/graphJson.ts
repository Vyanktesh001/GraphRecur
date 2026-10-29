import type { Edge, Graph, Vertex } from '../types/graph';
import { GraphError } from './errors';
import { circularLayout, createGraph, generateId, validateGraph } from './graph';

export const GRAPH_FORMAT = 'graphrecur-lab/graph';

export function exportGraphJson(graph: Graph): string {
  return JSON.stringify({ format: GRAPH_FORMAT, version: 1, graph }, null, 2);
}

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/**
 * Converts untrusted data (imported file or localStorage content) into a valid Graph.
 * Throws GraphError with an explanation if anything is wrong. Unknown fields are dropped.
 * Missing ids/positions/weights are filled in; the graph always gets a fresh id when
 * `freshId` is true (imports), so importing never overwrites an existing saved graph.
 */
export function normalizeGraph(data: unknown, freshId = false): Graph {
  const raw = isRecord(data) && isRecord(data.graph) ? data.graph : data;
  if (!isRecord(raw)) throw new GraphError('The file does not contain a graph object.');
  if (!Array.isArray(raw.vertices)) throw new GraphError('The graph must have a "vertices" array.');
  if (!Array.isArray(raw.edges)) throw new GraphError('The graph must have an "edges" array.');

  const names: string[] = raw.vertices.map((v) => (isRecord(v) ? String(v.id) : String(v)));
  const layout = circularLayout(names);
  const vertices: Vertex[] = raw.vertices.map((v, i) => {
    const id = names[i];
    const fallback = layout.get(id) ?? { x: 0, y: 0 };
    const x = isRecord(v) && typeof v.x === 'number' && Number.isFinite(v.x) ? v.x : fallback.x;
    const y = isRecord(v) && typeof v.y === 'number' && Number.isFinite(v.y) ? v.y : fallback.y;
    return { id, x, y };
  });
  const edges: Edge[] = raw.edges.map((e, i) => {
    if (!isRecord(e)) throw new GraphError(`Edge #${i + 1} is not an object with "source" and "target".`);
    const weight = e.weight === undefined ? 1 : e.weight;
    if (typeof weight !== 'number') throw new GraphError(`Edge #${i + 1} has a weight that is not a number.`);
    return {
      id: typeof e.id === 'string' && e.id.length > 0 ? e.id : generateId('e'),
      source: String(e.source),
      target: String(e.target),
      weight,
    };
  });

  const graph = createGraph({
    id: !freshId && typeof raw.id === 'string' && raw.id ? raw.id : undefined,
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 80) : 'Imported graph',
    directed: raw.directed === true,
    weighted: raw.weighted === true,
    vertices,
    edges,
  });
  const issues = validateGraph(graph);
  if (issues.length > 0) throw new GraphError(issues.slice(0, 3).join(' '));
  return graph;
}

export function parseGraphJson(text: string): Graph {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new GraphError('The file is not valid JSON.');
  }
  return normalizeGraph(data, true);
}
