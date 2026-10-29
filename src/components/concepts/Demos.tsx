import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { buildAdjacencyList, buildAdjacencyMatrix } from '../../algorithms/adjacency';
import { bfs } from '../../algorithms/bfs';
import { dfs } from '../../algorithms/dfs';
import { dijkstra } from '../../algorithms/dijkstra';
import { greedyColoring } from '../../algorithms/graphColoring';
import { analyzeGraph } from '../../algorithms/graphProperties';
import { kruskal } from '../../algorithms/kruskal';
import { prim } from '../../algorithms/prim';
import { bfsShortestPath } from '../../algorithms/shortestPath';
import { getExample, instantiateExample } from '../../content/exampleGraphs';
import type { DemoSpec, GraphFact } from '../../content/concepts';
import { useStepPlayer } from '../../hooks/useStepPlayer';
import { generateSequence } from '../../recurrence/generateSequence';
import { MAX_TERMS, parseNumberInput } from '../../recurrence/recurrenceValidation';
import type { AlgorithmTrace, TraceStep } from '../../types/algorithm';
import type { Graph } from '../../types/graph';
import type { RecurrenceResult } from '../../types/recurrence';
import { formatNumber } from '../../utils/format';
import { plainVisuals, stepToVisuals } from '../../utils/stepVisuals';
import { StepControls } from '../algorithms/StepControls';
import { GraphCanvas } from '../graph/GraphCanvas';
import { Alert } from '../ui/Feedback';
import { TextField } from '../ui/Fields';

function useExampleGraph(exampleId: string): Graph {
  return useMemo(() => instantiateExample(getExample(exampleId)), [exampleId]);
}

const yes = (b: boolean) => (b ? 'Yes' : 'No');

