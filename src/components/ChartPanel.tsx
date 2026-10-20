import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { EconomicData } from '../lib/economics'
import type { RegionData } from '../lib/types'

interface Props { region: RegionData; economic: EconomicData; selected?: string; metric?: string; title?: string }
export function ChartPanel({ region, economic, selected = region.defaultSel, metric = 'growth', title = 'Observed economic trend' }: Props) {
  const node = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!node.current) return
    const chart = echarts.init(node.current, undefined, { renderer: 'canvas' })
    const iso = region.ECON_IDS?.[selected]
    const values = iso ? (economic[metric]?.[iso] ?? {}) : {}
    const years = Object.keys(values).map(Number).sort((a, b) => a - b)
    chart.setOption({
      backgroundColor: 'transparent',
      title: { text: title, left: 0, textStyle: { color: '#edf6ff', fontSize: 14 } },
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 20, top: 40, bottom: 25 },
      xAxis: { type: 'category', data: years, axisLabel: { color: '#9eb4c9' } },
      yAxis: { type: 'value', axisLabel: { color: '#9eb4c9' }, splitLine: { lineStyle: { color: '#273b51' } } },
      series: [{ type: 'line', smooth: true, showSymbol: false, data: years.map((year) => values[year]), lineStyle: { color: '#eab968', width: 2 }, areaStyle: { color: 'rgba(234,185,104,.12)' } }],
    })
    const resize = () => chart.resize()
    window.addEventListener('resize', resize)
    return () => { window.removeEventListener('resize', resize); chart.dispose() }
  }, [economic, metric, region, selected, title])
  return <div className="chart-panel"><div ref={node} className="chart" aria-label={title} /></div>
}
