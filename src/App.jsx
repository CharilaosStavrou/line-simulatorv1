import { useState } from 'react'
import AnimationPanel from './components/AnimationPanel.jsx'
import CapacityNotice from './components/CapacityNotice.jsx'
import Header from './components/Header.jsx'
import LineEditor from './components/LineEditor.jsx'
import ResultsPanel from './components/ResultsPanel.jsx'
import RunPanel from './components/RunPanel.jsx'
import { createDefaultModel } from './data/defaultModel.js'
import { useSimulation } from './lib/useSimulation.js'
import { validateModel } from './lib/validation.js'

function App() {
  const [model, setModel] = useState(createDefaultModel)
  const [runModel, setRunModel] = useState(null)
  const [modelError, setModelError] = useState(null)
  const simulation = useSimulation()

  function handleRun() {
    const errors = validateModel(model)
    setModelError(errors.length > 0 ? errors.join('; ') : null)
    if (errors.length > 0) return
    setRunModel(model)
    simulation.run(model)
  }

  return (
    <div className="app">
      <Header model={model} onChange={setModel} />
      <main className="appMain">
        <LineEditor model={model} onChange={setModel} />
        <AnimationPanel model={model} />
        <CapacityNotice model={model} />
        <RunPanel
          status={simulation.status}
          progress={simulation.progress}
          error={modelError ?? simulation.error}
          onRun={handleRun}
        />
        {simulation.result && runModel && (
          <ResultsPanel result={simulation.result} model={runModel} />
        )}
      </main>
    </div>
  )
}

export default App
