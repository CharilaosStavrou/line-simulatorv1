import { formatNumber } from '../lib/numbers.js'
import { checkCapacity } from '../sim/capacity.js'

// Orange notice when arrivals reach or exceed the slowest station's capacity.
function CapacityNotice({ model }) {
  const check = checkCapacity(model)
  if (!check.overloaded) return null
  return (
    <p className="notice noticeWarn" role="status">
      <strong>⚠ The line cannot keep up with arrivals.</strong> WIP and cycle time will keep growing with simulation
      length. Arrivals {formatNumber(check.arrivalRatePerHour)} parts/h ≥ effective capacity of{' '}
      {model.stations[check.slowestIndex].name} {formatNumber(check.capacityPerHour)} parts/h.
    </p>
  )
}

export default CapacityNotice
