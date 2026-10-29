import { useState, type FormEvent } from 'react';
import { MousePointerClick, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Graph } from '../../types/graph';
import { addEdge, addVertex, removeEdge, removeVertex, renameVertex, setEdgeWeight } from '../../utils/graph';
import { parseNumberInput } from '../../recurrence/recurrenceValidation';
import { edgeLabel } from '../../utils/graph';
import { formatNumber } from '../../utils/format';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SelectField, TextField } from '../ui/Fields';
import type { CanvasSelection } from './GraphCanvas';

interface Props {
  graph: Graph;
  selection: CanvasSelection;
  /** Applies an edit, shows a toast, returns true if it succeeded. */
  edit: (op: (g: Graph) => Graph, successMessage: string) => boolean;
  onClearSelection: () => void;
}

export function GraphEditPanel({ graph, selection, edit, onClearSelection }: Props) {
  const [newName, setNewName] = useState('');
  const [removeId, setRemoveId] = useState('');
  const [renameFrom, setRenameFrom] = useState('');
  const [renameTo, setRenameTo] = useState('');
  const [edgeFrom, setEdgeFrom] = useState('');
  const [edgeTo, setEdgeTo] = useState('');
  const [edgeWeight, setEdgeWeightText] = useState('1');
  const [removeEdgeId, setRemoveEdgeId] = useState('');
  const [weightError, setWeightError] = useState<string | null>(null);
  const [selWeight, setSelWeight] = useState('');
  const [selRename, setSelRename] = useState('');

  const ids = graph.vertices.map((v) => v.id);
  const selVertex = selection.vertices.find((id) => ids.includes(id));
  const selEdge = graph.edges.find((e) => selection.edges.includes(e.id));
  const vertexOptions = (
    <>
      <option value="">Choose…</option>
      {ids.map((id) => (
        <option key={id} value={id}>
          {id}
        </option>
      ))}
    </>
  );

  const submitVertex = (e: FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (edit((g) => addVertex(g, name === '' ? undefined : name), name ? `Added vertex ${name}.` : 'Added a new vertex.')) setNewName('');
  };

  const submitEdge = (e: FormEvent) => {
    e.preventDefault();
    let weight = 1;
    if (graph.weighted) {
      const parsed = parseNumberInput(edgeWeight);
      if ('error' in parsed) {
        setWeightError(parsed.error);
        return;
      }
      weight = parsed.value;
    }
    setWeightError(null);
    if (!edgeFrom || !edgeTo) {
      edit(() => {
        throw new Error('Choose both end vertices for the edge.');
      }, '');
      return;
    }
    edit((g) => addEdge(g, edgeFrom, edgeTo, weight), `Added edge ${edgeLabel(graph, edgeFrom, edgeTo)}${graph.weighted ? ` with weight ${formatNumber(weight)}` : ''}.`);
  };

  return (
    <div className="space-y-4">
      <Card title="Selection" description="Click a vertex or edge in the drawing to select it.">
        {!selVertex && !selEdge ? (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <MousePointerClick className="h-4 w-4" aria-hidden /> Nothing selected.
          </p>
        ) : (
          <div className="space-y-3">
            {selVertex && (
              <div>
                <p className="text-sm">
                  Selected vertex: <strong className="text-navy-900">{selVertex}</strong>
                </p>
                <div className="mt-2 flex flex-wrap items-end gap-2">
                  <div className="w-32">
                    <TextField label="New name" value={selRename} onChange={(e) => setSelRename(e.target.value)} maxLength={12} placeholder={selVertex} />
                  </div>
                  <Button
                    icon={Pencil}
                    onClick={() => {
                      if (edit((g) => renameVertex(g, selVertex, selRename), `Renamed ${selVertex} to ${selRename.trim()}.`)) setSelRename('');
                    }}
                  >
                    Rename
                  </Button>
                  <Button
                    variant="danger"
                    icon={Trash2}
                    onClick={() => {
                      const n = graph.edges.filter((e) => e.source === selVertex || e.target === selVertex).length;
                      if (edit((g) => removeVertex(g, selVertex), `Removed vertex ${selVertex} and ${n} incident edge${n === 1 ? '' : 's'}.`)) onClearSelection();
                    }}
                  >
                    Remove vertex
                  </Button>
                </div>
              </div>
            )}
            {selEdge && (
              <div>
                <p className="text-sm">
                  Selected edge: <strong className="text-navy-900">{edgeLabel(graph, selEdge.source, selEdge.target)}</strong>
                  {graph.weighted && <> (weight {formatNumber(selEdge.weight)})</>}
                </p>
                <div className="mt-2 flex flex-wrap items-end gap-2">
                  {graph.weighted && (
                    <>
                      <div className="w-28">
                        <TextField label="New weight" value={selWeight} onChange={(e) => setSelWeight(e.target.value)} placeholder={String(selEdge.weight)} inputMode="decimal" />
                      </div>
                      <Button
                        icon={Pencil}
                        onClick={() => {
                          const parsed = parseNumberInput(selWeight);
                          if ('error' in parsed) {
                            edit(() => {
                              throw new Error(`Weight: ${parsed.error}`);
                            }, '');
                            return;
                          }
                          if (edit((g) => setEdgeWeight(g, selEdge.id, parsed.value), `Set the weight of ${edgeLabel(graph, selEdge.source, selEdge.target)} to ${formatNumber(parsed.value)}.`)) setSelWeight('');
                        }}
                      >
                        Set weight
                      </Button>
                    </>
                  )}
                  <Button
                    variant="danger"
                    icon={Trash2}
                    onClick={() => {
                      if (edit((g) => removeEdge(g, selEdge.id), `Removed edge ${edgeLabel(graph, selEdge.source, selEdge.target)}.`)) onClearSelection();
                    }}
                  >
                    Remove edge
                  </Button>
                </div>
              </div>
            )}
            <p className="text-xs text-slate-500">Tip: with the drawing focused you can also press Delete to remove the selection.</p>
          </div>
        )}
      </Card>

      <Card title="Vertices" description="Add, rename or remove vertices.">
        <form onSubmit={submitVertex} className="flex flex-wrap items-end gap-2" aria-label="Add vertex">
          <div className="min-w-0 flex-1 basis-32">
            <TextField label="New vertex name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="auto (next free letter)" maxLength={12} />
          </div>
          <Button type="submit" variant="primary" icon={Plus}>
            Add vertex
          </Button>
        </form>

        <div className="mt-4 grid gap-4">
          <form
            className="flex items-end gap-2"
            aria-label="Remove vertex"
            onSubmit={(e) => {
              e.preventDefault();
              if (!removeId) return void edit(() => { throw new Error('Choose a vertex to remove.'); }, '');
              const n = graph.edges.filter((x) => x.source === removeId || x.target === removeId).length;
              if (edit((g) => removeVertex(g, removeId), `Removed vertex ${removeId} and ${n} incident edge${n === 1 ? '' : 's'}.`)) setRemoveId('');
            }}
          >
            <div className="min-w-0 flex-1">
              <SelectField label="Remove vertex" value={removeId} onChange={(e) => setRemoveId(e.target.value)}>
                {vertexOptions}
              </SelectField>
            </div>
            <Button type="submit" variant="danger" icon={Trash2} aria-label="Remove chosen vertex">
              Remove
            </Button>
          </form>
          <form
            className="space-y-2"
            aria-label="Rename vertex"
            onSubmit={(e) => {
              e.preventDefault();
              if (!renameFrom) return void edit(() => { throw new Error('Choose a vertex to rename.'); }, '');
              if (edit((g) => renameVertex(g, renameFrom, renameTo), `Renamed ${renameFrom} to ${renameTo.trim()}.`)) {
                setRenameFrom('');
                setRenameTo('');
              }
            }}
          >
            <div className="flex gap-2">
              <div className="min-w-0 flex-1">
                <SelectField label="Rename vertex" value={renameFrom} onChange={(e) => setRenameFrom(e.target.value)}>
                  {vertexOptions}
                </SelectField>
              </div>
              <div className="min-w-0 flex-1">
                <TextField label="New name" value={renameTo} onChange={(e) => setRenameTo(e.target.value)} maxLength={12} />
              </div>
            </div>
            <Button type="submit" icon={Pencil}>
              Rename
            </Button>
          </form>
        </div>
      </Card>

      <Card title="Edges" description={graph.directed ? 'Edges go from the first vertex to the second.' : 'Edges join two vertices.'}>
        <form onSubmit={submitEdge} className="space-y-3" aria-label="Add edge">
          <div className="grid grid-cols-2 gap-2">
            <SelectField label={graph.directed ? 'From' : 'Vertex 1'} value={edgeFrom} onChange={(e) => setEdgeFrom(e.target.value)}>
              {vertexOptions}
            </SelectField>
            <SelectField label={graph.directed ? 'To' : 'Vertex 2'} value={edgeTo} onChange={(e) => setEdgeTo(e.target.value)}>
              {vertexOptions}
            </SelectField>
          </div>
          {graph.weighted && <TextField label="Weight" value={edgeWeight} onChange={(e) => setEdgeWeightText(e.target.value)} error={weightError} inputMode="decimal" hint="Any real number. Dijkstra requires non-negative weights." />}
          <Button type="submit" variant="primary" icon={Plus}>
            Add edge
          </Button>
        </form>

        <form
          className="mt-4 flex items-end gap-2"
          aria-label="Remove edge"
          onSubmit={(e) => {
            e.preventDefault();
            const edge = graph.edges.find((x) => x.id === removeEdgeId);
            if (!edge) return void edit(() => { throw new Error('Choose an edge to remove.'); }, '');
            if (edit((g) => removeEdge(g, edge.id), `Removed edge ${edgeLabel(graph, edge.source, edge.target)}.`)) setRemoveEdgeId('');
          }}
        >
          <div className="min-w-0 flex-1">
            <SelectField label="Remove edge" value={removeEdgeId} onChange={(e) => setRemoveEdgeId(e.target.value)}>
              <option value="">Choose…</option>
              {graph.edges.map((e) => (
                <option key={e.id} value={e.id}>
                  {edgeLabel(graph, e.source, e.target)}
                  {graph.weighted ? ` (${formatNumber(e.weight)})` : ''}
                </option>
              ))}
            </SelectField>
          </div>
          <Button type="submit" variant="danger" icon={Trash2} aria-label="Remove chosen edge">
            Remove
          </Button>
        </form>
        <p className="mt-3 text-xs text-slate-500">You can also drag from the dark dot on a vertex to another vertex to create an edge.</p>
      </Card>
    </div>
  );
}