function GraphFactsDemo({ exampleId, facts }: { exampleId: string; facts: GraphFact[] }) {
  const graph = useExampleGraph(exampleId);
  const props = useMemo(() => analyzeGraph(graph), [graph]);
  const visuals = useMemo(() => plainVisuals(graph), [graph]);
  const adj = useMemo(() => buildAdjacencyList(graph), [graph]);
  const matrix = useMemo(() => buildAdjacencyMatrix(graph), [graph]);
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        Example graph: <strong>{graph.name}</strong> — {getExample(exampleId).description}
      </p>
      <GraphCanvas graph={graph} visuals={visuals} className="h-64" ariaLabel={`Drawing of the example graph ${graph.name}`} />
      <div className="space-y-2 text-sm text-slate-800">
        {facts.includes('degrees') && (
          <p>
            <strong>Degrees:</strong>{' '}
            <span className="font-mono">
              {props.degrees.map((d) => (graph.directed ? `${d.id}(in ${d.inDegree}, out ${d.outDegree})` : `deg(${d.id}) = ${d.degree}`)).join(', ')}
            </span>
          </p>
        )}
        {facts.includes('handshake') && (
          <p>
            <strong>Handshaking:</strong> Σ deg = {props.handshake.sumDegrees} and 2|E| = {2 * props.edgeCount} → {props.handshake.holds ? 'equal ✓' : 'not equal ✗'}
          </p>
        )}
        {facts.includes('list') && (
          <div>
            <strong>Adjacency list:</strong>
            <ul className="mt-1 font-mono text-xs">
              {graph.vertices.map((v) => (
                <li key={v.id}>
                  {v.id} → {(adj.get(v.id) ?? []).map((n) => (graph.weighted ? `${n.to}(${n.weight})` : n.to)).join(', ') || '∅'}
                </li>
              ))}
            </ul>
          </div>
        )}
        {facts.includes('matrix') && (
          <div className="overflow-x-auto">
            <strong>Adjacency matrix:</strong>
            <pre className="mt-1 font-mono text-xs leading-5">
              {'    ' + matrix.labels.map((l) => l.padStart(3)).join('') + '\n'}
              {matrix.cells.map((row, i) => matrix.labels[i].padEnd(4) + row.map((c) => (c === null ? '  –' : String(c).padStart(3))).join('')).join('\n')}
            </pre>
          </div>
        )}
        {facts.includes('components') && (
          <p>
            <strong>Components:</strong> {props.components.length} → <span className="font-mono">{props.components.map((c) => `{${c.join(', ')}}`).join(' ')}</span>; connected: {yes(props.isConnected)}
          </p>
        )}
        {facts.includes('cycle') && (
          <p>
            <strong>Cycle:</strong> {props.cycle ? `yes, e.g. ${[...props.cycle, props.cycle[0]].join(' – ')}` : 'no cycle'} (|E| = {props.edgeCount}, |V| − c = {props.vertexCount - props.components.length})
          </p>
        )}
        {facts.includes('tree') && (
          <p>
            <strong>Tree:</strong> {yes(Boolean(props.isTree))} (connected: {yes(props.isConnected)}, cycle: {yes(props.hasCycle)}, |E| = {props.edgeCount}, |V| − 1 = {props.vertexCount - 1})
          </p>
        )}
        {facts.includes('bipartite') && (
          <p>
            <strong>Bipartite:</strong> {yes(props.bipartite.isBipartite)}
            {props.bipartite.partition && (
              <span className="font-mono"> — sides {`{${props.bipartite.partition[0].join(', ')}}`} and {`{${props.bipartite.partition[1].join(', ')}}`}</span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

function TraceDemo({ spec }: { spec: Extract<DemoSpec, { type: 'trace' }> }) {
  const graph = useExampleGraph(spec.exampleId);
  const start = spec.start ?? graph.vertices[0].id;
  const trace = useMemo<AlgorithmTrace<unknown>>(() => {
    switch (spec.algorithm) {
      case 'bfs': return bfs(graph, start);
      case 'dfs': return dfs(graph, start);
      case 'dijkstra': return dijkstra(graph, start, spec.target ?? graph.vertices[graph.vertices.length - 1].id);
      case 'bfs-path': return bfsShortestPath(graph, start, spec.target ?? graph.vertices[graph.vertices.length - 1].id);
      case 'kruskal': return kruskal(graph);
      case 'prim': return prim(graph, start);
      case 'coloring': return greedyColoring(graph);
    }
  }, [spec, graph, start]);
  const [speed, setSpeed] = useState(900);
  const player = useStepPlayer(trace.steps, speed);
  const step = player.item as TraceStep;
  const visuals = useMemo(() => stepToVisuals(graph, trace.algorithm, step, { source: start, target: spec.target }), [graph, trace.algorithm, step, start, spec.target]);
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        {trace.title} on <strong>{graph.name}</strong>. Use the controls to step forwards and backwards.
      </p>
      <GraphCanvas graph={graph} visuals={visuals} showStatusText className="h-72" ariaLabel={`${trace.title} demonstration`} />
      <StepControls player={player} speedMs={speed} onSpeedChange={setSpeed} />
      <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-800" aria-live="polite">
        {step.explanation}
      </p>
      {step.frontier.length > 0 && (
        <p className="text-sm text-slate-700">
          <strong>{step.frontierLabel}:</strong> <span className="font-mono">{step.frontier.join(', ')}</span>
        </p>
      )}
      <p className="text-xs text-slate-500">
        Want to try your own graph? Open the{' '}
        <Link className="font-medium underline" to="/algorithms">
          Algorithm Simulator
        </Link>
        .
      </p>
    </div>
  );
}

function SequenceDemo({ preset }: { preset: 'fibonacci' | 'arithmetic' | 'geometric' | 'second-order' }) {
  const [a0, setA0] = useState(preset === 'fibonacci' ? '0' : '2');
  const [param, setParam] = useState(preset === 'geometric' ? '3' : preset === 'arithmetic' ? '4' : '1');
  const [count, setCount] = useState('10');

  const view = useMemo((): { error: string } | { result: RecurrenceResult; check: string } => {
    const first = parseNumberInput(a0);
    const p = parseNumberInput(param);
    const n = parseNumberInput(count);
    if ('error' in first) return { error: `First term: ${first.error}` };
    if ('error' in p) return { error: `Parameter: ${p.error}` };
    if ('error' in n) return { error: `Number of terms: ${n.error}` };
    try {
      let config;
      let check: string;

      if (preset === 'second-order') {
        config = { coefficients: [3, -2], initial: [0, 1], count: n.value };
      } else if (preset === 'fibonacci') {
        config = { coefficients: [1, 1], initial: [first.value, p.value], count: n.value };
      } else if (preset === 'arithmetic') {
        config = { coefficients: [2, -1], initial: [first.value, first.value + p.value], count: n.value };
      } else {
        config = { coefficients: [p.value], initial: [first.value], count: n.value };
      }
      const result = generateSequence(config);
      const terms = result.terms;
      if (preset === 'second-order') {
        const ok = terms.every((t, i) => t === 2 ** i - 1);
        check = `Hand-solved formula a(n) = 2ⁿ − 1 matches every generated term: ${ok ? 'yes ✓' : 'no ✗'}`;
      } else if (preset === 'fibonacci') {
        if (first.value === 0 && p.value === 1 && terms.length + 2 <= MAX_TERMS) {
          const more = generateSequence({ ...config, count: terms.length + 2 }).terms;
          const sum = terms.reduce((s, t) => s + t, 0);
          const target = more[terms.length + 1] - 1;
          check = `Σ F(0..${terms.length - 1}) = ${formatNumber(sum)}. The identity Σ F(0..n) = F(n+2) − 1 predicts F(${terms.length + 1}) − 1 = ${formatNumber(target)} → ${sum === target ? 'equal ✓' : 'not equal ✗'}`;
        } else {
          check = 'The sum identity F(0) + … + F(n) = F(n+2) − 1 applies to the classic start 0, 1.';
        }
      } else if (preset === 'arithmetic') {
        const ok = terms.every((t, i) => t === first.value + i * p.value);
        const sum = terms.reduce((s, t) => s + t, 0);
        const formula = (terms.length * (2 * first.value + (terms.length - 1) * p.value)) / 2;
        check = `Closed form a(0) + n·d matches every term: ${ok ? 'yes ✓' : 'no ✗'}. Sum = ${formatNumber(sum)}; formula N(2a₀ + (N−1)d)/2 = ${formatNumber(formula)}.`;
      } else {
        const ok = terms.every((t, i) => Math.abs(t - first.value * p.value ** i) <= 1e-9 * Math.max(1, Math.abs(t)));
        check = `Closed form a(0)·rⁿ matches every term: ${ok ? 'yes ✓' : 'no ✗'}.`;
      }
      return { result, check };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }, [preset, a0, param, count]);

  const labels =
    preset === 'fibonacci'
      ? ['a(0)', 'a(1)']
      : preset === 'arithmetic'
        ? ['First term a(0)', 'Common difference d']
        : preset === 'geometric'
          ? ['First term a(0)', 'Common ratio r']
          : null;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        {labels && (
          <>
            <TextField label={labels[0]} value={a0} onChange={(e) => setA0(e.target.value)} inputMode="decimal" />
            <TextField label={labels[1]} value={param} onChange={(e) => setParam(e.target.value)} inputMode="decimal" />
          </>
        )}
        <TextField label="Number of terms" value={count} onChange={(e) => setCount(e.target.value)} inputMode="numeric" />
      </div>
      {'error' in view ? (
        <Alert kind="error">{view.error}</Alert>
      ) : (
        (
          <div className="space-y-2 text-sm">
            <p>
              <strong>Recurrence:</strong> <span className="font-mono">{view.result.formula}</span>
              {' · '}
              <span className="font-mono">{view.result.initialConditions.join(', ')}</span>
            </p>
            <p className="font-mono">{view.result.terms.slice(0, 30).map(formatNumber).join(', ')}{view.result.terms.length > 30 ? ', …' : ''}</p>
            <p className="text-slate-700">{view.check}</p>
            {view.result.warnings.map((w) => (
              <Alert key={w.code} kind="warning">{w.message}</Alert>
            ))}
            <Link to="/recurrence" className="inline-flex items-center gap-1 font-medium text-navy-700 underline">
              Open the Recurrence Lab <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        )
      )}
    </div>
  );
}

export function ConceptDemo({ spec }: { spec: DemoSpec }) {
  switch (spec.type) {
    case 'graph-facts':
      return <GraphFactsDemo exampleId={spec.exampleId} facts={spec.facts} />;
    case 'trace':
      return <TraceDemo spec={spec} />;
    case 'sequence':
      return <SequenceDemo preset={spec.preset} />;
    case 'link':
      return (
        <Link to={spec.to} className="inline-flex items-center gap-1 font-medium text-navy-700 underline">
          {spec.label} <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      );
  }
}
