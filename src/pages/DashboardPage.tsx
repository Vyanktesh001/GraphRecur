import type { LucideIcon } from 'lucide-react';
import { ArrowRight, BookOpen, Gauge, History, Library, Network, Route, Sigma } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/Feedback';
import { CONCEPTS, CONCEPT_CATEGORIES } from '../content/concepts';
import { useGraphStore } from '../store/GraphStore';
import { configToForm, useRecurrenceStore } from '../store/RecurrenceStore';
import { formatNumber } from '../utils/format';

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 truncate text-2xl font-bold text-navy-900">{value}</p>
      {hint && <p className="mt-0.5 truncate text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

const MODULES: { to: string; title: string; text: string; icon: LucideIcon }[] = [
  { to: '/graphs', title: 'Graph Explorer', text: 'Draw or type a graph, switch between drawing, adjacency list and matrix, and see its properties.', icon: Network },
  { to: '/algorithms', title: 'Algorithm Simulator', text: 'Step through BFS, DFS, shortest paths, spanning trees and colouring — forwards and backwards.', icon: Route },
  { to: '/recurrence', title: 'Recurrence Lab', text: 'Generate sequences from linear recurrences, chart them and watch every term being calculated.', icon: Sigma },
  { to: '/concepts', title: 'Concepts Library', text: 'Definitions, formulas, worked examples and live demos for each topic.', icon: BookOpen },
  { to: '/complexity', title: 'Complexity Analyzer', text: 'Time and space bounds of every implemented algorithm, checked against real runs.', icon: Gauge },
];

export default function DashboardPage() {
  const graphs = useGraphStore();
  const rec = useRecurrenceStore();
  const navigate = useNavigate();
  const { graph } = graphs;
  const recentGraphs = [...graphs.savedGraphs].sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt)).slice(0, 5);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-navy-900 px-6 py-8 text-white sm:px-8">
        <p className="text-sm font-medium text-navy-200">Discrete Mathematics course project</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">GraphRecur Lab</h1>
        <p className="mt-2 max-w-3xl text-navy-100">
          An interactive learning platform for graph theory and recurrence relations. Build graphs, watch classic algorithms run one step at a time, and explore sequences defined by recurrences — everything is calculated in your browser, with no account or internet service needed.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/graphs" className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-navy-900 hover:bg-navy-50">
            Open Graph Explorer <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link to="/recurrence" className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/40 px-4 text-sm font-semibold text-white hover:bg-white/10">
            Open Recurrence Lab
          </Link>
        </div>
      </section>

      <section aria-label="Your data at a glance">
        <h2 className="sr-only">Your data at a glance</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Stat label="Saved graphs" value={graphs.savedGraphs.length} hint="in this browser" />
          <Stat label="Current graph" value={graph.name} hint={graph.directed ? 'directed' : 'undirected'} />
          <Stat label="Vertices / edges" value={`${graph.vertices.length} / ${graph.edges.length}`} hint="of the current graph" />
          <Stat label="Saved recurrences" value={rec.savedConfigs.length} />
          <Stat label="Sequences generated" value={rec.recentSequences.length} hint="in recent history" />
        </div>
      </section>

      <section aria-labelledby="modules-title">
        <h2 id="modules-title" className="mb-3 text-lg font-semibold text-navy-900">Modules</h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {MODULES.map(({ to, title, text, icon: Icon }) => (
            <li key={to}>
              <Link to={to} className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-navy-300 hover:shadow">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-navy-100 text-navy-800">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="font-semibold text-navy-900">{title}</span>
                <span className="mt-1 text-sm text-slate-600">{text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Recently used graphs" description="Graphs you saved or opened from your library.">
          {recentGraphs.length === 0 ? (
            <EmptyState
              icon={Library}
              title="No saved graphs yet"
              action={
                <Link to="/graphs" className="inline-flex h-9 items-center rounded-lg bg-navy-800 px-3 text-sm font-medium text-white hover:bg-navy-700">
                  Create a graph
                </Link>
              }
            >
              Build a graph in the Graph Explorer and press Save. It will appear here.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentGraphs.map((s) => (
                <li key={s.graph.id} className="flex items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy-900">{s.graph.name}</p>
                    <p className="text-xs text-slate-500">
                      {s.graph.vertices.length} vertices · {s.graph.edges.length} edges · last used {new Date(s.lastUsedAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (graphs.loadSaved(s.graph.id)) navigate('/graphs');
                    }}
                    aria-label={`Open ${s.graph.name} in the Graph Explorer`}
                  >
                    Open
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Recently generated sequences" description="From the Recurrence Lab.">
          {rec.recentSequences.length === 0 ? (
            <EmptyState
              icon={History}
              title="No sequences generated yet"
              action={
                <Link to="/recurrence" className="inline-flex h-9 items-center rounded-lg bg-navy-800 px-3 text-sm font-medium text-white hover:bg-navy-700">
                  Generate one
                </Link>
              }
            >
              Generate a sequence in the Recurrence Lab and it will be listed here.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100">
              {rec.recentSequences.slice(0, 5).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm text-navy-900">{r.formula}</p>
                    <p className="truncate font-mono text-xs text-slate-500">{r.preview.map(formatNumber).join(', ')}{r.config.count > r.preview.length ? ', …' : ''}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      rec.setForm(configToForm(r.config));
                      rec.recordGeneration(r.config, r.preview);
                      navigate('/recurrence');
                    }}
                    aria-label={`Open ${r.formula} in the Recurrence Lab`}
                  >
                    Open
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Discrete Mathematics concepts covered" description={`${CONCEPTS.length} topics, each with a definition, formulas, worked example and interactive demo.`}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CONCEPT_CATEGORIES.map((cat) => (
            <div key={cat}>
              <h3 className="mb-1.5 text-sm font-semibold text-navy-900">{cat}</h3>
              <ul className="space-y-0.5 text-sm">
                {CONCEPTS.filter((c) => c.category === cat).map((c) => (
                  <li key={c.id}>
                    <Link to={`/concepts/${c.id}`} className="text-navy-700 underline-offset-2 hover:underline">
                      {c.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
