export type RecordTuple = [number, string, number, string, ...unknown[]]

export interface CountryRecord {
  id: string
  name: string
  p: RecordTuple[]
  label?: (year: number) => string
  full?: (year: number) => string
  parentAt?: (year: number) => string | null
  [key: string]: unknown
}

export interface MarkerState { id: string; x: number; y: number; lx: number; ly: number }

export interface RegionTexts { kicker?: string; muted?: string; provenance?: string; regionsNote?: string; econFoot?: string; shareNote?: string }

export interface RegionData {
  key: string
  defaultSel: string
  LABELS: Record<string, string>
  ECON_IDS?: Record<string, string>
  C: CountryRecord[]
  EVENTS: [number, string][]
  MARKERS: [string, string, number, string][]
  GEO: { iso: string; name: string; d: string }[]
  CENTERS: Record<string, [number, number]>
  labelPos?: Record<string, [number, number]>
  merge?: { host: string; guest: string }[]
  dAll?: Record<string, string>
  discs?: string[]
  naLabels?: string[]
  markerStates?: MarkerState[]
  texts?: RegionTexts
  [key: string]: unknown
}

export const TYPES: Record<string, string> = {
  IP: 'Imperial province / dependency',
  CO: 'Colonial / mandate / occupied',
  AM: 'Absolute monarchy',
  CM: 'Constitutional monarchy',
  MR: 'Military / one-party / authoritarian',
  TH: 'Theocratic republic',
  DR: 'Competitive republic',
  TR: 'Transitional authority',
  CW: 'Civil war / split control',
  NA: 'Not a separate state',
}

export const LEAN: Record<string, string> = {
  '-2': 'Strong Russia / USSR',
  '-1': 'Russia / USSR-leaning',
  '0': 'Non-aligned / split',
  '1': 'West-leaning',
  '2': 'Strong West',
}

// One red → yellow → blue scale: each leaning shade is a light tint of its pole so 'West-leaning' reads as West.
export const COLORS = ['#f2545b', '#f7a7aa', '#f5d565', '#a9c9f7', '#3d86f0']
export const NOT_SEPARATE_COLOR = '#304151'

export function lookup(country: CountryRecord, year: number): RecordTuple {
  let result = country.p[0]
  for (const record of country.p) {
    if (record[0] <= year) result = record
    else break
  }
  return result
}

export function poleOf(record: RecordTuple | undefined): 'CN' | '' {
  return record?.[5] === 'CN' && record[2] < 0 ? 'CN' : ''
}

export function alignmentText(record: RecordTuple): string {
  if (poleOf(record)) return record[2] === -2 ? 'Strong China' : 'China-leaning'
  return LEAN[String(record[2])] ?? 'Unknown'
}

export function alignmentColor(record: RecordTuple): string {
  if (poleOf(record)) return record[2] === -2 ? '#b14cff' : '#e0a3ff'
  return COLORS[record[2] + 2] ?? '#304151'
}

export function averageObserved(values: Array<number | null>, minimum = 2): number | null {
  const observed = values.filter((value): value is number => value !== null && Number.isFinite(value))
  return observed.length >= minimum ? observed.reduce((sum, value) => sum + value, 0) / observed.length : null
}

export function eventWindowDelta(
  read: (year: number) => number | null,
  eventYear: number,
  offsetsBefore = [-3, -2, -1],
  offsetsAfter = [1, 2, 3],
  minimum = 2,
) {
  const previous = averageObserved(offsetsBefore.map((offset) => read(eventYear + offset)), minimum)
  const following = averageObserved(offsetsAfter.map((offset) => read(eventYear + offset)), minimum)
  return { previous, following, delta: previous === null || following === null ? null : following - previous }
}

export function completeRegionalWindow(
  read: (year: number) => number | null,
  eventYear: number,
  window: number,
) {
  const before = Array.from({ length: window }, (_, index) => read(eventYear - window + index))
  const after = Array.from({ length: window }, (_, index) => read(eventYear + 1 + index))
  const values = [...before, ...after]
  const complete = values.every((value) => value !== null && Number.isFinite(value))
  const mean = (items: number[]) => items.reduce((sum, value) => sum + value, 0) / items.length
  return { before, after, complete, prior: complete ? mean(before as number[]) : null, post: complete ? mean(after as number[]) : null, delta: complete ? mean(after as number[]) - mean(before as number[]) : null }
}

/** A territory that is not a separate state (type NA) takes its parent state's record, as in the legacy atlas. */
export function effectiveRecord(countries: Record<string, CountryRecord>, id: string, year: number): { record: RecordTuple; own: RecordTuple; parent: string | null } | null {
  const country = countries[id]
  if (!country?.p.length) return null
  const own = lookup(country, year)
  if (own[1] !== 'NA') return { record: own, own, parent: null }
  const parent = country.parentAt ? country.parentAt(year) : id === 'ISR' ? 'PSE' : null
  const host = parent ? countries[parent] : undefined
  return host?.p.length ? { record: lookup(host, year), own, parent } : { record: own, own, parent: null }
}

/** Year-specific short name (e.g. "Ottoman" before 1923) when the record provides one. */
export function nameAt(region: RegionData, id: string, year: number): string {
  const country = region.C.find((item) => item.id === id)
  return country?.label?.(year) ?? region.LABELS[id] ?? country?.name ?? id
}