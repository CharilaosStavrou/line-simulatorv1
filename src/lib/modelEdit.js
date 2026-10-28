// Pure functions that return an edited copy of the model.

export function updateSettings(model, changes) {
  return { ...model, settings: { ...model.settings, ...changes } }
}

export function updateSource(model, source) {
  return { ...model, source }
}

export function updateStation(model, index, changes) {
  const stations = model.stations.map((station, i) => (i === index ? { ...station, ...changes } : station))
  return { ...model, stations }
}

export function updateBuffer(model, index, changes) {
  const buffers = model.buffers.map((buffer, i) => (i === index ? { ...buffer, ...changes } : buffer))
  return { ...model, buffers }
}

function nextStationId(stations) {
  const numbers = stations.map((station) => Number(/^station(\d+)$/.exec(station.id)?.[1] ?? 0))
  return `station${Math.max(0, ...numbers) + 1}`
}

// Appends a station at the end of the line, with a buffer in front of it.
export function addStation(model, bufferCapacity = 5) {
  const id = nextStationId(model.stations)
  const station = {
    id,
    name: `Station ${model.stations.length + 1}`,
    processingTime: { type: 'constant', value: 5 },
    mtbf: 0,
    mttr: 30,
  }
  return {
    ...model,
    stations: [...model.stations, station],
    buffers: [...model.buffers, { capacity: bufferCapacity }],
  }
}

// Removes a station and one adjacent buffer (the one after it, or before it
// for the last station). The line keeps at least one station.
export function deleteStation(model, index) {
  if (model.stations.length <= 1) return model
  const bufferIndex = index < model.buffers.length ? index : index - 1
  return {
    ...model,
    stations: model.stations.filter((_, i) => i !== index),
    buffers: model.buffers.filter((_, i) => i !== bufferIndex),
  }
}

// Swaps a station with its neighbour (direction -1 = left, +1 = right).
// Buffers stay in their positions in the line.
export function moveStation(model, index, direction) {
  const target = index + direction
  if (target < 0 || target >= model.stations.length) return model
  const stations = [...model.stations]
  stations[index] = model.stations[target]
  stations[target] = model.stations[index]
  return { ...model, stations }
}
