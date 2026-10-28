import { niceTicks } from '../lib/chartScale.js'
import { formatNumber } from '../lib/numbers.js'

const width = 600
const height = 250
const margin = { top: 12, right: 16, bottom: 40, left: 48 }
const plotWidth = width - margin.left - margin.right
const plotHeight = height - margin.top - margin.bottom

// Line chart of WIP over the measured period (each point is the time-average
// over its sampling interval), with the overall average as a dashed line.
function WipChart({ points, averageWip, startMinutes }) {
  if (points.length === 0) return null
  const startHours = startMinutes / 60
  const endHours = points.at(-1).time / 60
  const yTicks = niceTicks(Math.max(...points.map((p) => p.wip)), 5)
  const yMax = yTicks.at(-1)
  const xTicks = niceTicks(endHours, 5).filter((t) => t >= startHours - 1e-9 && t <= endHours + 1e-9)
  const xScale = (hours) => margin.left + ((hours - startHours) / (endHours - startHours)) * plotWidth
  const yScale = (value) => margin.top + plotHeight - (value / yMax) * plotHeight
  const path = points.map((p) => `${xScale(p.time / 60).toFixed(1)},${yScale(p.wip).toFixed(1)}`).join(' ')

  return (
    <figure className="chart">
      <figcaption>WIP over time (parts in the system)</figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} className="chartSvg" role="img"
        aria-label={`WIP over time, average ${formatNumber(averageWip)} parts`}>
        {yTicks.map((tick) => (
          <g key={`y${tick}`}>
            <line x1={margin.left} x2={width - margin.right} y1={yScale(tick)} y2={yScale(tick)} className="gridLine" />
            <text x={margin.left - 8} y={yScale(tick)} textAnchor="end" dominantBaseline="middle" className="axisText">
              {formatNumber(tick)}
            </text>
          </g>
        ))}
        {xTicks.map((tick) => (
          <text key={`x${tick}`} x={xScale(tick)} y={height - margin.bottom + 18} textAnchor="middle" className="axisText">
            {formatNumber(tick, 1)}
          </text>
        ))}
        <text x={margin.left + plotWidth / 2} y={height - 4} textAnchor="middle" className="axisText">
          Simulated time (h)
        </text>
        <line x1={margin.left} x2={margin.left} y1={margin.top} y2={margin.top + plotHeight} className="axisLine" />
        <line x1={margin.left} x2={width - margin.right} y1={margin.top + plotHeight} y2={margin.top + plotHeight}
          className="axisLine" />
        <line x1={margin.left} x2={width - margin.right} y1={yScale(averageWip)} y2={yScale(averageWip)}
          className="averageLine" />
        <polyline points={path} className="dataLine" />
      </svg>
      <p className="chartNote">Dashed line: average WIP {formatNumber(averageWip)} parts</p>
    </figure>
  )
}

export default WipChart
