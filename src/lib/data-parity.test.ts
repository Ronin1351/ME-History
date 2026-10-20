import { describe, expect, it } from 'vitest'
import { regions } from './regions'

describe('regional data inventory', () => {
  it('retains every country-year record from the four converted regional datasets', () => {
    expect(regions.af.C.length).toBe(54)
    expect(regions.af.C.reduce((sum, country) => sum + country.p.length, 0)).toBe(356)
    expect(regions.am.C.length).toBe(35)
    expect(regions.am.C.reduce((sum, country) => sum + country.p.length, 0)).toBe(195)
    expect(regions.as.C.length).toBe(33)
    expect(regions.as.C.reduce((sum, country) => sum + country.p.length, 0)).toBe(245)
    expect(regions.eu.C.length).toBe(41)
    expect(regions.eu.C.reduce((sum, country) => sum + country.p.length, 0)).toBe(321)
  })

  it('retains regional comparisons and historical geography payloads', () => {
    expect(regions.as.merge).toHaveLength(1)
    expect(regions.eu.merge).toHaveLength(1)
    expect(regions.as.markerStates).toHaveLength(1)
    expect(regions.af.GEO).toHaveLength(81)
    expect(regions.eu.GEO).toHaveLength(62)
  })

  it('retains the extracted Middle East records and geography', () => {
    expect(regions.me.C.length).toBe(19)
    expect(regions.me.C.reduce((sum, country) => sum + country.p.length, 0)).toBe(180)
    expect(regions.me.EVENTS).toHaveLength(44)
    expect(regions.me.MARKERS).toHaveLength(10)
    expect(regions.me.GEO).toHaveLength(33)
  })
})
