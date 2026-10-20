import { describe, expect, it } from 'vitest'
import { regions } from './regions'

describe('regional data inventory', () => {
  it('retains every country-year record from the four converted regional datasets', () => {
    expect(regions.af.C.length).toBe(54)
    expect(regions.af.C.reduce((sum, country) => sum + country.p.length, 0)).toBe(356)
    expect(regions.am.C.length).toBe(35)
    expect(regions.am.C.reduce((sum, country) => sum + country.p.length, 0)).toBe(195)
    expect(regions.as.C.length).toBe(52)
    expect(regions.as.C.reduce((sum, country) => sum + country.p.length, 0)).toBe(425)
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

  it('keeps North American records, European narratives, and Middle East coverage in Asia', () => {
    for (const id of ['USA', 'CAN']) {
      const country = regions.am.C.find((item) => item.id === id)
      expect(country?.p.length).toBeGreaterThan(0)
      expect(regions.am.LABELS[id]).toBeTruthy()
    }
    expect(regions.eu.C.every((country) => country.p.length > 0)).toBe(true)
    for (const id of ['IRN', 'IRQ', 'SAU', 'ISR', 'TUR', 'EGY']) {
      expect(regions.as.C.some((country) => country.id === id)).toBe(true)
    }
    const interactiveIsos = regions.as.GEO.filter((feature) => feature.iso !== 'CTX').map((feature) => feature.iso)
    expect(new Set(interactiveIsos).size).toBe(interactiveIsos.length)
  })
})
