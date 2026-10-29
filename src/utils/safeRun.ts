import type { AlgorithmTrace } from '../types/algorithm';
import { errorMessage } from './errors';

export type RunOutcome<R> = { trace: AlgorithmTrace<R>; error?: undefined } | { trace?: undefined; error: string };

/** Runs an algorithm and converts a thrown precondition error into a message for the UI. */
export function safeRun<R>(run: () => AlgorithmTrace<R>): RunOutcome<R> {
  try {
    return { trace: run() };
  } catch (err) {
    return { error: errorMessage(err) };
  }
}
