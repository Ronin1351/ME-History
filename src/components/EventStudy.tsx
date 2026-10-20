import type { RegionData } from '../lib/types'
import { eventWindowDelta } from '../lib/types'
import type { EconomicData } from '../lib/economics'
interface Props { region: RegionData; economic: EconomicData }
export function EventStudy({ region, economic }: Props) {
  const subject = region.defaultSel
  const iso = region.ECON_IDS?.[subject] ?? ''
  const rows = region.EVENTS.map(([eventYear, label]) => ({ eventYear, label, result: eventWindowDelta((year) => economic.growth?.[iso]?.[year] ?? null, eventYear) }))
  const observed = rows.filter((row) => row.result.delta !== null).length
  return <section className="panel pad"><div className="kicker">Descriptive association</div><h2>Regional event study</h2><p className="desc">Exact calendar-year GDP-growth averages around every recorded event. The event year is excluded; missing observations remain missing.</p><div className="stat"><div><small>Events coded</small><b>{rows.length}</b></div><div><small>Complete comparisons</small><b>{observed}</b></div></div><div className="table-scroll"><table><thead><tr><th>Event year</th><th>Recorded event</th><th>Pre mean</th><th>Post mean</th><th>Difference</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.eventYear}-${row.label}`}><td>{row.eventYear}</td><td>{row.label}</td><td>{format(row.result.previous)}</td><td>{format(row.result.following)}</td><td>{format(row.result.delta)}</td></tr>)}</tbody></table></div><p className="tiny">These are descriptive associations, not causal estimates.</p></section>
}
function format(value: number | null) { return value === null ? 'N/A' : value.toFixed(2) }
