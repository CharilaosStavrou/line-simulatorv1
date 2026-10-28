import { formatNumber } from '../lib/numbers.js'
import BufferTable from './BufferTable.jsx'
import CapacityNotice from './CapacityNotice.jsx'
import ConfidenceValue from './ConfidenceValue.jsx'
import StationStateChart from './StationStateChart.jsx'
import WipChart from './WipChart.jsx'

const littleTolerance = 0.02

function Kpi({ label, children, unit }) {
  return (
    <div className="kpi">
      <span className="kpiLabel">{label}</span>
      <span className="kpiValue">{children}</span>
      {unit && <span className="kpiUnit">{unit}</span>}
    </div>
  )
}

// Main results over all replications, the Little's law check and the charts.
function ResultsPanel({ result, model }) {
  const { warmupHours } = model.settings
  const count = result.replicationCount
  const throughput = result.throughputPerHour.mean
  const wip = result.averageWip.mean
  const cycleTime = result.averageCycleTime.mean ?? 0
  const littleWip = (throughput / 60) * cycleTime
  const difference = wip > 0 ? Math.abs(wip - littleWip) / wip : 0
  const littleOk = difference <= littleTolerance
  const { bottleneck } = result

  return (
    <section className="panel" aria-labelledby="resultsTitle">
      <div className="panelHeader">
        <h2 id="resultsTitle">Results</h2>
        <span className="panelNote">
          {count} replication{count === 1 ? '' : 's'} (seeds {result.seeds[0]}
          {count > 1 ? `–${result.seeds.at(-1)}` : ''}) · {formatNumber(result.measuredMinutes / 60, 1)} h measured
          after {formatNumber(warmupHours, 1)} h warm-up · {formatNumber(result.partsFinished.mean, 0)} parts finished
          per replication
        </span>
      </div>
      <CapacityNotice model={model} />
      <div className="kpiRow">
        <Kpi label="Throughput" unit="parts/h">
          <ConfidenceValue interval={result.throughputPerHour} />
        </Kpi>
        <Kpi label="Average WIP" unit="parts">
          <ConfidenceValue interval={result.averageWip} />
        </Kpi>
        <Kpi label="Average cycle time" unit="min">
          <ConfidenceValue interval={result.averageCycleTime} digits={1} />
        </Kpi>
        <Kpi
          label="Bottleneck"
          unit={`${formatNumber(bottleneck.activePercent, 1)}% busy + down${
            count > 1 ? ` · bottleneck in ${bottleneck.replicationsAsBottleneck} of ${count} replications` : ''
          }`}
        >
          {bottleneck.name}
        </Kpi>
      </div>
      {count === 1 && <p className="chartNote">Run 2 or more replications to get confidence intervals.</p>}
      <div className={`littleCheck ${littleOk ? 'littleOk' : 'littleWarn'}`}>
        <strong>{littleOk ? '✓' : '⚠'} Little&apos;s law:</strong> average WIP {formatNumber(wip)} vs throughput ×
        cycle time = {formatNumber(throughput / 60, 4)} parts/min × {formatNumber(cycleTime, 1)} min ={' '}
        {formatNumber(littleWip)} parts (difference {formatNumber(difference * 100, 1)}%
        {littleOk ? '' : ', the run may be too short'}; means over replications)
      </div>
      <div className="chartGrid">
        <div>
          <StationStateChart stations={result.stations} bottleneckIndex={bottleneck.index} />
          <BufferTable buffers={result.buffers} stations={result.stations} />
        </div>
        <WipChart points={result.wipOverTime} averageWip={wip} startMinutes={warmupHours * 60} />
      </div>
    </section>
  )
}

export default ResultsPanel
