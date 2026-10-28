import { formatInterval } from '../lib/numbers.js'
import InfoTip from './InfoTip.jsx'

// Mean ± 95% confidence half-width with a tooltip explaining the interval.
function ConfidenceValue({ interval, digits = 2 }) {
  if (interval.halfWidth === null) return <span>{formatInterval(interval, digits)}</span>
  return (
    <span className="confidenceValue">
      {formatInterval(interval, digits)}
      <InfoTip label="What does ± mean?">
        95% confidence interval from {interval.n} independent replications (Student t). If the whole set of
        replications were repeated many times, about 95% of the intervals computed this way would contain the true
        long-run mean. More replications or longer runs make it narrower.
      </InfoTip>
    </span>
  )
}

export default ConfidenceValue
