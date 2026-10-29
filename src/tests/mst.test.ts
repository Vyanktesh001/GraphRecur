import { describe, expect, it } from 'vitest';
import { exactChromaticNumber, greedyColoring, isProperColoring } from '../algorithms/graphColoring';
import { kruskal } from '../algorithms/kruskal';
import { prim } from '../algorithms/prim';
import { AlgorithmError } from '../utils/errors';
import { makeGraph } from './helpers';

const weighted = makeGraph(['A', 'B', 'C', 'D'], [['A', 'B', 2], ['A', 'C', 4], ['B', 'C', 1], ['B', 'D', 7], ['C', 'D', 3]]);

describe('minimum spanning tree', () => {
  it.each([
    ['Kruskal', () => kruskal(weighted)],
    ['Prim', () => prim(weighted)],
  ])('%s finds the MST of a connected weighted graph', (_name, run) => {
    const t = run();
    expect(t.result.totalWeight).toBe(6);
    expect(t.result.edgeIds.length).toBe(3);
    expect(t.result.isSpanningTree).toBe(true);
    expect([...t.result.edgeIds].sort()).toEqual(['e0', 'e2', 'e4']); // A-B, B-C, C-D
  });

  it('Kruskal explains selected and rejected edges in sorted order', () => {
    const t = kruskal(weighted);
    const text = t.steps.map((s) => s.explanation).join('\n');
    expect(text).toContain('SELECT');
    expect(t.steps[0].explanation).toContain('Sort all edges');
    // Sorted order: B-C(1), A-B(2), C-D(3) selected → spanning tree complete before A-C(4) is examined.
    expect(t.steps[t.steps.length - 1].selectedEdges).toEqual(['e2', 'e0', 'e4']);
  });

  it('Kruskal rejects an edge that would form a cycle', () => {
    const g = makeGraph(['A', 'B', 'C', 'D'], [['A', 'B', 1], ['B', 'C', 2], ['A', 'C', 3], ['C', 'D', 4]]);
    const t = kruskal(g);
    expect(t.steps.some((s) => s.explanation.includes('REJECT'))).toBe(true);
    expect(t.result.totalWeight).toBe(7);
  });

  it('Prim records rejected edges when both endpoints are already in the tree', () => {
    const g = makeGraph(['A', 'B', 'C'], [['A', 'B', 1], ['B', 'C', 2], ['A', 'C', 3]]);
    const t = prim(g, 'A');
    expect(t.result.totalWeight).toBe(3);
    expect(t.steps.some((s) => s.explanation.includes('REJECT'))).toBe(true);
  });

  it('graphs with several valid MSTs give the same total weight', () => {
    const tri = makeGraph(['A', 'B', 'C'], [['A', 'B', 1], ['B', 'C', 1], ['A', 'C', 1]]);
    const k = kruskal(tri).result;
    const p = prim(tri).result;
    expect(k.totalWeight).toBe(2);
    expect(p.totalWeight).toBe(2);
    expect(k.edgeIds).toHaveLength(2);
    // Deterministic tie-breaking: edge order decides.
    expect(k.edgeIds).toEqual(['e0', 'e1']);
  });

  it.each([
    ['Kruskal', kruskal],
    ['Prim', (g: ReturnType<typeof makeGraph>) => prim(g)],
  ])('%s returns a minimum spanning forest for a disconnected graph', (_name, run) => {
    const g = makeGraph(['A', 'B', 'C', 'D', 'E'], [['A', 'B', 3], ['C', 'D', 1], ['D', 'E', 2], ['C', 'E', 5]]);
    const t = run(g);
    expect(t.result.isSpanningTree).toBe(false);
    expect(t.result.componentCount).toBe(2);
    expect(t.result.edgeIds).toHaveLength(3); // V - k = 5 - 2
    expect(t.result.totalWeight).toBe(6);
    expect(t.steps[t.steps.length - 1].explanation).toContain('spanning FOREST');
  });

  it.each([
    ['Kruskal', kruskal],
    ['Prim', (g: ReturnType<typeof makeGraph>) => prim(g)],
  ])('%s handles a single vertex, no edges, and the empty graph', (_name, run) => {
    const single = run(makeGraph(['A'], []));
    expect(single.result.edgeIds).toEqual([]);
    expect(single.result.totalWeight).toBe(0);
    expect(single.result.isSpanningTree).toBe(true);
    const none = run(makeGraph(['A', 'B'], []));
    expect(none.result.componentCount).toBe(2);
    expect(none.result.isSpanningTree).toBe(false);
    const empty = run(makeGraph([], []));
    expect(empty.result.isSpanningTree).toBe(false);
    expect(empty.steps.length).toBe(1);
  });

  it('supports negative weights (MST algorithms remain correct) and agrees across algorithms', () => {
    const g = makeGraph(['A', 'B', 'C', 'D'], [['A', 'B', -2], ['B', 'C', 3], ['A', 'C', -1], ['C', 'D', 4], ['B', 'D', -5]]);
    const k = kruskal(g).result;
    const p = prim(g).result;
    expect(k.totalWeight).toBe(-8); // B-D(-5), A-B(-2), A-C(-1)
    expect(p.totalWeight).toBe(-8);
  });

  it('rejects directed graphs', () => {
    const d = makeGraph(['A', 'B'], [['A', 'B', 1]], { directed: true });
    expect(() => kruskal(d)).toThrow(AlgorithmError);
    expect(() => prim(d)).toThrow(/undirected/);
  });

  it('Prim rejects an unknown start vertex and honours a custom one', () => {
    expect(() => prim(weighted, 'Q')).toThrow(AlgorithmError);
    expect(prim(weighted, 'D').result.totalWeight).toBe(6);
  });

  it('Kruskal and Prim agree on random graphs (property check against brute force)', () => {
    let seed = 42;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    for (let trial = 0; trial < 25; trial += 1) {
      const n = 3 + Math.floor(rnd() * 4);
      const ids = Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i));
      const edges: [string, string, number][] = [];
      for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) if (rnd() < 0.6) edges.push([ids[i], ids[j], Math.floor(rnd() * 10) - 2]);
      const g = makeGraph(ids, edges, { weighted: true });
      const k = kruskal(g).result;
      const p = prim(g).result;
      expect(p.totalWeight).toBe(k.totalWeight);
      expect(p.edgeIds.length).toBe(k.edgeIds.length);
    }
  });
});

