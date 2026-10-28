import { Fragment } from 'react'
import { addStation, deleteStation, moveStation, updateBuffer, updateStation } from '../lib/modelEdit.js'
import { maxStations } from '../lib/validation.js'
import BufferCard from './BufferCard.jsx'
import StationCard from './StationCard.jsx'

// The line from left to right: station, buffer, station, ...
function LineEditor({ model, onChange }) {
  const { stations, buffers } = model

  return (
    <section className="panel" aria-labelledby="lineTitle">
      <div className="panelHeader">
        <h2 id="lineTitle">Line</h2>
        <button
          type="button"
          className="button"
          onClick={() => onChange(addStation(model))}
          disabled={stations.length >= maxStations}
        >
          + Add station
        </button>
      </div>
      <div className="lineRow">
        <div className="lineEnd" aria-hidden="true">
          {model.source.type === 'alwaysAvailable' ? 'Raw material' : 'Arrivals'}
        </div>
        {stations.map((station, index) => (
          <Fragment key={station.id}>
            <StationCard
              station={station}
              index={index}
              count={stations.length}
              onChange={(changes) => onChange(updateStation(model, index, changes))}
              onMove={(direction) => onChange(moveStation(model, index, direction))}
              onDelete={() => onChange(deleteStation(model, index))}
            />
            {index < buffers.length && (
              <BufferCard
                buffer={buffers[index]}
                index={index}
                onChange={(changes) => onChange(updateBuffer(model, index, changes))}
              />
            )}
          </Fragment>
        ))}
        <div className="lineEnd" aria-hidden="true">
          Finished
        </div>
      </div>
    </section>
  )
}

export default LineEditor
