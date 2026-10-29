import { describe, expect, it } from 'vitest';
import { bfs } from '../algorithms/bfs';
import { dfs } from '../algorithms/dfs';
import { AlgorithmError, GraphError } from '../utils/errors';
import { makeGraph } from './helpers';

/**
 * Neighbour-ordering rule under test: neighbours are explored in the order the vertices
 * appear in the vertex list V (here alphabetical).
 */
const simple = makeGraph(['A', 'B', 'C', 'D', 'E'], [['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'D'], ['D', 'E']]);

describe('BFS', () => {
  it('visits a normal graph level by level in V order', () => {
    const t = bfs(simple, 'A');
    expect(t.result.order).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(t.result.levels).toEqual({ A: 0, B: 1, C: 1, D: 2, E: 3 });
    expect(t.result.parents).toEqual({ A: null, B: 'A', C: 'A', D: 'B', E: 'D' });
    expect(t.result.treeEdges).toHaveLength(4);
  });

  it('only reaches the start vertex component of a disconnected graph', () => {
    const g = makeGraph(['A', 'B', 'C', 'D'], [['A', 'B'], ['C', 'D']]);
    const t = bfs(g, 'A');
    expect(t.result.order).toEqual(['A', 'B']);
    expect(t.result.unreachable).toEqual(['C', 'D']);
    expect(t.steps[t.steps.length - 1].explanation).toContain('cannot be reached');
  });

  it('works on a single vertex', () => {
    const t = bfs(makeGraph(['A'], []), 'A');
    expect(t.result.order).toEqual(['A']);
    expect(t.steps.length).toBeGreaterThanOrEqual(2);
  });

  it('rejects an invalid start vertex and an invalid graph', () => {
    expect(() => bfs(simple, 'Z')).toThrow(AlgorithmError);
    expect(() => bfs(makeGraph([], []), 'A')).toThrow(AlgorithmError);
    expect(() => bfs(makeGraph(['A'], [['A', 'Q']]), 'A')).toThrow(GraphError);
  });

  it('follows edge direction in directed graphs', () => {
    const g = makeGraph(['A', 'B', 'C'], [['B', 'A'], ['B', 'C']], { directed: true });
    expect(bfs(g, 'A').result.order).toEqual(['A']);
    expect(bfs(g, 'B').result.order).toEqual(['B', 'A', 'C']);
  });

  it('records the queue contents at each step', () => {
    const t = bfs(simple, 'A');
    expect(t.steps[0].frontier).toEqual(['A']);
    const afterB = t.steps.find((s) => s.explanation.includes('enqueue') && s.currentEdge && s.visited.includes('C'));
    expect(afterB?.frontier).toEqual(['B', 'C']);
    expect(t.steps[t.steps.length - 1].frontier).toEqual([]);
  });

  it('is deterministic', () => {
    expect(bfs(simple, 'C')).toEqual(bfs(simple, 'C'));
  });

  it('step snapshots are independent (earlier steps are not mutated later)', () => {
    const t = bfs(simple, 'A');
    expect(t.steps[0].visited).toEqual(['A']);
    expect(t.steps[0].order).toEqual([]);
    expect(t.steps.map((s) => s.index)).toEqual(t.steps.map((_, i) => i));
  });
});

describe('DFS', () => {
  it('goes deep first using V order and backtracks', () => {
    const t = dfs(simple, 'A');
    expect(t.result.order).toEqual(['A', 'B', 'D', 'C', 'E']);
    expect(t.result.parents).toEqual({ A: null, B: 'A', D: 'B', C: 'D', E: 'D' });
  });

  it('tracks the recursion stack and backtracking', () => {
    const t = dfs(simple, 'A');
    const maxDepth = Math.max(...t.steps.map((s) => s.frontier.length));
    expect(maxDepth).toBe(4); // A, B, D, C
    expect(t.steps[0].frontier).toEqual(['A']);
    expect(t.steps.some((s) => s.explanation.includes('backtrack'))).toBe(true);
    expect(t.steps[t.steps.length - 1].frontier).toEqual([]);
  });

  it('handles a disconnected graph', () => {
    const g = makeGraph(['A', 'B', 'C', 'D'], [['A', 'B'], ['C', 'D']]);
    const t = dfs(g, 'C');
    expect(t.result.order).toEqual(['C', 'D']);
    expect(t.result.unreachable).toEqual(['A', 'B']);
  });

  it('handles a single vertex and a cycle', () => {
    expect(dfs(makeGraph(['A'], []), 'A').result.order).toEqual(['A']);
    const cyc = makeGraph(['A', 'B', 'C'], [['A', 'B'], ['B', 'C'], ['C', 'A']]);
    expect(dfs(cyc, 'A').result.order).toEqual(['A', 'B', 'C']);
  });

  it('rejects an invalid start vertex', () => {
    expect(() => dfs(simple, 'nope')).toThrow(/not in the graph/);
  });

  it('respects edge direction', () => {
    const g = makeGraph(['A', 'B', 'C'], [['A', 'B'], ['C', 'B']], { directed: true });
    expect(dfs(g, 'A').result.order).toEqual(['A', 'B']);
  });
});
