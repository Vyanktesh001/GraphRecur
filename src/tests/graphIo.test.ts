import { describe, expect, it } from 'vitest';
import { EXAMPLE_GRAPHS, instantiateExample } from '../content/exampleGraphs';
import { GraphError } from '../utils/errors';
import { validateGraph } from '../utils/graph';
import { exportGraphJson, parseGraphJson } from '../utils/graphJson';
import { graphToText, parseGraphText } from '../utils/graphText';

describe('parseGraphText (manual input)', () => {
  it('parses the specification example', () => {
    const r = parseGraphText('A, B, C, D, E', 'A-B\nA-C\nB-D\nC-D\nD-E', { directed: false, weighted: false });
    expect(r.errors).toEqual([]);
    expect(r.graph?.vertices.map((v) => v.id)).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(r.graph?.edges.map((e) => `${e.source}${e.target}`)).toEqual(['AB', 'AC', 'BD', 'CD', 'DE']);
  });

  it('parses weights in several notations', () => {
    const r = parseGraphText('A B C D', 'A-B 2\nA-C: 4\nB-C, weight 1\nB->D (7)\nC,D,3', { directed: false, weighted: true });
    expect(r.errors).toEqual([]);
    expect(r.graph?.edges.map((e) => e.weight)).toEqual([2, 4, 1, 7, 3]);
  });

  it('accepts negative and decimal weights, and semicolons as separators', () => {
    const r = parseGraphText('A,B,C', 'A-B -2.5; B-C 0', { directed: true, weighted: true });
    expect(r.graph?.edges.map((e) => e.weight)).toEqual([-2.5, 0]);
  });

  it('reports every problem with line numbers and changes nothing', () => {
    const r = parseGraphText('A, B, B, _bad', 'A-Z\nA-A\nhello world\nA-B\nB-A', { directed: false, weighted: false });
    expect(r.graph).toBeNull();
    const text = r.errors.join('\n');
    expect(text).toContain('listed more than once');
    expect(text).toContain('Invalid vertex name "_bad"');
    expect(text).toContain('Edge line 1');
    expect(text).toContain('not in the vertex list');
    expect(text).toContain('self-loop');
    expect(text).toContain('not a valid edge');
    expect(text).toContain('more than once');
  });

  it('rejects weights on an unweighted graph', () => {
    const r = parseGraphText('A,B', 'A-B 3', { directed: false, weighted: false });
    expect(r.errors.join(' ')).toContain('unweighted');
  });

  it('directed graphs allow both A->B and B->A', () => {
    const r = parseGraphText('A,B', 'A->B\nB->A', { directed: true, weighted: false });
    expect(r.errors).toEqual([]);
    expect(r.graph?.edges).toHaveLength(2);
  });

  it('keeps the positions of existing vertices', () => {
    const base = instantiateExample(EXAMPLE_GRAPHS[0]);
    const r = parseGraphText('A, B, Z', 'A-B', { directed: false, weighted: false, existing: base });
    const a = base.vertices.find((v) => v.id === 'A');
    expect(r.graph?.vertices[0]).toMatchObject({ id: 'A', x: a?.x, y: a?.y });
    expect(r.graph?.id).toBe(base.id);
  });

  it('round-trips with graphToText', () => {
    const g = instantiateExample(EXAMPLE_GRAPHS.find((e) => e.id === 'directed-weighted') ?? EXAMPLE_GRAPHS[0]);
    const t = graphToText(g);
    const r = parseGraphText(t.vertices, t.edges, { directed: g.directed, weighted: g.weighted });
    expect(r.graph?.edges.map((e) => [e.source, e.target, e.weight])).toEqual(g.edges.map((e) => [e.source, e.target, e.weight]));
  });
});

describe('JSON import / export', () => {
  it('round-trips a graph and gives imports a fresh id', () => {
    const g = instantiateExample(EXAMPLE_GRAPHS[3]);
    const back = parseGraphJson(exportGraphJson(g));
    expect(back.id).not.toBe(g.id);
    expect(back.vertices).toEqual(g.vertices);
    expect(back.edges).toEqual(g.edges);
    expect(back.weighted).toBe(true);
  });

  it('fills in missing ids, positions and weights', () => {
    const g = parseGraphJson(JSON.stringify({ name: 'x', vertices: ['A', 'B'], edges: [{ source: 'A', target: 'B' }] }));
    expect(g.edges[0].weight).toBe(1);
    expect(g.edges[0].id).toBeTruthy();
    expect(Number.isFinite(g.vertices[0].x)).toBe(true);
  });

  it.each([
    ['not json', /not valid JSON/],
    ['{"vertices": 3, "edges": []}', /"vertices" array/],
    ['{"vertices": ["A"], "edges": [{"source":"A","target":"Q"}]}', /unknown vertex "Q"/],
    ['{"vertices": ["A","A"], "edges": []}', /Duplicate vertex/],
    ['{"vertices": ["A"], "edges": [{"source":"A","target":"A"}]}', /Self-loop/],
    ['{"vertices": ["A","B"], "edges": [{"source":"A","target":"B","weight":"heavy"}]}', /weight/],
    ['[1,2,3]', /graph object/],
  ])('rejects bad input: %s', (text, message) => {
    expect(() => parseGraphJson(text)).toThrow(GraphError);
    expect(() => parseGraphJson(text)).toThrow(message);
  });
});

describe('example graphs', () => {
  it.each(EXAMPLE_GRAPHS.map((e) => [e.name, e] as const))('%s is a valid simple graph', (_name, example) => {
    expect(validateGraph(instantiateExample(example))).toEqual([]);
  });
});
