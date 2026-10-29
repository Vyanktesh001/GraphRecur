import type { RecurrenceConfig } from '../types/recurrence';

export interface RecurrenceExample {
  id: string;
  name: string;
  description: string;
  config: RecurrenceConfig;
}

/** Built-in examples. Expected values are verified in src/tests/recurrence.test.ts. */
export const RECURRENCE_EXAMPLES: RecurrenceExample[] = [
  {
    id: 'fibonacci',
    name: 'Fibonacci sequence',
    description: 'a(n) = a(n-1) + a(n-2) with a(0) = 0, a(1) = 1.',
    config: { coefficients: [1, 1], initial: [0, 1], count: 10 },
  },
  {
    id: 'arithmetic',
    name: 'Arithmetic progression',
    description: 'a(n) = 2·a(n-1) − a(n-2) with a(0) = 3, a(1) = 7 gives 3, 7, 11, 15, … (common difference 4).',
    config: { coefficients: [2, -1], initial: [3, 7], count: 10 },
  },
  {
    id: 'geometric',
    name: 'Geometric progression',
    description: 'a(n) = 3·a(n-1) with a(0) = 2 gives 2, 6, 18, 54, … (common ratio 3).',
    config: { coefficients: [3], initial: [2], count: 10 },
  },
  {
    id: 'custom-second-order',
    name: 'Second order, custom coefficients',
    description: 'a(n) = 3·a(n-1) − 2·a(n-2) with a(0) = 0, a(1) = 1 gives 0, 1, 3, 7, 15, … (2^n − 1).',
    config: { coefficients: [3, -2], initial: [0, 1], count: 10 },
  },
  {
    id: 'first-order',
    name: 'First order (halving)',
    description: 'a(n) = 0.5·a(n-1) with a(0) = 64 gives 64, 32, 16, 8, … (exponential decay).',
    config: { coefficients: [0.5], initial: [64], count: 12 },
  },
];
