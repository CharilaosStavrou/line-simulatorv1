// Time-weighted statistics. Values are piecewise constant between events, so
// the time average is the area under the step curve divided by elapsed time.

export function createTimeWeighted(initialValue = 0, startTime = 0) {
  let value = initialValue
  let lastTime = startTime
  let area = 0
  let periodStart = startTime

  function advance(now) {
    area += value * (now - lastTime)
    lastTime = now
  }

  return {
    update(now, newValue) {
      advance(now)
      value = newValue
    },
    // Discards everything collected so far (used at the end of the warm-up).
    reset(now) {
      lastTime = now
      periodStart = now
      area = 0
    },
    areaUntil(now) {
      return area + value * (now - lastTime)
    },
    mean(now) {
      const elapsed = now - periodStart
      return elapsed > 0 ? this.areaUntil(now) / elapsed : value
    },
    get value() {
      return value
    },
  }
}

// Total time spent in each of a fixed set of states.
export function createStateTimer(states, initialState, startTime = 0) {
  const totals = Object.fromEntries(states.map((state) => [state, 0]))
  let current = initialState
  let lastTime = startTime
  let periodStart = startTime

  return {
    set(now, state) {
      totals[current] += now - lastTime
      lastTime = now
      current = state
    },
    reset(now) {
      for (const state of states) totals[state] = 0
      lastTime = now
      periodStart = now
    },
    // Fraction of the period spent in each state, closed at time now.
    fractions(now) {
      const elapsed = now - periodStart
      return Object.fromEntries(
        states.map((state) => {
          const time = totals[state] + (state === current ? now - lastTime : 0)
          return [state, elapsed > 0 ? time / elapsed : state === current ? 1 : 0]
        }),
      )
    },
    get current() {
      return current
    },
  }
}
