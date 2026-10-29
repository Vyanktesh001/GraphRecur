import type { RecurrenceConfig } from '../types/recurrence';

export const MAX_ORDER = 10;
export const MIN_TERMS = 1;
export const MAX_TERMS = 500;

/**
 * Validates a recurrence configuration and returns human-readable problems
 * (an empty list means the configuration is valid).
 */
export function validateRecurrenceConfig(config: RecurrenceConfig): string[] {
  const issues: string[] = [];
  const k = config.coefficients.length;
  if (k < 1 || k > MAX_ORDER) {
    issues.push(`The order k must be between 1 and ${MAX_ORDER} (got ${k}).`);
  }
  config.coefficients.forEach((c, i) => {
    if (typeof c !== 'number' || !Number.isFinite(c)) {
      issues.push(`Coefficient c${i + 1} must be a finite number.`);
    }
  });
  if (config.initial.length !== k) {
    issues.push(
      `A recurrence of order ${k} needs exactly ${k} initial condition${k === 1 ? '' : 's'} (a(0)${k > 1 ? `..a(${k - 1})` : ''}), but ${config.initial.length} ${config.initial.length === 1 ? 'was' : 'were'} given.`,
    );
  }
  config.initial.forEach((v, i) => {
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      issues.push(`Initial condition a(${i}) must be a finite number.`);
    }
  });
  if (!Number.isInteger(config.count) || config.count < MIN_TERMS || config.count > MAX_TERMS) {
    issues.push(`The number of terms must be a whole number between ${MIN_TERMS} and ${MAX_TERMS}.`);
  }
  return issues;
}

/**
 * Parses a user-typed number. Accepts integers, decimals, exponent notation and simple
 * fractions such as "1/2". Returns an error message instead of a number when invalid.
 */
export function parseNumberInput(text: string): { value: number } | { error: string } {
  const t = text.trim();
  if (t === '') return { error: 'This field is required.' };
  const fraction = /^([+-]?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/.exec(t);
  if (fraction) {
    const denominator = Number(fraction[2]);
    if (denominator === 0) return { error: 'Division by zero is not allowed.' };
    return { value: Number(fraction[1]) / denominator };
  }
  if (!/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(t)) {
    return { error: `"${t}" is not a valid number. Use digits such as 2, -3.5 or 1/2.` };
  }
  const value = Number(t);
  if (!Number.isFinite(value)) return { error: 'This number is too large to represent.' };
  return { value };
}

export interface RecurrenceFormValues {
  coefficients: string[];
  initial: string[];
  count: string;
}

export interface RecurrenceFormErrors {
  coefficients: (string | null)[];
  initial: (string | null)[];
  count: string | null;
  general: string[];
}

export interface RecurrenceFormResult {
  config: RecurrenceConfig | null;
  errors: RecurrenceFormErrors;
}

/** Parses the text fields of the recurrence form, reporting an error for each bad field. */
export function parseRecurrenceForm(form: RecurrenceFormValues): RecurrenceFormResult {
  const errors: RecurrenceFormErrors = {
    coefficients: [],
    initial: [],
    count: null,
    general: [],
  };
  const parseList = (texts: string[], slot: (string | null)[]): number[] => {
    const out: number[] = [];
    texts.forEach((text, i) => {
      const parsed = parseNumberInput(text);
      if ('error' in parsed) {
        slot[i] = parsed.error;
        out.push(Number.NaN);
      } else {
        slot[i] = null;
        out.push(parsed.value);
      }
    });
    return out;
  };
  const coefficients = parseList(form.coefficients, errors.coefficients);
  const initial = parseList(form.initial, errors.initial);

  let count = Number.NaN;
  const countText = form.count.trim();
  if (countText === '') errors.count = 'Enter how many terms to generate.';
  else if (!/^\d+$/.test(countText)) errors.count = 'Use a whole number such as 10.';
  else {
    count = Number(countText);
    if (count < MIN_TERMS || count > MAX_TERMS) errors.count = `Choose between ${MIN_TERMS} and ${MAX_TERMS} terms.`;
  }

  if (form.coefficients.length < 1 || form.coefficients.length > MAX_ORDER) {
    errors.general.push(`The order must be between 1 and ${MAX_ORDER}.`);
  }
  if (form.initial.length !== form.coefficients.length) {
    errors.general.push(
      `The number of initial conditions (${form.initial.length}) must equal the order (${form.coefficients.length}).`,
    );
  }

  const hasFieldError =
    errors.coefficients.some((e) => e !== null) || errors.initial.some((e) => e !== null) || errors.count !== null;
  if (hasFieldError || errors.general.length > 0) return { config: null, errors };
  return { config: { coefficients, initial, count }, errors };
}
