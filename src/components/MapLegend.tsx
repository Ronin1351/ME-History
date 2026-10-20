interface Props { metric: string }
export function MapLegend({ metric }: Props) {
  const items = metric === 'alignment'
    ? [['#f2545b', 'East-leaning'], ['#f5d565', 'Neutral / mixed'], ['#3d86f0', 'West-leaning']]
    : [['#304151', 'No exact-year observation'], ['#4aa6d8', 'Lower observed value'], ['#eab968', 'Higher observed value']]
  return <aside className="map-legend" aria-label="Map legend"><b>{metric === 'alignment' ? 'Alignment' : metric}</b>{items.map(([color, label]) => <span key={label}><i style={{ background: color }} />{label}</span>)}<small>Exact selected-year values only.</small></aside>
}
