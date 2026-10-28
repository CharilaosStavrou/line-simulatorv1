import { useState } from 'react'
import { formatInterval, formatNumber } from '../lib/numbers.js'
import { maxScenarios } from '../lib/scenarios.js'

const rows = [
  { label: 'Throughput (parts/h)', value: (s) => formatInterval(s.throughputPerHour) },
  { label: 'Average WIP (parts)', value: (s) => formatInterval(s.averageWip) },
  { label: 'Average cycle time (min)', value: (s) => formatInterval(s.averageCycleTime, 1) },
  {
    label: 'Bottleneck',
    value: (s) => `${s.bottleneck.name} (${formatNumber(s.bottleneck.activePercent, 1)}% active)`,
  },
  { label: 'Replications', value: (s) => String(s.replicationCount) },
]

// Saved result snapshots side by side, to compare what-if changes.
function ScenarioPanel({ scenarios, saveBlockedReason, onSave, onDelete }) {
  const [name, setName] = useState('')
  const defaultName = `Scenario ${scenarios.length + 1}`

  function handleSubmit(event) {
    event.preventDefault()
    onSave(name.trim() || defaultName)
    setName('')
  }

  return (
    <section className="panel" aria-labelledby="scenariosTitle">
      <div className="panelHeader">
        <h2 id="scenariosTitle">Scenarios</h2>
        <form className="scenarioForm" onSubmit={handleSubmit}>
          <label htmlFor="scenarioName" className="visuallyHidden">
            Scenario name
          </label>
          <input id="scenarioName" type="text" maxLength={40} placeholder={defaultName} value={name}
            onChange={(event) => setName(event.target.value)} disabled={Boolean(saveBlockedReason)} />
          <button type="submit" className="button" disabled={Boolean(saveBlockedReason)}>
            Save current result
          </button>
        </form>
      </div>
      {saveBlockedReason && <p className="chartNote">{saveBlockedReason}</p>}
      {scenarios.length === 0 ? (
        <p className="panelNote">
          Save up to {maxScenarios} results, change the model (e.g. a bigger buffer or a faster bottleneck), run
          again and compare them here.
        </p>
      ) : (
        <div className="tableScroll">
          <table className="dataTable comparisonTable">
            <thead>
              <tr>
                <th scope="col">Result</th>
                {scenarios.map((scenario) => (
                  <th scope="col" key={scenario.id}>
                    <span className="scenarioName">{scenario.name}</span>
                    <button type="button" className="iconButton iconButtonDanger" onClick={() => onDelete(scenario.id)}
                      aria-label={`Delete scenario ${scenario.name}`} title="Delete scenario">
                      ✕
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  {scenarios.map((scenario) => (
                    <td key={scenario.id}>{row.value(scenario.summary)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default ScenarioPanel
