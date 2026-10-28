import { useRef, useState } from 'react'
import { createNewModel } from '../data/newModel.js'
import { createSampleModel } from '../data/sampleModel.js'
import { modelToJson, parseModelFile } from '../lib/modelFile.js'

const replaceWarning = 'Your current model will be replaced. Export it first if you want to keep it.'

function downloadJson(text, fileName) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

// Load sample, New, Export JSON and Import JSON. Replacing the current
// model always asks for confirmation; an invalid import keeps it unchanged.
function FileToolbar({ model, onReplace }) {
  const fileInput = useRef(null)
  const [error, setError] = useState(null)

  function replace(next, question) {
    if (window.confirm(`${question}\n\n${replaceWarning}`)) {
      setError(null)
      onReplace(next)
    }
  }

  async function handleFile(event) {
    const file = event.target.files[0]
    event.target.value = '' // allow importing the same file again
    if (!file) return
    let text
    try {
      text = await file.text()
    } catch {
      setError('The file could not be read.')
      return
    }
    const result = parseModelFile(text)
    if (result.error) {
      setError(`Import failed, your current model is unchanged. ${result.error}`)
      return
    }
    replace(result.model, `Import the model from "${file.name}"?`)
  }

  return (
    <div className="fileToolbar">
      <div className="toolbarButtons">
        <button type="button" className="button" onClick={() => replace(createSampleModel(), 'Load the sample model?')}>
          Load sample
        </button>
        <button type="button" className="button" onClick={() => replace(createNewModel(), 'Start a new model?')}>
          New
        </button>
        <button type="button" className="button" onClick={() => downloadJson(modelToJson(model), 'line-model.json')}>
          Export JSON
        </button>
        <button type="button" className="button" onClick={() => fileInput.current.click()}>
          Import JSON
        </button>
        <input ref={fileInput} type="file" accept=".json,application/json" className="visuallyHidden"
          tabIndex={-1} aria-hidden="true" onChange={handleFile} />
      </div>
      {error && (
        <p className="errorMessage" role="alert">
          {error}{' '}
          <button type="button" className="linkButton" onClick={() => setError(null)}>
            Dismiss
          </button>
        </p>
      )}
    </div>
  )
}

export default FileToolbar
