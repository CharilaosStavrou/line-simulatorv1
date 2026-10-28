import { describe, expect, it } from 'vitest'
import { checkCapacity, stationCapacities } from '../../src/sim/capacity.js'
import { buildModel, constant, exponential, triangular } from './helpers.js'

describe('capacity check', () => {
  it('computes effective capacity as 60 / (mean processing time / availability)', () => {
    const model = buildModel({
      // 4 min, never fails: 15/h. Triangular mean 5 min, availability 0.9: 10.8/h.
      stations: [[constant(4)], [triangular(3, 5, 7), 90, 10]],
      buffers: [2],
    })
    const capacities = stationCapacities(model.stations)
    expect(capacities[0]).toBeCloseTo(15, 12)
    expect(capacities[1]).toBeCloseTo(60 / (5 / 0.9), 12)
    const result = checkCapacity(model)
    expect(result.slowestIndex).toBe(1)
    expect(result.capacityPerHour).toBeCloseTo(10.8, 12)
    expect(result.arrivalRatePerHour).toBeNull()
    expect(result.overloaded).toBe(false)
  })

  it('flags arrivals at or above the capacity of the slowest station', () => {
    const stations = [[constant(5)], [constant(6)]] // slowest: 10 parts/h
    const withArrivals = (mean) =>
      checkCapacity(
        buildModel({ stations, buffers: [1], source: { type: 'interarrival', interarrivalTime: exponential(mean) } }),
      )
    expect(withArrivals(7).overloaded).toBe(false) // 8.57/h
    expect(withArrivals(6).overloaded).toBe(true) // 10/h, exactly at capacity
    expect(withArrivals(5).arrivalRatePerHour).toBe(12)
    expect(withArrivals(5).overloaded).toBe(true)
  })

  it('ignores the stability check when material is always available', () => {
    expect(checkCapacity(buildModel({ stations: [[constant(60)]] })).overloaded).toBe(false)
  })
})
