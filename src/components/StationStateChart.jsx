import { formatNumber } from '../lib/numbers.js'
import { stateSeries } from '../lib/stationStates.js'


const labelWidth = 120
const barWidth = 470
const rowHeight = 34
const barHeight = 24

// Text for a segment: name and percentage when it fits, percentage only
// when narrower, nothing when tiny (the tooltip and legend still tell).
function segmentText(label, percent, width) {
  const text = `${formatNumber(percent, 0)}%`
  if (width >= 92) return `${label} ${text}`
  if (width >= 26) return text
  return ''
}

// One horizontal stacked bar per station showing the share of time in each state.
function StationStateChart({ stations, bottleneckIndex }) {
  const height = stations.length * rowHeight + 8
  return (
    <figure className="chart">
      <figcaption>Station states (% of measured time)</figcaption>
      <ul className="legend">
        {stateSeries.map((series) => (
          <li key={series.key}>
            <span className={`legendSwatch ${series.className}`} aria-hidden="true" />
            {series.label}
          </li>
        ))}
      </ul>
      <svg viewBox={`0 0 ${labelWidth + barWidth + 4} ${height}`} className="chartSvg" role="img"
        aria-label="Stacked bars of station states">
        {stations.map((station, row) => {
          const y = row * rowHeight + 4
          let x = labelWidth
          return (
            <g key={station.id}>
              <text x={labelWidth - 10} y={y + barHeight / 2} className="chartLabel" textAnchor="end"
                dominantBaseline="middle">
                {station.name}
                {row === bottleneckIndex ? ' ★' : ''}
              </text>
              {stateSeries.map((series) => {
                const percent = station[series.key]
                const width = (percent / 100) * barWidth
                const segmentX = x
                x += width
                if (width <= 0) return null
                const text = segmentText(series.label, percent, width)
                return (
                  <g key={series.key}>
                    <rect x={segmentX} y={y} width={width} height={barHeight} className={series.className}>
                      <title>{`${station.name}: ${series.label} ${formatNumber(percent, 1)}%`}</title>
                    </rect>
                    {text && (
                      <text x={segmentX + width / 2} y={y + barHeight / 2} textAnchor="middle"
                        dominantBaseline="middle" className={`segmentText ${series.className}Text`}>
                        {text}
                      </text>
                    )}
                  </g>
                )
              })}
            </g>
          )
        })}
      </svg>
      {bottleneckIndex !== undefined && <p className="chartNote">★ bottleneck</p>}
    </figure>
  )
}

export default StationStateChart
