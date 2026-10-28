// Static capacity check of a model, before any simulation.

import { effectiveProcessingTime } from './lineStatistics.js'
import { distributionMean } from './random.js'

// Effective capacity of each station in parts per hour:
// 60 / (mean processing time / availability).
export function stationCapacities(stations) {
  return stations.map((station) => 60 / effectiveProcessingTime(station))
}

// Compares the arrival rate (60 / mean interarrival time) with the capacity
// of the slowest station. With an interarrival source and arrivals at or
// above that capacity the line is unstable: the queue in front of the line
// grows without limit. arrivalRatePerHour is null when material is always
// available.
export function checkCapacity(model) {
  const capacities = stationCapacities(model.stations)
  let slowestIndex = 0
  capacities.forEach((capacity, i) => {
    if (capacity < capacities[slowestIndex]) slowestIndex = i
  })
  const capacityPerHour = capacities[slowestIndex]
  const arrivalRatePerHour =
    model.source.type === 'interarrival' ? 60 / distributionMean(model.source.interarrivalTime) : null
  return {
    capacityPerHour,
    slowestIndex,
    arrivalRatePerHour,
    overloaded: arrivalRatePerHour !== null && arrivalRatePerHour >= capacityPerHour,
  }
}
