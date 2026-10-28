// Read-only views of the line's internal state: the state of a station and a
// snapshot of the whole line for the animation.

export function stationState(station) {
  if (station.isDown) return 'down'
  if (station.phase === 'processing') return 'busy'
  if (station.phase === 'finished') return 'blocked'
  return 'starved'
}

// Current state of the line. Part lists are cut to maxParts entries (front
// of the queue first); counts are complete.
export function takeSnapshot({ time, stations, buffers, inputQueue, wipCount, finishedCount }, maxParts = 50) {
  const ids = (parts) => parts.slice(0, maxParts).map((part) => part.id)
  return {
    time,
    stations: stations.map((station) => ({ state: stationState(station), partId: station.part?.id ?? null })),
    buffers: buffers.map((buffer) => ({
      capacity: buffer.capacity,
      count: buffer.parts.length,
      partIds: ids(buffer.parts),
    })),
    inputQueue: { count: inputQueue.length, partIds: ids(inputQueue) },
    wip: wipCount,
    finished: finishedCount,
  }
}
