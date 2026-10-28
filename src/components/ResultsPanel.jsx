import { formatNumber } from '../lib/numbers.js'
import BufferTable from './BufferTable.jsx'
import CapacityNotice from './CapacityNotice.jsx'
import StationStateChart from './StationStateChart.jsx'
import WipChart from './WipChart.jsx'

const littleTolerance = 0.02

function Kpi({ label, value, unit }) {
  return (
    <div className="kpi">
      <span className="kpiLabel">{label}</span>
      <span className="kpiValue">{value}</span>
      {unit && <span className="kpiUnit">{unit}</span>}
    </div>
  )
}

// Main results of a run, the Little's law check and the charts.
function ResultsPanel({ result, model }) {
  const { warmupHours } = model.settings
  const littleWip = (result.throughputPerHour / 60) * (result.averageCycleTime ?? 0)
  const difference = result.averageWip > 0 ? Math.abs(result.averageWip - littleWip) / result.averageWip : 0
  const littleOk = difference <= littleTolerance

  return (
    <section className="panel" aria-labelledby="resultsTitle">
      <div className="panelHeader">
        <h2 id="resultsTitle">Results</h2>
        <span className="panelNote">
          {formatNumber(result.measuredMinutes / 60, 1)} h measured after {formatNumber(warmupHours, 1)} h warm-up ·{' '}
          {result.partsFinished} parts finished
        </span>
      </div>
      <CapacityNotice model={model} />
      <div className="kpiRow">
        <Kpi label="Throughput" value={formatNumber(result.throughputPerHour)} unit="parts/h" />
        <Kpi label="Average WIP" value={formatNumber(result.averageWip)} unit="parts" />
        <Kpi label="Average cycle time" value={formatNumber(result.averageCycleTime, 1)} unit="min" />
        <Kpi label="Bottleneck" value={result.bottleneck.name}
          unit={`${formatNumber(result.bottleneck.activePercent, 1)}% busy + down`} />
      </div>
      <div className={`littleCheck ${littleOk ? 'littleOk' : 'littleWarn'}`}>
        <strong>{littleOk ? '✓' : '⚠'} Little&apos;s law:</strong> average WIP {formatNumber(result.averageWip)} vs
        throughput × cycle time = {formatNumber(result.throughputPerHour / 60, 4)} parts/min ×{' '}
        {formatNumber(result.averageCycleTime, 1)} min = {formatNumber(littleWip)} parts (difference{' '}
        {formatNumber(difference * 100, 1)}%{littleOk ? '' : ', the run may be too short'})
      </div>
      <div className="chartGrid">
        <div>
          <StationStateChart stations={result.stations} bottleneckIndex={result.bottleneck.index} />
          <BufferTable buffers={result.buffers} stations={result.stations} />
        </div>
        <WipChart points={result.wipOverTime} averageWip={result.averageWip} startMinutes={warmupHours * 60} />
      </div>
    </section>
  )
}

export default ResultsPanel
