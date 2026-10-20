import { useEffect, useMemo, useState } from 'react'
import { Atlas } from './components/Atlas'
import { ApiDiagnostics } from './components/ApiDiagnostics'
import { CountryData } from './components/CountryData'
import { EventStudy } from './components/EventStudy'
import { Neighbors } from './components/Neighbors'
import { Trends } from './components/Trends'
import { Ledger } from './components/Ledger'
import { ChartPanel } from './components/ChartPanel'
import { RegionalBreakdowns } from './components/RegionalBreakdowns'
import * as Tabs from '@radix-ui/react-tabs'
import { motion } from 'motion/react'
import { ingestRows, indicators, type EconomicData, type IndicatorData } from './lib/economics'
import { regionNames, regions } from './lib/regions'

type View = 'overview' | 'economic' | 'ledger' | 'signals' | 'events' | 'spillover' | 'diagnostics'
const minYear = 1876
const maxYear = 2026

export default function App() {
  const params = new URLSearchParams(location.search)
  const [regionKey, setRegionKey] = useState(params.get('region') ?? 'me')
  const region = regions[regionKey] ?? regions.me
  const [year, setYear] = useState(Math.min(maxYear, Math.max(minYear, Number(params.get('year')) || 1979)))
  const [selected, setSelected] = useState(region.defaultSel)
  const [metric, setMetric] = useState('alignment')
  const [view, setView] = useState<View>('overview')
  const [economic, setEconomic] = useState<EconomicData>({})
  const [apiState, setApiState] = useState('not loaded')
  const [links, setLinks] = useState(true)
  const [icons, setIcons] = useState(true)
  const countries = useMemo(() => Object.fromEntries(region.C.map((country) => [country.id, country])), [region])

  useEffect(() => { setSelected(region.defaultSel); setView('overview'); setMetric('alignment') }, [region])

  async function loadEconomics() {
    setApiState('fetching')
    const ids = [...new Set(Object.values(region.ECON_IDS ?? {}))].join(';')
    const next: EconomicData = {}
    const results = await Promise.all(Object.entries(indicators).map(async ([key, meta]) => {
      try {
        const response = await fetch(`https://api.worldbank.org/v2/country/${ids}/indicator/${meta.id}?format=json&date=1960:2026&per_page=20000`)
        const json = await response.json()
        const parsed = json as unknown[]
        const target: IndicatorData = {}
        const count = ingestRows(Array.isArray(parsed) ? parsed[1] as unknown[] : [], target)
        next[key] = target
        return count > 0
      } catch { return false }
    }))
    setEconomic(next)
    setApiState(results.every(Boolean) ? 'loaded' : results.some(Boolean) ? 'partial' : 'unavailable')
  }

  useEffect(() => { void loadEconomics() }, [regionKey])

  function select(id: string) { if (countries[id]) setSelected(id) }
  function changeRegion(next: string) { setRegionKey(next); history.replaceState(null, '', `?region=${next}&year=${year}`) }
  const tabs: Array<[View, string]> = [['overview', 'Atlas'], ['economic', 'Country data'], ['ledger', 'Ledger'], ['signals', 'Trends'], ['events', 'Event study'], ['spillover', 'Neighbors'], ['diagnostics', 'API diagnostics']]

  return <main id="app"><header><div><div className="kicker">LEVANT / Middle East Futures Lab / Geographic reconstruction</div><h1>History, governments & alignment.</h1><div className="muted">Actual Natural Earth country outlines. Consistent political-alignment colors, government symbols, and dated regional links.</div></div><span className="badge">Embedded boundaries · economic layers need internet</span></header>
    <section className="command panel"><label>Region<select value={regionKey} onChange={(event) => changeRegion(event.target.value)}>{Object.entries(regionNames).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label><label>Map layer<select value={metric} onChange={(event) => setMetric(event.target.value)}><option value="alignment">Political alignment</option><option value="gdp">GDP · economic size</option><option value="growth">GDP growth · %</option><option value="unemployment">Unemployment · %</option></select></label><Tabs.Root value={view} onValueChange={(value) => setView(value as View)} className="tabs" orientation="horizontal"><Tabs.List aria-label="Application views">{tabs.map(([key, label]) => <Tabs.Trigger key={key} value={key} className={view === key ? 'active' : ''}>{label}</Tabs.Trigger>)}</Tabs.List></Tabs.Root></section>
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .22 }}>
    {view === 'overview' && <div className="deck"><Atlas region={region} year={year} selected={selected} metric={metric} economic={economic} onSelect={select} onYear={(next) => setYear(Math.min(maxYear, Math.max(minYear, next)))} links={links} icons={icons} onLinks={setLinks} onIcons={setIcons} /><aside className="right"><div className="kicker">Territory inspection · {region.LABELS[selected] ?? selected}</div><RegionalBreakdowns region={region} year={year} selected={selected} onYear={(next) => setYear(Math.min(maxYear, Math.max(minYear, next)))} /><section className="panel pad"><h2>Recorded relationship events</h2>{region.MARKERS.filter((event) => event[2] === year).map((event) => <p className="eventitem" key={event.join('-')}>{event[3]}</p>)}{!region.MARKERS.some((event) => event[2] === year) && <p className="empty">No relationship milestones coded for this year. This does not imply absence of interactions.</p>}</section></aside></div>}
    {view === 'economic' && <CountryData region={region} year={year} selected={selected} economic={economic} onSelect={select} />}
    {view === 'ledger' && <Ledger region={region} year={year} selected={selected} onSelect={select} />}
    {view === 'signals' && <Trends region={region} year={year} economic={economic} />}
    {view === 'signals' && <ChartPanel region={region} economic={economic} selected={selected} metric="growth" title="GDP growth observations" />}
    {view === 'events' && <EventStudy region={region} economic={economic} />}
    {view === 'spillover' && <Neighbors region={region} economic={economic} />}
    {view === 'diagnostics' && <ApiDiagnostics state={apiState} onReload={() => void loadEconomics()} />}
    </motion.div>
  </main>
}
