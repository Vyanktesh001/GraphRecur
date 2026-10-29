/** Compact, readable number formatting for tables and explanations (never used for CSV). */
export function formatNumber(x: number): string {
  if (Number.isNaN(x)) return 'NaN';
  if (!Number.isFinite(x)) return x > 0 ? '∞' : '−∞';
  if (Object.is(x, -0)) return '0';
  if (Number.isInteger(x) && Math.abs(x) < 1e21) return String(x);
  const abs = Math.abs(x);
  if (abs >= 1e21 || abs < 1e-6) return x.toExponential(8).replace(/\.?0+e/, 'e');
  return String(Number(x.toPrecision(12)));
}

/** Writes a value in an expression: negative numbers get parentheses, e.g. "(-2)". */
export function formatOperand(x: number): string {
  const s = formatNumber(x);
  return x < 0 ? `(${s})` : s;
}
