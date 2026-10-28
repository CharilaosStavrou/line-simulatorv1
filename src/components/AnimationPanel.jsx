import { formatClock } from '../lib/lineLayout.js'
import { stateSeries } from '../lib/stationStates.js'
import { glideMilliseconds, speedOptions, useLineAnimation } from '../lib/useLineAnimation.js'
import LineView from './LineView.jsx'

// Animated line driven step by step by the simulation engine.
function AnimationPanel({ model }) {
  const animation = useLineAnimation(model)
  const { snapshot } = animation

  return (
    <section className="panel" aria-labelledby="animationTitle">
      <div className="panelHeader">
        <h2 id="animationTitle">Animation</h2>
        <div className="animationControls">
          {animation.playing ? (
            <button type="button" className="button" onClick={animation.pause}>
              ❚❚ Pause
            </button>
          ) : (
            <button type="button" className="button buttonAccent" onClick={animation.play} disabled={animation.finished}>
              ▶ Play
            </button>
          )}
          <button type="button" className="button" onClick={animation.restart}>
            ↺ Restart
          </button>
          <div className="segmented" role="group" aria-label="Speed (simulated minutes per second)">
            {speedOptions.map((speed) => (
              <button
                key={speed}
                type="button"
                className={speed === animation.speed ? 'segmentActive' : undefined}
                aria-pressed={speed === animation.speed}
                onClick={() => animation.setSpeed(speed)}
              >
                {speed}×
              </button>
            ))}
          </div>
          <span className="panelNote">simulated min per second</span>
        </div>
      </div>
      <div className="counterRow" aria-live="off">
        <div className="counter">
          <span className="kpiLabel">Simulated clock (h:mm:ss)</span>
          <span className="counterValue">{formatClock(snapshot.time)}</span>
        </div>
        <div className="counter">
          <span className="kpiLabel">Parts finished</span>
          <span className="counterValue">{snapshot.finished}</span>
        </div>
        <div className="counter">
          <span className="kpiLabel">Current WIP</span>
          <span className="counterValue">{snapshot.wip}</span>
        </div>
        {animation.finished && <span className="panelNote">End of the simulation period reached.</span>}
      </div>
      <LineView model={model} snapshot={snapshot} glideMs={glideMilliseconds(animation.speed)} />
      <ul className="legend">
        {stateSeries.map((series) => (
          <li key={series.key}>
            <span className={`legendSwatch ${series.className}`} aria-hidden="true" />
            {series.label}
          </li>
        ))}
        <li>
          <span className="legendSwatch legendPart" aria-hidden="true" />
          Part
        </li>
      </ul>
    </section>
  )
}

export default AnimationPanel
