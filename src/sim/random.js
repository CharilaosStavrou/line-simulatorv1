// Seeded pseudo-random numbers and sampling from the supported distributions.
// All times are in the model's time unit (minutes).

// Mulberry32: a small 32-bit generator. It is used only to expand the user's
// seed into the 128-bit state of the main generator below. On its own its
// cycle (2^32) is too short: the streams of nearby seeds (seed, seed + 1, ...)
// start only a few hundred thousand draws apart, so long replications with
// consecutive seeds would overlap.
export function mulberry32(seed) {
  let state = seed >>> 0
  return function nextUint32() {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return (t ^ (t >>> 14)) >>> 0
  }
}

function rotl(x, k) {
  return (x << k) | (x >>> (32 - k))
}

// xoshiro128** (Blackman and Vigna): period 2^128 - 1, so the streams of
// different seeds never overlap in practice. Returns a function giving
// uniform numbers in [0, 1) with 32-bit resolution.
export function createRandom(seed) {
  const seeder = mulberry32(seed)
  let s0 = seeder()
  let s1 = seeder()
  let s2 = seeder()
  let s3 = seeder()
  if ((s0 | s1 | s2 | s3) === 0) s0 = 1 // the all-zero state is invalid

  return function next() {
    const result = Math.imul(rotl(Math.imul(s1, 5), 7), 9) >>> 0
    const t = s1 << 9
    s2 ^= s0
    s3 ^= s1
    s1 ^= s2
    s0 ^= s3
    s2 ^= t
    s3 = rotl(s3, 11)
    return result / 4294967296
  }
}

export const distributionTypes = ['constant', 'uniform', 'triangular', 'normal', 'exponential']

export function sampleConstant(value) {
  return value
}

export function sampleUniform(rng, min, max) {
  return min + (max - min) * rng()
}

// Inverse-CDF sampling of the triangular distribution.
export function sampleTriangular(rng, min, mode, max) {
  if (max === min) return min
  const u = rng()
  const split = (mode - min) / (max - min)
  if (u < split) return min + Math.sqrt(u * (max - min) * (mode - min))
  return max - Math.sqrt((1 - u) * (max - min) * (max - mode))
}

// Standard normal via the Box-Muller transform (one value per call, so the
// number of generator draws per sample is fixed apart from rejections).
function sampleStandardNormal(rng) {
  const u1 = 1 - rng() // in (0, 1], keeps log finite
  const u2 = rng()
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

const maxNormalAttempts = 1000

// Normal truncated at 0: negative draws are rejected and redrawn, so the
// result follows the normal density restricted to [0, inf). When the mean is
// several standard deviations above 0 this equals the plain normal.
export function sampleTruncatedNormal(rng, mean, sd) {
  if (sd === 0) return Math.max(0, mean)
  for (let attempt = 0; attempt < maxNormalAttempts; attempt++) {
    const x = mean + sd * sampleStandardNormal(rng)
    if (x >= 0) return x
  }
  return 0
}

// Inverse-CDF sampling of the exponential distribution.
export function sampleExponential(rng, mean) {
  return -mean * Math.log(1 - rng())
}

// Standard normal density and CDF (Abramowitz and Stegun 7.1.26, error < 1.5e-7).
export function normalPdf(x) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
}

export function normalCdf(x) {
  const z = Math.abs(x) / Math.SQRT2
  const t = 1 / (1 + 0.3275911 * z)
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))))
  const erf = 1 - poly * Math.exp(-z * z)
  return x >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf)
}

// Theoretical mean of a distribution. For the normal it is the mean of the
// distribution truncated at 0, which is what sampleTruncatedNormal draws from.
export function distributionMean(distribution) {
  const d = distribution
  switch (d.type) {
    case 'constant':
      return d.value
    case 'uniform':
      return (d.min + d.max) / 2
    case 'triangular':
      return (d.min + d.mode + d.max) / 3
    case 'normal': {
      if (d.sd === 0) return Math.max(0, d.mean)
      const alpha = -d.mean / d.sd
      return d.mean + (d.sd * normalPdf(alpha)) / (1 - normalCdf(alpha))
    }
    case 'exponential':
      return d.mean
    default:
      throw new Error(`Unknown distribution type: ${d.type}`)
  }
}

// Draws one value from a distribution object such as
// { type: 'triangular', min: 2, mode: 3, max: 5 }.
export function sample(distribution, rng) {
  const d = distribution
  switch (d.type) {
    case 'constant':
      return sampleConstant(d.value)
    case 'uniform':
      return sampleUniform(rng, d.min, d.max)
    case 'triangular':
      return sampleTriangular(rng, d.min, d.mode, d.max)
    case 'normal':
      return sampleTruncatedNormal(rng, d.mean, d.sd)
    case 'exponential':
      return sampleExponential(rng, d.mean)
    default:
      throw new Error(`Unknown distribution type: ${d.type}`)
  }
}
