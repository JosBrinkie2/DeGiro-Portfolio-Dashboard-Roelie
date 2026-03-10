/**
 * Parse a Dutch-formatted number string to a JavaScript number.
 * Dutch format uses period as thousands separator and comma as decimal separator.
 * Examples: "1.234,56" → 1234.56, "-42,00" → -42, "" → 0
 */
export function parseDutchNumber(raw: string | undefined | null): number {
  if (!raw || raw.trim() === '' || raw.trim() === '-') return 0;
  // Remove thousands separator (period), replace decimal comma with dot
  const normalized = raw.trim().replace(/\./g, '').replace(',', '.');
  const result = parseFloat(normalized);
  return isNaN(result) ? 0 : result;
}

/**
 * Format a number as a Euro currency string.
 * Example: 1234.56 → "€ 1.234,56"
 */
export function formatEuro(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number as a compact Euro string for small spaces.
 * Example: 1234.56 → "€1.235"
 */
export function formatEuroCompact(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a percentage with sign and 2 decimals.
 * Example: 0.1234 → "+12.34%"
 */
export function formatPct(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(2)}%`;
}
