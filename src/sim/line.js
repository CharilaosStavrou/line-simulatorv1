// Serial production line model on top of the generic engine.
//
// Parts flow: source -> station 1 -> buffer 1 -> station 2 -> ... -> sink.
// With an interarrival source, arriving parts wait in an unlimited input
// queue in front of station 1. A part's cycle time runs from its arrival in
// the system (entering the input queue, or entering station 1 when material is
// always available) until it leaves the last station.
//
// Event types:
//   arrival    a new part arrives (interarrival source only)
//   finish     a station completes processing of its part
//   fail       a station breaks down
//   repair     a station's repair is complete
//   sample     a point of the WIP-over-time series is recorded
//
// Blocking after service: a finished part stays on its station (BLOCKED)
// until the downstream buffer has space. With buffer capacity 0 it moves
// straight to the next station, which must be free: not busy, not blocked and
// not down. A down station neither accepts nor releases parts.
//
// Breakdowns are time-based: time to failure and repair time are exponential
// with means mtbf and mttr, and the failure clock runs in every state. A
// failure during processing pauses the part; after the repair processing
// resumes with the remaining time.
//
// Warm-up: statistics are reset after all events at the warm-up time, so the
// measurement period is (warmup, end]: a part leaving exactly at the warm-up
// time is not counted, one leaving exactly at the end time is.

import { createEngine } from './engine.js'
import { createLineStatistics } from './lineStatistics.js'
import { createRandom, sample, sampleExponential } from './random.js'

const minutesPerHour = 60

function checkModel(model) {
  const { settings, source, stations, buffers } = model
  if (!stations || stations.length === 0) throw new Error('The line needs at least one station')
  if (!buffers || buffers.length !== stations.length - 1) {
    throw new Error('There must be exactly one buffer between each pair of stations')
  }
  if (!(settings.warmupHours >= 0 && settings.simulationHours > settings.warmupHours)) {
    throw new Error('Simulation hours must be greater than warm-up hours (>= 0)')
  }
  if (source.type !== 'alwaysAvailable' && source.type !== 'interarrival') {
    throw new Error(`Unknown source type: ${source.type}`)
  }
}

export function stationState(station) {
  if (station.isDown) return 'down'
  if (station.phase === 'processing') return 'busy'
  if (station.phase === 'finished') return 'blocked'
  return 'starved'
}

