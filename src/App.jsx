import { useEffect, useState } from 'react'
import AnimationPanel from './components/AnimationPanel.jsx'
import CapacityNotice from './components/CapacityNotice.jsx'
import FileToolbar from './components/FileToolbar.jsx'
import Header from './components/Header.jsx'
import LineEditor from './components/LineEditor.jsx'
import ResultsPanel from './components/ResultsPanel.jsx'
import RunPanel from './components/RunPanel.jsx'
import ScenarioPanel from './components/ScenarioPanel.jsx'
import { createDefaultModel } from './data/defaultModel.js'
import { createScenario, saveBlockedReason } from './lib/scenarios.js'
import { loadSavedModel, loadSavedScenarios, saveModel, saveScenarios } from './lib/storage.js'
import { useSimulation } from './lib/useSimulation.js'
import { validateModel } from './lib/validation.js'

function App() {
  const [model, setModel] = useState(() => loadSavedModel() ?? createDefaultModel())
  const [modelError, setModelError] = useState(null)
  const [scenarios, setScenarios] = useState(loadSavedScenarios)
  const simulation = useSimulation()

  useEffect(() => saveModel(model), [model])
  useEffect(() => saveScenarios(scenarios), [scenarios])

  function handleRun() {
    const errors = validateModel(model)
    setModelError(errors.length > 0 ? errors.join('; ') : null)
    if (errors.length > 0) return
    simulation.run(model)
  }

  const result = simulation.status === 'done' ? simulation.result : null
  const { resultModel } = simulation
  const blockedReason = saveBlockedReason({ result, resultModel, model, scenarios })

  return (
    <div className="app">
      <Header model={model} onChange={setModel} actions={<FileToolbar model={model} onReplace={setModel} />} />
      <main className="appMain">
        <LineEditor model={model} onChange={setModel} />
        <AnimationPanel model={model} />
        <CapacityNotice model={model} />
        <RunPanel
          status={simulation.status}
          progress={simulation.progress}
          replications={model.settings.replications}
          error={modelError ?? simulation.error}
          onRun={handleRun}
        />
        {simulation.result && <ResultsPanel result={simulation.result} model={resultModel} />}
        <ScenarioPanel
          scenarios={scenarios}
          saveBlockedReason={blockedReason}
          onSave={(name) => setScenarios([...scenarios, createScenario(name, resultModel, result)])}
          onDelete={(id) => setScenarios(scenarios.filter((scenario) => scenario.id !== id))}
        />
      </main>
    </div>
  )
}

export default App
