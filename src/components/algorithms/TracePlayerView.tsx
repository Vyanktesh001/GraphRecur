import { useMemo, useState, type ReactNode } from 'react';
import { ListOrdered } from 'lucide-react';
import { useStepPlayer } from '../../hooks/useStepPlayer';
import { useGraphStore } from '../../store/GraphStore';
import type { AlgorithmTrace, TraceStep } from '../../types/algorithm';
import type { Graph } from '../../types/graph';
import { formatNumber } from '../../utils/format';
import { stepToVisuals, type VisualOptions } from '../../utils/stepVisuals';
import { GraphCanvas } from '../graph/GraphCanvas';
import { Card } from '../ui/Card';
import { StepControls } from './StepControls';

interface Props {
  /** The live graph (with current canvas positions). */
  graph: Graph;
  trace: AlgorithmTrace<unknown>;
  visualOptions?: VisualOptions;
  /** Final result summary, shown beneath the drawing. */
  result?: ReactNode;
}

function Chips({ items, empty = '(empty)' }: { items: string[]; empty?: string }) {
  if (items.length === 0) return <span className="text-sm text-slate-400">{empty}</span>;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((x, i) => (
        <li key={`${x}-${i}`} className="rounded-md border border-slate-300 bg-white px-2 py-0.5 font-mono text-xs text-slate-800">
          {x}
        </li>
      ))}
    </ul>
  );
}

function edgeNames(graph: Graph, ids: string[]): string[] {
  const byId = new Map(graph.edges.map((e) => [e.id, e]));
  return ids.map((id) => {
    const e = byId.get(id);
    if (!e) return id;
    return `${e.source}${graph.directed ? '→' : '–'}${e.target}${graph.weighted ? ` (${formatNumber(e.weight)})` : ''}`;
  });
}

function StateDetails({ graph, trace, step }: { graph: Graph; trace: AlgorithmTrace<unknown>; step: TraceStep }) {
  const kind = trace.algorithm;
  const isMst = kind === 'kruskal' || kind === 'prim';
  return (
    <div className="space-y-4">
      {step.frontierLabel && (
        <div>
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{step.frontierLabel}</h4>
          <Chips items={step.frontier} />
        </div>
      )}
      {kind !== 'kruskal' && kind !== 'prim' && kind !== 'coloring' && (
        <div>
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {kind === 'dijkstra' ? 'Order in which vertices were settled' : 'Traversal order so far'}
          </h4>
          <Chips items={step.order} empty="(none yet)" />
        </div>
      )}
      {kind === 'coloring' && (
        <div>
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Vertices coloured so far (in order)</h4>
          <Chips items={step.order} empty="(none yet)" />
        </div>
      )}
      {isMst && (
        <>
          <div>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Selected edges (total weight {formatNumber(step.totalWeight ?? 0)})</h4>
            <Chips items={edgeNames(graph, step.selectedEdges)} empty="(none yet)" />
          </div>
          <div>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Rejected edges (would form a cycle)</h4>
            <Chips items={edgeNames(graph, step.rejectedEdges)} empty="(none yet)" />
          </div>
        </>
      )}
    </div>
  );
}

function VertexTable({ graph, trace, step, visuals }: { graph: Graph; trace: AlgorithmTrace<unknown>; step: TraceStep; visuals: ReturnType<typeof stepToVisuals> }) {
  const hasDist = Boolean(step.distances);
  const hasParents = Boolean(step.parents);
  const distHeader = trace.algorithm === 'dijkstra' ? 'Distance' : 'Level (hops)';
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full text-sm">
        <caption className="sr-only">State of every vertex at this step</caption>
        <thead className="bg-slate-50 text-left text-xs text-slate-500">
          <tr>
            <th scope="col" className="px-3 py-2">Vertex</th>
            <th scope="col" className="px-3 py-2">State</th>
            {hasDist && <th scope="col" className="px-3 py-2">{distHeader}</th>}
            {hasParents && <th scope="col" className="px-3 py-2">Parent</th>}
          </tr>
        </thead>
        <tbody>
          {graph.vertices.map((v) => {
            const vis = visuals.vertices[v.id];
            const d = step.distances?.[v.id];
            return (
              <tr key={v.id} className={`border-t border-slate-100 ${step.currentVertex === v.id ? 'bg-amber-50' : ''}`}>
                <th scope="row" className="px-3 py-1.5 text-left font-semibold text-navy-900">{v.id}</th>
                <td className="px-3 py-1.5">
                  {vis?.label}
                  {vis && vis.tags.length > 0 && <span className="ml-1 text-xs text-slate-500">({vis.tags.join(', ')})</span>}
                </td>
                {hasDist && <td className="px-3 py-1.5 font-mono">{d === null || d === undefined ? '∞' : formatNumber(d)}</td>}
                {hasParents && <td className="px-3 py-1.5 font-mono">{step.parents?.[v.id] ?? '—'}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Drawing + step controls + explanation + recorded state for one algorithm trace. */
export function TracePlayerView({ graph, trace, visualOptions, result }: Props) {
  const { setGraph } = useGraphStore();
  const [speed, setSpeed] = useState(900);
  const player = useStepPlayer(trace.steps, speed);
  const step = player.item as TraceStep;
  const visuals = useMemo(() => stepToVisuals(graph, trace.algorithm, step, visualOptions), [graph, trace.algorithm, step, visualOptions]);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="space-y-4">
        <Card title={trace.title} description="Vertices show their state as text under the circle; the badge shows visit order, distance or colour.">
          <GraphCanvas graph={graph} visuals={visuals} showStatusText onGraphChange={setGraph} className="h-[440px]" ariaLabel={`${trace.title}. Current state is listed in the table next to the drawing.`} />
          <div className="mt-4">
            <StepControls player={player} speedMs={speed} onSpeedChange={setSpeed} />
          </div>
        </Card>
        <Card title="What is happening in this step?" actions={<ListOrdered className="h-5 w-5 text-navy-500" aria-hidden />}>
          <p className="text-sm leading-relaxed text-slate-800" aria-live="polite" data-testid="step-explanation">
            <span className="mr-2 rounded bg-navy-100 px-1.5 py-0.5 text-xs font-semibold text-navy-800">Step {step.index + 1}</span>
            {step.explanation}
          </p>
        </Card>
        {result}
      </div>
      <div className="space-y-4">
        <Card title="Algorithm state">
          <StateDetails graph={graph} trace={trace} step={step} />
        </Card>
        <Card title="Vertex states" description="Text labels for each vertex at this step.">
          <VertexTable graph={graph} trace={trace} step={step} visuals={visuals} />
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600" aria-label="How to read the drawing">
            <li>Dashed border = waiting in the queue / on the stack</li>
            <li>Dark filled + gold ring = current vertex</li>
            <li>Thick blue edge = tree edge</li>
            <li>Dashed red edge = rejected</li>
            <li>Gold glow = edge examined now</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
