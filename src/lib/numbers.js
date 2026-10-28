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
