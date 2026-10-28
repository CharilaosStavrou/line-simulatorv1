// Run button with a progress bar and error display.
function RunPanel({ status, progress, replications, error, onRun }) {
  const running = status === 'running'
  return (
    <section className="runPanel" aria-live="polite">
      <button type="button" className="button buttonPrimary" onClick={onRun} disabled={running}>
        {running ? 'Running…' : `Run simulation (${replications} replication${replications === 1 ? '' : 's'})`}
      </button>
      {running && (
        <div className="progress">
          <div
            className="progressBar"
            role="progressbar"
            aria-label="Simulation progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
          >
            <div className="progressFill" style={{ width: `${progress * 100}%` }} />
          </div>
          <span>{Math.round(progress * 100)}%</span>
        </div>
      )}
      {error && (
        <p className="errorMessage" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}

export default RunPanel
