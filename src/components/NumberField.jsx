import { useId, useState } from 'react'
import { formatNumber, parseDecimal } from '../lib/numbers.js'

// Text input for numbers (comma or point as decimal separator). Valid values
// are committed as you type; an invalid entry shows a red border and a
// message, and reverts to the last valid value on blur.
function NumberField({ label, value, onChange, validate, integer = false, unit, compact = false }) {
  const id = useId()
  const [draft, setDraft] = useState(() => formatNumber(value, 6))
  const [error, setError] = useState(null)
  const [shownValue, setShownValue] = useState(value)

  // Follow outside changes of the value (e.g. reordering, type change),
  // unless the draft already stands for it (e.g. "5," while typing "5,5").
  if (value !== shownValue) {
    setShownValue(value)
    if (parseDecimal(draft) !== value) {
      setDraft(formatNumber(value, 6))
      setError(null)
    }
  }

  function check(number) {
    if (Number.isNaN(number)) return 'Enter a number'
    if (integer && !Number.isInteger(number)) return 'Must be a whole number'
    return validate ? validate(number) : null
  }

  function handleChange(event) {
    const text = event.target.value
    setDraft(text)
    const number = parseDecimal(text)
    const message = check(number)
    setError(message)
    if (!message && number !== value) onChange(number)
  }

  function handleBlur() {
    if (error) {
      setDraft(formatNumber(value, 6))
      setError(null)
    }
  }

  return (
    <div className={`field${compact ? ' fieldCompact' : ''}`}>
      <label htmlFor={id}>
        {label}
        {unit && <span className="fieldUnit"> ({unit})</span>}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        className={error ? 'inputInvalid' : undefined}
        value={draft}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}Error` : undefined}
      />
      {error && (
        <span id={`${id}Error`} className="fieldError" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

export default NumberField
