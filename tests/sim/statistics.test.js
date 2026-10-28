import { describe, expect, it } from 'vitest'
import { createStateTimer, createTimeWeighted } from '../../src/sim/statistics.js'
import { findBottleneck } from '../../src/sim/lineStatistics.js'

describe('time-weighted statistic', () => {
  it('averages a step function over time', () => {
    const stat = createTimeWeighted(0, 0)
    stat.update(2, 4) // 0 for 2 minutes
    stat.update(5, 1) // 4 for 3 minutes
    // 1 for 5 minutes until time 10: area = 0 + 12 + 5 = 17
    expect(stat.areaUntil(10)).toBe(17)
    expect(stat.mean(10)).toBe(1.7)
  })

  it('discards history on reset but keeps the current value', () => {
    const stat = createTimeWeighted(0, 0)
    stat.update(5, 10)
    stat.reset(8)
    stat.update(10, 0)
    expect(stat.mean(12)).toBe(5) // 10 for 2 minutes, 0 for 2 minutes
  })
})

describe('state timer', () => {
  it('measures the fraction of time in each state', () => {
    const timer = createStateTimer(['a', 'b', 'c'], 'a', 0)
    timer.set(3, 'b')
    timer.set(4, 'a')
    timer.set(6, 'c')
    expect(timer.fractions(10)).toEqual({ a: 0.5, b: 0.1, c: 0.4 })
  })

  it('starts a new period on reset', () => {
    const timer = createStateTimer(['a', 'b'], 'a', 0)
    timer.set(5, 'b')
    timer.reset(6)
    timer.set(8, 'a')
    expect(timer.fractions(10)).toEqual({ a: 0.5, b: 0.5 })
  })
})

describe('findBottleneck (active period: busy + down)', () => {
  const station = (name, percentBusy, percentDown) => ({ id: name, name, percentBusy, percentDown })

  it('picks the station with the highest busy + down share', () => {
    const result = findBottleneck([station('A', 70, 0), station('B', 60, 20), station('C', 75, 0)])
    expect(result).toEqual({ index: 1, id: 'B', name: 'B', activePercent: 80 })
  })

  it('breaks ties in favour of the upstream station', () => {
    expect(findBottleneck([station('A', 90, 0), station('B', 80, 10)]).name).toBe('A')
  })
})
