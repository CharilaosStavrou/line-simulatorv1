// Sample model: a five-station line with mixed distributions, one
// unreliable machine (Welding) and small buffers.
export function createSampleModel() {
  return {
    settings: { simulationHours: 2000, warmupHours: 200, replications: 10, seed: 1, timeUnit: 'minutes' },
    source: { type: 'alwaysAvailable' },
    stations: [
      {
        id: 'station1',
        name: 'Cutting',
        processingTime: { type: 'triangular', min: 3, mode: 4, max: 6 },
        mtbf: 0,
        mttr: 30,
      },
      {
        id: 'station2',
        name: 'Machining',
        processingTime: { type: 'normal', mean: 5.2, sd: 0.8 },
        mtbf: 0,
        mttr: 30,
      },
      {
        id: 'station3',
        name: 'Welding',
        processingTime: { type: 'uniform', min: 3.5, max: 5.5 },
        mtbf: 120,
        mttr: 25,
      },
      {
        id: 'station4',
        name: 'Painting',
        processingTime: { type: 'constant', value: 4.5 },
        mtbf: 0,
        mttr: 30,
      },
      {
        id: 'station5',
        name: 'Assembly',
        processingTime: { type: 'exponential', mean: 4 },
        mtbf: 0,
        mttr: 30,
      },
    ],
    buffers: [{ capacity: 2 }, { capacity: 2 }, { capacity: 2 }, { capacity: 2 }],
  }
}
