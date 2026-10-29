import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { bfs } from '../../algorithms/bfs';
import { dfs } from '../../algorithms/dfs';
import { dijkstra } from '../../algorithms/dijkstra';
import { greedyColoring } from '../../algorithms/graphColoring';
import { kruskal } from '../../algorithms/kruskal';
import { prim } from '../../algorithms/prim';
import { bfsShortestPath } from '../../algorithms/shortestPath';
import type { AlgorithmTrace, ColoringResult, MstResult, PathResult, TraversalResult } from '../../types/algorithm';
import type { Graph } from '../../types/graph';
import { formatNumber } from '../../utils/format';
import { safeRun } from '../../utils/safeRun';
import { COLOR_PALETTE } from '../graph/GraphCanvas';
import { Card } from '../ui/Card';
import { SelectField } from '../ui/Fields';
import { Alert, Badge } from '../ui/Feedback';
import { TracePlayerView } from './TracePlayerView';

interface PanelProps {
  /** Live graph (canvas positions); drawing uses this one. */
  graph: Graph;
  /** Graph whose identity only changes with its structure; algorithms run on this one. */
  algGraph: Graph;
}

function NoVertices() {
  return (
    <Alert kind="info" title="This graph has no vertices">
      Add vertices in the <Link to="/graphs" className="font-medium underline">Graph Explorer</Link> or load an example graph above.
    </Alert>
  );
}

function VertexSelect({ label, value, onChange, graph, hint }: { label: string; value: string; onChange: (v: string) => void; graph: Graph; hint?: string }) {
  return (
    <SelectField label={label} value={value} onChange={(e) => onChange(e.target.value)} hint={hint}>
      {graph.vertices.map((v) => (
        <option key={v.id} value={v.id}>
          {v.id}
        </option>
      ))}
    </SelectField>
  );
}

const pick = (graph: Graph, wanted: string, fallbackIndex = 0) =>
  graph.vertices.some((v) => v.id === wanted) ? wanted : (graph.vertices[Math.min(fallbackIndex, graph.vertices.length - 1)]?.id ?? '');

function ResultBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card title={title}>
      <div className="space-y-2 text-sm text-slate-800">{children}</div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// BFS / DFS
