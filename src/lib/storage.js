// Auto-save in localStorage. Every access is wrapped in try/catch because
// storage can be unavailable (private mode, blocked, full).

import { validateModel } from './validation.js'

const modelKey = 'lineSimulator.model.v1'
const scenariosKey = 'lineSimulator.scenarios.v1'

function read(key) {
  try {
    const text = localStorage.getItem(key)
    return text === null ? null : JSON.parse(text)
  } catch {
    return null
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Saving is a convenience; the app keeps working without it.
  }
}

// The saved model, or null if there is none or it is no longer valid.
export function loadSavedModel() {
  const model = read(modelKey)
  return model && validateModel(model).length === 0 ? model : null
}

export function saveModel(model) {
  write(modelKey, model)
}

export function loadSavedScenarios() {
  const scenarios = read(scenariosKey)
  return Array.isArray(scenarios) ? scenarios : []
}

export function saveScenarios(scenarios) {
  write(scenariosKey, scenarios)
}
