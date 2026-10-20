import { describe, expect, it } from 'vitest'
import { alignmentColor, averageObserved, completeRegionalWindow, eventWindowDelta, lookup } from './types'

const country = { id: 'X', name: 'Example', p: [[1876, 'CO', 2, 'early'], [1979, 'DR', 1, 'selected'], [1990, 'NA', 0, 'merged']] } as any

describe('historical parity calculations', () => {
  it('uses the latest record at or before the exact selected year', () => {
    expect(lookup(country, 1979)).toEqual([1979, 'DR', 1, 'selected'])
    expect(lookup(country, 1978)).toEqual([1876, 'CO', 2, 'early'])
    expect(lookup(country, 1995)[1]).toBe('NA')
  })

  it('keeps missing values missing and only averages observed values when minimum coverage is met', () => {
    expect(averageObserved([1, null, 3])).toBe(2)
    expect(averageObserved([1, null], 2)).toBeNull()
  })

  it('calculates event windows without event year and requires two observed values per side', () => {
    const values: Record<number, number> = { 2008: 2, 2009: 4, 2012: 6, 2013: 8 }
    const result = eventWindowDelta((year) => values[year] ?? null, 2011, [-3, -2, -1], [1, 2, 3])
    expect(result.previous).toBe(3)
    expect(result.following).toBe(7)
    expect(result.delta).toBe(4)
  })

  it('requires every annual value in both regional windows', () => {
    const values: Record<number, number> = { 2009: 1, 2010: 2, 2012: 3, 2013: 4 }
    expect(completeRegionalWindow((year) => values[year] ?? null, 2011, 2).complete).toBe(true)
    expect(completeRegionalWindow((year) => year === 2010 ? null : values[year] ?? null, 2011, 2).complete).toBe(false)
  })

  it('preserves alignment color semantics, including China as a third pole', () => {
    expect(alignmentColor([1979, 'MR', -2, ''])).toBe('#f2545b')
    expect(alignmentColor([1979, 'MR', -2, '', '', 'CN'])).toBe('#a259e6')
  })
})
