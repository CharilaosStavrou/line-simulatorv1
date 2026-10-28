import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSampleModel } from '../src/data/sampleModel.js'
import { loadSavedModel, loadSavedScenarios, saveModel, saveScenarios } from '../src/lib/storage.js'

function stubStorage() {
  const data = new Map()
  vi.stubGlobal('localStorage', {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
  })
  return data
}

afterEach(() => vi.unstubAllGlobals())

describe('storage', () => {
  it('saves and loads the model and scenarios', () => {
    stubStorage()
    const model = createSampleModel()
    saveModel(model)
    saveScenarios([{ id: 'a', name: 'Base' }])
    expect(loadSavedModel()).toEqual(model)
    expect(loadSavedScenarios()).toEqual([{ id: 'a', name: 'Base' }])
  })

  it('ignores missing, corrupt or invalid saved data', () => {
    const data = stubStorage()
    expect(loadSavedModel()).toBeNull()
    expect(loadSavedScenarios()).toEqual([])
    data.set('lineSimulator.model.v1', '{ broken')
    expect(loadSavedModel()).toBeNull()
    data.set('lineSimulator.model.v1', JSON.stringify({ stations: [] }))
    expect(loadSavedModel()).toBeNull()
  })

  it('keeps working when storage throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('full')
      },
    })
    expect(() => saveModel(createSampleModel())).not.toThrow()
    expect(loadSavedModel()).toBeNull()
  })
})
