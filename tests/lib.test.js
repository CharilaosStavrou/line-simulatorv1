import { describe, expect, it } from 'vitest'
import { niceTicks } from '../src/lib/chartScale.js'
import { convertDistribution, validateDistributionParam } from '../src/lib/distributions.js'
import { addStation, deleteStation, moveStation, updateBuffer } from '../src/lib/modelEdit.js'
import { formatNumber, parseDecimal } from '../src/lib/numbers.js'
import { validateModel } from '../src/lib/validation.js'
import { createDefaultModel } from '../src/data/defaultModel.js'
import { distributionMean } from '../src/sim/random.js'

describe('parseDecimal', () => {
  it('accepts a point or a comma as decimal separator', () => {
    expect(parseDecimal('5.5')).toBe(5.5)
    expect(parseDecimal('5,5')).toBe(5.5)
    expect(parseDecimal(' 12 ')).toBe(12)
    expect(parseDecimal(',5')).toBe(0.5)
    expect(parseDecimal('7,')).toBe(7)
  })

  it('rejects anything that is not a plain number', () => {
    for (const text of ['', 'abc', '1.2.3', '1,2,3', '1e3', '5 min', '--1']) {
      expect(parseDecimal(text)).toBeNaN()
    }
  })

  it('formatNumber drops trailing zeros and shows a dash for missing values', () => {
    expect(formatNumber(7.5)).toBe('7.5')
    expect(formatNumber(2.3456, 2)).toBe('2.35')
    expect(formatNumber(null)).toBe('–')
  })
})

describe('distributions', () => {
  it('converts between types keeping the mean', () => {
    const start = { type: 'triangular', min: 3, mode: 4, max: 8 }
    for (const type of ['constant', 'uniform', 'triangular', 'normal', 'exponential']) {
      expect(distributionMean(convertDistribution(start, type))).toBeCloseTo(5, 2)
    }
  })

  it('validates parameters against each other', () => {
    const triangular = { type: 'triangular', min: 2, mode: 4, max: 6 }
    expect(validateDistributionParam(triangular, 'min', 3)).toBeNull()
    expect(validateDistributionParam(triangular, 'min', 5)).toMatch(/mode/)
    expect(validateDistributionParam(triangular, 'max', 3)).toMatch(/max/)
    expect(validateDistributionParam({ type: 'uniform', min: 0, max: 4 }, 'max', 0)).toMatch(/greater than 0/)
    expect(validateDistributionParam({ type: 'exponential', mean: 4 }, 'mean', 0)).not.toBeNull()
    expect(validateDistributionParam({ type: 'normal', mean: 4, sd: 1 }, 'sd', 0)).toBeNull()
    expect(validateDistributionParam({ type: 'constant', value: 4 }, 'value', -1)).not.toBeNull()
  })
})

describe('model editing', () => {
  it('adds a station with a buffer in front of it and a unique id', () => {
    const model = addStation(createDefaultModel())
    expect(model.stations).toHaveLength(4)
    expect(model.buffers).toHaveLength(3)
    expect(model.stations[3].id).toBe('station4')
    expect(validateModel(model)).toEqual([])
  })

  it('deletes a station and one adjacent buffer, keeping at least one station', () => {
    const model = createDefaultModel()
    const withoutFirst = deleteStation(updateBuffer(model, 0, { capacity: 9 }), 0)
    expect(withoutFirst.stations.map((s) => s.id)).toEqual(['station2', 'station3'])
    expect(withoutFirst.buffers).toEqual([{ capacity: 3 }])
    const withoutLast = deleteStation(model, 2)
    expect(withoutLast.buffers).toHaveLength(1)
    const single = deleteStation(deleteStation(model, 0), 0)
    expect(deleteStation(single, 0)).toBe(single)
  })

  it('moves stations left and right, leaving buffers in place', () => {
    const model = updateBuffer(createDefaultModel(), 0, { capacity: 9 })
    const moved = moveStation(model, 0, 1)
    expect(moved.stations.map((s) => s.id)).toEqual(['station2', 'station1', 'station3'])
    expect(moved.buffers[0].capacity).toBe(9)
    expect(moveStation(model, 0, -1)).toBe(model)
  })
})

describe('validateModel', () => {
  it('accepts the default model', () => {
    expect(validateModel(createDefaultModel())).toEqual([])
  })

  it('reports wrong values and structure', () => {
    const model = createDefaultModel()
    model.settings.warmupHours = 2000
    model.stations[1].mttr = 0
    model.stations[2].processingTime = { type: 'exponential', mean: -1 }
    model.buffers = [{ capacity: 1.5 }]
    const errors = validateModel(model)
    expect(errors.some((e) => e.includes('warmupHours'))).toBe(true)
    expect(errors.some((e) => e.includes('Station 2 MTTR'))).toBe(true)
    expect(errors.some((e) => e.includes('Station 3 processing time'))).toBe(true)
    expect(errors.some((e) => e.includes('one buffer between'))).toBe(true)
  })

  it('rejects non-objects and missing parts', () => {
    expect(validateModel(null)).toHaveLength(1)
    expect(validateModel({}).length).toBeGreaterThan(0)
  })
})

describe('niceTicks', () => {
  it('uses steps of 1, 2 or 5 times a power of ten', () => {
    expect(niceTicks(7.3, 5)).toEqual([0, 2, 4, 6, 8])
    expect(niceTicks(20000, 5)).toEqual([0, 5000, 10000, 15000, 20000])
    expect(niceTicks(0.9, 5)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1])
  })
})
