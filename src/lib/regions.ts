import { REGION_AF } from '../data/africa-data'
import { REGION_AM } from '../data/americas-data'
import { REGION_AS } from '../data/asia-data'
import { REGION_EU } from '../data/europe-data'
import { REGION_ME } from '../data/middle-east-data'
import type { RegionData } from './types'

export const regions: Record<string, RegionData> = {
  me: REGION_ME as unknown as RegionData,
  eu: REGION_EU as unknown as RegionData,
  as: {
    ...(REGION_AS as unknown as RegionData),
    key: 'as',
    C: [...(REGION_AS.C ?? []), ...(REGION_ME.C ?? [])],
    EVENTS: [...(REGION_AS.EVENTS ?? []), ...(REGION_ME.EVENTS ?? [])].sort((a, b) => a[0] - b[0]),
    MARKERS: [...(REGION_AS.MARKERS ?? []), ...(REGION_ME.MARKERS ?? [])],
    GEO: [...(REGION_AS.GEO ?? [])],
    CENTERS: { ...(REGION_AS.CENTERS ?? {}) },
    LABELS: { ...(REGION_AS.LABELS ?? {}) },
    ECON_IDS: { ...(REGION_AS.ECON_IDS ?? {}) },
  } as unknown as RegionData,
  af: REGION_AF as unknown as RegionData,
  am: REGION_AM as unknown as RegionData,
}

export const regionNames: Record<string, string> = { me: 'Middle East', eu: 'Europe', as: 'Asia', af: 'Africa', am: 'Americas' }
