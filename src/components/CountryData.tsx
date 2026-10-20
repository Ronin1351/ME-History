import type { RegionData } from '../lib/types'
import { lookup, TYPES, alignmentText } from '../lib/types'
import type { EconomicData } from '../lib/economics'
interface Props { region: RegionData; year: number; selected: string; economic: EconomicData; onSelect: (id: string) => void }
export function CountryData({ region, year, selected, economic, onSelect }: Props) {
  const econIds = region.ECON_IDS ?? {}
  const value = (id: string, key: string) => { const iso = econIds[id]; const v = economic[key]?.[iso]?.[year]; return Number.isFinite(v) ? v : null }
  return <section className="panel pad"><div className="trendhead"><div><div className="kicker">Data → color → map</div><h2>Economic country comparison <span className="gold">{year}</span></h2><p className="tiny">Exact-year World Bank observations. Missing values remain missing; nothing is carried forward.</p></div><span className="badge">World Bank</span></div><div className="table-scroll"><table><thead><tr><th>Country</th><th>GDP current US$</th><th>GDP growth %</th><th>Unemployment %</th></tr></thead><tbody>{Object.keys(econIds).map((id) => <tr key={id} className={id === selected ? 'active' : ''} tabIndex={0} onClick={() => onSelect(id)}><td>{region.LABELS[id] ?? id}</td><td>{format(value(id, 'gdp'), 'gdp')}</td><td>{format(value(id, 'growth'), 'growth')}</td><td>{format(value(id, 'unemployment'), 'unemployment')}</td></tr>)}</tbody></table></div><p className="tiny">Political record: {TYPES[lookup(region.C.find((country) => country.id === selected)!, year)[1]]} · {alignmentText(lookup(region.C.find((country) => country.id === selected)!, year))}</p></section>
}
function format(value: number | null, key: string) { if (value === null) return <span className="missing">No data</span>; if (key === 'gdp') return `$${(value / 1e9).toFixed(2)}B`; return `${value.toFixed(2)}%` }
