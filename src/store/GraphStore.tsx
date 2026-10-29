import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { EXAMPLE_GRAPHS, instantiateExample } from '../content/exampleGraphs';
import type { Graph, SavedGraph } from '../types/graph';
import { createGraph } from '../utils/graph';
import { normalizeGraph } from '../utils/graphJson';
import { readStorage, STORAGE_KEYS, writeStorage } from '../utils/storage';

interface GraphStoreValue {
  /** The graph currently being edited / analysed (shared by every page). */
  graph: Graph;
  setGraph: (updater: Graph | ((g: Graph) => Graph)) => void;
  /** Replace the working graph by a brand-new one (new graph, example, import). */
  newGraph: (name?: string) => void;
  loadExample: (exampleId: string) => void;
  openGraph: (graph: Graph) => void;
  savedGraphs: SavedGraph[];
  /** Saves (inserts or updates) the working graph; returns false if it could not be stored. */
  saveCurrent: () => boolean;
  loadSaved: (id: string) => boolean;
  deleteSaved: (id: string) => void;
  hasUnsavedChanges: boolean;
  isSaved: boolean;
  storageOk: boolean;
}

const GraphStoreContext = createContext<GraphStoreValue | null>(null);

function parseSavedList(raw: unknown): SavedGraph[] | null {
  if (!Array.isArray(raw)) return null;
  const out: SavedGraph[] = [];
  for (const item of raw) {
    try {
      if (typeof item !== 'object' || item === null) continue;
      const rec = item as Record<string, unknown>;
      const graph = normalizeGraph(rec.graph);
      const now = new Date().toISOString();
      out.push({
        graph,
        savedAt: typeof rec.savedAt === 'string' ? rec.savedAt : now,
        lastUsedAt: typeof rec.lastUsedAt === 'string' ? rec.lastUsedAt : now,
      });
    } catch {
      /* skip corrupted entries */
    }
  }
  return out;
}

function defaultGraph(): Graph {
  return instantiateExample(EXAMPLE_GRAPHS[0]);
}

export function GraphStoreProvider({ children }: { children: ReactNode }) {
  const [graph, setGraphState] = useState<Graph>(() =>
    readStorage<Graph>(STORAGE_KEYS.workingGraph, (raw) => {
      try {
        return normalizeGraph(raw);
      } catch {
        return null;
      }
    }, defaultGraph()),
  );
  const [savedGraphs, setSavedGraphs] = useState<SavedGraph[]>(() => readStorage(STORAGE_KEYS.savedGraphs, parseSavedList, []));
  const [storageOk, setStorageOk] = useState(true);
  /** JSON of the last example / blank / saved graph that was opened and not yet edited. Null: opened from elsewhere (import, restored session). */
  const [baseline, setBaseline] = useState<string | null>(() => (window.localStorage.getItem(STORAGE_KEYS.workingGraph) === null ? JSON.stringify(graph) : null));

  useEffect(() => {
    const ok = writeStorage(STORAGE_KEYS.workingGraph, graph);
    setStorageOk((prev) => (prev === ok ? prev : ok));
  }, [graph]);
  useEffect(() => {
    const ok = writeStorage(STORAGE_KEYS.savedGraphs, savedGraphs);
    setStorageOk((prev) => (prev === ok ? prev : ok));
  }, [savedGraphs]);

  const setGraph = useCallback((updater: Graph | ((g: Graph) => Graph)) => setGraphState(updater), []);
  const openGraph = useCallback((g: Graph) => {
    setGraphState(g);
    setBaseline(null);
  }, []);
  const newGraph = useCallback((name = 'Untitled graph') => {
    const g = createGraph({ name });
    setGraphState(g);
    setBaseline(JSON.stringify(g));
  }, []);
  const loadExample = useCallback((exampleId: string) => {
    const example = EXAMPLE_GRAPHS.find((e) => e.id === exampleId);
    if (example) {
      const g = instantiateExample(example);
      setGraphState(g);
      setBaseline(JSON.stringify(g));
    }
  }, []);

  const saveCurrent = useCallback((): boolean => {
    const now = new Date().toISOString();
    const snapshot: Graph = JSON.parse(JSON.stringify(graph));
    const next = (() => {
      const existing = savedGraphs.find((s) => s.graph.id === snapshot.id);
      if (existing) return savedGraphs.map((s) => (s.graph.id === snapshot.id ? { ...s, graph: snapshot, lastUsedAt: now } : s));
      return [...savedGraphs, { graph: snapshot, savedAt: now, lastUsedAt: now }];
    })();
    const ok = writeStorage(STORAGE_KEYS.savedGraphs, next);
    if (ok) setSavedGraphs(next);
    else setStorageOk(false);
    return ok;
  }, [graph, savedGraphs]);

  const loadSaved = useCallback(
    (id: string): boolean => {
      const found = savedGraphs.find((s) => s.graph.id === id);
      if (!found) return false;
      setGraphState(JSON.parse(JSON.stringify(found.graph)));
      setSavedGraphs((list) => list.map((s) => (s.graph.id === id ? { ...s, lastUsedAt: new Date().toISOString() } : s)));
      return true;
    },
    [savedGraphs],
  );

  const deleteSaved = useCallback((id: string) => setSavedGraphs((list) => list.filter((s) => s.graph.id !== id)), []);

  const saved = savedGraphs.find((s) => s.graph.id === graph.id);
  const currentJson = JSON.stringify(graph);
  const hasUnsavedChanges = currentJson !== baseline && (!saved || JSON.stringify(saved.graph) !== currentJson);

  const value = useMemo<GraphStoreValue>(
    () => ({
      graph,
      setGraph,
      newGraph,
      loadExample,
      openGraph,
      savedGraphs,
      saveCurrent,
      loadSaved,
      deleteSaved,
      hasUnsavedChanges,
      isSaved: Boolean(saved),
      storageOk,
    }),
    [graph, setGraph, newGraph, loadExample, openGraph, savedGraphs, saveCurrent, loadSaved, deleteSaved, hasUnsavedChanges, saved, storageOk],
  );

  return <GraphStoreContext.Provider value={value}>{children}</GraphStoreContext.Provider>;
}

export function useGraphStore(): GraphStoreValue {
  const ctx = useContext(GraphStoreContext);
  if (!ctx) throw new Error('useGraphStore must be used inside <GraphStoreProvider>');
  return ctx;
}

