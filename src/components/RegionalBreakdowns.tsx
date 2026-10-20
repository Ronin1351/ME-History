import type { RecordTuple, RegionData } from '../lib/types'
import { alignmentText, lookup, poleOf, TYPES } from '../lib/types'

interface Props { region: RegionData; year: number; selected: string; onYear: (year: number) => void }
export function RegionalBreakdowns({ region, year, selected, onYear }: Props) {
  const country = region.C.find((item) => item.id === selected) ?? region.C[0]
  const records = country?.p ?? []
  const selectedRecord = lookup(country, year)
  const timeline = records.map((record, index) => ({ record, start: record[0], end: records[index + 1]?.[0] ?? 2027 }))
  const current = region.C.map((item) => lookup(item, year))
  const groups = [
    { label: 'Russia / USSR-leaning', color: '#f2545b', matches: (record: RecordTuple) => record[2] < 0 && !poleOf(record) },
    { label: 'China-leaning', color: '#b14cff', matches: (record: RecordTuple) => !!poleOf(record) },
    { label: 'Neutral / mixed', color: '#f5d565', matches: (record: RecordTuple) => record[2] === 0 },
    { label: 'West-leaning', color: '#3d86f0', matches: (record: RecordTuple) => record[2] > 0 },
  ]
  const governments = Object.entries(current.reduce<Record<string, number>>((counts, record) => { counts[record[1]] = (counts[record[1]] ?? 0) + 1; return counts }, {})).sort((a, b) => b[1] - a[1])
  const namesFor = (predicate: (record: RecordTuple) => boolean) => region.C.filter((country, index) => predicate(current[index])).map((country) => region.LABELS[country.id] ?? country.name ?? country.id).join(', ')
  return <><section className="panel pad"><p className="tiny">{selectedRecord[3]}</p><div className="stat"><div><small>Political system</small><b>{TYPES[selectedRecord[1]] ?? selectedRecord[1]}</b></div><div><small>Alignment</small><b>{alignmentText(selectedRecord)}</b></div></div><h2 className="section-title">Selected territory timeline</h2><div className="timeline">{timeline.map(({ record, start, end }) => <button key={`${start}-${record[3]}`} className="timeline-segment" title={`${start}: ${record[3]}`} style={{ flex: Math.max(1, end - start), background: record[2] === 0 ? '#f5d565' : poleOf(record) ? '#b14cff' : record[2] < 0 ? '#f2545b' : '#3d86f0' }} onClick={() => onYear(start)} />)}</div><p className="tiny">Click a segment to jump to that period.</p></section><section className="panel pad"><div className="trendhead"><div><h2>Alignment share</h2><p className="tiny">Grouped by Russia / USSR, China, neutral/mixed, and West using territory counts. Hover a bar for the countries.</p></div><span className="badge">{year} · {region.C.length} territories</span></div>{groups.map((group) => { const count = current.filter(group.matches).length; const pct = region.C.length ? count / region.C.length * 100 : 0; const names = namesFor(group.matches); return <div className="breakdown-row" key={group.label}><span><i className="swatch" style={{ background: group.color }} />{group.label}</span><b>{pct.toFixed(1)}% <small>{count}/{region.C.length}</small></b><div className="bar" title={names || 'No countries in this category'} aria-label={`${group.label}: ${names || 'none'}`}><i style={{ width: `${pct}%`, background: group.color }} /></div></div>})}</section><section className="panel pad"><div className="trendhead"><div><h2>Government systems</h2><p className="tiny">Every coded government type is shown. Hover a bar for the countries.</p></div><span className="badge">{year} · {region.C.length} territories</span></div>{governments.map(([key, count]) => { const names = namesFor((record) => record[1] === key); return <div className="breakdown-row" key={key}><span>{TYPES[key] ?? `Unmapped code: ${key}`}</span><b>{(count / Math.max(1, region.C.length) * 100).toFixed(1)}% <small>{count}/{region.C.length}</small></b><div className="bar" title={names || 'No countries in this category'} aria-label={`${TYPES[key] ?? key}: ${names || 'none'}`}><i style={{ width: `${count / Math.max(1, region.C.length) * 100}%` }} /></div></div>})}</section></>
}
