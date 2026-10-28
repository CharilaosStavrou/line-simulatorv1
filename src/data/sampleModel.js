// Sample model: a five-station line with mixed distributions, one
// unreliable machine (Welding, availability 62%) and small buffers.
//
// With buffer 2 before Welding, every Welding breakdown soon blocks
// Machining, and Welding (busy + down) is the bottleneck. Raising that buffer
// to 20 lets Machining keep working through most repairs; throughput rises
// and Machining, the slowest reliable station, becomes the bottleneck.
export function createSampleModel() {
  return {
    settings: { simulationHours: 2000, warmupHours: 200, replications: 10, seed: 1, timeUnit: 'minutes' },
    source: { type: 'alwaysAvailable' },
    stations: [
      {
        id: 'station1',
        name: 'Cutting',
        processingTime: { type: 'triangular', min: 3, mode: 4, max: 5 },
        mtbf: 0,
        mttr: 30,
      },
      {
        id: 'station2',
        name: 'Machining',
        processingTime: { type: 'normal', mean: 5, sd: 0.5 },
        mtbf: 0,
        mttr: 30,
      },
      {
        id: 'station3',
        name: 'Welding',
        processingTime: { type: 'uniform', min: 2, max: 3 },
        mtbf: 90,
        mttr: 55,
      },
      {
        id: 'station4',
        name: 'Painting',
        processingTime: { type: 'constant', value: 3.5 },
        mtbf: 0,
        mttr: 30,
      },
      {
        id: 'station5',
        name: 'Assembly',
        processingTime: { type: 'exponential', mean: 3 },
        mtbf: 0,
        mttr: 30,
      },
    ],
    buffers: [{ capacity: 2 }, { capacity: 2 }, { capacity: 2 }, { capacity: 2 }],
  }
}
