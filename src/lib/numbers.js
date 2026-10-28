// Parses user input as a number, accepting a comma as decimal point.
// Returns NaN for anything that is not a plain decimal number.
export function parseDecimal(text) {
  const normalized = String(text).trim().replace(',', '.')
  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(normalized)) return NaN
  return Number(normalized)
}

// Formats a number for display, dropping trailing zeros.
export function formatNumber(value, maxDigits = 2) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '–'
  return value.toLocaleString('en-US', { maximumFractionDigits: maxDigits, useGrouping: false })
}

// Formats a confidence interval { mean, halfWidth } as "mean ± halfWidth",
// or just the mean when there is no interval (a single replication).
export function formatInterval(interval, digits = 2) {
  if (interval.mean === null) return '–'
  if (interval.halfWidth === null) return formatNumber(interval.mean, digits)
  return `${formatNumber(interval.mean, digits)} ± ${formatNumber(interval.halfWidth, digits)}`
}
