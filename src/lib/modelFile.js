// JSON export and import of a model.

import { validateModel } from './validation.js'

export const fileFormat = 'line-simulator-model'
export const fileVersion = 1
const maxErrorsShown = 5

export function modelToJson(model) {
  return JSON.stringify({ format: fileFormat, version: fileVersion, model }, null, 2)
}

// Parses file text into a model. Accepts the exported wrapper or a bare
// model object. Returns { model } or { error } with a readable message.
export function parseModelFile(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    return { error: 'The file is not valid JSON.' }
  }
  if (data && typeof data === 'object' && 'format' in data) {
    if (data.format !== fileFormat) return { error: 'This is not a Production Line Simulator model file.' }
    if (data.version !== fileVersion) return { error: `Unsupported file version: ${data.version}.` }
    data = data.model
  }
  const errors = validateModel(data)
  if (errors.length > 0) {
    const shown = errors.slice(0, maxErrorsShown).join('; ')
    const more = errors.length > maxErrorsShown ? ` (and ${errors.length - maxErrorsShown} more)` : ''
    return { error: `The model in the file is invalid: ${shown}${more}.` }
  }
  return { model: data }
}
