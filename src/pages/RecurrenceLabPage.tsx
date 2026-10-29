import { useMemo, useState } from 'react';
import { Download, FolderOpen, History, Sigma, Trash2 } from 'lucide-react';
import { SequenceChart } from '../components/charts/SequenceChart';
import { RecurrenceForm } from '../components/recurrence/RecurrenceForm';
import { SequenceTable, StepThrough, WarningList } from '../components/recurrence/SequenceViews';
import { Button } from '../components/ui/Button';
import { Card, PageHeader } from '../components/ui/Card';
import { Alert, EmptyState } from '../components/ui/Feedback';
import { useToast } from '../components/ui/Toast';
import { RECURRENCE_EXAMPLES } from '../recurrence/examples';
import { formatRecurrenceFormula, generateSequence, sequenceToCsv } from '../recurrence/generateSequence';
import { parseRecurrenceForm } from '../recurrence/recurrenceValidation';
import { configToForm, useRecurrenceStore } from '../store/RecurrenceStore';
import type { RecurrenceConfig } from '../types/recurrence';
import { downloadTextFile } from '../utils/download';
import { errorMessage } from '../utils/errors';
import { formatNumber } from '../utils/format';

export default function RecurrenceLabPage() {
  const store = useRecurrenceStore();
  const toast = useToast();
  const { form } = store;
  const [saveName, setSaveName] = useState('');

  const parsed = useMemo(() => parseRecurrenceForm(form), [form]);
  const result = useMemo(() => {
    if (!store.lastGenerated) return null;
    try {
      return generateSequence(store.lastGenerated);
    } catch {
      return null;
    }
  }, [store.lastGenerated]);
  const stale = !parsed.config || JSON.stringify(parsed.config) !== JSON.stringify(store.lastGenerated);

  const generate = (config: RecurrenceConfig) => {
    try {
      const r = generateSequence(config);
      store.recordGeneration(config, r.terms);
      const note = r.warnings.length > 0 ? ` (${r.warnings.length} warning${r.warnings.length === 1 ? '' : 's'} — see below)` : '';
      toast.success(`Generated ${r.terms.length} term${r.terms.length === 1 ? '' : 's'}${note}.`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const onGenerate = () => {
    if (!parsed.config) {
      toast.error('Please fix the highlighted inputs first.');
      return;
    }
    generate(parsed.config);
  };

  const applyConfig = (config: RecurrenceConfig) => {
    store.setForm(configToForm(config));
    generate(config);
  };

  const onSave = () => {
    if (!parsed.config) {
      toast.error('Fix the highlighted inputs before saving the configuration.');
      return;
    }
    const name = saveName.trim() || formatRecurrenceFormula(parsed.config.coefficients);
    store.saveConfig(name, parsed.config);
    setSaveName('');
    toast.success(`Saved configuration "${name}".`);
  };

  const onExport = () => {
    if (!result) return;
    downloadTextFile('recurrence_sequence.csv', sequenceToCsv(result), 'text/csv');
    toast.success(`Exported ${result.terms.length} terms to CSV.`);
  };

  return (
    <>
      <PageHeader
        title="Recurrence Relations Lab"
        description="Define a linear recurrence with constant coefficients, generate its terms, and watch exactly how each term is calculated from the ones before it."
      />
      <div className="space-y-4">
        <Card title="Examples" description="Pick an example to fill the form and generate it immediately.">
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {RECURRENCE_EXAMPLES.map((ex) => (
              <li key={ex.id} className="flex flex-col justify-between rounded-lg border border-slate-200 p-3">
                <div>
                  <p className="text-sm font-semibold text-navy-900">{ex.name}</p>
                  <p className="mt-1 text-xs text-slate-600">{ex.description}</p>
                </div>
                <Button size="sm" className="mt-3 self-start" onClick={() => applyConfig(ex.config)} aria-label={`Use example: ${ex.name}`}>
                  Use this example
                </Button>
              </li>
            ))}
          </ul>
        </Card>

        <RecurrenceForm
          form={form}
          errors={parsed.errors}
          stale={stale}
          hasResult={result !== null}
          onChange={store.setForm}
          onGenerate={onGenerate}
          saveName={saveName}
          onSaveNameChange={setSaveName}
          onSave={onSave}
        />

        {!result ? (
          <EmptyState icon={Sigma} title="No sequence generated yet">
            Fill in the form above (or pick an example) and press “Generate sequence” to see the terms, a chart and a step-by-step explanation.
          </EmptyState>
        ) : (
          <>
            <Card title="Recurrence">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Formula</p>
                  <p className="mt-1 font-mono text-lg text-navy-900" data-testid="formula">{result.formula}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Initial conditions</p>
                  <ul className="mt-1 font-mono text-base text-navy-900" data-testid="initial-conditions">
                    {result.initialConditions.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-700">
                <strong>Sequence:</strong>{' '}
                <span className="font-mono" data-testid="sequence-preview">
                  {result.terms.slice(0, 16).map(formatNumber).join(', ')}
                  {result.terms.length > 16 ? ', …' : ''}
                </span>
              </p>
              <p className="mt-2 text-xs text-slate-500">
                This lab evaluates the recurrence term by term. It does not derive a closed-form (explicit) formula.
              </p>
            </Card>

            <WarningList result={result} />

            <div className="grid gap-4 xl:grid-cols-2">
              <Card title="Terms" actions={<Button icon={Download} onClick={onExport}>Export CSV</Button>}>
                <SequenceTable result={result} />
              </Card>
              <Card title="Chart">
                <SequenceChart result={result} />
              </Card>
            </div>

            <Card title="Step through the calculation" description="Each step shows how one term follows from the previous ones.">
              <StepThrough result={result} orderK={store.lastGenerated?.coefficients.length ?? 1} />
            </Card>
          </>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Saved configurations" description="Stored in this browser (localStorage).">
            {store.savedConfigs.length === 0 ? (
              <EmptyState icon={FolderOpen} title="Nothing saved yet">
                Enter a recurrence, give it a name and press “Save configuration”.
              </EmptyState>
            ) : (
              <ul className="divide-y divide-slate-100">
                {store.savedConfigs.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-navy-900">{s.name}</p>
                      <p className="truncate font-mono text-xs text-slate-500">
                        {formatRecurrenceFormula(s.config.coefficients)} · initial [{s.config.initial.map(formatNumber).join(', ')}] · {s.config.count} terms
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" icon={FolderOpen} onClick={() => applyConfig(s.config)} aria-label={`Load saved configuration ${s.name}`}>
                        Load
                      </Button>
                      <Button size="sm" variant="danger" icon={Trash2} onClick={() => { store.deleteConfig(s.id); toast.success(`Deleted "${s.name}".`); }} aria-label={`Delete saved configuration ${s.name}`}>
                        Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Recently generated" description="The last sequences you generated.">
            {store.recentSequences.length === 0 ? (
              <EmptyState icon={History} title="No history yet">Generated sequences will be listed here.</EmptyState>
            ) : (
              <ul className="divide-y divide-slate-100">
                {store.recentSequences.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm text-navy-900">{r.formula}</p>
                      <p className="truncate font-mono text-xs text-slate-500">{r.preview.map(formatNumber).join(', ')}{r.config.count > r.preview.length ? ', …' : ''}</p>
                    </div>
                    <Button size="sm" onClick={() => applyConfig(r.config)} aria-label={`Generate again: ${r.formula}`}>
                      Use again
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <Alert kind="info" title="About numeric precision">
          Terms are stored as JavaScript numbers (64-bit floating point). Integers are exact only up to 2^53 − 1 = 9,007,199,254,740,991, and the largest representable value is about 1.8 × 10^308. The lab warns you when a result goes beyond these limits.
        </Alert>
      </div>
    </>
  );
}
