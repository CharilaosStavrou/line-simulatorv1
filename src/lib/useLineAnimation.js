import { useEffect, useState } from 'react'
import { createLineSimulation } from '../sim/line.js'

export const speedOptions = [1, 10, 60, 600] // simulated minutes per real second

// Duration of the glide of a part between two positions. It is a visual
// aid only and must stay shorter than the real time between moves, so it
// shrinks with speed and is off at the highest speed.
export function glideMilliseconds(speed) {
  if (speed <= 1) return 300
  if (speed <= 10) return 200
  if (speed <= 60) return 60
  return 0
}
const maxFrameSeconds = 0.1 // a slow or background frame does not jump ahead

function createRun(model) {
  const line = createLineSimulation(model, { sampleCount: 1 })
  return { model, line, snapshot: line.getSnapshot() }
}

// Plays the line by advancing the real simulation engine each animation
// frame by (elapsed real seconds x speed) simulated minutes. The engine
// processes every event up to that time; the view shows the resulting state.
export function useLineAnimation(model) {
  const [run, setRun] = useState(() => createRun(model))
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(60)

  // A changed model starts a fresh, paused run.
  if (run.model !== model) {
    setRun(createRun(model))
    setPlaying(false)
  }

  const { line } = run
  const finished = run.snapshot.time >= line.endTime

  useEffect(() => {
    if (!playing) return undefined
    let frame
    let last = performance.now()
    const tick = (now) => {
      // The frame timestamp can be slightly earlier than the start time.
      const seconds = Math.max(0, Math.min((now - last) / 1000, maxFrameSeconds))
      last = now
      line.runUntil(line.engine.now + seconds * speed)
      const snapshot = line.getSnapshot()
      setRun((current) => (current.line === line ? { ...current, snapshot } : current))
      if (snapshot.time >= line.endTime) {
        setPlaying(false)
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, speed, line])

  return {
    snapshot: run.snapshot,
    endTime: line.endTime,
    playing,
    finished,
    speed,
    setSpeed,
    play: () => setPlaying(true),
    pause: () => setPlaying(false),
    restart: () => {
      setRun(createRun(model))
      setPlaying(false)
    },
  }
}
