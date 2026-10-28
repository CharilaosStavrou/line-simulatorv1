import { describe, expect, it } from 'vitest'
import { confidenceInterval, tQuantile975 } from '../../src/sim/confidence.js'
import { simulateLine } from '../../src/sim/line.js'
import { createRandom, sample } from '../../src/sim/random.js'
import { runReplications } from '../../src/sim/replications.js'
import { buildModel, constant, exponential, triangular } from './helpers.js'

describe('Student t quantiles', () => {
  it('match published two-sided 95% values', () => {
    const published = { 1: 12.706, 2: 4.303, 9: 2.262, 29: 2.045, 30: 2.042, 40: 2.021, 60: 2.0, 99: 1.984, 120: 1.98 }
    for (const [df, value] of Object.entries(published)) {
      expect(Math.abs(tQuantile975(Number(df)) - value)).toBeLessThan(0.001)
    }
  })
})

describe('confidenceInterval', () => {
  it('computes mean, sample standard deviation and t-based half-width', () => {
    const result = confidenceInterval([2, 4, 4, 4, 5, 5, 7, 9])
    expect(result.mean).toBe(5)
    expect(result.standardDeviation).toBeCloseTo(Math.sqrt(32 / 7), 12)
    expect(result.halfWidth).toBeCloseTo((2.365 * Math.sqrt(32 / 7)) / Math.sqrt(8), 12)
    expect(result.n).toBe(8)
  })

  it('gives no interval for a single value and skips missing values', () => {
    expect(confidenceInterval([3])).toEqual({ mean: 3, halfWidth: null, standardDeviation: null, n: 1 })
    expect(confidenceInterval([null, 2, 4]).mean).toBe(3)
  })

  it('covers the true mean 95% of the time for normal data', () => {
    // 4000 intervals from 5 normal(10, 2) values each; the sampling error of
    // the coverage estimate is about 0.35 percentage points.
    const rng = createRandom(31)
    const trials = 4000
    let covered = 0
    for (let t = 0; t < trials; t++) {
      const values = Array.from({ length: 5 }, () => sample({ type: 'normal', mean: 10, sd: 2 }, rng))
      const ci = confidenceInterval(values)
      if (Math.abs(ci.mean - 10) <= ci.halfWidth) covered++
    }
    expect(Math.abs(covered / trials - 0.95)).toBeLessThan(0.012)
  })

  it('covers the true mean about 95% of the time even for skewed data', () => {
    // 2000 intervals from 5 exponential samples each (mean 1): coverage of a
    // t interval for skewed data is a little below 95%, but well above 85%.
    let seed = 12345
    const uniform = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return (seed + 0.5) / 4294967296
    }
    let covered = 0
    const trials = 2000
    for (let t = 0; t < trials; t++) {
      const values = Array.from({ length: 5 }, () => -Math.log(uniform()))
      const ci = confidenceInterval(values)
      if (Math.abs(ci.mean - 1) <= ci.halfWidth) covered++
    }
    expect(covered / trials).toBeGreaterThan(0.85)
    expect(covered / trials).toBeLessThan(0.97)
  })
})

describe('runReplications', () => {
  const model = buildModel({
    stations: [[triangular(2, 3, 5)], [exponential(4), 200, 20], [constant(3)]],
    buffers: [2, 1],
    warmupHours: 10,
    simulationHours: 210,
    seed: 100,
  })
  model.settings.replications = 5

  it('runs one replication per seed (seed, seed + 1, ...) and summarises them', () => {
    const summary = runReplications(model)
    expect(summary.replicationCount).toBe(5)
    expect(summary.seeds).toEqual([100, 101, 102, 103, 104])
    const single = simulateLine(model, { seed: 102 })
    expect(summary.replications[2].throughputPerHour).toBe(single.throughputPerHour)
    const throughputs = summary.replications.map((r) => r.throughputPerHour)
    expect(summary.throughputPerHour.mean).toBeCloseTo(throughputs.reduce((a, b) => a + b) / 5, 12)
    expect(summary.throughputPerHour.halfWidth).toBeGreaterThan(0)
    expect(new Set(throughputs).size).toBe(5)
  })

  it('averages station states, buffers and the WIP curve over replications', () => {
    const summary = runReplications(model)
    for (const station of summary.stations) {
      const total = station.percentBusy + station.percentStarved + station.percentBlocked + station.percentDown
      expect(total).toBeCloseTo(100, 9)
    }
    expect(summary.buffers).toHaveLength(2)
    expect(summary.wipOverTime).toHaveLength(200)
    const curveMean = summary.wipOverTime.reduce((sum, p) => sum + p.wip, 0) / 200
    expect(curveMean).toBeCloseTo(summary.averageWip.mean, 9)
    expect(summary.bottleneck.replicationsAsBottleneck).toBeGreaterThanOrEqual(1)
  })

  it('reports overall progress from 0 to 1 and is deterministic', () => {
    const fractions = []
    const a = runReplications(model, { onProgress: (f) => fractions.push(f) })
    expect(fractions.at(-1)).toBe(1)
    expect(fractions.every((f, i) => i === 0 || f >= fractions[i - 1])).toBe(true)
    expect(runReplications(model)).toEqual(a)
  })

  it('covers the M/M/1 theory (W = 40 min) with its 95% interval', () => {
    const mm1 = buildModel({
      stations: [[exponential(8)]],
      source: { type: 'interarrival', interarrivalTime: exponential(10) },
      warmupHours: 500,
      simulationHours: 10500,
      seed: 1,
    })
    mm1.settings.replications = 10
    const summary = runReplications(mm1)
    const { mean, halfWidth } = summary.averageCycleTime
    expect(Math.abs(mean - 40)).toBeLessThanOrEqual(halfWidth)
    expect(Math.abs(summary.averageWip.mean - 4)).toBeLessThanOrEqual(summary.averageWip.halfWidth)
  })
})
