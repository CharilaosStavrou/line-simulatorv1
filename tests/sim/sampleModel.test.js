// The README's what-if example: raising one buffer moves the bottleneck.
import { describe, expect, it } from 'vitest'
import { createSampleModel } from '../../src/data/sampleModel.js'
import { runReplications } from '../../src/sim/replications.js'

function withWeldingBuffer(capacity) {
  const model = createSampleModel()
  model.buffers[1] = { capacity } // Machining -> Welding
  return model
}

describe('sample model what-if', () => {
  const base = runReplications(createSampleModel())
  const bigBuffer = runReplications(withWeldingBuffer(20))

  it('has Welding as bottleneck with small buffers, in at least 9 of 10 replications', () => {
    expect(base.bottleneck.name).toBe('Welding')
    expect(base.bottleneck.replicationsAsBottleneck).toBeGreaterThanOrEqual(9)
  })

  it('moves the bottleneck to Machining when the buffer before Welding is 20', () => {
    expect(bigBuffer.bottleneck.name).toBe('Machining')
    expect(bigBuffer.bottleneck.replicationsAsBottleneck).toBeGreaterThanOrEqual(9)
  })

  it('gains throughput at the cost of more WIP and a longer cycle time, beyond the confidence intervals', () => {
    const separated = (low, high) => low.mean + low.halfWidth < high.mean - high.halfWidth
    expect(separated(base.throughputPerHour, bigBuffer.throughputPerHour)).toBe(true)
    expect(separated(base.averageWip, bigBuffer.averageWip)).toBe(true)
    expect(separated(base.averageCycleTime, bigBuffer.averageCycleTime)).toBe(true)
  })
})
