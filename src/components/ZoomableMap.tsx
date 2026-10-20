import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { EconomicData } from '../lib/economics'
import type { RegionData } from '../lib/types'
import { alignmentColor, lookup } from '../lib/types'

interface Props { region: RegionData; year: number; selected: string; metric: string; economic: EconomicData; onSelect: (id: string) => void }
type Ring = [number, number][]
function toLngLat(point: [number, number]): [number, number] { return [point[0] / 1120 * 360 - 180, 90 - point[1] / 690 * 180] }
function pathToRings(path: string): Ring[] {
  const tokens = path.match(/[MLHVZmlhvz]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []
  const rings: Ring[] = []; let ring: Ring = []; let command = ''; let i = 0
  const finish = () => { if (ring.length >= 3) rings.push(ring); ring = [] }
  while (i < tokens.length) {
    if (/^[MLHVZmlhvz]$/.test(tokens[i])) command = tokens[i++]
    if (command.toUpperCase() === 'Z') { finish(); command = ''; continue }
    const relative = command === command.toLowerCase(); const last = ring[ring.length - 1] ?? [0, 0]
    const value = () => Number(tokens[i++] ?? 0); const coordinate = (axis: 0 | 1) => { const next = value(); return relative ? last[axis] + next : next }
    if (command.toUpperCase() === 'M' || command.toUpperCase() === 'L') { if (i + 1 >= tokens.length) break; const point: [number, number] = [coordinate(0), coordinate(1)]; if (command.toUpperCase() === 'M' && ring.length) finish(); ring.push(toLngLat(point)); if (command.toUpperCase() === 'M') command = relative ? 'l' : 'L' }
    else if (command.toUpperCase() === 'H') ring.push(toLngLat([coordinate(0), last[1]]))
    else if (command.toUpperCase() === 'V') ring.push(toLngLat([last[0], coordinate(1)]))
    else { i++; command = '' }
  }
  finish(); return rings
}
function colorFor(region: RegionData, id: string, year: number, metric: string, economic: EconomicData) {
  const country = region.C.find((item) => item.id === id); if (!country) return '#243445'
  if (metric === 'alignment') return alignmentColor(lookup(country, year))
  const iso = region.ECON_IDS?.[id]; const value = iso ? economic[metric]?.[iso]?.[year] : undefined
  if (value === undefined) return '#304151'
  const normalized = metric === 'gdp' ? Math.min(1, Math.max(0, Math.log10(Math.max(1, value)) / 13)) : Math.min(1, Math.max(0, (value + (metric === 'growth' ? 10 : 0)) / (metric === 'growth' ? 20 : 20)))
  return `hsl(${210 - normalized * 170} 70% 45%)`
}
function geoJson(region: RegionData, year: number, metric: string, economic: EconomicData) {
  return { type: 'FeatureCollection', features: region.GEO.flatMap((feature) => { const rings = pathToRings(feature.d); if (!rings.length) return []; return [{ type: 'Feature', properties: { iso: feature.iso, name: feature.name, color: colorFor(region, feature.iso, year, metric, economic) }, geometry: { type: 'Polygon', coordinates: rings } }] }) }
}
export function ZoomableMap({ region, year, selected, metric, economic, onSelect }: Props) {
  const node = useRef<HTMLDivElement>(null); const map = useRef<maplibregl.Map | null>(null); const ready = useRef(false); const selection = useRef(onSelect); selection.current = onSelect
  useEffect(() => {
    if (!node.current) return
    const instance = new maplibregl.Map({ container: node.current, renderWorldCopies: false, attributionControl: false, style: { version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#071320' } }] }, center: [0, 25], zoom: 1 })
    map.current = instance; instance.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right')
    instance.once('load', () => {
      instance.addSource('historical-boundaries', { type: 'geojson', data: geoJson(region, year, metric, economic) as never })
      instance.addLayer({ id: 'historical-fill', type: 'fill', source: 'historical-boundaries', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': .82 } })
      instance.addLayer({ id: 'historical-line', type: 'line', source: 'historical-boundaries', paint: { 'line-color': '#07111d', 'line-width': 1 } })
      instance.addLayer({ id: 'historical-labels', type: 'symbol', source: 'historical-boundaries', layout: { 'text-field': ['get', 'name'], 'text-size': 10, 'text-allow-overlap': false }, paint: { 'text-color': '#f5f9ff', 'text-halo-color': '#071321', 'text-halo-width': 1.5 } })
      instance.on('click', 'historical-fill', (event) => { const iso = event.features?.[0]?.properties?.iso as string | undefined; if (iso) selection.current(iso) })
      instance.on('mouseenter', 'historical-fill', () => { instance.getCanvas().style.cursor = 'pointer' }); instance.on('mouseleave', 'historical-fill', () => { instance.getCanvas().style.cursor = '' })
      const points = Object.values(region.CENTERS).map(toLngLat); const lngs = points.map(([lng]) => lng); const lats = points.map(([, lat]) => lat)
      if (points.length) instance.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 42, maxZoom: 3.8, duration: 0 })
      for (const country of region.C) { const center = region.CENTERS[country.id]; if (!center) continue; new maplibregl.Marker({ color: country.id === selected ? '#eab968' : '#5cc8a8' }).setLngLat(toLngLat(center)).setPopup(new maplibregl.Popup({ offset: 12 }).setText(`${region.LABELS[country.id] ?? country.id} · ${year}`)).addTo(instance).getElement().addEventListener('click', () => selection.current(country.id)) }
      ready.current = true
    })
    return () => { ready.current = false; instance.remove(); map.current = null }
  }, [region])
  useEffect(() => { const source = map.current?.getSource('historical-boundaries') as maplibregl.GeoJSONSource | undefined; if (ready.current && source) source.setData(geoJson(region, year, metric, economic) as never) }, [region, year, metric, economic])
  return <div className="zoom-map" ref={node} aria-label="Zoomable MapLibre regional map" />
}
