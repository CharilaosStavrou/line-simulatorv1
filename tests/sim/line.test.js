import { describe, expect, it } from 'vitest'
import { createLineSimulation, simulateLine } from '../../src/sim/line.js'
import { buildModel, constant, exponential, triangular } from './helpers.js'

describe('line simulation mechanics', () => {
  it('starts with station 1 busy when material is always available', () => {
    const line = createLineSimulation(buildModel({ stations: [[constant(5)], [constant(5)]], buffers: [1] }))
    expect(line.stations.map((s) => s.phase)).toEqual(['processing', 'idle'])
    expect(line.wipCount).toBe(1)
  })

  it('measures only after the warm-up period, over (warmup, end]', () => {
    // Exits at 10, 20, ..., 900: the exit at 300 belongs to the warm-up.
    const result = simulateLine(
      buildModel({ stations: [[constant(10)]], warmupHours: 5, simulationHours: 15 }),
    )
    expect(result.measuredMinutes).toBe(600)
    expect(result.partsFinished).toBe(60)
    expect(result.averageCycleTime).toBe(10)
    expect(result.averageWip).toBe(1)
  })

  it('records the WIP series at equal intervals over the measurement period', () => {
    const model = buildModel({
      stations: [[triangular(2, 4, 8)], [exponential(5)]],
      buffers: [3],
      warmupHours: 10,
      simulationHours: 110,
    })
    const result = simulateLine(model, { sampleCount: 50 })
    expect(result.wipOverTime).toHaveLength(50)
    expect(result.wipOverTime[0].time).toBeCloseTo(600 + 120, 9)
    expect(result.wipOverTime.at(-1).time).toBe(6600)
    // Interval averages over equal intervals average to the overall mean.
    const mean = result.wipOverTime.reduce((sum, point) => sum + point.wip, 0) / 50
    expect(mean).toBeCloseTo(result.averageWip, 9)
  })

  it('reports no % full for a buffer with capacity 0', () => {
    const result = simulateLine(buildModel({ stations: [[constant(3)], [constant(4)]], buffers: [0] }))
    expect(result.buffers[0]).toEqual({ capacity: 0, averageLevel: 0, percentFull: null })
  })

  it('a down station accepts no parts, so the upstream station blocks behind it', () => {
    const line = createLineSimulation(
      buildModel({ stations: [[constant(2)], [constant(1), 50, 10]], buffers: [0] }),
    )
    let sawBlockedBehindDown = false
    while (line.step()) {
      const [first, second] = line.stations
      if (second.isDown) {
        expect(second.finishEvent).toBeNull()
        if (first.phase === 'finished' && second.phase === 'idle') sawBlockedBehindDown = true
      }
    }
    expect(sawBlockedBehindDown).toBe(true)
  })

  it('rejects inconsistent models', () => {
    expect(() => simulateLine(buildModel({ stations: [] }))).toThrow()
    expect(() => simulateLine(buildModel({ stations: [[constant(1)], [constant(1)]], buffers: [] }))).toThrow()
    expect(() =>
      simulateLine(buildModel({ stations: [[constant(1)]], warmupHours: 10, simulationHours: 10 })),
    ).toThrow()
  })
})
