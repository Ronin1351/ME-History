import { REGION_AF } from '../data/africa-data'
import { REGION_AM } from '../data/americas-data'
import { REGION_AS } from '../data/asia-data'
import { REGION_EU } from '../data/europe-data'
import { REGION_ME } from '../data/middle-east-data'
import type { CountryRecord, RegionData } from './types'

type RawRegion = RegionData & { useME?: true | string[]; useEU?: string[] }

const ME = REGION_ME as unknown as RegionData
const EU = REGION_EU as unknown as RegionData

/** The Middle East geometry keys two states by ISO code while the records use legacy ids (same aliasing as legacy/index.html). */
const ME_GEO_ALIASES: Record<string, string> = { ARE: 'UAE', YEM: 'NYE' }
/** Label positions from the legacy Middle East atlas. */
const ME_LABEL_POS: Record<string, [number, number]> = { TUR: [338, 139], EGY: [214, 350], SAU: [490, 408], IRN: [632, 252], IRQ: [450, 247], SYR: [344, 194], JOR: [318, 281], ISR: [252, 290], LBN: [245, 220], PSE: [189, 258], KWT: [549, 321], QAT: [580, 374], BHR: [680, 365], UAE: [653, 440], OMN: [720, 510], NYE: [500, 556], AFG: [860, 200], PAK: [915, 348] }

const middleEast: RegionData = {
  ...ME,
  GEO: ME.GEO.map((feature) => ME_GEO_ALIASES[feature.iso] ? { ...feature, iso: ME_GEO_ALIASES[feature.iso] } : feature),
  labelPos: ME_LABEL_POS,
  discs: ['BHR'],
  naLabels: [],
  markerStates: [{ id: 'SYE', x: 551, y: 588, lx: 610, ly: 640 }],
}

/** Resolves useME / useEU so countries edited in one region also appear (and are counted) in the regions that reuse them. */
export function withSharedCountries(raw: RawRegion): RegionData {
  const own = new Set(raw.C.map((country) => country.id))
  const fromME = raw.useME ? ME.C.filter((country) => (raw.useME === true || (raw.useME as string[]).includes(country.id)) && !own.has(country.id)) : []
  const fromEU = (raw.useEU ?? []).map((id) => EU.C.find((country) => country.id === id)).filter((country): country is CountryRecord => !!country && !own.has(country.id))
  if (!fromME.length && !fromEU.length) return raw
  const labels: Record<string, string> = {}
  const econ: Record<string, string> = {}
  for (const [source, list] of [[ME, fromME], [EU, fromEU]] as const) {
    for (const country of list) {
      labels[country.id] = source.LABELS[country.id] ?? country.name
      const iso = source.ECON_IDS?.[country.id]
      if (iso) econ[country.id] = iso
    }
  }
  const allME = raw.useME === true
  return {
    ...raw,
    C: [...raw.C, ...fromME, ...fromEU],
    LABELS: { ...labels, ...raw.LABELS },
    ECON_IDS: { ...econ, ...(raw.ECON_IDS ?? {}) },
    EVENTS: allME ? [...raw.EVENTS, ...ME.EVENTS].sort((a, b) => a[0] - b[0]) : raw.EVENTS,
    MARKERS: allME ? [...raw.MARKERS, ...ME.MARKERS] : raw.MARKERS,
  }
}

export const regions: Record<string, RegionData> = {
  me: middleEast,
  eu: EU,
  as: withSharedCountries(REGION_AS as unknown as RawRegion),
  af: withSharedCountries(REGION_AF as unknown as RawRegion),
  am: REGION_AM as unknown as RegionData,
}

export const regionNames: Record<string, string> = { me: 'Middle East', eu: 'Europe', as: 'Asia', af: 'Africa', am: 'Americas' }

export function regionKeyOf(value: string | null | undefined): string {
  return value && value in regions ? value : 'me'
}