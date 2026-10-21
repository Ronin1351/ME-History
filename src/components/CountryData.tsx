import type { RegionData } from '../lib/types'
import { alignmentText, effectiveRecord, nameAt, TYPES } from '../lib/types'
import type { EconomicData } from '../lib/economics'

interface Props { region: RegionData; year: number; selected: string; economic: EconomicData; onSelect: (id: string) => void }
const KEYS = ['gdp', 'growth', 'unemployment'] as const

export function CountryData({ region, year, selected, economic, onSelect }: Props) {
  const econIds = region.ECON_IDS ?? {}
  const countries = Object.fromEntries(region.C.map((country) => [country.id, country]))
  const ids = Object.keys(econIds).filter((id) => countries[id])
  const value = (id: string, key: string) => { const iso = econIds[id]; const v = iso ? economic[key]?.[iso]?.[year] : undefined; return typeof v === 'number' && Number.isFinite(v) ? v : null }
  const observed = ids.flatMap((id) => KEYS.map((key) => value(id, key))).filter((v): v is number => v !== null).length
  const current = KEYS.filter((key) => value(selected, key) !== null).length
  const resolved = effectiveRecord(countries, selected, year)
  return <section className="panel pad">
    <div className="trendhead"><div><div className="kicker">Data → color → map</div><h2>Economic country comparison <span className="gold">{year}</span></h2><p className="tiny">Exact-year World Bank observations. Missing values remain missing; nothing is carried forward.</p></div><span className="badge">World Bank</span></div>
    <div className="stat stat-four"><div><small>Countries with data series</small><b>{ids.length}</b></div><div><small>Selected indicators</small><b>{current}/3</b></div><div><small>Observed cells</small><b>{observed}</b></div><div><small>Coverage</small><b>{ids.length ? `${Math.round(observed / (ids.length * 3) * 100)}%` : '0%'}</b></div></div>
    <div className="table-scroll"><table><thead><tr><th>Country</th><th>GDP current US$</th><th>GDP growth %</th><th>Unemployment %</th></tr></thead><tbody>{ids.map((id) => <tr key={id} className={id === selected ? 'active' : ''} tabIndex={0} onClick={() => onSelect(id)} onKeyDown={(event) => { if (event.key === 'Enter') onSelect(id) }}><td>{nameAt(region, id, year)}</td><td>{format(value(id, 'gdp'), 'gdp')}</td><td>{format(value(id, 'growth'), 'growth')}</td><td>{format(value(id, 'unemployment'), 'unemployment')}</td></tr>)}</tbody></table></div>
    {resolved && <p className="tiny">Political record for {nameAt(region, selected, year)}: {TYPES[resolved.own[1]] ?? resolved.own[1]} · {alignmentText(resolved.record)}{resolved.parent ? ` (as part of ${nameAt(region, resolved.parent, year)})` : ''}{region.texts?.econFoot ? ` · ${region.texts.econFoot}` : ''}</p>}
  </section>
}

function format(value: number | null, key: string) { if (value === null) return <span className="missing">No data</span>; if (key === 'gdp') return `$${(value / 1e9).toFixed(2)}B`; return `${value.toFixed(2)}%` }