// ---------------------------------------------------------------------------
export function TraversalPanel({ kind, graph, algGraph }: PanelProps & { kind: 'bfs' | 'dfs' }) {
  const [startRaw, setStart] = useState('');
  const start = pick(algGraph, startRaw);
  const outcome = useMemo(() => (start ? safeRun<TraversalResult>(() => (kind === 'bfs' ? bfs(algGraph, start) : dfs(algGraph, start))) : null), [kind, algGraph, start]);

  if (algGraph.vertices.length === 0) return <NoVertices />;
  return (
    <div className="space-y-4">
      <Card title={kind === 'bfs' ? 'Breadth-First Search' : 'Depth-First Search'}>
        <div className="grid gap-4 md:grid-cols-[14rem_minmax(0,1fr)]">
          <VertexSelect label="Start vertex" value={start} onChange={setStart} graph={algGraph} />
          <div className="text-sm text-slate-600">
            {kind === 'bfs' ? (
              <p>
                BFS keeps a <strong>queue</strong>. It repeatedly removes the vertex at the front, then adds every unvisited neighbour to the back. Vertices are therefore discovered level by level (fewest edges first).
              </p>
            ) : (
              <p>
                DFS follows one path as deep as possible using a <strong>stack</strong> (the recursion stack). When a vertex has no unvisited neighbour left, it <strong>backtracks</strong> to the previous vertex and tries its next neighbour.
              </p>
            )}
            <p className="mt-1">
              <strong>Neighbour-ordering rule:</strong> neighbours are explored in the order they appear in the vertex list V ({algGraph.vertices.map((v) => v.id).join(', ')}).
              {algGraph.directed ? ' Only outgoing edges are followed.' : ''} Only vertices reachable from the start vertex are visited.
            </p>
          </div>
        </div>
      </Card>
      {outcome?.error && <Alert kind="error" title="Cannot run this algorithm">{outcome.error}</Alert>}
      {outcome?.trace && (
        <TracePlayerView
          graph={graph}
          trace={outcome.trace as AlgorithmTrace<unknown>}
          result={
            <ResultBox title="Result">
              <p>
                <strong>Traversal order:</strong> <span className="font-mono">{outcome.trace.result.order.join(' → ')}</span>
              </p>
              <p>
                <strong>Visited:</strong> {outcome.trace.result.order.length} of {algGraph.vertices.length} vertices.
                {outcome.trace.result.unreachable.length > 0 && (
                  <> Not reachable from {start}: <span className="font-mono">{outcome.trace.result.unreachable.join(', ')}</span>.</>
                )}
              </p>
            </ResultBox>
          }
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shortest path
// ---------------------------------------------------------------------------
export function ShortestPathPanel({ graph, algGraph }: PanelProps) {
  const [method, setMethod] = useState<'bfs' | 'dijkstra'>('bfs');
  const [sourceRaw, setSource] = useState('');
  const [targetRaw, setTarget] = useState('');
  const source = pick(algGraph, sourceRaw);
  const target = pick(algGraph, targetRaw, algGraph.vertices.length - 1);
  const outcome = useMemo(
    () =>
      source && target
        ? safeRun<PathResult>(() => (method === 'bfs' ? bfsShortestPath(algGraph, source, target) : dijkstra(algGraph, source, target)))
        : null,
    [method, algGraph, source, target],
  );

  if (algGraph.vertices.length === 0) return <NoVertices />;
  const hasNegative = algGraph.weighted && algGraph.edges.some((e) => e.weight < 0);
  return (
    <div className="space-y-4">
      <Card title="Shortest path">
        <div className="grid gap-4 md:grid-cols-3">
          <SelectField label="Algorithm" value={method} onChange={(e) => setMethod(e.target.value as 'bfs' | 'dijkstra')}>
            <option value="bfs">BFS — fewest edges (ignores weights)</option>
            <option value="dijkstra">Dijkstra — smallest total weight</option>
          </SelectField>
          <VertexSelect label="Source" value={source} onChange={setSource} graph={algGraph} />
          <VertexSelect label="Destination" value={target} onChange={setTarget} graph={algGraph} />
        </div>
        <p className="mt-3 text-sm text-slate-600">
          {method === 'bfs'
            ? 'BFS finds a path with the fewest edges. If the graph is weighted, the weights are ignored here — a path with fewer edges is not always the cheapest one.'
            : 'Dijkstra repeatedly settles the unsettled vertex with the smallest tentative distance and relaxes its outgoing edges. It is only correct for non-negative weights, so a graph with a negative weight is rejected.'}
          {!algGraph.weighted && method === 'dijkstra' && ' This graph is unweighted, so every edge counts as weight 1.'}
        </p>
        {method === 'dijkstra' && hasNegative && (
          <Alert kind="warning" className="mt-3">
            This graph contains a negative edge weight. Dijkstra's algorithm will be refused (use BFS for hop counts, or change the weights in the Graph Explorer).
          </Alert>
        )}
      </Card>
      {outcome?.error && (
        <Alert kind="error" title="Cannot run this algorithm">
          {outcome.error}
        </Alert>
      )}
      {outcome?.trace && (
        <TracePlayerView
          graph={graph}
          trace={outcome.trace as AlgorithmTrace<unknown>}
          visualOptions={{ source, target }}
          result={
            <ResultBox title="Result">
              {outcome.trace.result.reachable ? (
                <>
                  <p>
                    <strong>Path:</strong> <span className="font-mono">{outcome.trace.result.path.join(' → ')}</span>
                  </p>
                  <p>
                    <strong>{outcome.trace.result.costKind === 'hops' ? 'Number of edges' : 'Total cost'}:</strong> {formatNumber(outcome.trace.result.cost ?? 0)}
                  </p>
                </>
              ) : (
                <p>
                  <Badge tone="amber">Unreachable</Badge> There is no path from {source} to {target}
                  {algGraph.directed ? ' (following edge directions)' : ''}.
                </p>
              )}
            </ResultBox>
          }
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Minimum spanning tree
// ---------------------------------------------------------------------------
export function MstPanel({ graph, algGraph }: PanelProps) {
  const [method, setMethod] = useState<'kruskal' | 'prim'>('kruskal');
  const [startRaw, setStart] = useState('');
  const start = pick(algGraph, startRaw);
  const outcome = useMemo(
    () => (algGraph.vertices.length === 0 ? null : safeRun<MstResult>(() => (method === 'kruskal' ? kruskal(algGraph) : prim(algGraph, start)))),
    [method, algGraph, start],
  );

  if (algGraph.vertices.length === 0) return <NoVertices />;
  const edgeText = (id: string) => {
    const e = algGraph.edges.find((x) => x.id === id);
    return e ? `${e.source}–${e.target} (${formatNumber(algGraph.weighted ? e.weight : 1)})` : id;
  };
  return (
    <div className="space-y-4">
      <Card title="Minimum spanning tree">
        <div className="grid gap-4 md:grid-cols-3">
          <SelectField label="Algorithm" value={method} onChange={(e) => setMethod(e.target.value as 'kruskal' | 'prim')}>
            <option value="kruskal">Kruskal (sort edges, union-find)</option>
            <option value="prim">Prim (grow a tree from a vertex)</option>
          </SelectField>
          {method === 'prim' && <VertexSelect label="Start vertex" value={start} onChange={setStart} graph={algGraph} />}
        </div>
        <p className="mt-3 text-sm text-slate-600">
          A minimum spanning tree connects all vertices of a connected undirected graph using V − 1 edges of least total weight. If the graph is disconnected, a minimum spanning <strong>forest</strong> is produced instead (one tree per component).
          {!algGraph.weighted && ' This graph is unweighted, so every edge counts as weight 1 and every spanning tree is minimum.'}
        </p>
      </Card>
      {outcome?.error && (
        <Alert kind="error" title="Cannot run this algorithm">
          {outcome.error}
        </Alert>
      )}
      {outcome?.trace && (
        <TracePlayerView
          graph={graph}
          trace={outcome.trace as AlgorithmTrace<unknown>}
          result={
            <ResultBox title="Result">
              <p>
                <strong>{outcome.trace.result.isSpanningTree ? 'Minimum spanning tree' : 'Minimum spanning forest'}:</strong>{' '}
                <span className="font-mono">{outcome.trace.result.edgeIds.map(edgeText).join(', ') || '(no edges)'}</span>
              </p>
              <p>
                <strong>Total weight:</strong> {formatNumber(outcome.trace.result.totalWeight)} · <strong>Edges:</strong> {outcome.trace.result.edgeIds.length} · <strong>Components:</strong> {outcome.trace.result.componentCount}
              </p>
              {!outcome.trace.result.isSpanningTree && (
                <Alert kind="warning">The graph is disconnected, so a spanning tree does not exist; the selected edges form a minimum spanning forest.</Alert>
              )}
            </ResultBox>
          }
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Graph colouring
// ---------------------------------------------------------------------------
export function ColoringPanel({ graph, algGraph }: PanelProps) {
  const [ordering, setOrdering] = useState<'given' | 'degree'>('given');
  const outcome = useMemo(() => safeRun<ColoringResult>(() => greedyColoring(algGraph, ordering)), [algGraph, ordering]);

  if (algGraph.vertices.length === 0) return <NoVertices />;
  return (
    <div className="space-y-4">
      <Card title="Greedy graph colouring">
        <div className="grid gap-4 md:grid-cols-3">
          <SelectField label="Vertex ordering" value={ordering} onChange={(e) => setOrdering(e.target.value as 'given' | 'degree')}>
            <option value="given">Order of the vertex list V</option>
            <option value="degree">Largest degree first (Welsh–Powell)</option>
          </SelectField>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          A proper colouring gives adjacent vertices different colours. Greedy colouring takes the vertices in a fixed order and gives each the smallest colour not used by an already-coloured neighbour.
          It always produces a valid colouring, but it is a heuristic: <strong>it does not necessarily use the fewest possible colours</strong> (the chromatic number), and the answer can change with the order. Edge directions are ignored.
        </p>
      </Card>
      {outcome.error && <Alert kind="error" title="Cannot run this algorithm">{outcome.error}</Alert>}
      {outcome.trace && (
        <TracePlayerView
          graph={graph}
          trace={outcome.trace as AlgorithmTrace<unknown>}
          result={
            <ResultBox title="Result">
              <p>
                <strong>Colours used:</strong> {outcome.trace.result.colorCount} · <strong>Proper colouring:</strong>{' '}
                {outcome.trace.result.isProper ? <Badge tone="green">Yes — no edge joins equal colours</Badge> : <Badge tone="red">No</Badge>}
              </p>
              <p>
                <strong>Vertex order used:</strong> <span className="font-mono">{outcome.trace.result.order.join(', ')}</span>
              </p>
              <p>
                <strong>Chromatic number χ(G):</strong>{' '}
                {outcome.trace.result.chromaticNumber === null
                  ? 'not computed (graph has more than 12 vertices), so we cannot say whether greedy was optimal.'
                  : `${outcome.trace.result.chromaticNumber} (exhaustive search)${outcome.trace.result.chromaticNumber < outcome.trace.result.colorCount ? ' — greedy used more colours than necessary here.' : ' — greedy was optimal for this graph and ordering.'}`}
              </p>
              <ul className="flex flex-wrap gap-2" aria-label="Colour legend">
                {Array.from({ length: outcome.trace.result.colorCount }, (_, i) => (
                  <li key={i} className="flex items-center gap-1.5 rounded border border-slate-300 px-2 py-0.5 text-xs">
                    <span className="inline-block h-3 w-3 rounded-full border border-slate-600" style={{ backgroundColor: COLOR_PALETTE[i % COLOR_PALETTE.length] }} aria-hidden />
                    Colour {i + 1}: {graph.vertices.filter((v) => outcome.trace?.result.colors[v.id] === i + 1).map((v) => v.id).join(', ')}
                  </li>
                ))}
              </ul>
            </ResultBox>
          }
        />
      )}
    </div>
  );
}
