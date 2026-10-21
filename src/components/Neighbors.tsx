import { useState } from 'react'
import type { RegionData } from '../lib/types'
import { completeRegionalWindow, nameAt } from '../lib/types'
import type { EconomicData } from '../lib/economics'

interface Props { region: RegionData; economic: EconomicData }

const FIRST_TESTABLE = 1963 // World Bank growth series start in 1961
const LAST_TESTABLE = 2022 // needs three later years of data

export function Neighbors({ region, economic }: Props) {
  const events = region.EVENTS.map(([year, label], index) => ({ year, label, index })).filter(({ year }) => year >= FIRST_TESTABLE && year <= LAST_TESTABLE)
  const [choice, setChoice] = useState(() => (events.find(({ year }) => year >= 2011) ?? events[0])?.index ?? 0)
  const event = region.EVENTS[choice] ?? region.EVENTS[0]
  if (!event) return null
  const group = region.C.filter((country) => region.ECON_IDS?.[country.id]).sort((a, b) => nameAt(region, a.id, event[0]).localeCompare(nameAt(region, b.id, event[0])))
  const rows = group.map((country) => ({ country, result: completeRegionalWindow((year) => economic.growth?.[region.ECON_IDS?.[country.id] ?? '']?.[year] ?? null, event[0], 3) }))
  const complete = rows.filter(({ result }) => result.complete).length
  return <section className="panel pad">
    <div className="kicker">Regional comparison</div>
    <h2>Every country around one event</h2>
    <label className="field">Event<select value={choice} onChange={(changeEvent) => setChoice(Number(changeEvent.target.value))}>{events.map(({ year, label, index }) => <option key={index} value={index}>{year} · {label}</option>)}</select></label>
    <p className="desc">Real GDP growth of every country in this region, 3 years before vs 3 years after {event[0]}. All six annual observations are required before a comparison is shown.</p>
    <div className="stat"><div><small>Countries with data series</small><b>{group.length}</b></div><div><small>Complete windows</small><b>{complete}/{group.length}</b></div></div>
    <div className="table-scroll"><table><thead><tr><th>Country</th><th>Before average %</th><th>After average %</th><th>Change pp</th><th>Observations</th></tr></thead><tbody>{rows.map(({ country, result }) => <tr key={country.id}><td>{nameAt(region, country.id, event[0])}</td><td>{format(result.prior)}</td><td>{format(result.post)}</td><td>{format(result.delta)}</td><td>{result.complete ? '6/6' : 'Incomplete'}</td></tr>)}</tbody></table></div>
    <p className="tiny">This is descriptive context, not a spillover effect estimate.</p>
  </section>
}

function format(value: number | null) { return value === null ? 'N/A' : value.toFixed(2) }