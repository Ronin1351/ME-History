import { NOT_SEPARATE_COLOR } from './types'

export interface EconClass { below: number; color: string; label: string }
export interface EconLegend { title: string; classes: EconClass[] }

/** Fixed color classes for the economic map layers. Each class covers values up to (not including) `below`. */
export const ECON_CLASSES: Record<string, EconLegend> = {
  gdp: { title: 'GDP, current US$', classes: [
    { below: 1e9, color: '#fcfdbf', label: 'under $1B' },
    { below: 1e10, color: '#feca8d', label: '$1B – 10B' },
    { below: 5e10, color: '#fd9668', label: '$10B – 50B' },
    { below: 2e11, color: '#f1605d', label: '$50B – 200B' },
    { below: 1e12, color: '#cd4071', label: '$200B – 1T' },
    { below: 5e12, color: '#9e2f7f', label: '$1T – 5T' },
    { below: Infinity, color: '#6a1f8a', label: '$5T and over' },
  ] },
  growth: { title: 'Real GDP growth, annual %', classes: [
    { below: -5, color: '#c0392b', label: 'below −5%' },
    { below: -2, color: '#ee8a7e', label: '−5% to −2%' },
    { below: 0, color: '#f6cfc8', label: '−2% to 0%' },
    { below: 2, color: '#d3efdb', label: '0% to 2%' },
    { below: 4, color: '#8fd6a5', label: '2% to 4%' },
    { below: 7, color: '#3bad6c', label: '4% to 7%' },
    { below: Infinity, color: '#137a43', label: '7% and over' },
  ] },
  unemployment: { title: 'Unemployment, % of labor force', classes: [
    { below: 3, color: '#fff5c2', label: 'under 3%' },
    { below: 5, color: '#fed976', label: '3% – 5%' },
    { below: 8, color: '#feb24c', label: '5% – 8%' },
    { below: 12, color: '#fd8d3c', label: '8% – 12%' },
    { below: 20, color: '#e8452c', label: '12% – 20%' },
    { below: Infinity, color: '#a50f26', label: '20% and over' },
  ] },
}

export const NO_DATA_COLOR = NOT_SEPARATE_COLOR

export function econColor(metric: string, value: number): string {
  const legend = ECON_CLASSES[metric]
  if (!legend) return NO_DATA_COLOR
  return (legend.classes.find((item) => value < item.below) ?? legend.classes[legend.classes.length - 1]).color
}

export function formatEcon(metric: string, value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'no observation'
  if (metric === 'gdp') return value >= 1e12 ? `$${(value / 1e12).toFixed(2)}T` : value >= 1e9 ? `$${(value / 1e9).toFixed(1)}B` : `$${(value / 1e6).toFixed(0)}M`
  return `${value.toFixed(1)}%`
}