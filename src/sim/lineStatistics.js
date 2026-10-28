// Collects the statistics of a line run. Everything is reset at the end of
// the warm-up period, so results describe only the measurement period.

import { createStateTimer, createTimeWeighted } from './statistics.js'

export const stationStates = ['busy', 'starved', 'blocked', 'down']

// Bottleneck by the "active period" approach (Roser, Nakano and Tanaka): a
// station is active while it is busy or down, because then it is the one
// holding up the flow. While starved or blocked it is waiting for another
// station and cannot be the constraint. The station with the highest share of
// active time constrains the line most. Unlike plain utilisation this counts
// breakdowns, so an unreliable machine with moderate busy time is still found.
// Ties go to the most upstream station.
export function findBottleneck(stationResults) {
  let best = null
  stationResults.forEach((station, index) => {
    const activePercent = station.percentBusy + station.percentDown
    if (!best || activePercent > best.activePercent + 1e-9) {
      best = { index, id: station.id, name: station.name, activePercent }
    }
  })
  return best
}

export function createLineStatistics({ stations, buffers, startTime = 0 }) {
  const stationTimers = stations.map(() => createStateTimer(stationStates, 'starved', startTime))
  const bufferLevels = buffers.map(() => createTimeWeighted(0, startTime))
  const bufferFull = buffers.map(() => createTimeWeighted(0, startTime))
  const wip = createTimeWeighted(0, startTime)
  let periodStart = startTime
  let exits = 0
  let cycleTimeSum = 0
  let lastSampleTime = startTime
  let lastSampleArea = 0
  const wipOverTime = []

  // Records the current state of the line; call after every event.
  function observe(now, stationStateList, bufferLevelList, wipCount) {
    stationStateList.forEach((state, i) => {
      if (stationTimers[i].current !== state) stationTimers[i].set(now, state)
    })
    bufferLevelList.forEach((level, i) => {
      if (bufferLevels[i].value !== level) bufferLevels[i].update(now, level)
      const isFull = buffers[i].capacity > 0 && level >= buffers[i].capacity ? 1 : 0
      if (bufferFull[i].value !== isFull) bufferFull[i].update(now, isFull)
    })
    if (wip.value !== wipCount) wip.update(now, wipCount)
  }

  function recordExit(part, now) {
    exits++
    cycleTimeSum += now - part.arrivalTime
  }

  function reset(now) {
    stationTimers.forEach((timer) => timer.reset(now))
    bufferLevels.forEach((stat) => stat.reset(now))
    bufferFull.forEach((stat) => stat.reset(now))
    wip.reset(now)
    periodStart = now
    exits = 0
    cycleTimeSum = 0
    lastSampleTime = now
    lastSampleArea = 0
    wipOverTime.length = 0
  }

  // Stores the time-average WIP over the interval since the previous sample.
  function sampleWip(now) {
    const area = wip.areaUntil(now)
    const elapsed = now - lastSampleTime
    if (elapsed <= 0) return
    wipOverTime.push({ time: now, wip: (area - lastSampleArea) / elapsed })
    lastSampleTime = now
    lastSampleArea = area
  }

  function summary(now) {
    const measuredMinutes = now - periodStart
    const stationResults = stations.map((station, i) => {
      const f = stationTimers[i].fractions(now)
      return {
        id: station.id,
        name: station.name,
        percentBusy: 100 * f.busy,
        percentStarved: 100 * f.starved,
        percentBlocked: 100 * f.blocked,
        percentDown: 100 * f.down,
      }
    })
    return {
      measuredMinutes,
      partsFinished: exits,
      throughputPerHour: measuredMinutes > 0 ? (exits / measuredMinutes) * 60 : 0,
      averageWip: wip.mean(now),
      averageCycleTime: exits > 0 ? cycleTimeSum / exits : null,
      stations: stationResults,
      buffers: buffers.map((buffer, i) => ({
        capacity: buffer.capacity,
        averageLevel: bufferLevels[i].mean(now),
        percentFull: buffer.capacity > 0 ? 100 * bufferFull[i].mean(now) : null,
      })),
      bottleneck: findBottleneck(stationResults),
      wipOverTime: [...wipOverTime],
    }
  }

  return { observe, recordExit, reset, sampleWip, summary }
}
