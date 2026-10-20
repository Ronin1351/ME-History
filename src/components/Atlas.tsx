import type { RegionData } from '../lib/types'
import { alignmentColor, alignmentText } from '../lib/types'
import type { EconomicData } from '../lib/economics'
import { ZoomableMap } from './ZoomableMap'
import { MapLegend } from './MapLegend'

interface Props { region: RegionData; year: number; selected: string; metric: string; economic: EconomicData; onSelect: (id: string) => void; onYear: (year: number) => void; links: boolean; icons: boolean; onLinks: (value: boolean) => void; onIcons: (value: boolean) => void }

export function Atlas({ region, year, selected, metric, economic, onSelect, onYear, links, icons, onLinks, onIcons }: Props) {
  return <section className="panel atlas-panel">
    <div className="toolbar">
      <div className="actions"><div className="year mono">{year}</div><span className="muted">Historical map</span><button onClick={() => onYear(year - 1)} aria-label="Previous year">←</button><button onClick={() => onYear(year + 1)} aria-label="Next year">→</button></div>
      <input type="range" min="1876" max="2026" value={year} onChange={(event) => onYear(Number(event.target.value))} aria-label="Historical year" />
      <div className="actions">{[1914, 1948, 1956, 1979, 1991, 2011, 2025].map((preset) => <button key={preset} onClick={() => onYear(preset)}>{preset}</button>)}<label><input type="checkbox" checked={links} onChange={(event) => onLinks(event.target.checked)} /> Historical relationship events</label><label><input type="checkbox" checked={icons} onChange={(event) => onIcons(event.target.checked)} /> Government icons</label></div>
    </div>
    <div className="dynamic-map-shell"><ZoomableMap region={region} year={year} selected={selected} metric={metric} economic={economic} onSelect={onSelect} /><MapLegend metric={metric} /></div>
    <div className="legend"><span>Alignment:</span>{['-2','-1','0','1','2'].map((lean) => <span className="key" key={lean}><i className="sw" style={{ background: alignmentColor([year, 'MR', Number(lean), '']) }} />{alignmentText([year, 'MR', Number(lean), ''])}</span>)}</div>
    <div className="pad tiny">Actual Natural Earth country outlines with historical classifications. Gray or hatched states represent no separate state or no observation for the selected year. Government icons are retained as a control surface; this phase keeps the original classification behavior.</div>
  </section>
}
