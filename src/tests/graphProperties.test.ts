import { describe, expect, it } from 'vitest';
import { buildAdjacencyList, buildAdjacencyMatrix } from '../algorithms/adjacency';
import { checkBipartite } from '../algorithms/bipartite';
import { connectedComponents, isConnected, isolatedVertices, stronglyConnectedComponents } from '../algorithms/connectivity';
import { findCycle, hasCycle } from '../algorithms/cycleDetection';
import { analyzeGraph, computeDegrees } from '../algorithms/graphProperties';
import { GraphError } from '../utils/errors';
import { addEdge, addVertex, removeVertex, renameVertex, setDirected, validateGraph } from '../utils/graph';
import { makeGraph } from './helpers';

const simple = makeGraph(['A', 'B', 'C', 'D', 'E'], [['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'D'], ['D', 'E']]);

describe('empty graph, single vertex, no edges', () => {
  it('handles the empty graph without crashing', () => {
    const p = analyzeGraph(makeGraph([], []));
    expect(p.vertexCount).toBe(0);
    expect(p.edgeCount).toBe(0);
    expect(p.components).toEqual([]);
    expect(p.isConnected).toBe(false); // documented convention: zero components
    expect(p.isTree).toBe(false);
    expect(p.hasCycle).toBe(false);
    expect(p.bipartite.isBipartite).toBe(true);
    expect(buildAdjacencyMatrix(makeGraph([], [])).cells).toEqual([]);
  });

  it('handles a single vertex', () => {
    const p = analyzeGraph(makeGraph(['A'], []));
    expect(p.isConnected).toBe(true);
    expect(p.isTree).toBe(true); // 1 vertex, 0 edges = V - 1
    expect(p.isolatedVertices).toEqual(['A']);
    expect(p.degrees[0].degree).toBe(0);
  });

  it('handles a graph with vertices but no edges', () => {
    const g = makeGraph(['A', 'B', 'C'], []);
    expect(connectedComponents(g)).toEqual([['A'], ['B'], ['C']]);
    expect(isConnected(g)).toBe(false);
    expect(isolatedVertices(g)).toEqual(['A', 'B', 'C']);
    expect(analyzeGraph(g).isTree).toBe(false);
  });
});

describe('connectivity', () => {
  it('detects a connected graph and its degrees (handshaking lemma)', () => {
    const p = analyzeGraph(simple);
    expect(p.isConnected).toBe(true);
    expect(p.components).toEqual([['A', 'B', 'C', 'D', 'E']]);
    expect(p.degrees.map((d) => [d.id, d.degree])).toEqual([['A', 2], ['B', 2], ['C', 2], ['D', 3], ['E', 1]]);
    expect(p.handshake.sumDegrees).toBe(10);
    expect(p.handshake.holds).toBe(true);
  });

  it('detects a disconnected graph and lists components in vertex order', () => {
    const g = makeGraph(['A', 'B', 'C', 'D'], [['A', 'B'], ['C', 'D']]);
    expect(connectedComponents(g)).toEqual([['A', 'B'], ['C', 'D']]);
    expect(isConnected(g)).toBe(false);
  });

  it('reports isolated vertices', () => {
    const g = makeGraph(['A', 'B', 'C', 'D'], [['A', 'B']]);
    expect(isolatedVertices(g)).toEqual(['C', 'D']);
    expect(connectedComponents(g)).toHaveLength(3);
  });

  it('computes strongly connected components of a digraph', () => {
    const g = makeGraph(['A', 'B', 'C', 'D'], [['A', 'B'], ['B', 'C'], ['C', 'A'], ['C', 'D']], { directed: true });
    expect(stronglyConnectedComponents(g)).toEqual([['A', 'B', 'C'], ['D']]);
    const p = analyzeGraph(g);
    expect(p.isConnected).toBe(true); // weakly connected
    expect(p.isStronglyConnected).toBe(false);
  });
});

describe('cycles and trees', () => {
  it('finds a cycle in an undirected graph', () => {
    const g = makeGraph(['A', 'B', 'C'], [['A', 'B'], ['B', 'C'], ['C', 'A']]);
    expect(hasCycle(g)).toBe(true);
    const cycle = findCycle(g) as string[];
    expect([...cycle].sort()).toEqual(['A', 'B', 'C']);
  });

  it('reports no cycle in a tree and recognises the tree', () => {
    const g = makeGraph(['A', 'B', 'C', 'D'], [['A', 'B'], ['A', 'C'], ['C', 'D']]);
    expect(hasCycle(g)).toBe(false);
    expect(analyzeGraph(g).isTree).toBe(true);
  });

  it('a connected graph with a cycle is not a tree; an acyclic disconnected graph is not a tree', () => {
    expect(analyzeGraph(simple).isTree).toBe(false);
    expect(analyzeGraph(makeGraph(['A', 'B', 'C'], [['A', 'B']])).isTree).toBe(false);
  });

  it('does not treat the edge to the parent as a cycle (single edge)', () => {
    expect(hasCycle(makeGraph(['A', 'B'], [['A', 'B']]))).toBe(false);
  });

  it('detects directed cycles but not a DAG, and tree is not applicable to digraphs', () => {
    const cyc = makeGraph(['A', 'B', 'C'], [['A', 'B'], ['B', 'C'], ['C', 'A']], { directed: true });
    const dag = makeGraph(['A', 'B', 'C'], [['A', 'B'], ['B', 'C'], ['A', 'C']], { directed: true });
    expect(hasCycle(cyc)).toBe(true);
    expect(hasCycle(dag)).toBe(false);
    expect(analyzeGraph(dag).isDag).toBe(true);
    expect(analyzeGraph(dag).isTree).toBeNull();
    expect(analyzeGraph(cyc).isDag).toBe(false);
  });

  it('two opposite directed edges form a directed 2-cycle', () => {
    expect(hasCycle(makeGraph(['A', 'B'], [['A', 'B'], ['B', 'A']], { directed: true }))).toBe(true);
  });
});

describe('bipartite', () => {
  it('recognises an even cycle / K3,3 as bipartite with a valid partition', () => {
    const g = makeGraph(['A', 'B', 'C', 'D'], [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A']]);
    const r = checkBipartite(g);
    expect(r.isBipartite).toBe(true);
    expect(r.partition).toEqual([['A', 'C'], ['B', 'D']]);
  });

  it('rejects an odd cycle', () => {
    const r = checkBipartite(makeGraph(['A', 'B', 'C'], [['A', 'B'], ['B', 'C'], ['C', 'A']]));
    expect(r.isBipartite).toBe(false);
    expect(r.partition).toBeNull();
    expect(r.conflict).not.toBeNull();
  });

  it('checks every component of a disconnected graph', () => {
    const g = makeGraph(['A', 'B', 'C', 'D', 'E'], [['A', 'B'], ['C', 'D'], ['D', 'E'], ['E', 'C']]);
    expect(checkBipartite(g).isBipartite).toBe(false);
  });
});

describe('degrees of directed graphs', () => {
  it('computes in-degree, out-degree and their sums', () => {
    const g = makeGraph(['A', 'B', 'C'], [['A', 'B'], ['A', 'C'], ['B', 'C']], { directed: true });
    const d = Object.fromEntries(computeDegrees(g).map((x) => [x.id, x]));
    expect(d.A).toMatchObject({ inDegree: 0, outDegree: 2, degree: 2 });
    expect(d.B).toMatchObject({ inDegree: 1, outDegree: 1, degree: 2 });
    expect(d.C).toMatchObject({ inDegree: 2, outDegree: 0, degree: 2 });
    const p = analyzeGraph(g);
    expect(p.handshake.sumIn).toBe(3);
    expect(p.handshake.sumOut).toBe(3);
    expect(p.handshake.holds).toBe(true);
  });
});

describe('adjacency representations', () => {
  it('lists neighbours in vertex order', () => {
    const adj = buildAdjacencyList(makeGraph(['A', 'B', 'C'], [['A', 'C'], ['A', 'B']]));
    expect(adj.get('A')?.map((n) => n.to)).toEqual(['B', 'C']);
    expect(adj.get('C')?.map((n) => n.to)).toEqual(['A']);
  });

  it('builds a symmetric 0/1 matrix for undirected graphs', () => {
    const m = buildAdjacencyMatrix(makeGraph(['A', 'B', 'C'], [['A', 'B']]));
    expect(m.cells).toEqual([[0, 1, 0], [1, 0, 0], [0, 0, 0]]);
  });

  it('builds a non-symmetric matrix for digraphs and weight/null cells for weighted graphs', () => {
    const d = buildAdjacencyMatrix(makeGraph(['A', 'B'], [['A', 'B']], { directed: true }));
    expect(d.cells).toEqual([[0, 1], [0, 0]]);
    const w = buildAdjacencyMatrix(makeGraph(['A', 'B', 'C'], [['A', 'B', 0], ['B', 'C', 5]]));
    expect(w.cells).toEqual([[null, 0, null], [0, null, 5], [null, 5, null]]);
  });
});

describe('invalid vertex or edge references', () => {
  it('validateGraph reports unknown vertices, self-loops, duplicates and bad names', () => {
    const bad = makeGraph(['A', 'B'], [['A', 'Z']]);
    expect(validateGraph(bad).join(' ')).toContain('unknown vertex "Z"');
    expect(validateGraph(makeGraph(['A'], [['A', 'A']])).join(' ')).toContain('Self-loop');
    expect(validateGraph(makeGraph(['A', 'B'], [['A', 'B'], ['B', 'A']])).join(' ')).toContain('Duplicate edge');
    expect(validateGraph(makeGraph(['A', 'A'], [])).join(' ')).toContain('Duplicate vertex');
    expect(validateGraph(makeGraph(['bad name'], [])).join(' ')).toContain('Invalid vertex name');
    expect(validateGraph(makeGraph(['_x'], [])).length).toBeGreaterThan(0);
  });

  it('algorithms throw GraphError for a graph with a dangling edge', () => {
    const bad = makeGraph(['A', 'B'], [['A', 'Z']]);
    expect(() => analyzeGraph(bad)).toThrow(GraphError);
    expect(() => buildAdjacencyList(bad)).toThrow(GraphError);
  });

  it('edit operations reject invalid references and keep the graph unchanged', () => {
    const g = makeGraph(['A', 'B'], []);
    expect(() => addEdge(g, 'A', 'Z')).toThrow(/does not exist/);
    expect(() => addEdge(g, 'A', 'A')).toThrow(/Self-loops/);
    expect(() => addVertex(g, 'A')).toThrow(/already exists/);
    expect(() => addVertex(g, 'bad name')).toThrow(/valid vertex name/);
    expect(() => removeVertex(g, 'Q')).toThrow(/does not exist/);
    const g2 = addEdge(g, 'A', 'B');
    expect(() => addEdge(g2, 'B', 'A')).toThrow(/already exists/);
    expect(g.edges).toHaveLength(0);
  });
});

describe('graph edit operations', () => {
  it('removing a vertex removes its incident edges', () => {
    const g = removeVertex(simple, 'D');
    expect(g.vertices.map((v) => v.id)).toEqual(['A', 'B', 'C', 'E']);
    expect(g.edges).toHaveLength(2);
  });

  it('renaming a vertex updates the edges', () => {
    const g = renameVertex(simple, 'A', 'Z');
    expect(g.vertices[0].id).toBe('Z');
    expect(g.edges[0].source).toBe('Z');
    expect(validateGraph(g)).toEqual([]);
    expect(() => renameVertex(simple, 'A', 'B')).toThrow(/already exists/);
  });

  it('converting directed → undirected merges opposite edges', () => {
    const d = makeGraph(['A', 'B', 'C'], [['A', 'B'], ['B', 'A'], ['B', 'C']], { directed: true });
    const { graph, merged } = setDirected(d, false);
    expect(merged).toBe(1);
    expect(graph.edges).toHaveLength(2);
    expect(validateGraph(graph)).toEqual([]);
  });
});
