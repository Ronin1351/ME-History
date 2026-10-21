import type { RegionData } from '../lib/types'
import { eventWindowDelta, lookup, nameAt } from '../lib/types'
import type { EconomicData } from '../lib/economics'

interface Props { region: RegionData; year: number; economic: EconomicData; selected?: string }

export function Trends({ region, year, economic, selected }: Props) {
  const country = region.C.find((item) => item.id === selected) ?? region.C.find((item) => item.id === region.defaultSel)
  if (!country?.p.length) return null
  const iso = region.ECON_IDS?.[country.id] ?? ''
  const read = (y: number) => economic.growth?.[iso]?.[y] ?? null
  const from = year - 6
  const to = year - 1
  const change = eventWindowDelta(read, year, [-6], [-1], 1)
  return <section className="panel pad">
    <div className="kicker">Structural change laboratory</div>
    <h2>Trends · {nameAt(region, country.id, year)}</h2>
    <p className="desc">Uses only observations before the selected year. The change compares real GDP growth in {from} with {to}.</p>
    <div className="stat">
      <div><small>Political record in force since</small><b>{lookup(country, year)[0]}</b></div>
      <div><small>Growth change {from} → {to}</small><b>{change.delta === null ? 'N/A' : `${change.delta > 0 ? '+' : ''}${change.delta.toFixed(2)} pp`}</b></div>
    </div>
    <p className="tiny">{change.delta === null ? `No World Bank growth figure for ${change.previous === null ? from : to}. ` : ''}No forecast or causal inference is implied by these descriptive signals.</p>
  </section>
}