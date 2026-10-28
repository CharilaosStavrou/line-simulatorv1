import { describe, expect, it } from 'vitest'
import { createEventQueue } from '../../src/sim/eventQueue.js'
import { createRandom } from '../../src/sim/random.js'

describe('eventQueue', () => {
  it('pops events in increasing time order', () => {
    const queue = createEventQueue()
    for (const time of [5, 1, 9, 3, 7, 0, 2]) queue.push({ time })
    const popped = []
    while (queue.size > 0) popped.push(queue.pop().time)
    expect(popped).toEqual([0, 1, 2, 3, 5, 7, 9])
  })

  it('breaks ties by insertion order (FIFO)', () => {
    const queue = createEventQueue()
    queue.push({ time: 4, name: 'a' })
    queue.push({ time: 2, name: 'b' })
    queue.push({ time: 4, name: 'c' })
    queue.push({ time: 2, name: 'd' })
    queue.push({ time: 4, name: 'e' })
    const names = []
    while (queue.size > 0) names.push(queue.pop().name)
    expect(names).toEqual(['b', 'd', 'a', 'c', 'e'])
  })

  it('matches a stable sort for many random events with many ties', () => {
    const rng = createRandom(42)
    const queue = createEventQueue()
    const events = []
    for (let i = 0; i < 5000; i++) {
      const event = { time: Math.floor(rng() * 100), id: i }
      events.push(event)
      queue.push(event)
    }
    const expected = [...events].sort((a, b) => a.time - b.time || a.id - b.id).map((e) => e.id)
    const actual = []
    while (queue.size > 0) actual.push(queue.pop().id)
    expect(actual).toEqual(expected)
  })

  it('keeps order when pushes and pops are interleaved', () => {
    const queue = createEventQueue()
    queue.push({ time: 10 })
    queue.push({ time: 5 })
    expect(queue.pop().time).toBe(5)
    queue.push({ time: 7 })
    queue.push({ time: 12 })
    expect(queue.peek().time).toBe(7)
    expect([queue.pop().time, queue.pop().time, queue.pop().time]).toEqual([7, 10, 12])
  })

  it('returns undefined when empty and rejects invalid times', () => {
    const queue = createEventQueue()
    expect(queue.pop()).toBeUndefined()
    expect(queue.peek()).toBeUndefined()
    expect(() => queue.push({ time: NaN })).toThrow()
    expect(() => queue.push({ time: Infinity })).toThrow()
  })
})
