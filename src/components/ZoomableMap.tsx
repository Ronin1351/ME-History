import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { RegionData } from '../lib/types'
import { alignmentColor, lookup } from '../lib/types'

interface Props { region: RegionData; year: number; selected: string; onSelect: (id: string) => void }

// The legacy boundary payload is an SVG atlas. This MapLibre layer provides a
// real zoomable geographic interaction without rewriting those preserved paths.
function toLngLat(point: [number, number]): [number, number] {
  return [point[0] / 1120 * 360 - 180, 90 - point[1] / 690 * 180]
}

type Ring = [number, number][]
function pathToRings(path: string): Ring[] {
  const tokens = path.match(/[MLHVZmlhvz]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []
  const rings: Ring[] = []
  let ring: Ring = []
  let command = ''
  let i = 0
  const finish = () => { if (ring.length >= 3) rings.push(ring); ring = [] }
  while (i < tokens.length) {
    if (/^[MLHVZmlhvz]$/.test(tokens[i])) command = tokens[i++]
    if (command.toUpperCase() === 'Z') { finish(); command = ''; continue }
    const relative = command === command.toLowerCase()
    const last = ring[ring.length - 1] ?? [0, 0]
    const next = (axis: 'x' | 'y') => { const value = Number(tokens[i++]); return relative ? last[axis === 'x' ? 0 : 1] + value : value }
    if (command.toUpperCase() === 'M' || command.toUpperCase() === 'L') {
      if (i + 1 >= tokens.length) break
      const x = next('x'); const y = next('y')
      if (command.toUpperCase() === 'M' && ring.length) finish()
      ring.push(toLngLat([x, y]))
      if (command.toUpperCase() === 'M') command = relative ? 'l' : 'L'
    } else if (command.toUpperCase() === 'H') ring.push(toLngLat([next('x'), last[1]]))
    else if (command.toUpperCase() === 'V') ring.push(toLngLat([last[0], next('y')]))
    else { i++; command = '' }
  }
  finish()
  return rings
}

function geoJson(region: RegionData, year: number) {
  return { type: 'FeatureCollection', features: region.GEO.flatMap((feature) => {
    const rings = pathToRings(feature.d)
    if (!rings.length) return []
    const country = region.C.find((item) => item.id === feature.iso)
    return [{ type: 'Feature', properties: { iso: feature.iso, name: feature.name, color: country ? alignmentColor(lookup(country, year)) : '#243445' }, geometry: { type: 'Polygon', coordinates: rings } }]
  }) }
}

export function ZoomableMap({ region, year, selected, onSelect }: Props) {
  const node = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  useEffect(() => {
    if (!node.current) return
    const instance = new maplibregl.Map({
      container: node.current,
      attributionControl: false,
      style: { version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#071320' } }] },
      center: [0, 25], zoom: 1.2,
    })
    map.current = instance
    instance.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right')
    instance.on('load', () => {
      instance.addSource('historical-boundaries', { type: 'geojson', data: geoJson(region, year) as never })
      instance.addLayer({ id: 'historical-fill', type: 'fill', source: 'historical-boundaries', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': .68 } })
      instance.addLayer({ id: 'historical-line', type: 'line', source: 'historical-boundaries', paint: { 'line-color': '#091523', 'line-width': 1 } })
      instance.on('click', 'historical-fill', (event) => { const iso = (event.features?.[0]?.properties?.iso as string | undefined); if (iso) onSelect(iso) })
      instance.on('mouseenter', 'historical-fill', () => { instance.getCanvas().style.cursor = 'pointer' })
      instance.on('mouseleave', 'historical-fill', () => { instance.getCanvas().style.cursor = '' })
      for (const country of region.C) {
        const center = region.CENTERS[country.id]
        if (!center) continue
        const marker = new maplibregl.Marker({ color: country.id === selected ? '#eab968' : '#5cc8a8' })
          .setLngLat(toLngLat(center))
          .setPopup(new maplibregl.Popup({ offset: 12 }).setText(`${region.LABELS[country.id] ?? country.id} · ${year}`))
          .addTo(instance)
        marker.getElement().addEventListener('click', () => onSelect(country.id))
      }
    })
    return () => { instance.remove(); map.current = null }
  }, [region, year, selected, onSelect])
  return <div className="zoom-map" ref={node} aria-label="Zoomable MapLibre regional map" />
}
