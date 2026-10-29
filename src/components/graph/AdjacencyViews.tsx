import { useMemo } from 'react';
import { buildAdjacencyList, buildAdjacencyMatrix } from '../../algorithms/adjacency';
import type { Graph } from '../../types/graph';
import { formatNumber } from '../../utils/format';
import { EmptyState } from '../ui/Feedback';
import { Network } from 'lucide-react';

export function AdjacencyListView({ graph }: { graph: Graph }) {
  const adj = useMemo(() => buildAdjacencyList(graph), [graph]);
  if (graph.vertices.length === 0) return <EmptyState icon={Network} title="No vertices yet">Add vertices to see the adjacency list.</EmptyState>;
  return (
    <div>
      <p className="mb-2 text-sm text-slate-600">
        Each vertex lists its {graph.directed ? 'out-neighbours (targets of outgoing edges)' : 'neighbours'}, ordered as in the vertex list V. Storage: O(V + E).
      </p>
      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 font-mono text-sm" aria-label="Adjacency list">
        {graph.vertices.map((v) => {
          const list = adj.get(v.id) ?? [];
          return (
            <li key={v.id} className="flex flex-wrap items-baseline gap-x-2 px-3 py-2">
              <span className="w-12 shrink-0 font-bold text-navy-900">{v.id}</span>
              <span aria-hidden className="text-slate-400">→</span>
              <span>
                {list.length === 0 ? (
                  <span className="text-slate-400">∅ (no neighbours)</span>
                ) : (
                  list.map((n, i) => (
                    <span key={n.edgeId}>
                      {i > 0 && ', '}
                      {n.to}
                      {graph.weighted && <span className="text-slate-500"> (w={formatNumber(n.weight)})</span>}
                    </span>
                  ))
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function AdjacencyMatrixView({ graph }: { graph: Graph }) {
  const matrix = useMemo(() => buildAdjacencyMatrix(graph), [graph]);
  if (graph.vertices.length === 0) return <EmptyState icon={Network} title="No vertices yet">Add vertices to see the adjacency matrix.</EmptyState>;
  return (
    <div>
      <p className="mb-2 text-sm text-slate-600">
        Entry (row <i>i</i>, column <i>j</i>) is {graph.weighted ? 'the weight of the edge i→j, or "–" if there is none' : '1 if there is an edge i→j, otherwise 0'}.
        {graph.directed ? ' The matrix need not be symmetric for a directed graph.' : ' The matrix of an undirected graph is symmetric.'} Storage: O(V²).
      </p>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-center font-mono text-sm" aria-label="Adjacency matrix">
          <thead>
            <tr className="bg-slate-50">
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500">
                from \ to
              </th>
              {matrix.labels.map((l) => (
                <th key={l} scope="col" className="px-3 py-2 font-bold text-navy-900">
                  {l}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.cells.map((row, i) => (
              <tr key={matrix.labels[i]} className="border-t border-slate-100">
                <th scope="row" className="bg-slate-50 px-3 py-2 text-left font-bold text-navy-900">
                  {matrix.labels[i]}
                </th>
                {row.map((cell, j) => (
                  <td key={matrix.labels[j]} className={`px-3 py-2 ${cell === null || cell === 0 && !graph.weighted ? 'text-slate-400' : 'font-semibold text-slate-900'}`}>
                    {cell === null ? '–' : formatNumber(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