describe('graph colouring', () => {
  it('colours a triangle with 3 colours properly', () => {
    const g = makeGraph(['A', 'B', 'C'], [['A', 'B'], ['B', 'C'], ['C', 'A']]);
    const r = greedyColoring(g).result;
    expect(r.colorCount).toBe(3);
    expect(r.isProper).toBe(true);
    expect(isProperColoring(g, r.colors)).toBe(true);
    expect(r.chromaticNumber).toBe(3);
  });

  it('colours a bipartite graph with 2 colours', () => {
    const g = makeGraph(['A', 'B', 'C', 'D'], [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A']]);
    expect(greedyColoring(g).result.colorCount).toBe(2);
  });

  it('gives every vertex colour 1 when there are no edges and handles the empty graph', () => {
    const r = greedyColoring(makeGraph(['A', 'B'], [])).result;
    expect(r.colors).toEqual({ A: 1, B: 1 });
    expect(greedyColoring(makeGraph([], [])).result.colorCount).toBe(0);
  });

  it('shows that greedy is not always optimal: bad vertex order on a bipartite graph', () => {
    // Path-like "crown" graph: order A1,B1,A2,B2,A3,B3 with edges Ai-Bj (i≠j) forces 3 colours,
    // although the graph is bipartite (χ = 2).
    const ids = ['A1', 'B1', 'A2', 'B2', 'A3', 'B3'];
    const edges: [string, string][] = [['A1', 'B2'], ['A1', 'B3'], ['A2', 'B1'], ['A2', 'B3'], ['A3', 'B1'], ['A3', 'B2']];
    const g = makeGraph(ids, edges);
    const r = greedyColoring(g, 'given').result;
    expect(r.isProper).toBe(true);
    expect(r.chromaticNumber).toBe(2);
    expect(r.colorCount).toBe(3);
  });

  it('computes exact chromatic numbers', () => {
    const k4 = makeGraph(['A', 'B', 'C', 'D'], [['A', 'B'], ['A', 'C'], ['A', 'D'], ['B', 'C'], ['B', 'D'], ['C', 'D']]);
    expect(exactChromaticNumber(k4)).toBe(4);
    const c5 = makeGraph(['A', 'B', 'C', 'D', 'E'], [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'E'], ['E', 'A']]);
    expect(exactChromaticNumber(c5)).toBe(3);
    expect(exactChromaticNumber(makeGraph([], []))).toBe(0);
    const big = makeGraph(Array.from({ length: 13 }, (_, i) => `V${i}`), []);
    expect(exactChromaticNumber(big)).toBeNull();
  });

  it('ignores edge direction and supports degree ordering', () => {
    const g = makeGraph(['A', 'B', 'C', 'D'], [['A', 'B'], ['C', 'B'], ['D', 'B']], { directed: true });
    const r = greedyColoring(g, 'degree').result;
    expect(r.order[0]).toBe('B');
    expect(r.isProper).toBe(true);
    expect(r.colorCount).toBe(2);
  });
});
