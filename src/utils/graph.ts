import type { Edge, Graph, Vertex } from '../types/graph';
import { GraphError } from './errors';

export const MAX_VERTICES = 100;
export const MAX_EDGES = 1000;
/** Vertex names: 1-12 characters, letters/digits/underscore, not starting with an underscore. */
export const VERTEX_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_]{0,11}$/;
export const NODE_SIZE = 48;

let idCounter = 0;
export function generateId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}${idCounter}`;
}

export function createGraph(partial: Partial<Graph> = {}): Graph {
  return {
    id: partial.id ?? generateId('g'),
    name: partial.name ?? 'Untitled graph',
    directed: partial.directed ?? false,
    weighted: partial.weighted ?? false,
    vertices: partial.vertices ?? [],
    edges: partial.edges ?? [],
  };
}

export function isValidVertexName(name: string): boolean {
  return VERTEX_NAME_PATTERN.test(name);
}

/** Effective weight used by algorithms: the stored weight if weighted, otherwise 1. */
export function effectiveWeight(graph: Graph, edge: Edge): number {
  return graph.weighted ? edge.weight : 1;
}

export function vertexIndexMap(graph: Graph): Map<string, number> {
  return new Map(graph.vertices.map((v, i) => [v.id, i]));
}

export function hasVertex(graph: Graph, id: string): boolean {
  return graph.vertices.some((v) => v.id === id);
}

/** Finds the edge joining a and b (respecting direction in directed graphs). */
export function findEdge(graph: Graph, a: string, b: string): Edge | undefined {
  return graph.edges.find(
    (e) => (e.source === a && e.target === b) || (!graph.directed && e.source === b && e.target === a),
  );
}

/** Returns a list of human-readable problems; an empty list means the graph is a valid simple graph. */
export function validateGraph(graph: Graph): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  if (graph.vertices.length > MAX_VERTICES) issues.push(`A graph may have at most ${MAX_VERTICES} vertices.`);
  if (graph.edges.length > MAX_EDGES) issues.push(`A graph may have at most ${MAX_EDGES} edges.`);
  for (const v of graph.vertices) {
    if (typeof v.id !== 'string' || !isValidVertexName(v.id)) {
      issues.push(`Invalid vertex name "${String(v.id)}": use 1-12 letters, digits or underscores (not starting with "_").`);
    } else if (ids.has(v.id)) {
      issues.push(`Duplicate vertex "${v.id}".`);
    }
    ids.add(v.id);
  }
  const edgeIds = new Set<string>();
  const pairs = new Set<string>();
  for (const e of graph.edges) {
    if (edgeIds.has(e.id)) issues.push(`Duplicate edge id "${e.id}".`);
    edgeIds.add(e.id);
    if (!ids.has(e.source)) issues.push(`Edge ${e.source}-${e.target} references unknown vertex "${e.source}".`);
    if (!ids.has(e.target)) issues.push(`Edge ${e.source}-${e.target} references unknown vertex "${e.target}".`);
    if (e.source === e.target) issues.push(`Self-loop on "${e.source}" is not allowed (simple graphs only).`);
    if (typeof e.weight !== 'number' || !Number.isFinite(e.weight)) {
      issues.push(`Edge ${e.source}-${e.target} has an invalid weight.`);
    }
    const key = graph.directed ? `${e.source}>${e.target}` : [e.source, e.target].sort().join('|');
    if (pairs.has(key)) issues.push(`Duplicate edge ${e.source}-${e.target} (parallel edges are not allowed).`);
    pairs.add(key);
  }
  return issues;
}

export function assertValidGraph(graph: Graph): void {
  const issues = validateGraph(graph);
  if (issues.length > 0) throw new GraphError(issues[0]);
}

// ---------------------------------------------------------------------------
// Pure edit operations: each returns a new Graph and never mutates its input.
// ---------------------------------------------------------------------------

/** Spreadsheet-style names: A..Z, AA, AB, ... first unused one. */
export function nextVertexName(graph: Graph): string {
  const used = new Set(graph.vertices.map((v) => v.id));
  for (let n = 0; ; n += 1) {
    let name = '';
    let k = n;
    do {
      name = String.fromCharCode(65 + (k % 26)) + name;
      k = Math.floor(k / 26) - 1;
    } while (k >= 0);
    if (!used.has(name)) return name;
  }
}

/** First free slot on a grid, so new vertices do not stack on top of each other. */
export function nextFreePosition(graph: Graph): { x: number; y: number } {
  for (let i = 0; i < 1000; i += 1) {
    const x = 60 + (i % 6) * 130;
    const y = 50 + Math.floor(i / 6) * 120;
    const taken = graph.vertices.some((v) => Math.abs(v.x - x) < 60 && Math.abs(v.y - y) < 60);
    if (!taken) return { x, y };
  }
  return { x: 60, y: 50 };
}

export function addVertex(graph: Graph, id?: string, position?: { x: number; y: number }): Graph {
  const name = (id ?? nextVertexName(graph)).trim();
  if (!isValidVertexName(name)) {
    throw new GraphError(`"${name}" is not a valid vertex name. Use 1-12 letters, digits or underscores (not starting with "_").`);
  }
  if (hasVertex(graph, name)) throw new GraphError(`Vertex "${name}" already exists.`);
  if (graph.vertices.length >= MAX_VERTICES) throw new GraphError(`A graph may have at most ${MAX_VERTICES} vertices.`);
  const pos = position ?? nextFreePosition(graph);
  const vertex: Vertex = { id: name, x: Math.round(pos.x), y: Math.round(pos.y) };
  return { ...graph, vertices: [...graph.vertices, vertex] };
}

export function removeVertex(graph: Graph, id: string): Graph {
  if (!hasVertex(graph, id)) throw new GraphError(`Vertex "${id}" does not exist.`);
  return {
    ...graph,
    vertices: graph.vertices.filter((v) => v.id !== id),
    edges: graph.edges.filter((e) => e.source !== id && e.target !== id),
  };
}

export function renameVertex(graph: Graph, oldId: string, newIdRaw: string): Graph {
  const newId = newIdRaw.trim();
  if (!hasVertex(graph, oldId)) throw new GraphError(`Vertex "${oldId}" does not exist.`);
  if (!isValidVertexName(newId)) {
    throw new GraphError(`"${newId}" is not a valid vertex name. Use 1-12 letters, digits or underscores (not starting with "_").`);
  }
  if (newId !== oldId && hasVertex(graph, newId)) throw new GraphError(`Vertex "${newId}" already exists.`);
  return {
    ...graph,
    vertices: graph.vertices.map((v) => (v.id === oldId ? { ...v, id: newId } : v)),
    edges: graph.edges.map((e) => ({
      ...e,
      source: e.source === oldId ? newId : e.source,
      target: e.target === oldId ? newId : e.target,
    })),
  };
}

export function addEdge(graph: Graph, source: string, target: string, weight = 1): Graph {
  if (!hasVertex(graph, source)) throw new GraphError(`Vertex "${source}" does not exist.`);
  if (!hasVertex(graph, target)) throw new GraphError(`Vertex "${target}" does not exist.`);
  if (source === target) throw new GraphError('Self-loops are not allowed: an edge must join two different vertices.');
  if (!Number.isFinite(weight)) throw new GraphError('Edge weight must be a finite number.');
  if (findEdge(graph, source, target)) {
    throw new GraphError(`Edge ${source}${graph.directed ? '->' : '-'}${target} already exists (parallel edges are not allowed).`);
  }
  if (graph.edges.length >= MAX_EDGES) throw new GraphError(`A graph may have at most ${MAX_EDGES} edges.`);
  const edge: Edge = { id: generateId('e'), source, target, weight };
  return { ...graph, edges: [...graph.edges, edge] };
}

export function removeEdge(graph: Graph, edgeId: string): Graph {
  if (!graph.edges.some((e) => e.id === edgeId)) throw new GraphError('That edge does not exist.');
  return { ...graph, edges: graph.edges.filter((e) => e.id !== edgeId) };
}

export function setEdgeWeight(graph: Graph, edgeId: string, weight: number): Graph {
  if (!Number.isFinite(weight)) throw new GraphError('Edge weight must be a finite number.');
  if (!graph.edges.some((e) => e.id === edgeId)) throw new GraphError('That edge does not exist.');
  return { ...graph, edges: graph.edges.map((e) => (e.id === edgeId ? { ...e, weight } : e)) };
}

/**
 * Switches between directed and undirected. Converting to undirected can make A->B and B->A
 * collapse into one edge; the first one wins and `merged` reports how many edges were dropped.
 */
export function setDirected(graph: Graph, directed: boolean): { graph: Graph; merged: number } {
  if (graph.directed === directed) return { graph, merged: 0 };
  if (directed) return { graph: { ...graph, directed }, merged: 0 };
  const seen = new Set<string>();
  const edges: Edge[] = [];
  for (const e of graph.edges) {
    const key = [e.source, e.target].sort().join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push(e);
  }
  return { graph: { ...graph, directed, edges }, merged: graph.edges.length - edges.length };
}

export function moveVertex(graph: Graph, id: string, x: number, y: number): Graph {
  return {
    ...graph,
    vertices: graph.vertices.map((v) => (v.id === id ? { ...v, x: Math.round(x), y: Math.round(y) } : v)),
  };
}

/** Places the given ids evenly on a circle. */
export function circularLayout(ids: string[], radius = 190, cx = 280, cy = 230): Map<string, { x: number; y: number }> {
  const out = new Map<string, { x: number; y: number }>();
  const n = ids.length;
  const r = n <= 1 ? 0 : Math.max(radius, n * 22);
  ids.forEach((id, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / Math.max(n, 1);
    out.set(id, { x: Math.round(cx + r * Math.cos(angle) - NODE_SIZE / 2), y: Math.round(cy + r * Math.sin(angle) - NODE_SIZE / 2) });
  });
  return out;
}

export function relayoutCircle(graph: Graph): Graph {
  const layout = circularLayout(graph.vertices.map((v) => v.id));
  return { ...graph, vertices: graph.vertices.map((v) => ({ ...v, ...(layout.get(v.id) as { x: number; y: number }) })) };
}

/** Human-readable edge text used in explanations: "A-B" or "A→B". */
export function edgeLabel(graph: Graph, source: string, target: string): string {
  return graph.directed ? `${source}→${target}` : `${source}–${target}`;
}
