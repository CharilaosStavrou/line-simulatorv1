// Seeded pseudo-random numbers and sampling from the supported distributions.
// All times are in the model's time unit (minutes).

// Mulberry32: a small, fast 32-bit generator with good statistical quality
// for simulation use. Returns a function giving uniform numbers in [0, 1).
export function mulberry32(seed) {
  let state = seed >>> 0
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createRandom(seed) {
  return mulberry32(seed)
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
