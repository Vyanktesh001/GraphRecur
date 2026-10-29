import { useMemo, type ReactNode } from 'react';
import { analyzeGraph } from '../../algorithms/graphProperties';
import type { Graph } from '../../types/graph';
import { Badge } from '../ui/Feedback';

function Fact({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-navy-900">{children}</dd>
      {hint && <p className="mt-1 text-xs font-normal text-slate-500">{hint}</p>}
    </div>
  );
}

const yesNo = (b: boolean) => <Badge tone={b ? 'green' : 'neutral'}>{b ? 'Yes' : 'No'}</Badge>;
const NA = <Badge tone="neutral">Not applicable</Badge>;

export function GraphPropertiesPanel({ graph }: { graph: Graph }) {
  const p = useMemo(() => analyzeGraph(graph), [graph]);
  const compText = p.components.map((c) => `{${c.join(', ')}}`).join('  ');

  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Fact label="Vertices |V|">{p.vertexCount}</Fact>
        <Fact label="Edges |E|">{p.edgeCount}</Fact>
        <Fact label="Type">{p.directed ? 'Directed' : 'Undirected'}{p.weighted ? ', weighted' : ''}</Fact>
        <Fact label="Isolated vertices" hint="Vertices with no incident edge.">
          {p.isolatedVertices.length === 0 ? 'None' : p.isolatedVertices.join(', ')}
        </Fact>
      </dl>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-navy-900">Degrees</h3>
        {p.vertexCount === 0 ? (
          <p className="text-sm text-slate-500">No vertices.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-sm">
              <caption className="sr-only">Degree of every vertex</caption>
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th scope="col" className="px-3 py-2">Vertex</th>
                  {p.directed ? (
                    <>
                      <th scope="col" className="px-3 py-2">In-degree</th>
                      <th scope="col" className="px-3 py-2">Out-degree</th>
                      <th scope="col" className="px-3 py-2">Total degree</th>
                    </>
                  ) : (
                    <th scope="col" className="px-3 py-2">Degree</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {p.degrees.map((d) => (
                  <tr key={d.id} className="border-t border-slate-100">
                    <th scope="row" className="px-3 py-1.5 text-left font-semibold text-navy-900">{d.id}</th>
                    {p.directed ? (
                      <>
                        <td className="px-3 py-1.5">{d.inDegree}</td>
                        <td className="px-3 py-1.5">{d.outDegree}</td>
                        <td className="px-3 py-1.5">{d.degree}</td>
                      </>
                    ) : (
                      <td className="px-3 py-1.5">{d.degree}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-sm text-slate-600">
          {p.directed
            ? `Handshaking for digraphs: Σ in-degree = ${p.handshake.sumIn}, Σ out-degree = ${p.handshake.sumOut}, |E| = ${p.handshake.edgeCount} → ${p.handshake.holds ? 'equal ✓' : 'NOT equal ✗'}`
            : `Handshaking lemma: Σ deg(v) = ${p.handshake.sumDegrees} and 2|E| = ${2 * p.handshake.edgeCount} → ${p.handshake.holds ? 'equal ✓' : 'NOT equal ✗'}`}
        </p>
      </div>

      <section aria-labelledby="props-shared">
        <h3 id="props-shared" className="mb-2 text-sm font-semibold text-navy-900">
          {p.directed ? 'Connectivity and cycles (directed graph)' : 'Connectivity and structure (undirected graph)'}
        </h3>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Fact
            label={p.directed ? 'Weakly connected' : 'Connected'}
            hint={p.directed ? 'Connected when edge directions are ignored.' : 'Every vertex can reach every other vertex.'}
          >
            {p.vertexCount === 0 ? 'No (empty graph has no component)' : yesNo(p.isConnected)}
          </Fact>
          <Fact label={p.directed ? 'Weakly connected components' : 'Connected components'} hint={compText || undefined}>
            {p.components.length}
          </Fact>
          {p.directed && p.stronglyConnectedComponents && (
            <>
              <Fact label="Strongly connected" hint="Every vertex can reach every other following edge directions.">
                {p.vertexCount === 0 ? '—' : yesNo(Boolean(p.isStronglyConnected))}
              </Fact>
              <Fact label="Strongly connected components" hint={p.stronglyConnectedComponents.map((c) => `{${c.join(', ')}}`).join('  ')}>
                {p.stronglyConnectedComponents.length}
              </Fact>
            </>
          )}
          <Fact label={p.directed ? 'Contains a directed cycle' : 'Contains a cycle'} hint={p.cycle ? `Example: ${[...p.cycle, p.cycle[0]].join(p.directed ? ' → ' : ' – ')}` : undefined}>
            {yesNo(p.hasCycle)}
          </Fact>
          {p.directed ? (
            <Fact label="Directed acyclic graph (DAG)">{p.isDag === null ? NA : yesNo(p.isDag)}</Fact>
          ) : (
            <Fact label="Tree" hint="A tree is a connected graph with no cycle (equivalently: connected and |E| = |V| − 1).">
              {p.isTree === null ? NA : yesNo(p.isTree)}
            </Fact>
          )}
          <Fact
            label="Bipartite"
            hint={
              p.bipartite.partition
                ? `Sides: {${p.bipartite.partition[0].join(', ')}} and {${p.bipartite.partition[1].join(', ')}}`
                : p.bipartite.conflict
                  ? `${p.bipartite.conflict[0]} and ${p.bipartite.conflict[1]} are adjacent but forced onto the same side (odd cycle).`
                  : undefined
            }
          >
            {yesNo(p.bipartite.isBipartite)}
          </Fact>
        </dl>
        {p.directed && (
          <p className="mt-2 text-xs text-slate-500">
            Bipartiteness and weak connectivity ignore edge directions. "Tree" is defined here for undirected graphs only.
          </p>
        )}
      </section>
    </div>
  );
}
