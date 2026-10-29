import { Play, Save } from 'lucide-react';
import { MAX_ORDER, MAX_TERMS, type RecurrenceFormErrors, type RecurrenceFormValues } from '../../recurrence/recurrenceValidation';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SelectField, TextField } from '../ui/Fields';
import { Alert } from '../ui/Feedback';

interface Props {
  form: RecurrenceFormValues;
  errors: RecurrenceFormErrors;
  stale: boolean;
  hasResult: boolean;
  onChange: (f: RecurrenceFormValues) => void;
  onGenerate: () => void;
  saveName: string;
  onSaveNameChange: (s: string) => void;
  onSave: () => void;
}

export function RecurrenceForm({ form, errors, stale, hasResult, onChange, onGenerate, saveName, onSaveNameChange, onSave }: Props) {
  const order = form.coefficients.length;

  const setOrder = (k: number) => {
    const resize = (arr: string[]) => Array.from({ length: k }, (_, i) => arr[i] ?? '0');
    onChange({ ...form, coefficients: resize(form.coefficients), initial: resize(form.initial) });
  };
  const setAt = (key: 'coefficients' | 'initial', i: number, value: string) =>
    onChange({ ...form, [key]: form[key].map((x, j) => (j === i ? value : x)) });

  return (
    <Card title="Define the recurrence" description="a(n) = c₁·a(n−1) + c₂·a(n−2) + … + cₖ·a(n−k)">
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          onGenerate();
        }}
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Order k" value={String(order)} onChange={(e) => setOrder(Number(e.target.value))} hint="How many previous terms each term depends on.">
            {Array.from({ length: MAX_ORDER }, (_, i) => i + 1).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Number of terms"
            value={form.count}
            onChange={(e) => onChange({ ...form, count: e.target.value })}
            error={errors.count}
            inputMode="numeric"
            hint={`Generates a(0) … a(N−1). Maximum ${MAX_TERMS}.`}
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-700">Coefficients</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {form.coefficients.map((value, i) => (
              <TextField
                key={i}
                label={`c${i + 1} (× a(n−${i + 1}))`}
                value={value}
                onChange={(e) => setAt('coefficients', i, e.target.value)}
                error={errors.coefficients[i]}
                inputMode="decimal"
                spellCheck={false}
              />
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-500">c₁ multiplies the previous term a(n−1), c₂ multiplies a(n−2), and so on. Decimals and fractions such as 1/2 are accepted.</p>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-700">Initial conditions</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {form.initial.map((value, i) => (
              <TextField
                key={i}
                label={`a(${i})`}
                value={value}
                onChange={(e) => setAt('initial', i, e.target.value)}
                error={errors.initial[i]}
                inputMode="decimal"
                spellCheck={false}
              />
            ))}
          </div>
        </fieldset>

        {errors.general.length > 0 && (
          <Alert kind="error">
            {errors.general.map((g) => (
              <p key={g}>{g}</p>
            ))}
          </Alert>
        )}
        {stale && hasResult && <Alert kind="info">The inputs have changed since the last result. Press “Generate sequence” to update it.</Alert>}

        <div className="flex flex-wrap items-end gap-3">
          <Button type="submit" variant="primary" icon={Play}>
            Generate sequence
          </Button>
          <div className="ml-auto flex items-end gap-2">
            <div className="w-48 max-w-full">
              <TextField label="Name for saving" value={saveName} onChange={(e) => onSaveNameChange(e.target.value)} maxLength={60} placeholder="e.g. My recurrence" />
            </div>
            <Button icon={Save} onClick={onSave}>
              Save configuration
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
