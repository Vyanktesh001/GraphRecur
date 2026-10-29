import { describe, expect, it } from 'vitest';
import { dijkstra } from '../algorithms/dijkstra';
import { bfsShortestPath } from '../algorithms/shortestPath';
import { AlgorithmError } from '../utils/errors';
import { makeGraph } from './helpers';

describe('BFS shortest path (fewest edges)', () => {
  it('chooses a shortest path among several using neighbour order', () => {
    // Two shortest A→D paths (A,B,D) and (A,C,D); B comes first in V so A,B,D wins.
    const g = makeGraph(['A', 'B', 'C', 'D'], [['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'D']]);
    const r = bfsShortestPath(g, 'A', 'D').result;
    expect(r.path).toEqual(['A', 'B', 'D']);
    expect(r.cost).toBe(2);
    expect(r.costKind).toBe('hops');
    expect(r.edgeIds).toEqual(['e0', 'e2']);
  });

  it('prefers the direct edge over a longer route', () => {
    const g = makeGraph(['A', 'B', 'C'], [['A', 'B'], ['B', 'C'], ['A', 'C']]);
    expect(bfsShortestPath(g, 'A', 'C').result.path).toEqual(['A', 'C']);
  });

  it('reports an unreachable destination', () => {
    const g = makeGraph(['A', 'B', 'C'], [['A', 'B']]);
    const t = bfsShortestPath(g, 'A', 'C');
    expect(t.result.reachable).toBe(false);
    expect(t.result.path).toEqual([]);
    expect(t.result.cost).toBeNull();
    expect(t.steps[t.steps.length - 1].explanation).toContain('no path');
  });

  it('source equal to destination gives a zero-length path', () => {
    const r = bfsShortestPath(makeGraph(['A', 'B'], [['A', 'B']]), 'A', 'A').result;
    expect(r.path).toEqual(['A']);
    expect(r.cost).toBe(0);
  });

  it('rejects unknown source or destination', () => {
    const g = makeGraph(['A', 'B'], [['A', 'B']]);
    expect(() => bfsShortestPath(g, 'X', 'B')).toThrow(AlgorithmError);
    expect(() => bfsShortestPath(g, 'A', 'X')).toThrow(/destination/);
  });
});

describe("Dijkstra's algorithm", () => {
  const weighted = makeGraph(['A', 'B', 'C', 'D'], [['A', 'B', 2], ['A', 'C', 4], ['B', 'C', 1], ['B', 'D', 7], ['C', 'D', 3]]);

  it('finds the weighted shortest path (not the fewest-edges path)', () => {
    const t = dijkstra(weighted, 'A', 'D');
    expect(t.result.path).toEqual(['A', 'B', 'C', 'D']);
    expect(t.result.cost).toBe(6);
    expect(t.result.distances).toEqual({ A: 0, B: 2, C: 3, D: 6 });
    // The fewest-edges path A,B,D costs 9, A,C,D costs 7 - both are worse.
    expect(bfsShortestPath(weighted, 'A', 'D').result.path.length).toBe(3);
  });

  it('shows intermediate distance updates', () => {
    const t = dijkstra(weighted, 'A', 'D');
    const updates = t.steps.filter((s) => s.explanation.startsWith('Relax') && s.explanation.includes('→ update'));
    expect(updates.length).toBeGreaterThanOrEqual(4);
    expect(t.steps[0].distances).toEqual({ A: 0, B: null, C: null, D: null });
    // C was first reached with 4 (via A) and later improved to 3 (via B).
    expect(t.steps.some((s) => s.distances?.C === 4)).toBe(true);
    expect(t.steps[t.steps.length - 1].distances?.C).toBe(3);
  });

  it('handles an unreachable destination', () => {
    const g = makeGraph(['A', 'B', 'C'], [['A', 'B', 1]], { weighted: true });
    const r = dijkstra(g, 'A', 'C').result;
    expect(r.reachable).toBe(false);
    expect(r.cost).toBeNull();
    expect(r.path).toEqual([]);
    expect(r.distances.C).toBeNull();
  });

  it('source equal to destination costs 0', () => {
    const r = dijkstra(weighted, 'B', 'B').result;
    expect(r.path).toEqual(['B']);
    expect(r.cost).toBe(0);
  });

  it('supports zero-weight edges', () => {
    const g = makeGraph(['A', 'B', 'C'], [['A', 'B', 0], ['B', 'C', 0], ['A', 'C', 1]]);
    const r = dijkstra(g, 'A', 'C').result;
    expect(r.cost).toBe(0);
    expect(r.path).toEqual(['A', 'B', 'C']);
  });

  it('rejects negative weights', () => {
    const g = makeGraph(['A', 'B', 'C'], [['A', 'B', 4], ['A', 'C', 2], ['C', 'B', -3]], { directed: true });
    expect(() => dijkstra(g, 'A', 'B')).toThrow(AlgorithmError);
    expect(() => dijkstra(g, 'A', 'B')).toThrow(/non-negative/);
  });

  it('ignores stored weights when the graph is unweighted (every edge counts 1)', () => {
    const g = makeGraph(['A', 'B', 'C'], [['A', 'B', -5], ['B', 'C', 9], ['A', 'C', 1]], { weighted: false });
    expect(dijkstra(g, 'A', 'C').result.cost).toBe(1);
  });

  it('respects direction in directed graphs', () => {
    const g = makeGraph(['A', 'B', 'C'], [['A', 'B', 1], ['C', 'B', 1]], { directed: true });
    expect(dijkstra(g, 'A', 'C').result.reachable).toBe(false);
    expect(dijkstra(g, 'C', 'B').result.cost).toBe(1);
  });

  it('is deterministic when two paths tie', () => {
    const g = makeGraph(['A', 'B', 'C', 'D'], [['A', 'B', 1], ['A', 'C', 1], ['B', 'D', 1], ['C', 'D', 1]]);
    expect(dijkstra(g, 'A', 'D').result.path).toEqual(['A', 'B', 'D']);
  });

  it('example from the sample data: directed weighted graph', () => {
    const g = makeGraph(
      ['A', 'B', 'C', 'D', 'E'],
      [['A', 'B', 4], ['A', 'C', 1], ['C', 'B', 2], ['B', 'D', 1], ['C', 'D', 5], ['D', 'E', 3]],
      { directed: true },
    );
    const r = dijkstra(g, 'A', 'E').result;
    expect(r.path).toEqual(['A', 'C', 'B', 'D', 'E']);
    expect(r.cost).toBe(7);
  });
});
