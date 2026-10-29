import type { RecurrenceConfig, RecurrenceResult, RecurrenceStep, RecurrenceWarning } from '../types/recurrence';
import { RecurrenceError } from '../utils/errors';
import { formatNumber, formatOperand } from '../utils/format';
import { validateRecurrenceConfig } from './recurrenceValidation';

/** Largest integer n such that every integer in [-n, n] is exactly representable as a double. */
export const MAX_SAFE = Number.MAX_SAFE_INTEGER; // 2^53 - 1 = 9007199254740991

/** "a(n) = a(n-1) + a(n-2)", "a(n) = 3·a(n-1) - 2·a(n-2)", "a(n) = 0" when every c_i = 0. */
export function formatRecurrenceFormula(coefficients: number[]): string {
  let out = '';
  coefficients.forEach((c, i) => {
    if (c === 0) return;
    const magnitude = Math.abs(c) === 1 ? '' : `${formatNumber(Math.abs(c))}·`;
    const term = `${magnitude}a(n-${i + 1})`;
    if (out === '') out = c < 0 ? `-${term}` : term;
    else out += c < 0 ? ` - ${term}` : ` + ${term}`;
  });
  return `a(n) = ${out === '' ? '0' : out}`;
}

export function formatInitialConditions(initial: number[]): string[] {
  return initial.map((v, i) => `a(${i}) = ${formatNumber(v)}`);
}

/**
 * Generates a(0)..a(count-1) for a(n) = c1*a(n-1) + ... + ck*a(n-k), where
 * coefficients[i] = c_{i+1} multiplies a(n-1-i). Uses ordinary JavaScript numbers
 * (IEEE-754 doubles), so it reports when results may be inexact:
 *  - integer inputs: once any term, product or partial sum exceeds 2^53 − 1, that term and
 *    everything after it may be rounded ("unsafe-integer");
 *  - non-integer inputs: results are floating-point approximations ("non-integer-inputs");
 *  - overflow: if a term would exceed ±1.797e308, generation stops before it ("non-finite").
 * Throws RecurrenceError listing every validation problem if the configuration is invalid.
 * This function evaluates the recurrence term by term; it does NOT compute closed forms.
 */
export function generateSequence(config: RecurrenceConfig): RecurrenceResult {
  const issues = validateRecurrenceConfig(config);
  if (issues.length > 0) throw new RecurrenceError(issues);

  const { coefficients, initial, count } = config;
  const k = coefficients.length;
  const terms: number[] = [];
  const steps: RecurrenceStep[] = [];
  const warnings: RecurrenceWarning[] = [];
  const integerInputs = [...coefficients, ...initial].every(Number.isInteger);
  let firstUnsafeIndex: number | null = null;
  let truncatedAt: number | null = null;

  for (let n = 0; n < count; n += 1) {
    if (n < k) {
      const value = initial[n];
      terms.push(value);
      steps.push({ n, kind: 'initial', value, formula: `a(${n})`, substitution: `= ${formatNumber(value)} (given initial condition)` });
      if (integerInputs && firstUnsafeIndex === null && Math.abs(value) > MAX_SAFE) firstUnsafeIndex = n;
      continue;
    }
    let sum = 0;
    let exceeded = false;
    for (let i = 1; i <= k; i += 1) {
      const product = coefficients[i - 1] * terms[n - i];
      sum += product;
      if (Math.abs(product) > MAX_SAFE || Math.abs(sum) > MAX_SAFE) exceeded = true;
    }
    if (!Number.isFinite(sum)) {
      truncatedAt = n;
      warnings.push({
        code: 'non-finite',
        index: n,
        message: `a(${n}) is larger than the biggest number JavaScript can store (about ±1.8 × 10^308), so generation stopped after a(${n - 1}). Only ${n} term${n === 1 ? '' : 's'} could be computed.`,
      });
      break;
    }
    if (integerInputs && firstUnsafeIndex === null && exceeded) firstUnsafeIndex = n;
    terms.push(sum);

    const used = coefficients.map((_, idx) => idx + 1);
    steps.push({
      n,
      kind: 'computed',
      value: sum,
      formula: `a(${n}) = ${used.map((i) => `${formatOperand(coefficients[i - 1])}·a(${n - i})`).join(' + ')}`,
      substitution: `= ${used.map((i) => `${formatOperand(coefficients[i - 1])}·${formatOperand(terms[n - i])}`).join(' + ')} = ${formatNumber(sum)}`,
    });
  }

  if (!integerInputs) {
    warnings.unshift({
      code: 'non-integer-inputs',
      message:
        'Some inputs are not integers. Decimals such as 0.1 cannot be stored exactly in binary floating point, so tiny rounding errors can accumulate in later terms.',
    });
  }
  if (firstUnsafeIndex !== null) {
    warnings.unshift({
      code: 'unsafe-integer',
      index: firstUnsafeIndex,
      message: `From a(${firstUnsafeIndex}) onward the calculation involves integers larger than 2^53 − 1 = 9,007,199,254,740,991. JavaScript numbers are 64-bit floats and can no longer represent every integer exactly there, so these terms may be rounded approximations.`,
    });
  }

  return {
    terms,
    steps,
    formula: formatRecurrenceFormula(coefficients),
    initialConditions: formatInitialConditions(initial.slice(0, Math.min(k, count))),
    warnings,
    firstUnsafeIndex,
    truncatedAt,
  };
}

/** CSV with columns n, a(n), type (initial/computed) and a precision note. Values are full precision. */
export function sequenceToCsv(result: RecurrenceResult): string {
  const rows = ['n,a(n),type,note'];
  result.steps.forEach((s) => {
    const inexact = result.firstUnsafeIndex !== null && s.n >= result.firstUnsafeIndex;
    rows.push(`${s.n},${String(s.value)},${s.kind},${inexact ? 'may be inexact (exceeds 2^53-1)' : ''}`);
  });
  return rows.join('\r\n') + '\r\n';
}
