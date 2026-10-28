// Student t confidence intervals for the mean of independent replications.

// Two-sided 95% critical values t(0.975, df) for df = 1..30.
const t975 = [
  12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.16, 2.145, 2.131,
  2.12, 2.11, 2.101, 2.093, 2.086, 2.08, 2.074, 2.069, 2.064, 2.06, 2.056, 2.052, 2.048, 2.045, 2.042,
]

// t(0.975, df). Exact table up to 30 degrees of freedom, above that the
// Cornish-Fisher expansion around the normal quantile (error < 0.001).
export function tQuantile975(df) {
  if (!(df >= 1)) throw new Error('Degrees of freedom must be at least 1')
  if (df <= 30) return t975[Math.floor(df) - 1]
  const z = 1.959964
  const z3 = z ** 3
  const z5 = z ** 5
  const z7 = z ** 7
  return (
    z +
    (z3 + z) / (4 * df) +
    (5 * z5 + 16 * z3 + 3 * z) / (96 * df ** 2) +
    (3 * z7 + 19 * z5 + 17 * z3 - 15 * z) / (384 * df ** 3)
  )
}

// Mean, sample standard deviation and the 95% half-width
// t(0.975, n - 1) x s / sqrt(n). With fewer than 2 values there is no
// interval and halfWidth is null. Missing values (null) are skipped.
export function confidenceInterval(values) {
  const data = values.filter((value) => value !== null && Number.isFinite(value))
  const n = data.length
  if (n === 0) return { mean: null, halfWidth: null, standardDeviation: null, n }
  const mean = data.reduce((sum, value) => sum + value, 0) / n
  if (n < 2) return { mean, halfWidth: null, standardDeviation: null, n }
  const variance = data.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (n - 1)
  const standardDeviation = Math.sqrt(variance)
  return { mean, halfWidth: (tQuantile975(n - 1) * standardDeviation) / Math.sqrt(n), standardDeviation, n }
}
