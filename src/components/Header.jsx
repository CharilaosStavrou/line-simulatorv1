import { useId } from 'react'
import { updateSettings, updateSource } from '../lib/modelEdit.js'
import { settingsRules } from '../lib/validation.js'
import DistributionEditor from './DistributionEditor.jsx'
import NumberField from './NumberField.jsx'

const defaultInterarrival = { type: 'exponential', mean: 7 }

// App title and the run settings: duration, warm-up, replications, seed, source.
function Header({ model, onChange, actions }) {
  const sourceId = useId()
  const { settings, source } = model

  function settingField(key, label, options = {}) {
    return (
      <NumberField
        label={label}
        value={settings[key]}
        validate={(value) => settingsRules[key](value, settings)}
        onChange={(value) => onChange(updateSettings(model, { [key]: value }))}
        {...options}
      />
    )
  }

  function handleSourceType(type) {
    const next =
      type === 'interarrival'
        ? { type, interarrivalTime: source.interarrivalTime ?? defaultInterarrival }
        : { type, interarrivalTime: source.interarrivalTime }
    onChange(updateSource(model, next))
  }

  return (
    <header className="appHeader">
      <div className="headerTop">
        <div className="appTitle">
          <h1>Production Line Simulator</h1>
          <p className="appSubtitle">Discrete-event simulation of a serial line · times in minutes</p>
        </div>
        {actions}
      </div>
      <div className="settingsRow">
        {settingField('simulationHours', 'Simulation', { unit: 'h' })}
        {settingField('warmupHours', 'Warm-up', { unit: 'h' })}
        {settingField('replications', 'Replications', { integer: true })}
        {settingField('seed', 'Seed', { integer: true })}
        <div className="field">
          <label htmlFor={sourceId}>Raw material</label>
          <select id={sourceId} value={source.type} onChange={(event) => handleSourceType(event.target.value)}>
            <option value="alwaysAvailable">Always available</option>
            <option value="interarrival">Interarrival time</option>
          </select>
        </div>
        {source.type === 'interarrival' && (
          <DistributionEditor
            label="Interarrival time (min)"
            distribution={source.interarrivalTime}
            onChange={(interarrivalTime) => onChange(updateSource(model, { ...source, interarrivalTime }))}
          />
        )}
      </div>
    </header>
  )
}

export default Header
