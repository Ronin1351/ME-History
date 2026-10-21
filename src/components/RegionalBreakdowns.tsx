import type { ReactNode } from 'react'
import type { RecordTuple, RegionData } from '../lib/types'
import { lookup, nameAt, poleOf, TYPES } from '../lib/types'
import { GovIcon } from './GovIcon'

interface Props { region: RegionData; year: number }

const GROUPS = [
  { label: 'Russia / USSR (strong + leaning)', color: '#f2545b', matches: (record: RecordTuple) => record[2] < 0 && !poleOf(record) },
  { label: 'China (strong + leaning)', color: '#b14cff', matches: (record: RecordTuple) => !!poleOf(record) },
  { label: 'Neutral / mixed', color: '#f5d565', matches: (record: RecordTuple) => record[2] === 0 },
  { label: 'West (strong + leaning)', color: '#3d86f0', matches: (record: RecordTuple) => record[2] > 0 },
]

/** Region-wide alignment shares and government-type counts for the selected year. */
export function RegionalBreakdowns({ region, year }: Props) {
  // Territories that are not separate states are excluded from the shares (legacy rule; see each region's shareNote).
  const counted = region.C.filter((item) => item.p.length).map((item) => ({ item, record: lookup(item, year) })).filter(({ record }) => record[1] !== 'NA')
  const total = counted.length
  const excluded = region.C.length - total
  const pct = (count: number) => total ? count / total * 100 : 0
  const namesFor = (predicate: (record: RecordTuple) => boolean) => counted.filter(({ record }) => predicate(record)).map(({ item }) => nameAt(region, item.id, year)).join(', ')
  const governments = Object.entries(counted.reduce<Record<string, number>>((counts, { record }) => { counts[record[1]] = (counts[record[1]] ?? 0) + 1; return counts }, {})).sort((a, b) => b[1] - a[1])
  const method = `Denominator: ${total} separate states in ${year}.${excluded ? ` ${excluded} not-separate territories excluded.` : ''}${region.texts?.shareNote ? ` ${region.texts.shareNote}` : ''}`
  const row = (key: string, label: ReactNode, count: number, names: string, color?: string) => <div className="breakdown-row" key={key}><span>{label}</span><b>{pct(count).toFixed(1)}% <small>{count}/{total}</small></b><div className="bar" title={names || 'None'} aria-label={`${key}: ${names || 'none'}`}><i style={{ width: `${pct(count)}%`, ...(color ? { background: color } : {}) }} /></div></div>

  return <>
    <section className="panel pad">
      <div className="trendhead"><div><h2>Alignment share</h2><p className="tiny">Territory counts by pole. Hover a bar for the countries.</p></div><span className="badge">{year} · {total} states</span></div>
      {GROUPS.map((group) => row(group.label, <><i className="swatch" style={{ background: group.color }} />{group.label}</>, counted.filter(({ record }) => group.matches(record)).length, namesFor(group.matches), group.color))}
      <p className="tiny">{method}</p>
    </section>
    <section className="panel pad">
      <div className="trendhead"><div><h2>Government systems</h2><p className="tiny">Every coded government type. Hover a bar for the countries.</p></div><span className="badge">{year} · {total} states</span></div>
      {governments.map(([key, count]) => row(key, <><GovIcon code={key} />{TYPES[key] ?? `Unmapped code: ${key}`}</>, count, namesFor((record) => record[1] === key)))}
    </section>
  </>
}