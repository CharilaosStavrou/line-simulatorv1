// Geometry of the animated line view: boxes for source, stations, buffers and
// sink, and the position of every visible part. Pure functions, no React.

export const partSize = 10
const partGap = 3
const boxPadding = 8
const labelSpace = 18
const margin = 16
const gap = 18
const top = 34
const endWidth = 84
const stationWidth = 112
const stationHeight = 84
const bufferWidth = 96

export function computeLayout(stationCount) {
  let x = margin
  const source = { x, y: top, width: endWidth, height: stationHeight }
  x += endWidth + gap
  const stations = []
  const buffers = []
  for (let i = 0; i < stationCount; i++) {
    stations.push({ x, y: top, width: stationWidth, height: stationHeight })
    x += stationWidth + gap
    if (i < stationCount - 1) {
      buffers.push({ x, y: top + 12, width: bufferWidth, height: stationHeight - 24 })
      x += bufferWidth + gap
    }
  }
  const sink = { x, y: top, width: endWidth, height: stationHeight }
  x += endWidth + margin
  return { width: x, height: top + stationHeight + 40, centerY: top + stationHeight / 2, source, stations, buffers, sink }
}

// Grid of part slots inside an area. Slot 0 is the front of the queue (the
// next part to leave), placed top right so parts flow towards the right.
export function slotGrid(area) {
  const step = partSize + partGap
  const columns = Math.max(1, Math.floor((area.width + partGap) / step))
  const rows = Math.max(1, Math.floor((area.height + partGap) / step))
  return {
    capacity: columns * rows,
    position(k) {
      const column = columns - 1 - (k % columns)
      const row = Math.floor(k / columns)
      return { x: area.x + column * step, y: area.y + row * step }
    },
  }
}

function innerArea(box, reserveTop = 0) {
  return {
    x: box.x + boxPadding,
    y: box.y + boxPadding + reserveTop,
    width: box.width - 2 * boxPadding,
    height: box.height - 2 * boxPadding - reserveTop,
  }
}

export function queueGrid(layout) {
  return slotGrid(innerArea(layout.source, labelSpace))
}

export function bufferGrid(bufferBox) {
  return slotGrid(innerArea(bufferBox))
}

// Positions of all visible parts in a snapshot: [{ id, x, y }]. Parts beyond
// the visible slots of a queue are not drawn (the view shows the count).
export function partPositions(snapshot, layout) {
  const positions = []
  const place = (ids, grid) => {
    ids.slice(0, grid.capacity).forEach((id, k) => positions.push({ id, ...grid.position(k) }))
  }
  place(snapshot.inputQueue.partIds, queueGrid(layout))
  snapshot.stations.forEach((station, i) => {
    if (station.partId === null) return
    const box = layout.stations[i]
    positions.push({
      id: station.partId,
      x: box.x + (box.width - partSize) / 2,
      y: box.y + (box.height - partSize) / 2,
    })
  })
  snapshot.buffers.forEach((buffer, i) => place(buffer.partIds, bufferGrid(layout.buffers[i])))
  return positions
}

// Simulated minutes as h:mm:ss.
export function formatClock(minutes) {
  const totalSeconds = Math.floor(minutes * 60 + 1e-6)
  const hours = Math.floor(totalSeconds / 3600)
  const mm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const ss = String(totalSeconds % 60).padStart(2, '0')
  return `${hours}:${mm}:${ss}`
}
