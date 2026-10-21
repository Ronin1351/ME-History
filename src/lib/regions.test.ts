import { describe, expect, it } from 'vitest'
import { regionKeyOf, regions } from './regions'
import { effectiveRecord, lookup, nameAt } from './types'

const byId = (key: string) => Object.fromEntries(regions[key].C.map((country) => [country.id, country]))

describe('region assembly', () => {
  it('has unique country ids in every region', () => {
    for (const region of Object.values(regions)) {
      const ids = region.C.map((country) => country.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('resolves shared countries (useEU / useME)', () => {
    expect(regions.as.C.some((country) => country.id === 'RUS')).toBe(true)
    expect(regions.af.C.some((country) => country.id === 'EGY')).toBe(true)
    expect(regions.as.ECON_IDS?.RUS).toBe('RUS')
    expect(regions.af.ECON_IDS?.EGY).toBe('EGY')
  })

  it('gives every coded country a clickable shape, disc or marker', () => {
    for (const region of Object.values(regions)) {
      const reachable = new Set([...region.GEO.map((feature) => feature.iso), ...(region.discs ?? []), ...(region.markerStates ?? []).map((marker) => marker.id), ...(region.merge ?? []).map((pair) => pair.guest)])
      const unreachable = region.C.map((country) => country.id).filter((id) => !reachable.has(id))
      expect({ region: region.key, unreachable }).toEqual({ region: region.key, unreachable: [] })
    }
  })

  it('maps Middle East geometry codes to record ids', () => {
    const isos = regions.me.GEO.map((feature) => feature.iso)
    expect(isos).toContain('UAE')
    expect(isos).toContain('NYE')
    expect(isos).not.toContain('ARE')
  })

  it('falls back to the Middle East for unknown region keys', () => {
    expect(regionKeyOf('xx')).toBe('me')
    expect(regionKeyOf(null)).toBe('me')
    expect(regionKeyOf('eu')).toBe('eu')
  })
})

describe('not-separate territories', () => {
  it('take their parent state record (Ukraine 1980 → Soviet Union)', () => {
    const resolved = effectiveRecord(byId('eu'), 'UKR', 1980)
    expect(resolved?.own[1]).toBe('NA')
    expect(resolved?.parent).toBe('RUS')
    expect(resolved?.record[2]).toBe(-2)
  })

  it('works across regions once shared countries resolve (Kazakhstan 1980 in Asia)', () => {
    const resolved = effectiveRecord(byId('as'), 'KAZ', 1980)
    expect(resolved?.parent).toBe('RUS')
    expect(resolved?.record[1]).not.toBe('NA')
  })

  it('keeps Israel before 1948 on the Mandate Palestine record', () => {
    expect(effectiveRecord(byId('me'), 'ISR', 1930)?.parent).toBe('PSE')
  })

  it('returns null for unknown ids instead of throwing', () => {
    expect(effectiveRecord(byId('eu'), 'IRN', 1980)).toBeNull()
  })

  it('uses year-specific names when the record provides them', () => {
    expect(nameAt(regions.me, 'TUR', 1900)).toBe('Ottoman')
    expect(nameAt(regions.me, 'TUR', 1990)).toBe('Turkey')
  })

  it('merges East Germany into Germany outside 1949–1990', () => {
    const ddr = byId('eu').DDR
    expect(lookup(ddr, 1930)[1]).toBe('NA')
    expect(lookup(ddr, 1970)[1]).not.toBe('NA')
    expect(regions.eu.dAll?.DEU).toBeTruthy()
  })
})