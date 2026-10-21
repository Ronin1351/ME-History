import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { EconomicData } from '../lib/economics'
import type { RecordTuple, RegionData } from '../lib/types'
import { alignmentColor, alignmentText, effectiveRecord, lookup, nameAt, NOT_SEPARATE_COLOR, TYPES } from '../lib/types'
import { ECON_CLASSES, econColor, formatEcon, NO_DATA_COLOR } from '../lib/colors'
import { GovBadge, GovIcon, GovSymbols } from './GovIcon'

const W = 1120
const H = 690
const MIN_ZOOM = 0.7
const MAX_ZOOM = 8
const DRAG_THRESHOLD_PX = 4
const GOV_ORDER = ['IP', 'CO', 'AM', 'CM', 'MR', 'TH', 'DR', 'TR', 'CW']

interface Props { region: RegionData; year: number; selected: string; metric: string; economic: EconomicData; links: boolean; icons: boolean; govIcons?: boolean; onSelect: (id: string) => void }
interface Drag { id: number; startX: number; startY: number; x: number; y: number; moved: boolean }

const ALIGNMENT_LEGEND: Array<[string, string]> = [
  ...[-2, -1, 0, 1, 2].map((lean): [string, string] => { const record: RecordTuple = [0, 'MR', lean, '']; return [alignmentColor(record), alignmentText(record)] }),
  ...[-2, -1].map((lean): [string, string] => { const record: RecordTuple = [0, 'MR', lean, '', '', 'CN']; return [alignmentColor(record), alignmentText(record)] }),
  [NOT_SEPARATE_COLOR, 'No separate state / no record'],
]

