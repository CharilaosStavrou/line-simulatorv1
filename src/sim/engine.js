// Generic discrete-event simulation clock and event loop. The engine knows
// nothing about production lines: models register a handler per event type
// and schedule events; the engine advances the clock from event to event.

import { createEventQueue } from './eventQueue.js'

export function createEngine() {
  const queue = createEventQueue()
  const handlers = new Map()
  let currentTime = 0
  let processedCount = 0

  function on(type, handler) {
    handlers.set(type, handler)
  }

  // Schedules an event at an absolute time (not earlier than now).
  function scheduleAt(time, type, data = null) {
    if (!(time >= currentTime)) {
      throw new Error(`Cannot schedule event at ${time}, current time is ${currentTime}`)
    }
    return queue.push({ time, type, data, cancelled: false })
  }

  // Schedules an event after a non-negative delay from now.
  function schedule(delay, type, data = null) {
    if (!(delay >= 0) || !Number.isFinite(delay)) {
      throw new Error(`Delay must be a finite number >= 0, got ${delay}`)
    }
    return scheduleAt(currentTime + delay, type, data)
  }

  // Cancelled events stay in the heap and are skipped when popped
  // (lazy deletion), which keeps cancellation O(1).
  function cancel(event) {
    if (event) event.cancelled = true
  }

  function dropCancelled() {
    while (queue.size > 0 && queue.peek().cancelled) queue.pop()
  }

  function nextEventTime() {
    dropCancelled()
    return queue.size > 0 ? queue.peek().time : Infinity
  }

  // Processes exactly one event. Returns the event, or null if none is left.
  function step() {
    dropCancelled()
    const event = queue.pop()
    if (!event) return null
    currentTime = event.time
    const handler = handlers.get(event.type)
    if (!handler) throw new Error(`No handler registered for event type: ${event.type}`)
    processedCount++
    handler(event)
    return event
  }

  // Processes all events with time <= endTime, then sets the clock to
  // endTime so time-weighted statistics can be closed at that instant.
  function runUntil(endTime) {
    if (!(endTime >= currentTime)) {
      throw new Error(`Cannot run until ${endTime}, current time is ${currentTime}`)
    }
    while (nextEventTime() <= endTime) step()
    currentTime = endTime
  }

  return {
    on,
    schedule,
    scheduleAt,
    cancel,
    step,
    runUntil,
    nextEventTime,
    get now() {
      return currentTime
    },
    get processedCount() {
      return processedCount
    },
  }
}
