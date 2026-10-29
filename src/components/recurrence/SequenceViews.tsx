import { AlertTriangle } from 'lucide-react';
import { useStepPlayer } from '../../hooks/useStepPlayer';
import type { RecurrenceResult } from '../../types/recurrence';
import { formatNumber } from '../../utils/format';
import { StepControls } from '../algorithms/StepControls';
import { useState } from 'react';
import { Alert } from '../ui/Feedback';

export function SequenceTable({ result }: { result: RecurrenceResult }) {
  return (
    <div className="max-h-96 overflow-auto rounded-lg border border-slate-200">
      <table className="min-w-full text-sm">
        <caption className="sr-only">Terms of the sequence</caption>
        <thead className="sticky top-0 bg-slate-50 text-left text-xs text-slate-500">
          <tr>
            <th scope="col" className="px-3 py-2">n</th>
            <th scope="col" className="px-3 py-2">a(n)</th>
            <th scope="col" className="px-3 py-2">Source</th>
            <th scope="col" className="px-3 py-2">Precision</th>
          </tr>
        </thead>
        <tbody>
          {result.steps.map((s) => {
            const unsafe = result.firstUnsafeIndex !== null && s.n >= result.firstUnsafeIndex;
            return (
              <tr key={s.n} className={`border-t border-slate-100 ${unsafe ? 'bg-amber-50' : ''}`}>
                <th scope="row" className="px-3 py-1.5 text-left font-semibold text-navy-900">{s.n}</th>
                <td className="px-3 py-1.5 font-mono">{formatNumber(s.value)}</td>
                <td className="px-3 py-1.5 text-slate-600">{s.kind === 'initial' ? 'Initial condition' : 'Computed'}</td>
                <td className="px-3 py-1.5 text-xs">
                  {unsafe ? (
                    <span className="inline-flex items-center gap-1 text-amber-800">
                      <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> may be inexact
                    </span>
                  ) : (
                    <span className="text-slate-400">exact</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function WarningList({ result }: { result: RecurrenceResult }) {
  if (result.warnings.length === 0) return null;
  return (
    <div className="space-y-2">
      {result.warnings.map((w) => (
        <Alert key={w.code} kind={w.code === 'non-integer-inputs' ? 'info' : 'warning'} title={w.code === 'unsafe-integer' ? 'Numbers too large for exact arithmetic' : w.code === 'non-finite' ? 'Overflow' : 'Floating-point note'}>
          {w.message}
        </Alert>
      ))}
    </div>
  );
}

/** Walks through the calculation of each term, one recorded step at a time. */
export function StepThrough({ result, orderK }: { result: RecurrenceResult; orderK: number }) {
  const [speed, setSpeed] = useState(900);
  const player = useStepPlayer(result.steps, speed);
  const step = player.item;
  if (!step) return null;
  const known = result.terms.slice(0, step.n + 1);
  return (
    <div className="space-y-4">
      <StepControls player={player} speedMs={speed} onSpeedChange={setSpeed} />
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" aria-live="polite" data-testid="recurrence-step">
        {step.kind === 'initial' ? (
          <>
            <p className="text-sm font-semibold text-navy-900">Initial condition</p>
            <p className="mt-1 font-mono text-base">
              a({step.n}) = {formatNumber(step.value)}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              The first {orderK} term{orderK === 1 ? ' is' : 's are'} given, not calculated: the recurrence needs {orderK} starting value{orderK === 1 ? '' : 's'} before it can produce a(n) for n ≥ {orderK}.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-navy-900">
              Compute a({step.n}) from the {orderK} previous term{orderK === 1 ? '' : 's'}
            </p>
            <p className="mt-2 font-mono text-sm sm:text-base">{step.formula}</p>
            <p className="font-mono text-sm sm:text-base">{step.substitution}</p>
            <p className="mt-2 text-sm text-slate-600">
              Replace n by {step.n}, multiply each earlier term by its coefficient (c₁ for a({step.n - 1}){orderK > 1 ? `, c₂ for a(${step.n - 2})` : ''}
              {orderK > 2 ? ', …' : ''}) and add the products.
            </p>
          </>
        )}
      </div>
      <div>
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Terms known so far</h4>
        <ul className="flex flex-wrap gap-1.5">
          {known.map((v, n) => (
            <li key={n} className={`rounded-md border px-2 py-0.5 font-mono text-xs ${n === step.n ? 'border-navy-700 bg-navy-800 text-white' : 'border-slate-300 bg-white text-slate-800'}`}>
              a({n}) = {formatNumber(v)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
