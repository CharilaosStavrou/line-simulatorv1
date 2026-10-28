// Independent replications of a model with seeds seed, seed + 1, ... and
// the summary across them: means with 95% confidence intervals for the main
// results, mean station and buffer statistics, and a mean WIP curve.

import { confidenceInterval } from './confidence.js'
import { simulateLine } from './line.js'
import { findBottleneck } from './lineStatistics.js'

const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length

function meanOf(results, read) {
  return mean(results.map(read))
}

export function summarizeReplications(model, results, seeds) {
  const stations = model.stations.map((station, i) => ({
    id: station.id,
    name: station.name,
    percentBusy: meanOf(results, (r) => r.stations[i].percentBusy),
    percentStarved: meanOf(results, (r) => r.stations[i].percentStarved),
    percentBlocked: meanOf(results, (r) => r.stations[i].percentBlocked),
    percentDown: meanOf(results, (r) => r.stations[i].percentDown),
  }))
  // Bottleneck of the mean station states, and how often each replication
  // found the same station.
  const bottleneck = findBottleneck(stations, model.stations)
  bottleneck.replicationsAsBottleneck = results.filter((r) => r.bottleneck.index === bottleneck.index).length

  return {
    replicationCount: results.length,
    seeds,
    measuredMinutes: results[0].measuredMinutes,
    throughputPerHour: confidenceInterval(results.map((r) => r.throughputPerHour)),
    averageWip: confidenceInterval(results.map((r) => r.averageWip)),
    averageCycleTime: confidenceInterval(results.map((r) => r.averageCycleTime)),
    partsFinished: confidenceInterval(results.map((r) => r.partsFinished)),
    stations,
    buffers: model.buffers.map((buffer, i) => ({
      capacity: buffer.capacity,
      averageLevel: meanOf(results, (r) => r.buffers[i].averageLevel),
      percentFull: buffer.capacity > 0 ? meanOf(results, (r) => r.buffers[i].percentFull) : null,
    })),
    bottleneck,
    wipOverTime: results[0].wipOverTime.map((point, k) => ({
      time: point.time,
      wip: meanOf(results, (r) => r.wipOverTime[k].wip),
    })),
    replications: results.map((r, i) => ({
      seed: seeds[i],
      throughputPerHour: r.throughputPerHour,
      averageWip: r.averageWip,
      averageCycleTime: r.averageCycleTime,
      bottleneckName: r.bottleneck.name,
    })),
  }
}

// Runs settings.replications replications. onProgress receives the overall
// completed fraction (0 to 1).
export function runReplications(model, { onProgress } = {}) {
  const count = model.settings.replications
  const results = []
  const seeds = []
  for (let r = 0; r < count; r++) {
    const seed = model.settings.seed + r
    seeds.push(seed)
    const reportProgress = onProgress ? (fraction) => onProgress((r + fraction) / count) : undefined
    results.push(simulateLine(model, { seed, onProgress: reportProgress, progressSteps: Math.ceil(50 / count) }))
  }
  return summarizeReplications(model, results, seeds)
}
