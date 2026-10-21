import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { EconomicData } from '../lib/economics'
import type { RegionData } from '../lib/types'

interface Props { region: RegionData; economic: EconomicData; selected?: string; metric?: string; title?: string }
const YEARS = Array.from({ length: 2026 - 1960 + 1 }, (_, index) => 1960 + index)

export function ChartPanel({ region, economic, selected = region.defaultSel, metric = 'growth', title = 'Observed economic trend' }: Props) {
  const node = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!node.current) return
    const chart = echarts.init(node.current, undefined, { renderer: 'canvas' })
    const iso = region.ECON_IDS?.[selected]
    const values = iso ? (economic[metric]?.[iso] ?? {}) : {}
    chart.setOption({
      backgroundColor: 'transparent',
      title: { text: title, left: 0, textStyle: { color: '#edf6ff', fontSize: 14 } },
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 20, top: 40, bottom: 25 },
      // Every year is on the axis; missing observations stay as gaps instead of being collapsed or interpolated.
      xAxis: { type: 'category', data: YEARS, axisLabel: { color: '#9eb4c9' } },
      yAxis: { type: 'value', axisLabel: { color: '#9eb4c9' }, splitLine: { lineStyle: { color: '#273b51' } } },
      series: [{ type: 'line', smooth: false, connectNulls: false, showSymbol: false, data: YEARS.map((year) => values[year] ?? null), lineStyle: { color: '#eab968', width: 2 }, areaStyle: { color: 'rgba(234,185,104,.12)' } }],
    })
    const resize = () => chart.resize()
    window.addEventListener('resize', resize)
    return () => { window.removeEventListener('resize', resize); chart.dispose() }
  }, [economic, metric, region, selected, title])
  return <div className="chart-panel"><div ref={node} className="chart" aria-label={title} /></div>
}