// Evenly spaced "nice" axis ticks (1, 2 or 5 times a power of ten) from 0
// to at least maxValue.
export function niceTicks(maxValue, targetCount = 5) {
  const max = maxValue > 0 ? maxValue : 1
  const rawStep = max / targetCount
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const step = [1, 2, 5, 10].map((f) => f * magnitude).find((s) => s >= rawStep)
  const ticks = []
  for (let value = 0; value < max + step - 1e-9; value += step) ticks.push(Number(value.toFixed(10)))
  return ticks
}
