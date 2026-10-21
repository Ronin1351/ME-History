import type { EconomicData } from '../lib/economics'
import type { RegionData } from '../lib/types'
import { alignmentColor, alignmentText, effectiveRecord, nameAt, NOT_SEPARATE_COLOR, TYPES } from '../lib/types'
import { formatEcon } from '../lib/colors'
import { GovIcon } from './GovIcon'

interface Props { region: RegionData; year: number; selected: string; economic: EconomicData; onYear: (year: number) => void; onClose: () => void }

const START = 1876
const END = 2027
const SPARK_FROM = 1960
const SPARK_TO = 2026
const SPARK_W = 300
const SPARK_H = 64
const MIN_TICK_GAP = 8 // percent of the bar between visible year ticks

export function CountryDossier({ region, year, selected, economic, onYear, onClose }: Props) {
  const countries = Object.fromEntries(region.C.map((country) => [country.id, country]))
  const country = countries[selected]
  const resolved = effectiveRecord(countries, selected, year)
  if (!country || !resolved) return null
  const { own, record, parent } = resolved
  const name = country.full?.(year) ?? nameAt(region, selected, year)
  const pos = (value: number) => (value - START) / (END - START) * 100

  const segments = country.p.map((item, index) => ({ item, start: item[0], end: country.p[index + 1]?.[0] ?? END }))
  const ticks: number[] = []
  for (const value of [...segments.map((segment) => segment.start), 2026]) {
    if (!ticks.length || pos(value) - pos(ticks[ticks.length - 1]) >= MIN_TICK_GAP) ticks.push(value)
    else if (value === 2026) ticks[ticks.length - 1] = 2026
  }

  const iso = region.ECON_IDS?.[selected]
  const value = (key: string) => (iso ? economic[key]?.[iso]?.[year] : undefined) ?? null
  const growth = iso ? economic.growth?.[iso] ?? {} : {}
  const growthValues = Object.values(growth)
  const lo = Math.min(-5, ...growthValues)
  const hi = Math.max(5, ...growthValues)
  const x = (y: number) => (y - SPARK_FROM) / (SPARK_TO - SPARK_FROM) * SPARK_W
  const yPos = (v: number) => SPARK_H - 4 - (v - lo) / (hi - lo) * (SPARK_H - 8)
  // Separate line pieces so missing years stay as gaps.
  const pieces: string[] = []
  let piece: string[] = []
  for (let y = SPARK_FROM; y <= SPARK_TO; y++) {
    const v = growth[y]
    if (typeof v === 'number') piece.push(`${x(y).toFixed(1)},${yPos(v).toFixed(1)}`)
    else if (piece.length) { pieces.push(piece.join(' ')); piece = [] }
  }
  if (piece.length) pieces.push(piece.join(' '))

  const events = region.MARKERS.filter(([from, to, eventYear]) => eventYear === year && (from === selected || to === selected))

  return <section className="panel dossier" aria-label={`Country dossier: ${name}`}>
    <div className="dossier-block">
      <div className="dossier-head"><span className="kicker">Country dossier</span><span className="count" title="Political records for this country">{country.p.length}</span><button className="close" onClick={onClose} aria-label="Close dossier">×</button></div>
      <h2 className="dossier-name">{name}</h2>
      <div className="chips">
        <span className="chip"><GovIcon code={own[1]} />{TYPES[own[1]] ?? own[1]}</span>
        <span className="chip"><i className="chip-swatch" style={{ background: record[1] === 'NA' ? NOT_SEPARATE_COLOR : alignmentColor(record) }} />{alignmentText(record)}</span>
        {parent && <span className="chip">Part of {nameAt(region, parent, year)}</span>}
        <span className="chip">Record since {own[0]}</span>
      </div>
      <p className="dossier-text">{own[3]}</p>
    </div>

    <div className="dossier-block">
      <div className="dossier-label">Political timeline · click to jump</div>
      <div className="dossier-timeline">
        {segments.map(({ item, start, end }) => <button key={`${start}-${item[3]}`} className={item === own ? 'on' : ''} style={{ flex: Math.max(1, end - start), background: item[1] === 'NA' ? NOT_SEPARATE_COLOR : alignmentColor(item) }} title={`${start}: ${TYPES[item[1]] ?? item[1]} · ${alignmentText(item)}`} aria-label={`${start}: ${TYPES[item[1]] ?? item[1]}, ${alignmentText(item)}`} onClick={() => onYear(start)} />)}
        <i className="dossier-now" style={{ left: `${pos(year + 0.5)}%` }} aria-hidden="true" />
      </div>
      <div className="dossier-ticks">{ticks.map((tick) => <span key={tick} style={{ left: `${pos(tick === 2026 ? END : tick)}%` }}>{tick}</span>)}</div>
    </div>

    <div className="dossier-block">
      <div className="dossier-label">Economy · {year}</div>
      <div className="econ-cells">
        <div><small>GDP</small><b>{value('gdp') === null ? '—' : formatEcon('gdp', value('gdp'))}</b></div>
        <div><small>Growth</small><b>{value('growth') === null ? '—' : formatEcon('growth', value('growth'))}</b></div>
        <div><small>Unemp.</small><b>{value('unemployment') === null ? '—' : formatEcon('unemployment', value('unemployment'))}</b></div>
      </div>
      {growthValues.length
        ? <svg className="spark" viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} role="img" aria-label={`Real GDP growth ${SPARK_FROM}–${SPARK_TO}`}>
            {lo < 0 && hi > 0 && <line className="spark-zero" x1={0} x2={SPARK_W} y1={yPos(0)} y2={yPos(0)} />}
            {pieces.map((points, index) => <polyline key={index} points={points} />)}
            {year >= SPARK_FROM && year <= SPARK_TO && <line className="spark-year" x1={x(year)} x2={x(year)} y1={0} y2={SPARK_H} />}
          </svg>
        : <p className="tiny">No World Bank growth series for this country.</p>}
      <p className="tiny">Growth {SPARK_FROM}–{SPARK_TO} · dashed line = selected year</p>
    </div>

    <div className="dossier-block">
      <div className="dossier-label">Relationship events involving {nameAt(region, selected, year)} · {year}</div>
      {events.length ? events.map(([from, to, eventYear, label]) => <p className="dossier-event" key={`${from}-${to}-${label}`}><b>{eventYear}</b> {label}</p>) : <p className="tiny">No coded event this year.</p>}
      <p className="tiny">No coded event ≠ no interaction.</p>
    </div>
  </section>
}