import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { bfs } from '../algorithms/bfs';
import { buildAdjacencyList } from '../algorithms/adjacency';
import { dfs } from '../algorithms/dfs';
import { Card, PageHeader } from '../components/ui/Card';
import { Alert } from '../components/ui/Feedback';
import { COMPLEXITY_CAVEATS, COMPLEXITY_ENTRIES, type ComplexityEntry } from '../content/complexity';
import { useGraphStore } from '../store/GraphStore';
import { formatNumber } from '../utils/format';
import { safeRun } from '../utils/safeRun';

const log2 = (x: number) => (x > 1 ? Math.log2(x) : 0);

/** The value of the growth term for the current graph (no constants): a size indicator, not a running time. */
function growthValue(g: ComplexityEntry['growth'], V: number, E: number): number | null {
  switch (g) {
    case 'V+E': return V + E;
    case '(V+E)logV': return (V + E) * log2(V);
    case 'ElogE': return E * log2(E);
    case 'V^2': return V * V;
    case 'V+2E': return V + 2 * E;
    default: return null;
  }
}

export default function ComplexityPage() {
  const { graph } = useGraphStore();
  const V = graph.vertices.length;
  const E = graph.edges.length;

  const traversal = useMemo(() => {
    if (V === 0) return null;
    const start = graph.vertices[0].id;
    const adj = buildAdjacencyList(graph);
    const run = (kind: 'bfs' | 'dfs') => {
      const out = safeRun(() => (kind === 'bfs' ? bfs(graph, start) : dfs(graph, start)));
      if (!out.trace) return null;
      const reachable = new Set(out.trace.result.order);
      const entries = [...reachable].reduce((s, v) => s + (adj.get(v)?.length ?? 0), 0);
      const examined = out.trace.steps.filter((s) => s.currentEdge !== null && !s.explanation.startsWith('Dequeue')).length;
      return { start, reached: reachable.size, entries, examined };
    };
    return { bfs: run('bfs'), dfs: run('dfs'), start };
  }, [graph, V]);

  const chartData = useMemo(() => {
    const maxE = graph.directed ? V * (V - 1) : (V * (V - 1)) / 2;
    const step = Math.max(1, Math.ceil(maxE / 25));
    const rows: { edges: number; matrix: number; list: number }[] = [];
    for (let e = 0; e <= maxE; e += step) rows.push({ edges: e, matrix: V * V, list: V + (graph.directed ? e : 2 * e) });
    if (rows.length === 0 || rows[rows.length - 1].edges !== maxE) rows.push({ edges: maxE, matrix: V * V, list: V + (graph.directed ? maxE : 2 * maxE) });
    return rows;
  }, [V, graph.directed]);

  return (
    <>
      <PageHeader
        title="Algorithm Complexity Analyzer"
        description="Theoretical time and space bounds for every algorithm implemented in this project, with V = number of vertices and E = number of edges."
      />
      <div className="space-y-4">
        <Alert kind="info" title="How to read this page">
          <ul className="list-disc pl-4">
            {COMPLEXITY_CAVEATS.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </Alert>

        <Card title="Bounds for the implemented algorithms">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <caption className="sr-only">Time and space complexity of each algorithm</caption>
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="py-2 pr-4">Algorithm</th>
                  <th scope="col" className="py-2 pr-4">Time</th>
                  <th scope="col" className="py-2 pr-4">Space</th>
                  <th scope="col" className="py-2 pr-4">Assumptions</th>
                  <th scope="col" className="py-2">In this code</th>
                </tr>
              </thead>
              <tbody>
                {COMPLEXITY_ENTRIES.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 align-top">
                    <th scope="row" className="py-3 pr-4 font-semibold text-navy-900">{c.name}</th>
                    <td className="py-3 pr-4 font-mono text-navy-800">{c.time}</td>
                    <td className="py-3 pr-4 font-mono text-navy-800">{c.space}</td>
                    <td className="max-w-xs py-3 pr-4 text-slate-700">{c.conditions}</td>
                    <td className="max-w-xs py-3 text-slate-600">{c.matchesCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card
          title="Evaluate the bounds for your graph"
          description={`Current graph "${graph.name}": V = ${V}, E = ${E}. The numbers are the growth terms with constants dropped (log base 2). They show relative size, not seconds.`}
        >
          {V === 0 ? (
            <p className="text-sm text-slate-600">
              The graph is empty. Add vertices in the <Link to="/graphs" className="font-medium underline">Graph Explorer</Link> to see numbers here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <caption className="sr-only">Growth terms evaluated for the current graph</caption>
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="py-2 pr-4">Algorithm / structure</th>
                    <th scope="col" className="py-2 pr-4">Time or space term</th>
                    <th scope="col" className="py-2">Value for V = {V}, E = {E}</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPLEXITY_ENTRIES.filter((c) => growthValue(c.growth, V, E) !== null).map((c) => (
                    <tr key={c.id} className="border-b border-slate-100">
                      <th scope="row" className="py-2 pr-4 font-medium text-navy-900">{c.name}</th>
                      <td className="py-2 pr-4 font-mono">{c.growth === 'V^2' ? 'V²' : c.growth === 'V+2E' ? 'V + 2E' : c.growth === 'ElogE' ? 'E · log₂E' : c.growth === '(V+E)logV' ? '(V + E) · log₂V' : 'V + E'}</td>
                      <td className="py-2 font-mono">{formatNumber(Math.round(growthValue(c.growth, V, E) as number))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Check against a real run" description="The recorded traces let us count how many adjacency entries a traversal really examined.">
            {!traversal ? (
              <p className="text-sm text-slate-600">Add vertices to run a traversal.</p>
            ) : (
              <div className="space-y-3 text-sm">
                {(['bfs', 'dfs'] as const).map((k) => {
                  const r = traversal[k];
                  if (!r) return null;
                  return (
                    <p key={k}>
                      <strong>{k.toUpperCase()}</strong> from {r.start}: reached {r.reached} of {V} vertices and examined <strong>{r.examined}</strong> adjacency entries. The adjacency lists of the reached vertices contain <strong>{r.entries}</strong> entries
                      {r.examined === r.entries ? ' — equal, as the O(V + E) analysis predicts (each entry is looked at exactly once).' : ' — these should match; if not, the implementation is wrong.'}
                    </p>
                  );
                })}
                <p className="text-xs text-slate-500">
                  An undirected edge appears in two adjacency lists, so a traversal of a connected undirected graph examines 2E = {2 * E} entries; a directed graph has E = {E}.
                </p>
              </div>
            )}
          </Card>
          <Card title="Storage: matrix vs list" description={`Cells stored for V = ${V} as the number of edges grows (${graph.directed ? 'directed' : 'undirected'}).`}>
            {V < 2 ? (
              <p className="text-sm text-slate-600">Add at least two vertices to compare the representations.</p>
            ) : (
              <div className="h-64 w-full" role="img" aria-label="Line chart comparing adjacency matrix storage V squared with adjacency list storage V plus 2E">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <XAxis dataKey="edges" tick={{ fontSize: 12 }} label={{ value: 'number of edges E', position: 'insideBottom', offset: -2, fontSize: 12 }} height={40} />
                    <YAxis tick={{ fontSize: 12 }} width={48} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="matrix" name="Adjacency matrix (V²)" stroke="#1f3d6e" strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="list" name={graph.directed ? 'Adjacency list (V + E)' : 'Adjacency list (V + 2E)'} stroke="#c2410c" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <p className="mt-2 text-xs text-slate-500">For sparse graphs (few edges) the list is much smaller; for dense graphs both are Θ(V²).</p>
          </Card>
        </div>
      </div>
    </>
  );
}
