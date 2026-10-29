import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Palette, Route, Search, Share2, TreePine } from 'lucide-react';
import { ColoringPanel, MstPanel, ShortestPathPanel, TraversalPanel } from '../components/algorithms/AlgorithmPanels';
import { Button } from '../components/ui/Button';
import { Card, PageHeader } from '../components/ui/Card';
import { SelectField } from '../components/ui/Fields';
import { ConfirmDialog } from '../components/ui/Feedback';
import { TabPanel, Tabs, type TabItem } from '../components/ui/Tabs';
import { useToast } from '../components/ui/Toast';
import { EXAMPLE_GRAPHS } from '../content/exampleGraphs';
import { useStructuralGraph } from '../hooks/useStructuralGraph';
import { useGraphStore } from '../store/GraphStore';

type Tab = 'bfs' | 'dfs' | 'path' | 'mst' | 'coloring';
const TABS: TabItem<Tab>[] = [
  { id: 'bfs', label: 'BFS', icon: Search },
  { id: 'dfs', label: 'DFS', icon: Share2 },
  { id: 'path', label: 'Shortest path', icon: Route },
  { id: 'mst', label: 'Minimum spanning tree', icon: TreePine },
  { id: 'coloring', label: 'Graph colouring', icon: Palette },
];

export default function AlgorithmSimulatorPage() {
  const store = useGraphStore();
  const toast = useToast();
  const { graph } = store;
  const algGraph = useStructuralGraph(graph);
  const [tab, setTab] = useState<Tab>('bfs');
  const [choice, setChoice] = useState('');
  const [pending, setPending] = useState<string | null>(null);

  const load = (value: string) => {
    if (value.startsWith('example:')) {
      store.loadExample(value.slice(8));
      toast.success('Loaded the example graph.');
    } else if (store.loadSaved(value.slice(6))) {
      toast.success('Loaded the saved graph.');
    }
    setChoice('');
  };

  return (
    <>
      <PageHeader
        title="Algorithm Simulator"
        description="Run BFS, DFS, shortest-path, spanning-tree and colouring algorithms on your graph. Every run is recorded step by step, so you can move forwards and backwards through it."
      />
      <Card className="mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1 basis-60">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Graph in use</p>
            <p className="truncate text-base font-semibold text-navy-900">{graph.name}</p>
            <p className="text-sm text-slate-600">
              |V| = {graph.vertices.length}, |E| = {graph.edges.length} · {graph.directed ? 'directed' : 'undirected'}
              {graph.weighted ? ', weighted' : ''} ·{' '}
              <Link to="/graphs" className="font-medium text-navy-700 underline">
                edit in Graph Explorer
              </Link>
            </p>
          </div>
          <div className="w-64 max-w-full">
            <SelectField label="Switch graph" value={choice} onChange={(e) => setChoice(e.target.value)}>
              <option value="">Choose a graph…</option>
              <optgroup label="Examples">
                {EXAMPLE_GRAPHS.map((ex) => (
                  <option key={ex.id} value={`example:${ex.id}`}>
                    {ex.name}
                  </option>
                ))}
              </optgroup>
              {store.savedGraphs.length > 0 && (
                <optgroup label="Saved graphs">
                  {store.savedGraphs.map((s) => (
                    <option key={s.graph.id} value={`saved:${s.graph.id}`}>
                      {s.graph.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </SelectField>
          </div>
          <Button
            disabled={!choice}
            onClick={() => (store.hasUnsavedChanges && graph.vertices.length > 0 ? setPending(choice) : load(choice))}
          >
            Load
          </Button>
        </div>
      </Card>

      <Tabs tabs={TABS} value={tab} onChange={setTab} label="Algorithms" idPrefix="algo" />
      <TabPanel idPrefix="algo" id="bfs" active={tab === 'bfs'}>
        <TraversalPanel kind="bfs" graph={graph} algGraph={algGraph} />
      </TabPanel>
      <TabPanel idPrefix="algo" id="dfs" active={tab === 'dfs'}>
        <TraversalPanel kind="dfs" graph={graph} algGraph={algGraph} />
      </TabPanel>
      <TabPanel idPrefix="algo" id="path" active={tab === 'path'}>
        <ShortestPathPanel graph={graph} algGraph={algGraph} />
      </TabPanel>
      <TabPanel idPrefix="algo" id="mst" active={tab === 'mst'}>
        <MstPanel graph={graph} algGraph={algGraph} />
      </TabPanel>
      <TabPanel idPrefix="algo" id="coloring" active={tab === 'coloring'}>
        <ColoringPanel graph={graph} algGraph={algGraph} />
      </TabPanel>

      <ConfirmDialog
        open={pending !== null}
        title="Switch graph"
        message={`"${graph.name}" has changes that are not saved in the Graph Explorer. Switch graph and discard them?`}
        confirmLabel="Discard and switch"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) load(pending);
          setPending(null);
        }}
      />
    </>
  );
}
