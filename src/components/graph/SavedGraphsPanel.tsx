import { useState } from 'react';
import { FolderOpen, Trash2, Library } from 'lucide-react';
import { useGraphStore } from '../../store/GraphStore';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ConfirmDialog, EmptyState } from '../ui/Feedback';
import { useToast } from '../ui/Toast';

export function SavedGraphsPanel() {
  const store = useGraphStore();
  const toast = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loadId, setLoadId] = useState<string | null>(null);
  const sorted = [...store.savedGraphs].sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt));
  const toDelete = store.savedGraphs.find((s) => s.graph.id === deleteId);
  const toLoad = store.savedGraphs.find((s) => s.graph.id === loadId);

  const doLoad = (id: string) => {
    if (store.loadSaved(id)) toast.success('Loaded the saved graph.');
  };

  return (
    <Card title="Saved graphs" description="Stored in this browser (localStorage).">
      {sorted.length === 0 ? (
        <EmptyState icon={Library} title="No saved graphs yet">
          Build a graph and press Save. It will stay here even after you refresh the page.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-slate-100">
          {sorted.map((s) => (
            <li key={s.graph.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-navy-900">
                  {s.graph.name}
                  {s.graph.id === store.graph.id && <span className="ml-2 text-xs font-normal text-emerald-700">(open)</span>}
                </p>
                <p className="text-xs text-slate-500">
                  {s.graph.vertices.length} vertices · {s.graph.edges.length} edges · {s.graph.directed ? 'directed' : 'undirected'}
                  {s.graph.weighted ? ', weighted' : ''} · saved {new Date(s.savedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  icon={FolderOpen}
                  onClick={() => (store.hasUnsavedChanges && store.graph.vertices.length > 0 && s.graph.id !== store.graph.id ? setLoadId(s.graph.id) : doLoad(s.graph.id))}
                  aria-label={`Load ${s.graph.name}`}
                >
                  Load
                </Button>
                <Button size="sm" variant="danger" icon={Trash2} onClick={() => setDeleteId(s.graph.id)} aria-label={`Delete saved graph ${s.graph.name}`}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete saved graph"
        message={`Delete "${toDelete?.graph.name}" from this browser? This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) store.deleteSaved(deleteId);
          setDeleteId(null);
          toast.success('Deleted the saved graph.');
        }}
      />
      <ConfirmDialog
        open={Boolean(toLoad)}
        title="Load saved graph"
        message={`The graph currently open ("${store.graph.name}") has unsaved changes. Load "${toLoad?.graph.name}" and discard them?`}
        confirmLabel="Discard and load"
        onCancel={() => setLoadId(null)}
        onConfirm={() => {
          if (loadId) doLoad(loadId);
          setLoadId(null);
        }}
      />
    </Card>
  );
}
