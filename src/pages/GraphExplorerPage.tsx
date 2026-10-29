import { useCallback, useMemo, useState } from 'react';
import { List, Network, Sigma, Table2 } from 'lucide-react';
import { AdjacencyListView, AdjacencyMatrixView } from '../components/graph/AdjacencyViews';
import { EMPTY_SELECTION, GraphCanvas, type CanvasSelection } from '../components/graph/GraphCanvas';
import { GraphEditPanel } from '../components/graph/GraphEditPanel';
import { GraphPropertiesPanel } from '../components/graph/GraphPropertiesPanel';
import { GraphTextInput } from '../components/graph/GraphTextInput';
import { GraphToolbar } from '../components/graph/GraphToolbar';
import { SavedGraphsPanel } from '../components/graph/SavedGraphsPanel';
import { Card, PageHeader } from '../components/ui/Card';
import { Alert } from '../components/ui/Feedback';
import { TabPanel, Tabs, type TabItem } from '../components/ui/Tabs';
import { useToast } from '../components/ui/Toast';
import { useGraphStore } from '../store/GraphStore';
import type { Graph } from '../types/graph';
import { addEdge, addVertex, removeEdge, removeVertex } from '../utils/graph';
import { errorMessage } from '../utils/errors';
import { plainVisuals } from '../utils/stepVisuals';

type View = 'visual' | 'list' | 'matrix';
const VIEW_TABS: TabItem<View>[] = [
  { id: 'visual', label: 'Visual graph', icon: Network },
  { id: 'list', label: 'Adjacency list', icon: List },
  { id: 'matrix', label: 'Adjacency matrix', icon: Table2 },
];

export default function GraphExplorerPage() {
  const { graph, setGraph, storageOk } = useGraphStore();
  const toast = useToast();
  const [view, setView] = useState<View>('visual');
  const [selection, setSelection] = useState<CanvasSelection>(EMPTY_SELECTION);
  const visuals = useMemo(() => plainVisuals(graph), [graph]);

  const cleanSelection: CanvasSelection = useMemo(
    () => ({
      vertices: selection.vertices.filter((id) => graph.vertices.some((v) => v.id === id)),
      edges: selection.edges.filter((id) => graph.edges.some((e) => e.id === id)),
    }),
    [selection, graph],
  );

  /** Applies a pure graph edit; shows an error toast (and changes nothing) if it is rejected. */
  const edit = useCallback(
    (op: (g: Graph) => Graph, successMessage: string): boolean => {
      try {
        setGraph(op(graph));
        if (successMessage) toast.success(successMessage);
        return true;
      } catch (err) {
        toast.error(errorMessage(err));
        return false;
      }
    },
    [graph, setGraph, toast],
  );

  const onConnect = useCallback(
    (source: string, target: string) => {
      edit((g) => addEdge(g, source, target, 1), `Added edge ${source}${graph.directed ? '→' : '–'}${target}.`);
    },
    [edit, graph.directed],
  );

  return (
    <>
      <PageHeader
        title="Graph Explorer"
        description="Build a graph G = (V, E) by drawing it or typing V and E. Switch between the drawing, the adjacency list and the adjacency matrix, and read off the graph's properties."
      />
      {!storageOk && (
        <Alert kind="warning" title="Changes cannot be saved in this browser" className="mb-4">
          localStorage is unavailable or full, so your work will be lost when you close the page. Use Export JSON to keep a copy.
        </Alert>
      )}
      <div className="space-y-4">
        <GraphToolbar />

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <Card
            title={`${graph.name}`}
            description={`|V| = ${graph.vertices.length}, |E| = ${graph.edges.length} · ${graph.directed ? 'directed' : 'undirected'}${graph.weighted ? ', weighted' : ''}`}
          >
            <Tabs tabs={VIEW_TABS} value={view} onChange={setView} label="Graph representation" idPrefix="explorer-view" />
            <TabPanel idPrefix="explorer-view" id="visual" active={view === 'visual'}>
              <GraphCanvas
                graph={graph}
                visuals={visuals}
                editable
                selection={cleanSelection}
                onSelectionChange={(u) => setSelection((s) => u(s))}
                onGraphChange={setGraph}
                onConnectVertices={onConnect}
                onAddVertexAt={(pos) => edit((g) => addVertex(g, undefined, pos), 'Added a new vertex.')}
                onDeleteSelection={(sel) => {
                  edit((g) => {
                    let next = g;
                    for (const id of sel.vertices) next = removeVertex(next, id);
                    for (const id of sel.edges) if (next.edges.some((e) => e.id === id)) next = removeEdge(next, id);
                    return next;
                  }, `Deleted ${sel.vertices.length} vertex(es) and ${sel.edges.length} selected edge(s).`);
                  setSelection(EMPTY_SELECTION);
                }}
                className="h-[460px]"
                ariaLabel={`Drawing of ${graph.name}. Use the adjacency list or matrix tabs for a text version.`}
              />
              <p className="mt-2 text-xs text-slate-500">
                Drag vertices to move them · click to select · drag from a vertex's dark dot onto another vertex to add an edge · double-click empty space to add a vertex · Delete removes the selection.
              </p>
            </TabPanel>
            <TabPanel idPrefix="explorer-view" id="list" active={view === 'list'}>
              <AdjacencyListView graph={graph} />
            </TabPanel>
            <TabPanel idPrefix="explorer-view" id="matrix" active={view === 'matrix'}>
              <AdjacencyMatrixView graph={graph} />
            </TabPanel>
          </Card>

          <div className="space-y-4">
            <GraphEditPanel graph={graph} selection={cleanSelection} edit={edit} onClearSelection={() => setSelection(EMPTY_SELECTION)} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <GraphTextInput
            graph={graph}
            onApply={(g) => {
              setGraph(g);
              toast.success(`Applied: ${g.vertices.length} vertices and ${g.edges.length} edges.`);
            }}
          />
          <SavedGraphsPanel />
        </div>

        <Card title="Graph properties" description="Computed from the graph above whenever it changes." actions={<Sigma className="h-5 w-5 text-navy-500" aria-hidden />}>
          <GraphPropertiesPanel graph={graph} />
        </Card>
      </div>
    </>
  );
}
