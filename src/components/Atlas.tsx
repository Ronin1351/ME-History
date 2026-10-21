import type { RegionData } from '../lib/types'
import type { EconomicData } from '../lib/economics'
import { DynamicAtlas } from './DynamicAtlas'

interface Props { region: RegionData; year: number; selected: string; metric: string; economic: EconomicData; onSelect: (id: string) => void; onYear: (year: number) => void; links: boolean; icons: boolean; onLinks: (value: boolean) => void; onIcons: (value: boolean) => void; govIcons?: boolean; onGovIcons?: (value: boolean) => void }

const DEFAULT_NOTE = 'Country outlines are modern generalized shapes, not historical borders. Territories that were not separate states take the color of the state they belonged to. Classification: provisional and awaiting source-level verification.'

export function Atlas({ region, year, selected, metric, economic, onSelect, onYear, links, icons, onLinks, onIcons, govIcons = false, onGovIcons }: Props) {
  return <section className="panel atlas-panel">
    <div className="toolbar">
      <div className="actions"><div className="year mono">{year}</div><span className="muted">Historical map</span><button onClick={() => onYear(year - 1)} aria-label="Previous year">←</button><button onClick={() => onYear(year + 1)} aria-label="Next year">→</button></div>
      <input type="range" min="1876" max="2026" value={year} onChange={(event) => onYear(Number(event.target.value))} aria-label="Historical year" />
      <div className="actions">
        {[1914, 1948, 1956, 1979, 1991, 2011, 2026].map((preset) => <button key={preset} className={preset === year ? 'active' : ''} onClick={() => onYear(preset)}>{preset}</button>)}
        <label><input type="checkbox" checked={links} onChange={(event) => onLinks(event.target.checked)} /> Relationship events</label>
        <label><input type="checkbox" checked={icons} onChange={(event) => onIcons(event.target.checked)} /> Country labels</label>
        {onGovIcons && <label><input type="checkbox" checked={govIcons} onChange={(event) => onGovIcons(event.target.checked)} /> Government icons</label>}
      </div>
    </div>
    <DynamicAtlas region={region} year={year} selected={selected} metric={metric} economic={economic} links={links} icons={icons} govIcons={govIcons} onSelect={onSelect} />
    <div className="pad tiny">{region.texts?.provenance ?? DEFAULT_NOTE}</div>
  </section>
}