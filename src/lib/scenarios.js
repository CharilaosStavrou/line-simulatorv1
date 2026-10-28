// Scenarios: named snapshots of a run's main results and its model.

export const maxScenarios = 4

export function createScenario(name, model, result) {
  return {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name,
    model,
    summary: {
      replicationCount: result.replicationCount,
      throughputPerHour: result.throughputPerHour,
      averageWip: result.averageWip,
      averageCycleTime: result.averageCycleTime,
      bottleneck: { name: result.bottleneck.name, activePercent: result.bottleneck.activePercent },
    },
  }
}

// Why the current result cannot be saved, or null when it can.
export function saveBlockedReason({ result, resultModel, model, scenarios }) {
  if (!result) return 'Run the simulation to save its result as a scenario.'
  if (resultModel !== model) return 'The model has changed since the last run. Run again to save this model.'
  if (scenarios.length >= maxScenarios) return `At most ${maxScenarios} scenarios. Delete one to save a new one.`
  return null
}
