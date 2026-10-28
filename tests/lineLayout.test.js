import { describe, expect, it } from 'vitest'
import { bufferGrid, computeLayout, formatClock, partPositions, slotGrid } from '../src/lib/lineLayout.js'

const snapshot = {
  time: 0,
  stations: [
    { state: 'busy', partId: 5 },
    { state: 'starved', partId: null },
  ],
  buffers: [{ capacity: 30, count: 25, partIds: Array.from({ length: 25 }, (_, k) => 100 + k) }],
  inputQueue: { count: 2, partIds: [7, 8] },
  wip: 28,
  finished: 0,
}

describe('line layout', () => {
  it('places source, stations, buffers and sink left to right without overlap', () => {
    const layout = computeLayout(3)
    const boxes = [layout.source, layout.stations[0], layout.buffers[0], layout.stations[1], layout.buffers[1],
      layout.stations[2], layout.sink]
    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i].x).toBeGreaterThan(boxes[i - 1].x + boxes[i - 1].width)
    }
    expect(layout.width).toBeGreaterThan(layout.sink.x + layout.sink.width)
  })

  it('fills slots from the right so the front part is nearest the next station', () => {
    const grid = slotGrid({ x: 0, y: 0, width: 36, height: 23 }) // 3 columns, 2 rows
    expect(grid.capacity).toBe(6)
    expect(grid.position(0)).toEqual({ x: 26, y: 0 })
    expect(grid.position(2)).toEqual({ x: 0, y: 0 })
    expect(grid.position(3)).toEqual({ x: 26, y: 13 })
  })

  it('positions every visible part once, inside its box', () => {
    const layout = computeLayout(2)
    const positions = partPositions(snapshot, layout)
    const visibleInBuffer = Math.min(25, bufferGrid(layout.buffers[0]).capacity)
    expect(positions).toHaveLength(2 + 1 + visibleInBuffer)
    expect(new Set(positions.map((p) => p.id)).size).toBe(positions.length)
    const onStation = positions.find((p) => p.id === 5)
    const box = layout.stations[0]
    expect(onStation.x).toBeGreaterThan(box.x)
    expect(onStation.x).toBeLessThan(box.x + box.width)
    for (const p of positions.filter((p) => p.id >= 100)) {
      expect(p.x).toBeGreaterThanOrEqual(layout.buffers[0].x)
      expect(p.x + 10).toBeLessThanOrEqual(layout.buffers[0].x + layout.buffers[0].width)
      expect(p.y + 10).toBeLessThanOrEqual(layout.buffers[0].y + layout.buffers[0].height)
    }
  })

  it('formats the simulated clock as h:mm:ss', () => {
    expect(formatClock(0)).toBe('0:00:00')
    expect(formatClock(61.5)).toBe('1:01:30')
    expect(formatClock(1500)).toBe('25:00:00')
  })
})