export function DynamicAtlas({ region, year, selected, metric, economic, links, icons, govIcons = false, onSelect }: Props) {
  const [view, setView] = useState({ zoom: 1, x: 0, y: 0 })
  const [keyOpen, setKeyOpen] = useState(true)
  const svg = useRef<SVGSVGElement>(null)
  const drag = useRef<Drag | null>(null)
  const suppressClick = useRef(false)
  const countries = useMemo(() => Object.fromEntries(region.C.map((country) => [country.id, country])), [region])

  useEffect(() => { setView({ zoom: 1, x: 0, y: 0 }) }, [region])

  /** Converts screen coordinates to viewBox units (handles letterboxing and CSS scaling). */
  const toViewBox = (clientX: number, clientY: number): [number, number] => {
    const matrix = svg.current?.getScreenCTM()
    if (!matrix) return [W / 2, H / 2]
    const point = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse())
    return [point.x, point.y]
  }
  const zoomAt = (px: number, py: number, factor: number) => setView((current) => {
    const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current.zoom * factor))
    const k = zoom / current.zoom
    return { zoom, x: px - (px - current.x) * k, y: py - (py - current.y) * k }
  })

  // React registers wheel listeners as passive, so preventDefault only works on a native listener.
  useEffect(() => {
    const element = svg.current
    if (!element) return
    const onWheel = (event: WheelEvent) => { event.preventDefault(); const [px, py] = toViewBox(event.clientX, event.clientY); zoomAt(px, py, event.deltaY < 0 ? 1.15 : 1 / 1.15) }
    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  }, [])

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) return
    suppressClick.current = false
    drag.current = { id: event.pointerId, startX: event.clientX, startY: event.clientY, x: view.x, y: view.y, moved: false }
  }
  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const current = drag.current
    if (!current || current.id !== event.pointerId) return
    if (!current.moved) {
      if (Math.hypot(event.clientX - current.startX, event.clientY - current.startY) < DRAG_THRESHOLD_PX) return
      current.moved = true
      svg.current?.setPointerCapture(event.pointerId)
    }
    const [ax, ay] = toViewBox(current.startX, current.startY)
    const [bx, by] = toViewBox(event.clientX, event.clientY)
    setView((value) => ({ ...value, x: current.x + bx - ax, y: current.y + by - ay }))
  }
  const endDrag = (event: ReactPointerEvent<SVGSVGElement>) => {
    const current = drag.current
    if (!current || current.id !== event.pointerId) return
    suppressClick.current = current.moved
    drag.current = null
    if (svg.current?.hasPointerCapture(event.pointerId)) svg.current.releasePointerCapture(event.pointerId)
  }
  const choose = (id: string) => { if (suppressClick.current) { suppressClick.current = false; return } onSelect(id) }

  const econValue = (id: string) => { const iso = region.ECON_IDS?.[id]; return iso ? economic[metric]?.[iso]?.[year] : undefined }
  const fill = (id: string) => {
    const resolved = effectiveRecord(countries, id, year)
    if (!resolved) return NO_DATA_COLOR
    if (metric === 'alignment') return resolved.record[1] === 'NA' ? NOT_SEPARATE_COLOR : alignmentColor(resolved.record)
    const value = econValue(id)
    return value === undefined ? NO_DATA_COLOR : econColor(metric, value)
  }
  const describe = (id: string) => {
    const name = nameAt(region, id, year)
    const resolved = effectiveRecord(countries, id, year)
    if (metric !== 'alignment') return `${name}, ${year}: ${formatEcon(metric, econValue(id))}`
    if (!resolved) return `${name}, ${year}`
    const part = resolved.parent ? `, part of ${nameAt(region, resolved.parent, year)}` : ''
    return `${name}, ${year}${part}: ${alignmentText(resolved.record)} · ${TYPES[resolved.record[1]] ?? resolved.record[1]}`
  }
  const govCode = (id: string) => effectiveRecord(countries, id, year)?.record[1] ?? 'NA'

  // One unified host shape while the guest is not a separate state (e.g. Germany outside 1949-1990).
  const mergedPath = new Map<string, string>()
  const hidden = new Set<string>()
  for (const { host, guest } of region.merge ?? []) {
    const guestCountry = countries[guest]
    const unified = region.dAll?.[host]
    if (guestCountry?.p.length && unified && lookup(guestCountry, year)[1] === 'NA') { mergedPath.set(host, unified); hidden.add(guest) }
  }

  const context = region.GEO.filter((feature) => !countries[feature.iso])
  const areas = region.GEO.filter((feature) => countries[feature.iso] && !hidden.has(feature.iso))
  const discs = new Set(region.discs ?? [])
  const naLabels = new Set(region.naLabels ?? [])
  const labelPoints = Object.entries(region.labelPos ?? region.CENTERS).filter(([id]) => {
    const country = countries[id]
    if (!country?.p.length || hidden.has(id)) return false
    return lookup(country, year)[1] !== 'NA' || (id !== 'ISR' && naLabels.has(id))
  })
  const markerStates = (region.markerStates ?? []).filter((marker) => countries[marker.id]?.p.length && lookup(countries[marker.id], year)[1] !== 'NA')
  const disc = (id: string, x: number, y: number) => <circle key={`disc-${id}`} className={`disc ${id === selected ? 'sel' : ''}`} cx={x} cy={y} r={govIcons ? 15 : 7} fill={fill(id)} tabIndex={0} role="button" aria-label={describe(id)} onClick={() => choose(id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelect(id) }}><title>{describe(id)}</title></circle>
  const econLegend = ECON_CLASSES[metric]

  return <div className="dynamic-atlas">
    <div className="atlas-controls"><button onClick={() => zoomAt(W / 2, H / 2, 1.3)} aria-label="Zoom in">+</button><button onClick={() => zoomAt(W / 2, H / 2, 1 / 1.3)} aria-label="Zoom out">−</button><button onClick={() => setView({ zoom: 1, x: 0, y: 0 })} aria-label="Reset map view">Reset</button><span>Wheel to zoom · drag to pan</span></div>
    <div className="map-key" aria-label="Map key">
      <button className="map-key-head" onClick={() => setKeyOpen((open) => !open)} aria-expanded={keyOpen}>{metric === 'alignment' || !econLegend ? 'Alignment' : econLegend.title} · {year} <span aria-hidden="true">{keyOpen ? '▾' : '▸'}</span></button>
      {keyOpen && <>
        {(metric === 'alignment' || !econLegend ? ALIGNMENT_LEGEND : [...econLegend.classes.map((item): [string, string] => [item.color, item.label]), [NO_DATA_COLOR, 'No observation'] as [string, string]]).map(([color, label]) => <span className="map-key-row" key={label}><i style={{ background: color }} />{label}</span>)}
        {govIcons && <div className="map-key-gov">{GOV_ORDER.map((code) => <span className="map-key-row" key={code}><GovIcon code={code} />{TYPES[code]}</span>)}</div>}
      </>}
    </div>
    <svg ref={svg} id="atlas" viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Dynamic historical country atlas" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
      <GovSymbols />
      <g transform={`translate(${view.x} ${view.y}) scale(${view.zoom})`}>
        <g>{context.map((feature, index) => <path key={`ctx-${index}`} d={feature.d} className="context" />)}</g>
        <g>{areas.map((feature, index) => { const id = feature.iso; return <path key={`area-${index}`} d={mergedPath.get(id) ?? feature.d} className={`area ${id === selected ? 'sel' : ''}`} fill={fill(id)} tabIndex={0} role="button" aria-label={describe(id)} onClick={() => choose(id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelect(id) }}><title>{describe(id)}</title></path> })}</g>
        {links && region.MARKERS.filter((event) => event[2] === year).map(([from, to, eventYear, label]) => { const a = region.CENTERS[from], b = region.CENTERS[to]; if (!a || !b) return null; return <g key={`${from}-${to}-${eventYear}`}><path className="eventline" d={`M${a[0]},${a[1]} Q${(a[0] + b[0]) / 2},${(a[1] + b[1]) / 2 - 45} ${b[0]},${b[1]}`} /><title>{label}</title></g> })}
        {labelPoints.map(([id, [x, y]]) => { const center = region.CENTERS[id]; const offset = center && Math.hypot(x - center[0], y - center[1]) > 29; return <g key={`label-${id}`}>{(icons || govIcons) && offset && <path className="guide" d={`M${center[0]},${center[1]} L${x},${y - 7}`} />}{discs.has(id) && disc(id, x, y - 20)}{govIcons && <GovBadge code={govCode(id)} x={x} y={y - 20} />}{icons && <text className="label" x={x} y={y}>{nameAt(region, id, year)}</text>}</g> })}
        {markerStates.map((marker) => <g key={`marker-${marker.id}`}><path className="guide" d={`M${marker.x},${marker.y} L${marker.lx},${marker.ly + 3}`} /><circle className="eventdot" cx={marker.x} cy={marker.y} r={4} />{disc(marker.id, marker.lx, marker.ly - 20)}{govIcons && <GovBadge code={govCode(marker.id)} x={marker.lx} y={marker.ly - 20} />}{icons && <text className="label" x={marker.lx} y={marker.ly}>{nameAt(region, marker.id, year)}</text>}</g>)}
      </g>
    </svg>
    <div className="dynamic-map-note">{region.C.length} coded territories · {year}{region.texts?.regionsNote ? ` · ${region.texts.regionsNote}` : ''}</div>
  </div>
}