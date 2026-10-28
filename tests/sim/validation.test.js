// Validation of the line simulation against known theory.
import { describe, expect, it } from 'vitest'
import { simulateLine } from '../../src/sim/line.js'
import { buildModel, constant, exponential, normal, stateSum, triangular, uniform } from './helpers.js'

describe('validation against theory', () => {
  it('deterministic line, no failures, large buffers: throughput = 60 / longest time, exactly', () => {
    // Exits happen at 19 + 8k minutes; the 6000-minute measurement window
    // (60 to 6060) is a whole number of 8-minute periods.
    const model = buildModel({
      stations: [[constant(5)], [constant(8)], [constant(6)]],
      buffers: [1000, 1000],
      warmupHours: 1,
      simulationHours: 101,
    })
    const result = simulateLine(model)
    expect(result.throughputPerHour).toBe(60 / 8)
    expect(result.partsFinished).toBe(750)
    expect(result.measuredMinutes).toBe(6000)
    expect(result.stations[1].percentBusy).toBeCloseTo(100, 9)
  })

  it('deterministic line with large buffers: the tie with station 1 goes to station 2', () => {
    // Stations 1 and 2 are both 100% busy; station 2 has the longer
    // effective processing time (8 vs 5 minutes).
    const model = buildModel({
      stations: [[constant(5)], [constant(8)], [constant(6)]],
      buffers: [1000, 1000],
      warmupHours: 1,
      simulationHours: 101,
    })
    const result = simulateLine(model)
    expect(result.stations[0].percentBusy).toBeCloseTo(100, 9)
    expect(result.bottleneck.name).toBe('Station 2')
  })

  it('deterministic line with buffers that fill up: the slowest station is the bottleneck', () => {
    // With unlimited raw material and buffers that never fill, station 1 is
    // never starved or blocked and ties with the true bottleneck at 100%
    // active; with finite buffers it becomes blocked and the tie disappears.
    const model = buildModel({
      stations: [[constant(5)], [constant(8)], [constant(6)]],
      buffers: [10, 10],
      warmupHours: 10,
      simulationHours: 110,
    })
    const result = simulateLine(model)
    expect(result.throughputPerHour).toBe(60 / 8)
    expect(result.bottleneck.name).toBe('Station 2')
    expect(result.stations[0].percentBlocked).toBeCloseTo(37.5, 9)
    expect(result.buffers[0].percentFull).toBeCloseTo(100, 9)
    expect(result.buffers[1].averageLevel).toBe(0)
  })

  it('an unreliable machine is found as bottleneck although a faster one is busier', () => {
    // Station 1: 5 min, availability 2/3, so 7.5 min effective per part.
    // Station 2: 7 min, reliable. Station 2 is busier, station 1 more active.
    const model = buildModel({
      stations: [[constant(5), 60, 30], [constant(7)]],
      buffers: [3],
      warmupHours: 100,
      simulationHours: 20100,
      seed: 8,
    })
    const result = simulateLine(model)
    expect(result.stations[1].percentBusy).toBeGreaterThan(result.stations[0].percentBusy)
    expect(result.bottleneck.name).toBe('Station 1')
  })

  it('deterministic line with zero buffer: the faster upstream station is blocked', () => {
    // Station 1 works 5 minutes, then waits 3 minutes for station 2 (8 minutes).
    const model = buildModel({
      stations: [[constant(5)], [constant(8)]],
      buffers: [0],
      warmupHours: 1,
      simulationHours: 101,
    })
    const result = simulateLine(model)
    expect(result.throughputPerHour).toBe(7.5)
    expect(result.stations[0].percentBusy).toBeCloseTo(62.5, 9)
    expect(result.stations[0].percentBlocked).toBeCloseTo(37.5, 9)
    expect(result.stations[1].percentBusy).toBeCloseTo(100, 9)
  })

  describe('M/M/1: interarrival exponential (mean 10), service exponential (mean 8)', () => {
    // rho = 0.8: L = rho / (1 - rho) = 4, W = 1 / (mu - lambda) = 40 minutes.
    // 50,000 measured hours give about 300,000 parts.
    const model = buildModel({
      stations: [[exponential(8)]],
      source: { type: 'interarrival', interarrivalTime: exponential(10) },
      warmupHours: 1000,
      simulationHours: 51000,
      seed: 2026,
    })
    const result = simulateLine(model)

    it('average number in system is about 4 (within 5%)', () => {
      expect(Math.abs(result.averageWip - 4) / 4).toBeLessThan(0.05)
    })

    it('average time in system is about 40 minutes (within 5%)', () => {
      expect(Math.abs(result.averageCycleTime - 40) / 40).toBeLessThan(0.05)
    })

    it('utilisation is about rho = 80% and throughput about 6 parts per hour', () => {
      expect(Math.abs(result.stations[0].percentBusy - 80)).toBeLessThan(1)
      expect(Math.abs(result.throughputPerHour - 6) / 6).toBeLessThan(0.01)
    })

    it("satisfies Little's law", () => {
      const littleWip = (result.throughputPerHour / 60) * result.averageCycleTime
      expect(Math.abs(result.averageWip - littleWip) / result.averageWip).toBeLessThan(0.01)
    })
  })

  it("Little's law holds on a line with variability, failures and finite buffers", () => {
    const model = buildModel({
      stations: [
        [triangular(3, 4, 7)],
        [normal(5, 1), 240, 30],
        [uniform(3, 6)],
        [exponential(4), 600, 60],
      ],
      buffers: [2, 0, 3],
      warmupHours: 100,
      simulationHours: 10100,
      seed: 7,
    })
    const result = simulateLine(model)
    const littleWip = (result.throughputPerHour / 60) * result.averageCycleTime
    expect(Math.abs(result.averageWip - littleWip) / result.averageWip).toBeLessThan(0.01)
  })

  it('single station with failures and no starvation: availability = mtbf / (mtbf + mttr)', () => {
    // Resume semantics: no work is lost, so throughput = availability x 60 / 5.
    const model = buildModel({
      stations: [[constant(5), 100, 10]],
      warmupHours: 100,
      simulationHours: 50100,
      seed: 11,
    })
    const result = simulateLine(model)
    const availability = 100 / 110
    const station = result.stations[0]
    expect(Math.abs(1 - station.percentDown / 100 - availability)).toBeLessThan(0.005)
    expect(Math.abs(station.percentBusy / 100 - availability)).toBeLessThan(0.005)
    expect(station.percentStarved).toBe(0)
    expect(station.percentBlocked).toBe(0)
    expect(Math.abs(result.throughputPerHour / (12 * availability) - 1)).toBeLessThan(0.01)
  })

  it('two identical exponential stations with zero buffer: throughput = 2/3 of the service rate', () => {
    // Three-state Markov chain (busy/idle, busy/busy, blocked/busy), each with
    // probability 1/3; throughput = mu x 2/3 = 6 x 2/3 = 4 parts per hour.
    const model = buildModel({
      stations: [[exponential(10)], [exponential(10)]],
      buffers: [0],
      warmupHours: 100,
      simulationHours: 50100,
      seed: 3,
    })
    const result = simulateLine(model)
    expect(Math.abs(result.throughputPerHour - 4) / 4).toBeLessThan(0.02)
    expect(Math.abs(result.stations[0].percentBlocked - 100 / 3)).toBeLessThan(1)
    expect(Math.abs(result.stations[1].percentStarved - 100 / 3)).toBeLessThan(1)
  })

  it('state percentages of every station sum to 100%', () => {
    const model = buildModel({
      stations: [
        [triangular(2, 3, 6), 300, 20],
        [exponential(4), 120, 15],
        [constant(3.5)],
        [normal(4, 1.5), 500, 40],
      ],
      buffers: [0, 1, 4],
      source: { type: 'interarrival', interarrivalTime: exponential(5) },
      seed: 5,
    })
    const result = simulateLine(model)
    for (const station of result.stations) expect(stateSum(station)).toBeCloseTo(100, 9)
  })

  it('the same seed gives identical results, a different seed different ones', () => {
    const options = {
      stations: [[exponential(4), 200, 20], [triangular(2, 4, 7)], [normal(3, 1)]],
      buffers: [1, 2],
    }
    const a = simulateLine(buildModel({ ...options, seed: 42 }))
    const b = simulateLine(buildModel({ ...options, seed: 42 }))
    const c = simulateLine(buildModel({ ...options, seed: 43 }))
    expect(b).toEqual(a)
    expect(c.averageWip).not.toBe(a.averageWip)
  })
})
