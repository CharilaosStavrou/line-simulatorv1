import { useId } from 'react'

// Small "i" button that shows an explanation on hover or keyboard focus.
function InfoTip({ label, children }) {
  const id = useId()
  return (
    <span className="infoTip">
      <button type="button" className="infoButton" aria-label={label} aria-describedby={id}>
        i
      </button>
      <span id={id} role="tooltip" className="tipText">
        {children}
      </span>
    </span>
  )
}

export default InfoTip
