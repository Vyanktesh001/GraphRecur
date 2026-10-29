import { describe, expect, it } from 'vitest';
import { RECURRENCE_EXAMPLES } from '../recurrence/examples';
import { formatRecurrenceFormula, generateSequence, sequenceToCsv } from '../recurrence/generateSequence';
import { parseNumberInput, parseRecurrenceForm, validateRecurrenceConfig } from '../recurrence/recurrenceValidation';
import { RecurrenceError } from '../utils/errors';

describe('generateSequence', () => {
  it('generates the Fibonacci sequence', () => {
    const r = generateSequence({ coefficients: [1, 1], initial: [0, 1], count: 10 });
    expect(r.terms).toEqual([0, 1, 1, 2, 3, 5, 8, 13, 21, 34]);
    expect(r.formula).toBe('a(n) = a(n-1) + a(n-2)');
    expect(r.initialConditions).toEqual(['a(0) = 0', 'a(1) = 1']);
    expect(r.warnings).toEqual([]);
  });

  it('matches the closed-form Fibonacci values F(20) = 6765 and F(50) = 12586269025', () => {
    const r = generateSequence({ coefficients: [1, 1], initial: [0, 1], count: 51 });
    expect(r.terms[20]).toBe(6765);
    expect(r.terms[50]).toBe(12586269025);
  });

  it('generates a first-order recurrence (geometric)', () => {
    const r = generateSequence({ coefficients: [3], initial: [2], count: 6 });
    expect(r.terms).toEqual([2, 6, 18, 54, 162, 486]);
    expect(r.formula).toBe('a(n) = 3·a(n-1)');
  });

  it('orders coefficients consistently: c1 multiplies a(n-1), c2 multiplies a(n-2)', () => {
    // a(n) = 2a(n-1) + 3a(n-2), a(0)=1, a(1)=1 → a(2) = 2·1 + 3·1 = 5, a(3) = 2·5 + 3·1 = 13
    const r = generateSequence({ coefficients: [2, 3], initial: [1, 1], count: 4 });
    expect(r.terms).toEqual([1, 1, 5, 13]);
    // swapping the coefficients gives a different sequence: a(2) = 3·1 + 2·1 = 5, a(3) = 3·5 + 2·1 = 17
    expect(generateSequence({ coefficients: [3, 2], initial: [1, 1], count: 4 }).terms).toEqual([1, 1, 5, 17]);
  });

  it('generates a custom second-order recurrence: a(n) = 3a(n-1) - 2a(n-2) gives 2^n - 1', () => {
    const r = generateSequence({ coefficients: [3, -2], initial: [0, 1], count: 12 });
    expect(r.terms).toEqual(Array.from({ length: 12 }, (_, n) => 2 ** n - 1));
    expect(r.formula).toBe('a(n) = 3·a(n-1) - 2·a(n-2)');
  });

  it('arithmetic progression as a(n) = 2a(n-1) - a(n-2)', () => {
    expect(generateSequence({ coefficients: [2, -1], initial: [3, 7], count: 6 }).terms).toEqual([3, 7, 11, 15, 19, 23]);
  });

  it('supports higher orders (tribonacci)', () => {
    const r = generateSequence({ coefficients: [1, 1, 1], initial: [0, 0, 1], count: 10 });
    expect(r.terms).toEqual([0, 0, 1, 1, 2, 4, 7, 13, 24, 44]);
  });

  it('returns only initial terms when count is smaller than the order', () => {
    const r = generateSequence({ coefficients: [1, 1], initial: [5, 8], count: 1 });
    expect(r.terms).toEqual([5]);
    expect(r.steps).toHaveLength(1);
  });

  it('records a readable calculation for each computed term', () => {
    const r = generateSequence({ coefficients: [1, 1], initial: [0, 1], count: 6 });
    const step = r.steps[5];
    expect(step.n).toBe(5);
    expect(step.kind).toBe('computed');
    expect(step.formula).toBe('a(5) = 1·a(4) + 1·a(3)');
    expect(step.substitution).toBe('= 1·3 + 1·2 = 5');
    expect(r.steps[0].kind).toBe('initial');
  });

  it('formats formulas with negative, zero and unit coefficients', () => {
    expect(formatRecurrenceFormula([0, 1])).toBe('a(n) = a(n-2)');
    expect(formatRecurrenceFormula([-1, 2])).toBe('a(n) = -a(n-1) + 2·a(n-2)');
    expect(formatRecurrenceFormula([0, 0])).toBe('a(n) = 0');
    expect(formatRecurrenceFormula([0.5])).toBe('a(n) = 0.5·a(n-1)');
  });
});

