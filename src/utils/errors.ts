/** Raised when a graph (or an edit to a graph) is not a valid simple graph. */
export class GraphError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GraphError';
  }
}

/** Raised when an algorithm's precondition is violated (bad start vertex, negative weight, ...). */
export class AlgorithmError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AlgorithmError';
  }
}

export class RecurrenceError extends Error {
  readonly issues: string[];
  constructor(issues: string[]) {
    super(issues.join(' '));
    this.name = 'RecurrenceError';
    this.issues = issues;
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
