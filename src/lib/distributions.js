// Distribution metadata for the editor: labels, parameters, conversion
// between types and validation of single parameters.

import { distributionMean } from '../sim/random.js'

export const distributionOptions = [
  { type: 'constant', label: 'Constant' },
  { type: 'uniform', label: 'Uniform' },
  { type: 'triangular', label: 'Triangular' },
  { type: 'normal', label: 'Normal' },
  { type: 'exponential', label: 'Exponential' },
]

export const distributionParams = {
  constant: [{ key: 'value', label: 'Value' }],
  uniform: [
    { key: 'min', label: 'Min' },
    { key: 'max', label: 'Max' },
  ],
  triangular: [
    { key: 'min', label: 'Min' },
    { key: 'mode', label: 'Mode' },
    { key: 'max', label: 'Max' },
  ],
  normal: [
    { key: 'mean', label: 'Mean' },
    { key: 'sd', label: 'Std dev' },
  ],
  exponential: [{ key: 'mean', label: 'Mean' }],
}

const maxTime = 1e6

function round(value) {
  return Math.round(value * 1000) / 1000
}

// Builds a distribution of a new type with (about) the same mean.
export function convertDistribution(distribution, type) {
  const mean = round(distributionMean(distribution)) || 1
  switch (type) {
    case 'constant':
      return { type, value: mean }
    case 'uniform':
      return { type, min: round(mean * 0.8), max: round(mean * 1.2) }
    case 'triangular':
      return { type, min: round(mean * 0.8), mode: mean, max: round(mean * 1.2) }
    case 'normal':
      return { type, mean, sd: round(mean * 0.1) }
    case 'exponential':
      return { type, mean }
    default:
      throw new Error(`Unknown distribution type: ${type}`)
  }
}

// Validates one parameter value given the other current parameters.
// Every distribution must have a mean above 0, so the simulation always advances.
export function validateDistributionParam(distribution, key, value) {
  const d = { ...distribution, [key]: value }
  if (!Number.isFinite(value)) return 'Enter a number'
  if (value < 0) return 'Must be 0 or more'
  if (value > maxTime) return `Must be at most ${maxTime}`
  switch (d.type) {
    case 'constant':
      return value > 0 ? null : 'Must be greater than 0'
    case 'uniform':
      if (d.min > d.max) return 'Min must not exceed max'
      return d.max > 0 ? null : 'Max must be greater than 0'
    case 'triangular':
      if (d.min > d.mode) return 'Min must not exceed mode'
      if (d.mode > d.max) return 'Mode must not exceed max'
      return d.max > 0 ? null : 'Max must be greater than 0'
    case 'normal':
      return key === 'mean' && value <= 0 ? 'Mean must be greater than 0' : null
    case 'exponential':
      return value > 0 ? null : 'Mean must be greater than 0'
    default:
      return 'Unknown distribution type'
  }
}

export function validateDistribution(distribution) {
  const params = distributionParams[distribution?.type]
  if (!params) return 'Unknown distribution type'
  for (const { key, label } of params) {
    const error = validateDistributionParam(distribution, key, distribution[key])
    if (error) return `${label}: ${error}`
  }
  return null
}
