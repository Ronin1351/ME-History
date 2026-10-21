import type { RegionData } from '../lib/types'
import { alignmentText, lookup, nameAt, TYPES } from '../lib/types'

interface Props { region: RegionData; year: number; selected: string; onSelect: (id: string) => void }

export function Ledger({ region, year, selected, onSelect }: Props) {
  const rows = region.C.flatMap((country) => country.p.map((record) => ({ id: country.id, record }))).sort((a, b) => b.record[0] - a.record[0])
  const selectedCountry = region.C.find((country) => country.id === selected)
  const current = selectedCountry?.p.length ? lookup(selectedCountry, year) : undefined
  return <section className="panel pad ledger">
    <div className="trendhead"><div><div className="kicker">Historical ledger</div><h2>Country-year political records</h2><p className="tiny">Every preserved record is shown; no historical entry is synthesized. The highlighted row is the selected country's record in force in {year}.</p></div><span className="badge">{rows.length} records</span></div>
    <div className="table-scroll"><table><thead><tr><th>Year</th><th>Country</th><th>System</th><th>Alignment</th><th>Narrative</th></tr></thead><tbody>{rows.map(({ id, record }, index) => <tr key={`${id}-${record[0]}-${index}`} className={record === current ? 'active' : ''} tabIndex={0} onClick={() => onSelect(id)} onKeyDown={(event) => { if (event.key === 'Enter') onSelect(id) }}><td>{record[0]}</td><td>{nameAt(region, id, record[0])}</td><td>{TYPES[record[1]] ?? record[1]}</td><td>{alignmentText(record)}</td><td>{record[3]}</td></tr>)}</tbody></table></div>
    <p className="tiny">Selected-year lookup: {current ? TYPES[current[1]] ?? current[1] : 'No record'}.</p>
  </section>
}