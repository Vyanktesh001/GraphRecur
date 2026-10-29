import type { Edge, Graph, Vertex } from '../types/graph';
import { createGraph, circularLayout, generateId, isValidVertexName, MAX_EDGES, MAX_VERTICES, nextFreePosition } from './graph';
import { validateGraph } from './graph';

export interface ParseOptions {
  name?: string;
  id?: string;
  directed: boolean;
  weighted: boolean;
  /** Existing graph: vertices that keep their name keep their canvas position. */
  existing?: Graph;
}

export interface ParseResult {
  graph: Graph | null;
  errors: string[];
}

const EDGE_PATTERN =
  /^([A-Za-z0-9_]+)\s*(?:->|--|-|,|>)\s*([A-Za-z0-9_]+)\s*(?:(?:[,:]|\s)\s*(?:weight\s*[=:]?\s*|w\s*[=:]?\s*)?\(?\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)\s*\)?)?$/i;

/**
 * Parses the "manual input" form.
 *  - vertices: names separated by commas, spaces or new lines: `A, B, C`
 *  - edges: one per line (or separated by `;`): `A-B`, `A-B 5`, `A->B: 5`, `A-B, weight 5`
 * Collects ALL problems (with line numbers) instead of stopping at the first one.
 */
export function parseGraphText(vertexText: string, edgeText: string, options: ParseOptions): ParseResult {
  const errors: string[] = [];
  const names = vertexText.split(/[\s,;]+/).filter((s) => s.length > 0);
  const seen = new Set<string>();
  const vertexIds: string[] = [];
  for (const name of names) {
    if (!isValidVertexName(name)) {
      errors.push(`Invalid vertex name "${name}": use 1-12 letters, digits or underscores (not starting with "_").`);
    } else if (seen.has(name)) {
      errors.push(`Vertex "${name}" is listed more than once.`);
    } else {
      seen.add(name);
      vertexIds.push(name);
    }
  }
  if (vertexIds.length > MAX_VERTICES) errors.push(`At most ${MAX_VERTICES} vertices are supported.`);

  const edges: Edge[] = [];
  const pairs = new Set<string>();
  const lines = edgeText.split(/[\r\n;]+/);
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (line === '' || line.startsWith('#')) return;
    const label = `Edge line ${i + 1}`;
    const m = EDGE_PATTERN.exec(line);
    if (!m) {
      errors.push(`${label}: "${line}" is not a valid edge. Write it as A-B, or A-B 5 for a weighted edge.`);
      return;
    }
    const [, a, b, w] = m;
    const missing = [a, b].filter((v) => !seen.has(v));
    if (missing.length > 0) {
      errors.push(`${label}: "${line}" uses ${missing.length > 1 ? 'vertices' : 'vertex'} ${missing.map((v) => `"${v}"`).join(' and ')}, which ${missing.length > 1 ? 'are' : 'is'} not in the vertex list.`);
      return;
    }
    if (a === b) {
      errors.push(`${label}: "${line}" is a self-loop; edges must join two different vertices.`);
      return;
    }
    if (w !== undefined && !options.weighted) {
      errors.push(`${label}: "${line}" has a weight but the graph is unweighted. Tick "Weighted" or remove the weight.`);
      return;
    }
    const key = options.directed ? `${a}>${b}` : [a, b].sort().join('|');
    if (pairs.has(key)) {
      errors.push(`${label}: edge ${a}-${b} appears more than once (parallel edges are not allowed).`);
      return;
    }
    pairs.add(key);
    edges.push({ id: generateId('e'), source: a, target: b, weight: w !== undefined ? Number(w) : 1 });
  });
  if (edges.length > MAX_EDGES) errors.push(`At most ${MAX_EDGES} edges are supported.`);

  if (errors.length > 0) return { graph: null, errors };

  const previous = new Map((options.existing?.vertices ?? []).map((v) => [v.id, v]));
  const layout = circularLayout(vertexIds);
  const vertices: Vertex[] = [];
  for (const id of vertexIds) {
    const old = previous.get(id);
    if (old) vertices.push({ id, x: old.x, y: old.y });
    else if (options.existing && options.existing.vertices.length > 0) {
      const pos = nextFreePosition({ ...options.existing, vertices });
      vertices.push({ id, ...pos });
    } else vertices.push({ id, ...(layout.get(id) as { x: number; y: number }) });
  }
  const graph = createGraph({
    id: options.id ?? options.existing?.id,
    name: options.name ?? options.existing?.name ?? 'Untitled graph',
    directed: options.directed,
    weighted: options.weighted,
    vertices,
    edges,
  });
  const issues = validateGraph(graph);
  return issues.length > 0 ? { graph: null, errors: issues } : { graph, errors: [] };
}

/** Inverse of parseGraphText: fills the manual-input form from a graph. */
export function graphToText(graph: Graph): { vertices: string; edges: string } {
  const arrow = graph.directed ? '->' : '-';
  return {
    vertices: graph.vertices.map((v) => v.id).join(', '),
    edges: graph.edges
      .map((e) => `${e.source}${arrow}${e.target}${graph.weighted ? ` ${e.weight}` : ''}`)
      .join('\n'),
  };
}
