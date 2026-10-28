import { stationRules } from '../lib/validation.js'
import DistributionEditor from './DistributionEditor.jsx'
import NumberField from './NumberField.jsx'
import TextField from './TextField.jsx'

// One station of the line: name, processing time, reliability, and buttons
// to move it left or right or delete it.
function StationCard({ station, index, count, onChange, onMove, onDelete }) {
  return (
    <article className="card stationCard" aria-label={`Station ${index + 1}: ${station.name}`}>
      <div className="cardHeader">
        <span className="stationNumber">{index + 1}</span>
        <div className="cardActions">
          <button
            type="button"
            className="iconButton"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label={`Move ${station.name} left`}
            title="Move left"
          >
            ←
          </button>
          <button
            type="button"
            className="iconButton"
            onClick={() => onMove(1)}
            disabled={index === count - 1}
            aria-label={`Move ${station.name} right`}
            title="Move right"
          >
            →
          </button>
          <button
            type="button"
            className="iconButton iconButtonDanger"
            onClick={onDelete}
            disabled={count === 1}
            aria-label={`Delete ${station.name}`}
            title="Delete station"
          >
            ✕
          </button>
        </div>
      </div>
      <TextField
        label="Name"
        value={station.name}
        validate={stationRules.name}
        onChange={(name) => onChange({ name })}
      />
      <DistributionEditor
        label="Processing time (min)"
        distribution={station.processingTime}
        onChange={(processingTime) => onChange({ processingTime })}
      />
      <div className="fieldPair">
        <NumberField
          label="MTBF"
          unit="min"
          value={station.mtbf}
          validate={stationRules.mtbf}
          onChange={(mtbf) => onChange({ mtbf })}
        />
        <NumberField
          label="MTTR"
          unit="min"
          value={station.mttr}
          validate={stationRules.mttr}
          onChange={(mttr) => onChange({ mttr })}
        />
      </div>
      <p className="cardHint">{station.mtbf > 0 ? 'Fails at random' : 'MTBF 0: never fails'}</p>
    </article>
  )
}

export default StationCard
