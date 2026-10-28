import { describe, expect, it } from 'vitest'
import { createEngine } from '../../src/sim/engine.js'

describe('engine', () => {
  it('advances the clock to each event time in order', () => {
    const engine = createEngine()
    const log = []
    engine.on('tick', (event) => log.push([engine.now, event.data]))
    engine.schedule(3, 'tick', 'c')
    engine.schedule(1, 'tick', 'a')
    engine.schedule(2, 'tick', 'b')
    engine.runUntil(10)
    expect(log).toEqual([
      [1, 'a'],
      [2, 'b'],
      [3, 'c'],
    ])
    expect(engine.now).toBe(10)
  })

  it('handles events with equal time in scheduling order', () => {
    const engine = createEngine()
    const log = []
    engine.on('a', () => log.push('a'))
    engine.on('b', () => log.push('b'))
    engine.schedule(5, 'b')
    engine.schedule(5, 'a')
    engine.schedule(5, 'b')
    engine.runUntil(5)
    expect(log).toEqual(['b', 'a', 'b'])
  })

  it('lets handlers schedule new events, including zero-delay events', () => {
    const engine = createEngine()
    const times = []
    engine.on('repeat', (event) => {
      times.push(engine.now)
      if (event.data < 3) engine.schedule(2, 'repeat', event.data + 1)
    })
    engine.on('now', () => times.push(`now@${engine.now}`))
    engine.schedule(0, 'repeat', 0)
    engine.schedule(4, 'now')
    engine.runUntil(100)
    // 'now' was scheduled before the second 'repeat' at time 4, so it runs first
    expect(times).toEqual([0, 2, 'now@4', 4, 6])
  })

  it('stops at the end time and leaves later events pending', () => {
    const engine = createEngine()
    const log = []
    engine.on('x', (event) => log.push(event.data))
    engine.schedule(5, 'x', 'early')
    engine.schedule(15, 'x', 'late')
    engine.runUntil(10)
    expect(log).toEqual(['early'])
    expect(engine.now).toBe(10)
    expect(engine.nextEventTime()).toBe(15)
    engine.runUntil(20)
    expect(log).toEqual(['early', 'late'])
  })

  it('skips cancelled events', () => {
    const engine = createEngine()
    const log = []
    engine.on('x', (event) => log.push(event.data))
    engine.schedule(1, 'x', 'keep')
    const cancelled = engine.schedule(2, 'x', 'drop')
    engine.cancel(cancelled)
    engine.runUntil(10)
    expect(log).toEqual(['keep'])
    expect(engine.processedCount).toBe(1)
  })

  it('steps one event at a time and returns null when empty', () => {
    const engine = createEngine()
    engine.on('x', () => {})
    engine.schedule(4, 'x')
    expect(engine.step().time).toBe(4)
    expect(engine.now).toBe(4)
    expect(engine.step()).toBeNull()
  })

  it('rejects scheduling in the past, invalid delays and unknown event types', () => {
    const engine = createEngine()
    engine.on('x', () => {})
    engine.schedule(5, 'x')
    engine.runUntil(5)
    expect(() => engine.schedule(-1, 'x')).toThrow()
    expect(() => engine.schedule(NaN, 'x')).toThrow()
    expect(() => engine.scheduleAt(4, 'x')).toThrow()
    expect(() => engine.runUntil(3)).toThrow()
    engine.schedule(1, 'unknown')
    expect(() => engine.runUntil(10)).toThrow(/unknown/)
  })
})
