import { formatNumber } from '../lib/numbers.js'

// Average level and share of time full for each buffer.
function BufferTable({ buffers, stations }) {
  if (buffers.length === 0) return null
  return (
    <table className="dataTable">
      <caption>Buffers</caption>
      <thead>
        <tr>
          <th scope="col">Buffer</th>
          <th scope="col">Capacity</th>
          <th scope="col">Average level</th>
          <th scope="col">% time full</th>
        </tr>
      </thead>
      <tbody>
        {buffers.map((buffer, i) => (
          <tr key={stations[i].id}>
            <th scope="row">
              {stations[i].name} → {stations[i + 1].name}
            </th>
            <td>{buffer.capacity}</td>
            <td>{formatNumber(buffer.averageLevel)}</td>
            <td>{buffer.percentFull === null ? 'no buffer' : `${formatNumber(buffer.percentFull, 1)}%`}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default BufferTable
