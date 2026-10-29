import { useRef, useState, type ChangeEvent } from 'react';
import { Download, Eraser, FilePlus2, LayoutTemplate, Save, Upload, Shapes } from 'lucide-react';
import { EXAMPLE_GRAPHS } from '../../content/exampleGraphs';
import { useGraphStore } from '../../store/GraphStore';
import { errorMessage } from '../../utils/errors';
import { downloadTextFile, safeFileName } from '../../utils/download';
import { relayoutCircle, setDirected } from '../../utils/graph';
import { exportGraphJson, parseGraphJson } from '../../utils/graphJson';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { CheckboxField, SelectField, TextField } from '../ui/Fields';
import { Badge, ConfirmDialog } from '../ui/Feedback';
import { useToast } from '../ui/Toast';

type Pending = { title: string; message: string; confirmLabel: string; run: () => void } | null;

const MAX_IMPORT_BYTES = 2_000_000;

export function GraphToolbar() {
  const store = useGraphStore();
  const toast = useToast();
  const { graph, setGraph } = store;
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [importing, setImporting] = useState(false);
  const [exampleId, setExampleId] = useState('');
  const hasContent = graph.vertices.length > 0;

  /** Runs `run` immediately, or after confirmation when it would discard unsaved work. */
  const guard = (title: string, run: () => void) => {
    if (store.hasUnsavedChanges && hasContent) {
      setPending({ title, message: `"${graph.name}" has changes that are not saved. Continue and discard them?`, confirmLabel: 'Discard and continue', run });
    } else run();
  };

  const onSave = () => {
    if (store.saveCurrent()) toast.success(`Saved "${graph.name}" in this browser.`);
    else toast.error('The browser refused to store the graph (storage may be full or disabled).');
  };

  const onExport = () => {
    downloadTextFile(`${safeFileName(graph.name)}.json`, exportGraphJson(graph), 'application/json');
    toast.success(`Exported "${graph.name}" as JSON.`);
  };

  const onImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      toast.error('That file is larger than 2 MB, which is too big for a graph.');
      return;
    }
    setImporting(true);
    try {
      const imported = parseGraphJson(await file.text());
      guard('Import graph', () => {
        store.openGraph(imported);
        toast.success(`Imported "${imported.name}" (${imported.vertices.length} vertices, ${imported.edges.length} edges).`);
      });
    } catch (err) {
      toast.error(`Import failed: ${errorMessage(err)}`);
    } finally {
      setImporting(false);
    }
  };

  const onDirected = (directed: boolean) => {
    const { graph: next, merged } = setDirected(graph, directed);
    setGraph(next);
    if (merged > 0) toast.info(`${merged} edge${merged === 1 ? ' was' : 's were'} merged because an undirected graph cannot contain both A–B and B–A.`);
  };

  return (
    <Card>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        <div className="w-full min-w-0 sm:w-64">
          <TextField label="Graph name" value={graph.name} maxLength={60} onChange={(e) => setGraph((g) => ({ ...g, name: e.target.value }))} />
        </div>
        <div className="flex gap-4 pb-2">
          <CheckboxField label="Directed" checked={graph.directed} onChange={(e) => onDirected(e.target.checked)} />
          <CheckboxField label="Weighted" checked={graph.weighted} onChange={(e) => setGraph((g) => ({ ...g, weighted: e.target.checked }))} />
        </div>
        <div className="pb-2">
          {store.isSaved ? (
            store.hasUnsavedChanges ? <Badge tone="amber">Unsaved changes</Badge> : <Badge tone="green">Saved</Badge>
          ) : (
            <Badge tone="neutral">{store.hasUnsavedChanges ? 'Not saved yet' : 'Not saved (unchanged)'}</Badge>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <Button variant="primary" icon={Save} onClick={onSave}>
          Save
        </Button>
        <Button icon={FilePlus2} onClick={() => guard('New graph', () => { store.newGraph(); toast.success('Created a new empty graph.'); })}>
          New graph
        </Button>
        <Button icon={Download} onClick={onExport}>
          Export JSON
        </Button>
        <Button icon={Upload} loading={importing} onClick={() => fileRef.current?.click()}>
          Import JSON
        </Button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" aria-label="Choose a graph JSON file to import" tabIndex={-1} onChange={onImport} />
        <Button icon={LayoutTemplate} disabled={!hasContent} onClick={() => { setGraph(relayoutCircle(graph)); toast.success('Arranged the vertices on a circle.'); }}>
          Arrange in circle
        </Button>
        <Button
          variant="danger"
          icon={Eraser}
          disabled={!hasContent}
          onClick={() =>
            setPending({
              title: 'Clear graph',
              message: `Remove all ${graph.vertices.length} vertices and ${graph.edges.length} edges from "${graph.name}"? Saved copies are not affected.`,
              confirmLabel: 'Clear graph',
              run: () => {
                setGraph((g) => ({ ...g, vertices: [], edges: [] }));
                toast.success('Cleared the graph.');
              },
            })
          }
        >
          Clear
        </Button>

        <div className="ml-auto flex min-w-0 items-end gap-2">
          <div className="w-56 max-w-full">
            <SelectField label="Load an example" value={exampleId} onChange={(e) => setExampleId(e.target.value)}>
              <option value="">Choose an example…</option>
              {EXAMPLE_GRAPHS.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </SelectField>
          </div>
          <Button
            icon={Shapes}
            disabled={!exampleId}
            onClick={() => {
              const ex = EXAMPLE_GRAPHS.find((x) => x.id === exampleId);
              if (!ex) return;
              guard(`Load "${ex.name}"`, () => {
                store.loadExample(ex.id);
                toast.success(`Loaded example: ${ex.name}.`);
              });
            }}
          >
            Load
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={pending !== null}
        title={pending?.title ?? ''}
        message={pending?.message}
        confirmLabel={pending?.confirmLabel}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          const run = pending?.run;
          setPending(null);
          run?.();
        }}
      />
    </Card>
  );
}
