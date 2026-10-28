// Binary min-heap of events ordered by time. Events with equal time are
// ordered by a monotonically increasing sequence number, so ties are always
// resolved first-in first-out and every run is fully deterministic.

function isBefore(a, b) {
  return a.time < b.time || (a.time === b.time && a.seq < b.seq)
}

export function createEventQueue() {
  const heap = []
  let nextSeq = 0

  function swap(i, j) {
    const tmp = heap[i]
    heap[i] = heap[j]
    heap[j] = tmp
  }

  function siftUp(index) {
    let i = index
    while (i > 0) {
      const parent = (i - 1) >> 1
      if (!isBefore(heap[i], heap[parent])) break
      swap(i, parent)
      i = parent
    }
  }

  function siftDown(index) {
    let i = index
    const n = heap.length
    for (;;) {
      const left = 2 * i + 1
      const right = left + 1
      let smallest = i
      if (left < n && isBefore(heap[left], heap[smallest])) smallest = left
      if (right < n && isBefore(heap[right], heap[smallest])) smallest = right
      if (smallest === i) break
      swap(i, smallest)
      i = smallest
    }
  }

  // Adds an event object; time must be a finite number. Returns the stored event.
  function push(event) {
    if (!Number.isFinite(event.time)) {
      throw new Error(`Event time must be a finite number, got ${event.time}`)
    }
    const stored = { ...event, seq: nextSeq++ }
    heap.push(stored)
    siftUp(heap.length - 1)
    return stored
  }

  // Removes and returns the earliest event, or undefined when empty.
  function pop() {
    if (heap.length === 0) return undefined
    const top = heap[0]
    const last = heap.pop()
    if (heap.length > 0) {
      heap[0] = last
      siftDown(0)
    }
    return top
  }

  function peek() {
    return heap[0]
  }

  function clear() {
    heap.length = 0
    nextSeq = 0
  }

  return {
    push,
    pop,
    peek,
    clear,
    get size() {
      return heap.length
    },
  }
}