describe('input validation', () => {
  it('rejects the wrong number of initial conditions', () => {
    const issues = validateRecurrenceConfig({ coefficients: [1, 1], initial: [0], count: 5 });
    expect(issues.join(' ')).toContain('needs exactly 2 initial conditions');
    expect(() => generateSequence({ coefficients: [1, 1], initial: [0, 1, 2], count: 5 })).toThrow(RecurrenceError);
  });

  it('rejects invalid coefficients and initial values', () => {
    expect(validateRecurrenceConfig({ coefficients: [Number.NaN, 1], initial: [0, 1], count: 5 }).join(' ')).toContain('c1');
    expect(validateRecurrenceConfig({ coefficients: [1, Infinity], initial: [0, 1], count: 5 }).join(' ')).toContain('c2');
    expect(validateRecurrenceConfig({ coefficients: [1, 1], initial: [0, Number.NaN], count: 5 }).join(' ')).toContain('a(1)');
    expect(validateRecurrenceConfig({ coefficients: [], initial: [], count: 5 }).join(' ')).toContain('order');
  });

  it('rejects invalid term counts', () => {
    for (const count of [0, -3, 2.5, 501, Number.NaN]) {
      expect(validateRecurrenceConfig({ coefficients: [1], initial: [1], count }).join(' ')).toContain('number of terms');
    }
    expect(validateRecurrenceConfig({ coefficients: [1], initial: [1], count: 500 })).toEqual([]);
  });

  it('parseNumberInput accepts integers, decimals, exponents and fractions only', () => {
    expect(parseNumberInput(' 3 ')).toEqual({ value: 3 });
    expect(parseNumberInput('-2.5')).toEqual({ value: -2.5 });
    expect(parseNumberInput('1e3')).toEqual({ value: 1000 });
    expect(parseNumberInput('1/2')).toEqual({ value: 0.5 });
    for (const bad of ['', 'abc', '1,5', '--2', '1/0', '1e999', '2x', 'NaN', 'Infinity']) {
      expect(parseNumberInput(bad)).toHaveProperty('error');
    }
  });

  it('parseRecurrenceForm reports field-level errors and returns null config', () => {
    const bad = parseRecurrenceForm({ coefficients: ['1', 'x'], initial: ['0', ''], count: '0' });
    expect(bad.config).toBeNull();
    expect(bad.errors.coefficients).toEqual([null, expect.stringContaining('not a valid number')]);
    expect(bad.errors.initial[1]).toBe('This field is required.');
    expect(bad.errors.count).toContain('between');
    const mismatch = parseRecurrenceForm({ coefficients: ['1', '1'], initial: ['0'], count: '5' });
    expect(mismatch.config).toBeNull();
    expect(mismatch.errors.general.join(' ')).toContain('must equal the order');
    const ok = parseRecurrenceForm({ coefficients: ['1', '1'], initial: ['0', '1'], count: '10' });
    expect(ok.config).toEqual({ coefficients: [1, 1], initial: [0, 1], count: 10 });
  });
});

describe('numerical safeguards', () => {
  it('warns when integers pass 2^53 - 1 (Fibonacci: a(79) is the first unsafe term)', () => {
    const r = generateSequence({ coefficients: [1, 1], initial: [0, 1], count: 90 });
    expect(r.terms[78]).toBe(8944394323791464);
    expect(r.firstUnsafeIndex).toBe(79);
    expect(r.warnings[0].code).toBe('unsafe-integer');
    expect(r.warnings[0].index).toBe(79);
    expect(r.warnings[0].message).toContain('9,007,199,254,740,991');
    // F(78) < 2^53 so no warning below that
    expect(generateSequence({ coefficients: [1, 1], initial: [0, 1], count: 79 }).warnings).toEqual([]);
  });

  it('stops before a term that overflows to Infinity and says so', () => {
    const r = generateSequence({ coefficients: [10], initial: [1], count: 400 });
    expect(r.truncatedAt).toBe(309);
    expect(r.terms).toHaveLength(309); // a(0)..a(308) = 1e308 is the last finite power of ten
    expect(Number.isFinite(r.terms[308])).toBe(true);
    expect(r.warnings.some((w) => w.code === 'non-finite')).toBe(true);
  });

  it('flags non-integer inputs as floating-point approximations', () => {
    const r = generateSequence({ coefficients: [0.1], initial: [1], count: 5 });
    expect(r.warnings.map((w) => w.code)).toContain('non-integer-inputs');
  });

  it('flags large initial conditions', () => {
    const r = generateSequence({ coefficients: [1], initial: [2 ** 60], count: 3 });
    expect(r.firstUnsafeIndex).toBe(0);
  });
});

describe('built-in examples and CSV export', () => {
  it('every example is valid and produces the documented values', () => {
    const byId = Object.fromEntries(RECURRENCE_EXAMPLES.map((e) => [e.id, generateSequence(e.config).terms]));
    expect(byId.fibonacci).toEqual([0, 1, 1, 2, 3, 5, 8, 13, 21, 34]);
    expect(byId.arithmetic.slice(0, 5)).toEqual([3, 7, 11, 15, 19]);
    expect(byId.geometric.slice(0, 4)).toEqual([2, 6, 18, 54]);
    expect(byId['custom-second-order'].slice(0, 5)).toEqual([0, 1, 3, 7, 15]);
    expect(byId['first-order'].slice(0, 5)).toEqual([64, 32, 16, 8, 4]);
  });

  it('exports CSV with header and one row per term', () => {
    const csv = sequenceToCsv(generateSequence({ coefficients: [1, 1], initial: [0, 1], count: 4 }));
    expect(csv.split('\r\n')).toEqual(['n,a(n),type,note', '0,0,initial,', '1,1,initial,', '2,1,computed,', '3,2,computed,', '']);
  });

  it('marks possibly inexact rows in the CSV', () => {
    const csv = sequenceToCsv(generateSequence({ coefficients: [1, 1], initial: [0, 1], count: 81 }));
    const rows = csv.trim().split('\r\n');
    expect(rows[1 + 78]).toMatch(/,$/);
    expect(rows[1 + 79]).toContain('may be inexact');
  });
});
