import type { RegionData } from '../lib/types'
import { eventWindowDelta, nameAt } from '../lib/types'
import type { EconomicData } from '../lib/economics'

interface Props { region: RegionData; economic: EconomicData; selected?: string }

export function EventStudy({ region, economic, selected }: Props) {
  const subject = region.C.some((item) => item.id === selected) ? selected! : region.defaultSel
  const iso = region.ECON_IDS?.[subject] ?? ''
  const rows = region.EVENTS.map(([eventYear, label]) => ({ eventYear, label, result: eventWindowDelta((year) => economic.growth?.[iso]?.[year] ?? null, eventYear) }))
  const observed = rows.filter((row) => row.result.delta !== null).length
  return <section className="panel pad">
    <div className="kicker">Descriptive association</div>
    <h2>Event study · {nameAt(region, subject, 2026)}</h2>
    <p className="desc">Average real GDP growth of the selected country in the 3 years before and after each recorded regional event. The event year is excluded; at least 2 observations per side are required. World Bank data starts in 1960, so earlier events show N/A.</p>
    <div className="stat"><div><small>Events coded</small><b>{rows.length}</b></div><div><small>Complete comparisons</small><b>{observed}</b></div></div>
    <div className="table-scroll"><table><thead><tr><th>Event year</th><th>Recorded event</th><th>Pre mean %</th><th>Post mean %</th><th>Difference pp</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.eventYear}-${index}`}><td>{row.eventYear}</td><td>{row.label}</td><td>{format(row.result.previous)}</td><td>{format(row.result.following)}</td><td>{format(row.result.delta)}</td></tr>)}</tbody></table></div>
    <p className="tiny">These are descriptive associations, not causal estimates. Select another country on the map to change the subject.</p>
  </section>
}

function format(value: number | null) { return value === null ? 'N/A' : value.toFixed(2) }