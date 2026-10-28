import { bufferGrid, computeLayout, partPositions, partSize, queueGrid } from '../lib/lineLayout.js'
import { stateSeries } from '../lib/stationStates.js'

const stateInfo = Object.fromEntries(stateSeries.map((series) => [series.state, series]))

function shortName(name) {
  return name.length > 14 ? `${name.slice(0, 13)}…` : name
}

// SVG view of the line at one instant: stations coloured (and labelled) by
// state, buffers and the input queue with their parts as small squares.
function LineView({ model, snapshot, glideMs }) {
  const layout = computeLayout(model.stations.length)
  const hasQueue = model.source.type === 'interarrival'
  const parts = partPositions(snapshot, layout)
  const { source, sink, centerY } = layout
  const hiddenQueue = snapshot.inputQueue.count - queueGrid(layout).capacity

  return (
    <div className="lineViewScroll">
      <svg viewBox={`0 0 ${layout.width} ${layout.height}`} className="lineView" style={{ minWidth: layout.width * 0.7, maxWidth: layout.width * 1.1, '--glide': `${glideMs}ms` }}
        role="img" aria-label="Animated view of the line">
        <line x1={source.x + source.width} x2={sink.x} y1={centerY} y2={centerY} className="flowLine" />

        <rect {...source} rx="6" className="endBox" />
        <text x={source.x + source.width / 2} y={source.y + 16} textAnchor="middle" className="viewSmall">
          {hasQueue ? `Queue ${snapshot.inputQueue.count}` : 'Raw material'}
        </text>
        {!hasQueue && (
          <text x={source.x + source.width / 2} y={centerY + 10} textAnchor="middle" className="viewLarge">∞</text>
        )}
        {hiddenQueue > 0 && (
          <text x={source.x + source.width / 2} y={source.y + source.height + 16} textAnchor="middle"
            className="viewSmall">+{hiddenQueue} more</text>
        )}

        {model.stations.map((station, i) => {
          const box = layout.stations[i]
          const info = stateInfo[snapshot.stations[i].state]
          return (
            <g key={station.id}>
              <text x={box.x + box.width / 2} y={box.y - 8} textAnchor="middle" className="viewLabel">
                {shortName(station.name)}
              </text>
              <rect {...box} rx="6" className={`stationBox ${info.className}`} />
              <text x={box.x + box.width / 2} y={box.y + box.height - 10} textAnchor="middle"
                className={`viewSmall ${info.className}Text`}>
                {info.label}
              </text>
            </g>
          )
        })}

        {snapshot.buffers.map((buffer, i) => {
          const box = layout.buffers[i]
          const hidden = buffer.count - bufferGrid(box).capacity
          return (
            <g key={`buffer${i}`}>
              {buffer.capacity > 0 && <rect {...box} rx="4" className="bufferBox" />}
              <text x={box.x + box.width / 2} y={box.y + box.height + 16} textAnchor="middle" className="viewSmall">
                {buffer.capacity === 0 ? 'no buffer' : `${buffer.count}/${buffer.capacity}`}
                {hidden > 0 ? ` (+${hidden})` : ''}
              </text>
            </g>
          )
        })}

        <rect {...sink} rx="6" className="endBox" />
        <text x={sink.x + sink.width / 2} y={sink.y + 16} textAnchor="middle" className="viewSmall">Finished</text>
        <text x={sink.x + sink.width / 2} y={centerY + 8} textAnchor="middle" className="viewLarge">
          {snapshot.finished}
        </text>

        {parts.map((part) => (
          <rect key={part.id} width={partSize} height={partSize} rx="1.5" className="partSquare"
            style={{ transform: `translate(${part.x}px, ${part.y}px)` }} />
        ))}
      </svg>
    </div>
  )
}

export default LineView
