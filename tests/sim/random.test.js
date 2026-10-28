import { describe, expect, it } from 'vitest'
import { createRandom, distributionMean, normalCdf, normalPdf, sample } from '../../src/sim/random.js'

const sampleCount = 100000

function moments(distribution, seed = 12345) {
  const rng = createRandom(seed)
  let sum = 0
  let sumSq = 0
  let min = Infinity
  for (let i = 0; i < sampleCount; i++) {
    const x = sample(distribution, rng)
    sum += x
    sumSq += x * x
    if (x < min) min = x
  }
  const mean = sum / sampleCount
  const variance = (sumSq - sampleCount * mean * mean) / (sampleCount - 1)
  return { mean, variance, min }
}

// Mean tolerance: 4 standard errors. Variance tolerance: 3% relative,
// which is well above the sampling error of the variance at n = 100,000.
function expectMoments(distribution, theory) {
  const result = moments(distribution)
  const standardError = Math.sqrt(theory.variance / sampleCount)
  expect(Math.abs(result.mean - theory.mean)).toBeLessThan(4 * standardError)
  expect(Math.abs(result.variance - theory.variance) / theory.variance).toBeLessThan(0.03)
  return result
}

// Mean and variance of a normal(mean, sd) truncated to [0, inf).
function truncatedNormalTheory(mean, sd) {
  const alpha = -mean / sd
  const lambda = normalPdf(alpha) / (1 - normalCdf(alpha))
  return {
    mean: mean + sd * lambda,
    variance: sd * sd * (1 + alpha * lambda - lambda * lambda),
  }
}

describe('random generator', () => {
  it('gives the same sequence for the same seed', () => {
    const a = createRandom(2026)
    const b = createRandom(2026)
    for (let i = 0; i < 1000; i++) expect(a()).toBe(b())
  })

  it('gives different sequences for different seeds', () => {
    const a = createRandom(1)
    const b = createRandom(2)
    const same = Array.from({ length: 100 }, () => a() === b()).filter(Boolean).length
    expect(same).toBe(0)
  })

  it('gives uncorrelated sequences for consecutive seeds', () => {
    const n = 100000
    const a = createRandom(500)
    const b = createRandom(501)
    let sumAb = 0
    let sumA = 0
    let sumB = 0
    for (let i = 0; i < n; i++) {
      const x = a()
      const y = b()
      sumAb += x * y
      sumA += x
      sumB += y
    }
    const covariance = sumAb / n - (sumA / n) * (sumB / n)
    const correlation = covariance / (1 / 12)
    expect(Math.abs(correlation)).toBeLessThan(0.015)
  })

  it('returns numbers in [0, 1) with mean 1/2 and variance 1/12', () => {
    const rng = createRandom(7)
    let sum = 0
    let sumSq = 0
    for (let i = 0; i < sampleCount; i++) {
      const u = rng()
      expect(u >= 0 && u < 1).toBe(true)
      sum += u
      sumSq += u * u
    }
    const mean = sum / sampleCount
    expect(Math.abs(mean - 0.5)).toBeLessThan(0.005)
    expect(Math.abs(sumSq / sampleCount - mean * mean - 1 / 12)).toBeLessThan(0.002)
  })

  it('gives identical samples for the same seed across distributions', () => {
    const distribution = { type: 'normal', mean: 5, sd: 2 }
    const a = createRandom(99)
    const b = createRandom(99)
    for (let i = 0; i < 1000; i++) expect(sample(distribution, a)).toBe(sample(distribution, b))
  })
})

describe('distributions (100,000 samples vs theory)', () => {
  it('constant', () => {
    const result = moments({ type: 'constant', value: 4.5 })
    expect(result.mean).toBeCloseTo(4.5, 12)
    expect(result.variance).toBeCloseTo(0, 12)
  })

  it('uniform (2, 8): mean 5, variance 3', () => {
    const result = expectMoments({ type: 'uniform', min: 2, max: 8 }, { mean: 5, variance: 3 })
    expect(result.min).toBeGreaterThanOrEqual(2)
  })

  it('triangular (1, 3, 8): mean 4, variance 39/18', () => {
    const result = expectMoments(
      { type: 'triangular', min: 1, mode: 3, max: 8 },
      { mean: 4, variance: (1 + 9 + 64 - 3 - 8 - 24) / 18 },
    )
    expect(result.min).toBeGreaterThanOrEqual(1)
  })

  it('triangular with mode at an end point (0, 0, 6): mean 2, variance 2', () => {
    expectMoments({ type: 'triangular', min: 0, mode: 0, max: 6 }, { mean: 2, variance: 2 })
  })

  it('normal (10, 2), truncation negligible: mean 10, variance 4', () => {
    expectMoments({ type: 'normal', mean: 10, sd: 2 }, { mean: 10, variance: 4 })
  })

  it('normal (1, 2) truncated at 0 matches truncated-normal theory', () => {
    const theory = truncatedNormalTheory(1, 2)
    const result = expectMoments({ type: 'normal', mean: 1, sd: 2 }, theory)
    expect(result.min).toBeGreaterThanOrEqual(0)
  })

  it('exponential (mean 8): mean 8, variance 64', () => {
    const result = expectMoments({ type: 'exponential', mean: 8 }, { mean: 8, variance: 64 })
    expect(result.min).toBeGreaterThanOrEqual(0)
  })

  it('distributionMean gives the theoretical mean of each type', () => {
    expect(distributionMean({ type: 'constant', value: 4 })).toBe(4)
    expect(distributionMean({ type: 'uniform', min: 2, max: 8 })).toBe(5)
    expect(distributionMean({ type: 'triangular', min: 1, mode: 3, max: 8 })).toBe(4)
    expect(distributionMean({ type: 'normal', mean: 10, sd: 2 })).toBeCloseTo(10, 4)
    expect(distributionMean({ type: 'normal', mean: 1, sd: 2 })).toBeCloseTo(truncatedNormalTheory(1, 2).mean, 12)
    expect(distributionMean({ type: 'exponential', mean: 8 })).toBe(8)
  })

  it('throws for an unknown distribution type', () => {
    expect(() => sample({ type: 'weibull' }, createRandom(1))).toThrow()
  })
})
