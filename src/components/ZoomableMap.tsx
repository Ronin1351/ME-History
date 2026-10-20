import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { RegionData } from '../lib/types'

interface Props { region: RegionData; year: number; selected: string; onSelect: (id: string) => void }

// The legacy boundary payload is an SVG atlas. This MapLibre layer provides a
// real zoomable geographic interaction without rewriting those preserved paths.
function toLngLat(point: [number, number]): [number, number] {
  return [point[0] / 1120 * 360 - 180, 90 - point[1] / 690 * 180]
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
