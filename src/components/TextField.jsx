import { useId, useState } from 'react'

// Text input with the same validate / revert-on-blur behaviour as NumberField.
function TextField({ label, value, onChange, validate }) {
  const id = useId()
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState(null)
  const [shownValue, setShownValue] = useState(value)

  if (value !== shownValue) {
    setShownValue(value)
    if (draft.trim() !== value) {
      setDraft(value)
      setError(null)
    }
  }

  function handleChange(event) {
    const text = event.target.value
    setDraft(text)
    const message = validate ? validate(text) : null
    setError(message)
    if (!message) onChange(text.trim())
  }

  function handleBlur() {
    setDraft(error ? value : draft.trim())
    setError(null)
  }

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        maxLength={40}
        className={error ? 'inputInvalid' : undefined}
        value={draft}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-invalid={Boolean(error)}
      />
      {error && (
        <span className="fieldError" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

export default TextField
