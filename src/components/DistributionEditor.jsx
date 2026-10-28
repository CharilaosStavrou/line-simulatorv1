import { useId } from 'react'
import {
  convertDistribution,
  distributionOptions,
  distributionParams,
  validateDistributionParam,
} from '../lib/distributions.js'
import NumberField from './NumberField.jsx'

// Distribution type selector with one field per parameter (in minutes).
function DistributionEditor({ label, distribution, onChange }) {
  const id = useId()
  const params = distributionParams[distribution.type]

  return (
    <fieldset className="distribution">
      <legend>{label}</legend>
      <label htmlFor={id} className="visuallyHidden">
        {label}: distribution type
      </label>
      <div className="distributionBody">
        <select
          id={id}
          value={distribution.type}
          onChange={(event) => onChange(convertDistribution(distribution, event.target.value))}
        >
          {distributionOptions.map((option) => (
            <option key={option.type} value={option.type}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="distributionParams">
          {params.map((param) => (
            <NumberField
              key={`${distribution.type}-${param.key}`}
              compact
              label={param.label}
              value={distribution[param.key]}
              validate={(value) => validateDistributionParam(distribution, param.key, value)}
              onChange={(value) => onChange({ ...distribution, [param.key]: value })}
            />
          ))}
        </div>
      </div>
    </fieldset>
  )
}

export default DistributionEditor
