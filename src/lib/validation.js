// Validation rules for single fields and for a whole model (used before a run
// and when importing a file). Field validators return an error message or null.

import { validateDistribution } from './distributions.js'

export const maxStations = 10
export const maxBufferCapacity = 10000
export const maxSimulationHours = 100000
export const maxReplications = 100
const maxSeed = 4294967295

const isInteger = (value) => Number.isInteger(value)

export const settingsRules = {
  simulationHours: (value, settings) => {
    if (!(value > 0)) return 'Must be greater than 0'
    if (value > maxSimulationHours) return `Must be at most ${maxSimulationHours}`
    if (value <= settings.warmupHours) return 'Must be greater than the warm-up'
    return null
  },
  warmupHours: (value, settings) => {
    if (!(value >= 0)) return 'Must be 0 or more'
    if (value >= settings.simulationHours) return 'Must be less than the simulation hours'
    return null
  },
  replications: (value) =>
    isInteger(value) && value >= 1 && value <= maxReplications
      ? null
      : `Whole number from 1 to ${maxReplications}`,
  seed: (value) => (isInteger(value) && value >= 0 && value <= maxSeed ? null : 'Whole number, 0 or more'),
}

export const stationRules = {
  name: (value) => (String(value).trim() === '' ? 'Name is required' : null),
  mtbf: (value) => (value >= 0 && value <= 1e7 ? null : 'Must be 0 (never fails) or more'),
  mttr: (value) => (value > 0 && value <= 1e7 ? null : 'Must be greater than 0'),
}

export const bufferRules = {
  capacity: (value) =>
    isInteger(value) && value >= 0 && value <= maxBufferCapacity
      ? null
      : `Whole number from 0 to ${maxBufferCapacity}`,
}

function checkNumber(errors, label, value, rule, context) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    errors.push(`${label}: must be a number`)
    return
  }
  const error = rule(value, context)
  if (error) errors.push(`${label}: ${error}`)
}

// Checks the structure and all values of a model. Returns a list of messages.
export function validateModel(model) {
  const errors = []
  if (!model || typeof model !== 'object') return ['The model must be an object']
  const { settings, source, stations, buffers } = model
  if (!settings || typeof settings !== 'object') {
    errors.push('Settings are missing')
  } else {
    if (settings.timeUnit !== 'minutes') errors.push('Settings timeUnit must be "minutes"')
    for (const key of Object.keys(settingsRules)) {
      checkNumber(errors, `Settings ${key}`, settings[key], settingsRules[key], settings)
    }
  }
  if (!source || (source.type !== 'alwaysAvailable' && source.type !== 'interarrival')) {
    errors.push('Source type must be "alwaysAvailable" or "interarrival"')
  } else if (source.type === 'interarrival') {
    const error = validateDistribution(source.interarrivalTime)
    if (error) errors.push(`Interarrival time: ${error}`)
  }
  if (!Array.isArray(stations) || stations.length === 0) {
    errors.push('The line needs at least one station')
    return errors
  }
  if (stations.length > maxStations) errors.push(`At most ${maxStations} stations`)
  const ids = new Set()
  stations.forEach((station, i) => {
    const label = `Station ${i + 1}`
    if (!station || typeof station !== 'object') {
      errors.push(`${label}: must be an object`)
      return
    }
    if (typeof station.id !== 'string' || station.id === '' || ids.has(station.id)) {
      errors.push(`${label}: needs a unique id`)
    }
    ids.add(station.id)
    if (typeof station.name !== 'string' || stationRules.name(station.name)) {
      errors.push(`${label}: name is required`)
    }
    const error = validateDistribution(station.processingTime)
    if (error) errors.push(`${label} processing time: ${error}`)
    checkNumber(errors, `${label} MTBF`, station.mtbf, stationRules.mtbf)
    checkNumber(errors, `${label} MTTR`, station.mttr, stationRules.mttr)
  })
  if (!Array.isArray(buffers) || buffers.length !== stations.length - 1) {
    errors.push('There must be exactly one buffer between each pair of stations')
  } else {
    buffers.forEach((buffer, i) => {
      checkNumber(errors, `Buffer ${i + 1} capacity`, buffer?.capacity, bufferRules.capacity)
    })
  }
  return errors
}
