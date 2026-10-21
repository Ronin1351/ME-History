import { useEffect, useMemo, useRef, useState } from 'react'
import { Atlas } from './components/Atlas'
import { ApiDiagnostics } from './components/ApiDiagnostics'
import { CountryData } from './components/CountryData'
import { CountryDossier } from './components/CountryDossier'
import { CountrySearch } from './components/CountrySearch'
import { EventStudy } from './components/EventStudy'
import { Neighbors } from './components/Neighbors'
import { Trends } from './components/Trends'
import { Ledger } from './components/Ledger'
import { ChartPanel } from './components/ChartPanel'
import { RegionalBreakdowns } from './components/RegionalBreakdowns'
import * as Tabs from '@radix-ui/react-tabs'
import { motion } from 'motion/react'
import { loadIndicators, type EconomicData } from './lib/economics'
import { regionKeyOf, regionNames, regions } from './lib/regions'
import { nameAt } from './lib/types'

type View = 'overview' | 'economic' | 'ledger' | 'signals' | 'events' | 'spillover' | 'diagnostics'
const minYear = 1876
const maxYear = 2026
const clampYear = (value: number) => Math.min(maxYear, Math.max(minYear, Math.round(value)))
const DEFAULT_KICKER = 'LEVANT / Middle East Futures Lab / Geographic reconstruction'
const DEFAULT_MUTED = 'Country outlines with consistent political-alignment colors, government types, and dated regional links.'
const TABS: Array<[View, string]> = [['overview', 'Atlas'], ['economic', 'Country data'], ['ledger', 'Ledger'], ['signals', 'Trends'], ['events', 'Event study'], ['spillover', 'Regional comparison'], ['diagnostics', 'API diagnostics']]
const LAYERS: Array<[string, string]> = [['alignment', 'Political alignment'], ['gdp', 'GDP · economic size'], ['growth', 'GDP growth · %'], ['unemployment', 'Unemployment · %']]

export default function App() {
  const params = useMemo(() => new URLSearchParams(location.search), [])
  const [regionKey, setRegionKey] = useState(() => regionKeyOf(params.get('region')))
  const region = regions[regionKey]
  const [year, setYearState] = useState(() => clampYear(Number(params.get('year')) || 1979))
  const [selected, setSelected] = useState(region.defaultSel)
  const [dossierOpen, setDossierOpen] = useState(false)
  const [metric, setMetric] = useState('alignment')
  const [view, setView] = useState<View>('overview')
  const [economic, setEconomic] = useState<EconomicData>({})
  const [apiState, setApiState] = useState('not loaded')
  const [links, setLinks] = useState(true)
  const [icons, setIcons] = useState(true)
  const [govIcons, setGovIcons] = useState(true)
  const [reloadToken, setReloadToken] = useState(0)
  const forceReload = useRef(false)
  const countries = useMemo(() => Object.fromEntries(region.C.map((country) => [country.id, country])), [region])
  // Never render with an id from another region (this caused the region-switch crash).
  const active = countries[selected] ? selected : region.defaultSel
  const setYear = (next: number) => setYearState(clampYear(next))

  useEffect(() => { history.replaceState(null, '', `?region=${regionKey}&year=${year}`) }, [regionKey, year])

  useEffect(() => {
    const controller = new AbortController()
    const force = forceReload.current
    forceReload.current = false
    setApiState('fetching')
    loadIndicators(Object.values(region.ECON_IDS ?? {}), controller.signal, force)
      .then((result) => {
        setEconomic(result.data)
        setApiState(result.cached ? `${result.state} (cached)` : result.state === 'partial' ? `partial: ${result.failed.join(', ')} missing` : result.state)
      })
      .catch((error: Error) => { if (error.name !== 'AbortError') setApiState('unavailable') })
    return () => controller.abort()
  }, [region, reloadToken])

  function select(id: string) { if (countries[id]) { setSelected(id); setDossierOpen(true) } }
  function changeRegion(next: string) { const key = regionKeyOf(next); setRegionKey(key); setSelected(regions[key].defaultSel); setDossierOpen(false) }
  function jumpTo(key: string, id: string) { setRegionKey(regionKeyOf(key)); setSelected(id); setDossierOpen(true); setView('overview') }
  function reload() { forceReload.current = true; setReloadToken((value) => value + 1) }
  const viewLabel = TABS.find(([key]) => key === view)?.[1] ?? view

  return <main id="app">
    <header><div><div className="kicker">{region.texts?.kicker ?? DEFAULT_KICKER}</div><h1>History, governments & alignment.</h1><div className="muted">{region.texts?.muted ?? DEFAULT_MUTED}</div></div><span className="badge">Embedded boundaries · economic layers need internet</span></header>
    <section className="command panel command-bar">
      <div className="topbar">
        <div className="segmented" role="radiogroup" aria-label="Region">{Object.entries(regionNames).map(([key, name]) => <button key={key} role="radio" aria-checked={key === regionKey} className={key === regionKey ? 'on' : ''} onClick={() => changeRegion(key)}>{name}</button>)}</div>
        <label className="pill-select"><span>Layer:</span><select value={metric} onChange={(event) => setMetric(event.target.value)} aria-label="Map layer">{LAYERS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><span className="caret" aria-hidden="true">▾</span></label>
        <CountrySearch regionKey={regionKey} year={year} onJump={jumpTo} />
      </div>
      <Tabs.Root value={view} onValueChange={(value) => setView(value as View)} className="tabs" orientation="horizontal"><Tabs.List aria-label="Application views">{TABS.map(([key, label]) => <Tabs.Trigger key={key} value={key}>{label}</Tabs.Trigger>)}</Tabs.List></Tabs.Root>
    </section>
    <motion.div key={view} role="tabpanel" aria-label={viewLabel} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .22 }}>
      {view === 'overview' && <div className="deck">
        <Atlas region={region} year={year} selected={active} metric={metric} economic={economic} onSelect={select} onYear={setYear} links={links} icons={icons} onLinks={setLinks} onIcons={setIcons} govIcons={govIcons} onGovIcons={setGovIcons} />
        <aside className="right">
          {dossierOpen
            ? <CountryDossier region={region} year={year} selected={active} economic={economic} onYear={setYear} onClose={() => setDossierOpen(false)} />
            : <section className="panel pad dossier-hint"><div className="kicker">Country dossier</div><p className="tiny">Click a country on the map, or use “Jump to country”, to open its dossier.</p></section>}
          <RegionalBreakdowns region={region} year={year} />
          <section className="panel pad"><h2>All relationship events · {year}</h2>{region.MARKERS.filter((event) => event[2] === year).map((event) => <p className="eventitem" key={event.join('-')}>{event[3]}</p>)}{!region.MARKERS.some((event) => event[2] === year) && <p className="empty">No relationship milestones coded for this year. This does not imply absence of interactions.</p>}</section>
        </aside>
      </div>}
      {view === 'economic' && <CountryData region={region} year={year} selected={active} economic={economic} onSelect={select} />}
      {view === 'ledger' && <Ledger region={region} year={year} selected={active} onSelect={select} />}
      {view === 'signals' && <><Trends region={region} year={year} economic={economic} selected={active} /><ChartPanel region={region} economic={economic} selected={active} metric="growth" title={`Real GDP growth, annual % · ${nameAt(region, active, year)}`} /></>}
      {view === 'events' && <EventStudy region={region} economic={economic} selected={active} />}
      {view === 'spillover' && <Neighbors key={regionKey} region={region} economic={economic} />}
      {view === 'diagnostics' && <ApiDiagnostics state={apiState} onReload={reload} />}
    </motion.div>
  </main>
}