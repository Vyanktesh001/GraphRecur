import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { RecurrenceResult } from '../../types/recurrence';
import { formatNumber } from '../../utils/format';
import { CheckboxField } from '../ui/Fields';

const compact = (v: number) => {
  const a = Math.abs(v);
  if (a >= 1e6 || (a > 0 && a < 1e-3)) return v.toExponential(1);
  return formatNumber(v);
};

/** Line chart of a(n) against n. The table next to it is the accessible text alternative. */
export function SequenceChart({ result }: { result: RecurrenceResult }) {
  const [log, setLog] = useState(false);
  const allPositive = result.terms.every((t) => t > 0);
  const useLog = log && allPositive;
  const data = useMemo(() => result.terms.map((value, n) => ({ n, value })), [result.terms]);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">a(n) plotted for n = 0 … {result.terms.length - 1}</p>
        <CheckboxField
          label="Logarithmic y-axis"
          hint={allPositive ? undefined : 'Only available when every term is positive'}
          checked={useLog}
          disabled={!allPositive}
          onChange={(e) => setLog(e.target.checked)}
        />
      </div>
      <div className="h-72 w-full" role="img" aria-label={`Line chart of the sequence. First terms: ${result.terms.slice(0, 8).map(formatNumber).join(', ')}.`}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis dataKey="n" tick={{ fontSize: 12 }} label={{ value: 'n', position: 'insideBottomRight', offset: -4, fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              width={70}
              scale={useLog ? 'log' : 'auto'}
              domain={useLog ? ['auto', 'auto'] : undefined}
              tickFormatter={compact}
              allowDataOverflow={false}
            />
            <Tooltip formatter={(v) => [formatNumber(Number(v)), 'a(n)']} labelFormatter={(n) => `n = ${n}`} />
            {result.firstUnsafeIndex !== null && (
              <ReferenceLine x={result.firstUnsafeIndex} stroke="#b45309" strokeDasharray="4 4" label={{ value: 'beyond 2^53', fontSize: 11, fill: '#92400e', position: 'insideTopLeft' }} />
            )}
            <Line type="monotone" dataKey="value" stroke="#1f3d6e" strokeWidth={2} dot={data.length <= 60 ? { r: 3 } : false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
