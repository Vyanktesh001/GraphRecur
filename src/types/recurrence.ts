/** a(n) = c1*a(n-1) + c2*a(n-2) + ... + ck*a(n-k), with k = coefficients.length. */
export interface RecurrenceConfig {
  /** coefficients[i] is c_{i+1}, the multiplier of a(n-(i+1)). */
  coefficients: number[];
  /** initial[i] is a(i), for i = 0..k-1. */
  initial: number[];
  /** Number of terms to generate: a(0) .. a(count-1). */
  count: number;
}

export type RecurrenceWarningCode = 'unsafe-integer' | 'non-finite' | 'non-integer-inputs';

export interface RecurrenceWarning {
  code: RecurrenceWarningCode;
  message: string;
  /** Index n of the first affected term, when relevant. */
  index?: number;
}

export interface RecurrenceStep {
  n: number;
  kind: 'initial' | 'computed';
  value: number;
  /** e.g. "a(5) = 1·a(4) + 1·a(3)" */
  formula: string;
  /** e.g. "= 1·3 + 1·2 = 3 + 2 = 5" */
  substitution: string;
}

export interface RecurrenceResult {
  terms: number[];
  steps: RecurrenceStep[];
  formula: string;
  initialConditions: string[];
  warnings: RecurrenceWarning[];
  /** Index of the first term whose magnitude exceeds 2^53 - 1 (integer inputs only). */
  firstUnsafeIndex: number | null;
  /** If a term overflowed to ±Infinity, generation stopped there (index of that term). */
  truncatedAt: number | null;
}

export interface SavedRecurrence {
  id: string;
  name: string;
  config: RecurrenceConfig;
  savedAt: string;
}

export interface SequenceRecord {
  id: string;
  formula: string;
  config: RecurrenceConfig;
  generatedAt: string;
  preview: number[];
}