export function createLineSimulation(model, options = {}) {
  checkModel(model)
  const seed = options.seed ?? model.settings.seed
  const sampleCount = options.sampleCount ?? 200
  const rng = createRandom(seed)
  const engine = createEngine()
  const warmupTime = model.settings.warmupHours * minutesPerHour
  const endTime = model.settings.simulationHours * minutesPerHour
  const alwaysAvailable = model.source.type === 'alwaysAvailable'

  const stations = model.stations.map((config) => ({
    config,
    part: null,
    phase: 'idle', // idle | processing | finished
    isDown: false,
    finishEvent: null,
    finishTime: 0,
    remaining: 0,
    canFail: config.mtbf > 0 && config.mttr > 0,
  }))
  const buffers = model.buffers.map((buffer) => ({ capacity: buffer.capacity, parts: [] }))
  const inputQueue = []
  const last = stations.length - 1
  let nextPartId = 1
  let wipCount = 0
  const stats = createLineStatistics({ stations: model.stations, buffers })

  function newPart() {
    wipCount++
    return { id: nextPartId++, arrivalTime: engine.now }
  }

  function isFree(station) {
    return !station.isDown && station.phase === 'idle'
  }

  function startProcessing(index, part) {
    const station = stations[index]
    const duration = sample(station.config.processingTime, rng)
    station.part = part
    station.phase = 'processing'
    station.finishTime = engine.now + duration
    station.finishEvent = engine.schedule(duration, 'finish', index)
  }

  function takePart(station) {
    const part = station.part
    station.part = null
    station.phase = 'idle'
    return part
  }

  // Moves the finished part of station i downstream if possible.
  function release(i) {
    const station = stations[i]
    if (station.phase !== 'finished' || station.isDown) return false
    if (i === last) {
      stats.recordExit(takePart(station), engine.now)
      wipCount--
      return true
    }
    const buffer = buffers[i]
    if (buffer.parts.length < buffer.capacity) {
      buffer.parts.push(takePart(station))
      return true
    }
    if (buffer.capacity === 0 && isFree(stations[i + 1])) {
      startProcessing(i + 1, takePart(station))
      return true
    }
    return false
  }

  // Lets a free station i take its next part from upstream if one is waiting.
  function pull(i) {
    if (!isFree(stations[i])) return false
    let part = null
    if (i === 0) {
      part = alwaysAvailable ? newPart() : (inputQueue.shift() ?? null)
    } else if (buffers[i - 1].parts.length > 0) {
      part = buffers[i - 1].parts.shift()
    }
    if (!part) return false
    startProcessing(i, part)
    return true
  }

  // Applies all instantaneous moves possible at the current time. Sweeping
  // downstream to upstream lets freed space propagate up the line; the sweep
  // repeats until nothing moves.
  function propagate() {
    let changed = true
    while (changed) {
      changed = false
      for (let i = last; i >= 0; i--) {
        if (release(i)) changed = true
        if (pull(i)) changed = true
      }
    }
  }

  function observe() {
    stats.observe(
      engine.now,
      stations.map(stationState),
      buffers.map((buffer) => buffer.parts.length),
      wipCount,
    )
  }

  function on(type, handler) {
    engine.on(type, (event) => {
      handler(event.data)
      propagate()
      observe()
    })
  }

  on('arrival', () => {
    inputQueue.push(newPart())
    engine.schedule(sample(model.source.interarrivalTime, rng), 'arrival')
  })

  on('finish', (index) => {
    stations[index].phase = 'finished'
    stations[index].finishEvent = null
  })

  on('fail', (index) => {
    const station = stations[index]
    station.isDown = true
    if (station.phase === 'processing') {
      station.remaining = station.finishTime - engine.now
      engine.cancel(station.finishEvent)
      station.finishEvent = null
    }
    engine.schedule(sampleExponential(rng, station.config.mttr), 'repair', index)
  })

  on('repair', (index) => {
    const station = stations[index]
    station.isDown = false
    if (station.phase === 'processing') {
      station.finishTime = engine.now + station.remaining
      station.finishEvent = engine.schedule(station.remaining, 'finish', index)
    }
    engine.schedule(sampleExponential(rng, station.config.mtbf), 'fail', index)
  })

  on('sample', () => stats.sampleWip(engine.now))

  let warmupDone = false
  function resetAfterWarmup(time) {
    if (!warmupDone && time >= warmupTime) {
      stats.reset(warmupTime)
      warmupDone = true
    }
  }

  // Processes the next event (resetting the statistics first when it lies
  // after the warm-up time). Returns the event, or null at the end.
  function step() {
    const nextTime = engine.nextEventTime()
    if (nextTime > endTime) return null
    if (nextTime > warmupTime) resetAfterWarmup(nextTime)
    return engine.step()
  }

  function runUntil(time) {
    const target = Math.min(time, endTime)
    while (engine.nextEventTime() <= target) step()
    resetAfterWarmup(target)
    engine.runUntil(target)
  }

  // Initial events and state at time 0.
  const sampleInterval = (endTime - warmupTime) / sampleCount
  for (let k = 1; k <= sampleCount; k++) {
    engine.scheduleAt(k === sampleCount ? endTime : warmupTime + k * sampleInterval, 'sample')
  }
  if (!alwaysAvailable) engine.schedule(sample(model.source.interarrivalTime, rng), 'arrival')
  stations.forEach((station, index) => {
    if (station.canFail) engine.schedule(sampleExponential(rng, station.config.mtbf), 'fail', index)
  })
  propagate()
  observe()

  return {
    engine,
    stations,
    buffers,
    inputQueue,
    warmupTime,
    endTime,
    get wipCount() {
      return wipCount
    },
    step,
    runUntil,
    runToEnd() {
      runUntil(endTime)
      return stats.summary(endTime)
    },
    getResults() {
      return stats.summary(engine.now)
    },
  }
}

// Runs one replication of the model and returns its results. The optional
// onProgress callback receives the completed fraction (0 to 1) in steps.
export function simulateLine(model, options = {}) {
  const line = createLineSimulation(model, options)
  const { onProgress, progressSteps = 50 } = options
  if (onProgress) {
    for (let k = 1; k < progressSteps; k++) {
      line.runUntil((line.endTime * k) / progressSteps)
      onProgress(k / progressSteps)
    }
  }
  const results = line.runToEnd()
  onProgress?.(1)
  return results
}
