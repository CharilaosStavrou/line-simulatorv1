// Runs simulations off the main thread so the UI stays responsive.
// Message in:  { model }
// Messages out: { type: 'progress', fraction } | { type: 'result', result }
//               | { type: 'error', message }
// The result is the summary of settings.replications replications.

import { runReplications } from '../sim/replications.js'

self.onmessage = (event) => {
  const { model } = event.data
  try {
    const result = runReplications(model, {
      onProgress: (fraction) => self.postMessage({ type: 'progress', fraction }),
    })
    self.postMessage({ type: 'result', result })
  } catch (error) {
    self.postMessage({ type: 'error', message: error.message })
  }
}
