import { bufferRules } from '../lib/validation.js'
import NumberField from './NumberField.jsx'

// Buffer between two stations, with its capacity in parts.
function BufferCard({ buffer, index, onChange }) {
  return (
    <div className="card bufferCard" aria-label={`Buffer ${index + 1}`}>
      <span className="bufferArrow" aria-hidden="true">
        →
      </span>
      <NumberField
        label="Buffer"
        unit="parts"
        integer
        compact
        value={buffer.capacity}
        validate={bufferRules.capacity}
        onChange={(capacity) => onChange({ capacity })}
      />
      <p className="cardHint">{buffer.capacity === 0 ? 'No buffer' : `Holds ${buffer.capacity}`}</p>
      <span className="bufferArrow" aria-hidden="true">
        →
      </span>
    </div>
  )
}

export default BufferCard
