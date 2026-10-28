import { useCallback, useEffect, useRef, useState } from 'react'

const initialState = { status: 'idle', progress: 0, result: null, error: null }

// Runs the model in a Web Worker and tracks progress and the latest result.
export function useSimulation() {
  const [state, setState] = useState(initialState)
  const workerRef = useRef(null)

  const run = useCallback((model) => {
    workerRef.current?.terminate()
    const worker = new Worker(new URL('../workers/simulationWorker.js', import.meta.url), {
      type: 'module',
    })
    workerRef.current = worker
    setState((previous) => ({ ...previous, status: 'running', progress: 0, error: null }))

    worker.onmessage = (event) => {
      const message = event.data
      if (message.type === 'progress') {
        setState((previous) => ({ ...previous, progress: message.fraction }))
      } else if (message.type === 'result') {
        setState({ status: 'done', progress: 1, result: message.result, error: null })
        worker.terminate()
      } else if (message.type === 'error') {
        setState((previous) => ({ ...previous, status: 'error', error: message.message }))
        worker.terminate()
      }
    }
    worker.onerror = (event) => {
      setState((previous) => ({ ...previous, status: 'error', error: event.message || 'Simulation failed' }))
      worker.terminate()
    }
    worker.postMessage({ model })
  }, [])

  useEffect(() => () => workerRef.current?.terminate(), [])

  return { ...state, run }
}
