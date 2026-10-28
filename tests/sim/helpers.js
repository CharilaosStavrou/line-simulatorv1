// Builds a line model with sensible defaults; stations are given as
// [processingTime, mtbf, mttr] and buffers as capacities.
export function buildModel({
  stations,
  buffers = [],
  source = { type: 'alwaysAvailable' },
  simulationHours = 100,
  warmupHours = 10,
  seed = 1,
}) {
  return {
    settings: { simulationHours, warmupHours, replications: 1, seed, timeUnit: 'minutes' },
    source,
    stations: stations.map(([processingTime, mtbf = 0, mttr = 0], i) => ({
      id: `s${i + 1}`,
      name: `Station ${i + 1}`,
      processingTime,
      mtbf,
      mttr,
    })),
    buffers: buffers.map((capacity) => ({ capacity })),
  }
}

export const constant = (value) => ({ type: 'constant', value })
export const exponential = (mean) => ({ type: 'exponential', mean })
export const triangular = (min, mode, max) => ({ type: 'triangular', min, mode, max })
export const uniform = (min, max) => ({ type: 'uniform', min, max })
export const normal = (mean, sd) => ({ type: 'normal', mean, sd })

export function stateSum(station) {
  return station.percentBusy + station.percentStarved + station.percentBlocked + station.percentDown
}
