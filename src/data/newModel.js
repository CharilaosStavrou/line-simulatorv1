// The model created by "New": a single station to build on.
export function createNewModel() {
  return {
    settings: { simulationHours: 1000, warmupHours: 100, replications: 5, seed: 1, timeUnit: 'minutes' },
    source: { type: 'alwaysAvailable' },
    stations: [
      {
        id: 'station1',
        name: 'Station 1',
        processingTime: { type: 'constant', value: 5 },
        mtbf: 0,
        mttr: 30,
      },
    ],
    buffers: [],
  }
}
