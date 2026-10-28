// The model shown when the app starts: a short line to edit and run.
export function createDefaultModel() {
  return {
    settings: { simulationHours: 1000, warmupHours: 100, replications: 1, seed: 1, timeUnit: 'minutes' },
    source: { type: 'alwaysAvailable' },
    stations: [
      {
        id: 'station1',
        name: 'Station 1',
        processingTime: { type: 'triangular', min: 3, mode: 4, max: 6 },
        mtbf: 0,
        mttr: 30,
      },
      {
        id: 'station2',
        name: 'Station 2',
        processingTime: { type: 'normal', mean: 5, sd: 1 },
        mtbf: 480,
        mttr: 30,
      },
      {
        id: 'station3',
        name: 'Station 3',
        processingTime: { type: 'exponential', mean: 4 },
        mtbf: 0,
        mttr: 30,
      },
    ],
    buffers: [{ capacity: 3 }, { capacity: 3 }],
  }
}
