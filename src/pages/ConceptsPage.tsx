import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { ConceptDemo } from '../components/concepts/Demos';
import { Card, PageHeader } from '../components/ui/Card';
import { EmptyState } from '../components/ui/Feedback';
import { TextField } from '../components/ui/Fields';
import { CONCEPT_CATEGORIES, CONCEPTS, type Concept } from '../content/concepts';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 first:mt-0">
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      {children}
    </section>
  );
}

function ConceptDetail({ concept }: { concept: Concept }) {
  return (
    <Card as="article" title={concept.title} description={concept.category}>
      <Section title="Definition">
        <p className="text-sm leading-relaxed text-slate-800">{concept.definition}</p>
      </Section>
      <Section title="Formulas">
        <ul className="space-y-1">
          {concept.formulas.map((f) => (
            <li key={f} className="rounded bg-slate-50 px-3 py-1.5 font-mono text-sm text-navy-900">
              {f}
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Worked example">
        <p className="mb-1 text-sm font-medium text-navy-900">{concept.example.title}</p>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-800">
          {concept.example.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </Section>
      <Section title="In simple words">
        <p className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-navy-900">{concept.simple}</p>
      </Section>
      <Section title="Try it">
        <ConceptDemo key={concept.id} spec={concept.demo} />
      </Section>
      {concept.related && concept.related.length > 0 && (
        <Section title="Related topics">
          <ul className="flex flex-wrap gap-2">
            {concept.related.map((id) => {
              const r = CONCEPTS.find((c) => c.id === id);
              return (
                r && (
                  <li key={id}>
                    <Link to={`/concepts/${id}`} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-navy-800 hover:bg-navy-50">
                      {r.title}
                    </Link>
                  </li>
                )
              );
            })}
          </ul>
        </Section>
      )}
    </Card>
  );
}

export default function ConceptsPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const active = CONCEPTS.find((c) => c.id === topicId) ?? CONCEPTS[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CONCEPTS;
    return CONCEPTS.filter((c) => `${c.title} ${c.category} ${c.definition}`.toLowerCase().includes(q));
  }, [query]);

  return (
    <>
      <PageHeader
        title="Mathematical Concepts Library"
        description="Short definitions, formulas, worked examples and interactive demonstrations for the Discrete Mathematics topics used in this project."
      />
      <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <Card bodyClassName="p-3">
            <TextField label="Search topics" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. tree, BFS, Fibonacci" type="search" />
            <nav aria-label="Concept topics" className="mt-3 max-h-[60vh] overflow-y-auto">
              {filtered.length === 0 ? (
                <EmptyState icon={Search} title="No matching topic">Try a different word.</EmptyState>
              ) : (
                CONCEPT_CATEGORIES.map((cat) => {
                  const items = filtered.filter((c) => c.category === cat);
                  if (items.length === 0) return null;
                  return (
                    <div key={cat} className="mb-3">
                      <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{cat}</p>
                      <ul>
                        {items.map((c) => (
                          <li key={c.id}>
                            <button
                              type="button"
                              onClick={() => navigate(`/concepts/${c.id}`)}
                              aria-current={c.id === active.id ? 'page' : undefined}
                              className={`block w-full rounded-md px-2 py-1.5 text-left text-sm ${c.id === active.id ? 'bg-navy-800 font-medium text-white' : 'text-slate-700 hover:bg-navy-50'}`}
                            >
                              {c.title}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })
              )}
            </nav>
          </Card>
        </aside>
        <div className="min-w-0">
          <ConceptDetail concept={active} />
        </div>
      </div>
    </>
  );
}
