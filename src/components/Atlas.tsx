import type { RegionData } from '../lib/types'
import { alignmentColor, alignmentText, lookup } from '../lib/types'
import type { EconomicData } from '../lib/economics'
import { ZoomableMap } from './ZoomableMap'

interface Props { region: RegionData; year: number; selected: string; metric: string; economic: EconomicData; onSelect: (id: string) => void; onYear: (year: number) => void; links: boolean; icons: boolean; onLinks: (value: boolean) => void; onIcons: (value: boolean) => void }

export function Atlas({ region, year, selected, metric, economic, onSelect, onYear, links, icons, onLinks, onIcons }: Props) {
  const countries = new Map(region.C.map((country) => [country.id, country]))
  const fill = (id: string) => {
    const country = countries.get(id)
    if (!country) return '#243445'
    const record = lookup(country, year)
    if (metric === 'alignment') return record[1] === 'NA' ? '#304151' : alignmentColor(record)
    const iso = region.ECON_IDS?.[id]
    const value = iso ? economic[metric]?.[iso]?.[year] : undefined
    if (value === undefined) return '#304151'
    const normalized = metric === 'gdp' ? Math.min(1, Math.max(0, Math.log10(Math.max(1, value)) / 13)) : Math.min(1, Math.max(0, (value + (metric === 'growth' ? 10 : 0)) / (metric === 'growth' ? 20 : 20)))
    const hue = 210 - normalized * 170
    return `hsl(${hue} 70% 45%)`
  }
  const shownEvents = links ? region.MARKERS.filter((event) => event[2] === year) : []
  return <section className="panel atlas-panel">
    <div className="toolbar">
      <div className="actions"><div className="year mono">{year}</div><span className="muted">Historical map</span><button onClick={() => onYear(year - 1)} aria-label="Previous year">←</button><button onClick={() => onYear(year + 1)} aria-label="Next year">→</button></div>
      <input type="range" min="1876" max="2026" value={year} onChange={(event) => onYear(Number(event.target.value))} aria-label="Historical year" />
      <div className="actions">{[1914, 1948, 1956, 1979, 1991, 2011, 2025].map((preset) => <button key={preset} onClick={() => onYear(preset)}>{preset}</button>)}<label><input type="checkbox" checked={links} onChange={(event) => onLinks(event.target.checked)} /> Historical relationship events</label><label><input type="checkbox" checked={icons} onChange={(event) => onIcons(event.target.checked)} /> Government icons</label></div>
    </div>
    <div className="mapFrame"><svg id="atlas" viewBox="0 0 1120 690" role="group" aria-label="Historical country atlas">
      <defs><pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#253443" /><rect width="2" height="8" fill="#7b90a0" /></pattern></defs>
      <g>{region.GEO.map((feature) => { const id = countries.has(feature.iso) ? feature.iso : '' ; return <path key={`${feature.iso}-${feature.d}`} d={feature.d} className={id ? `area ${id === selected ? 'sel' : ''}` : 'context'} fill={id ? fill(id) : undefined} tabIndex={id ? 0 : undefined} role={id ? 'button' : undefined} aria-label={id ? `${region.LABELS[id] ?? id}, ${year}` : undefined} onClick={id ? () => onSelect(id) : undefined} onKeyDown={id ? (event) => { if (event.key === 'Enter' || event.key === ' ') onSelect(id) } : undefined} /> })}</g>
      {shownEvents.map(([from, to, eventYear, label]) => { const a = region.CENTERS[from], b = region.CENTERS[to]; if (!a || !b) return null; return <g key={`${from}-${to}-${eventYear}`}><path className="eventline" d={`M${a[0]},${a[1]} Q${(a[0] + b[0]) / 2},${(a[1] + b[1]) / 2 - 45} ${b[0]},${b[1]}`} /><title>{label}</title></g> })}
    </svg></div>
    <ZoomableMap region={region} year={year} selected={selected} onSelect={onSelect} />
    <div className="legend"><span>Alignment:</span>{['-2','-1','0','1','2'].map((lean) => <span className="key" key={lean}><i className="sw" style={{ background: alignmentColor([year, 'MR', Number(lean), '']) }} />{alignmentText([year, 'MR', Number(lean), ''])}</span>)}</div>
    <div className="pad tiny">Actual Natural Earth country outlines with historical classifications. Gray or hatched states represent no separate state or no observation for the selected year. Government icons are retained as a control surface; this phase keeps the original classification behavior.</div>
  </section>
}
