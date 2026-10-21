import { useMemo, useState } from 'react'
import { regionNames, regions } from '../lib/regions'
import { nameAt } from '../lib/types'

interface Props { regionKey: string; year: number; onJump: (regionKey: string, id: string) => void }
interface Entry { id: string; regionKey: string; name: string; terms: string }

const MAX_RESULTS = 8

/** Search box that finds a country in any region; countries in the current region are listed first. */
export function CountrySearch({ regionKey, year, onJump }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(0)
  const entries = useMemo(() => {
    const seen = new Set<string>()
    const list: Entry[] = []
    for (const key of [regionKey, ...Object.keys(regions).filter((k) => k !== regionKey)]) {
      const region = regions[key]
      for (const country of region.C) {
        if (seen.has(country.id)) continue
        seen.add(country.id)
        const names = [nameAt(region, country.id, year), region.LABELS[country.id], country.name, country.full?.(year), country.id]
        list.push({ id: country.id, regionKey: key, name: country.full?.(year) ?? nameAt(region, country.id, year), terms: names.filter(Boolean).join(' ').toLowerCase() })
      }
    }
    return list
  }, [regionKey, year])
  const needle = query.trim().toLowerCase()
  const matches = needle ? entries.filter((entry) => entry.terms.includes(needle)).slice(0, MAX_RESULTS) : []
  const choose = (entry: Entry | undefined) => { if (!entry) return; onJump(entry.regionKey, entry.id); setQuery(''); setOpen(false); setCursor(0) }

  return <div className="search">
    <span className="search-icon" aria-hidden="true">⌕</span>
    <input value={query} placeholder="Jump to country…" aria-label="Jump to country" role="combobox" aria-expanded={open && matches.length > 0} aria-controls="country-search-list" aria-autocomplete="list"
      onChange={(event) => { setQuery(event.target.value); setOpen(true); setCursor(0) }}
      onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 120)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown') { event.preventDefault(); setCursor((c) => Math.min(c + 1, matches.length - 1)) }
        else if (event.key === 'ArrowUp') { event.preventDefault(); setCursor((c) => Math.max(c - 1, 0)) }
        else if (event.key === 'Enter') choose(matches[cursor])
        else if (event.key === 'Escape') { setQuery(''); setOpen(false) }
      }} />
    {open && needle && <ul className="search-list" id="country-search-list" role="listbox">
      {matches.length === 0 && <li className="search-empty">No country matches “{query}”</li>}
      {matches.map((entry, index) => <li key={`${entry.regionKey}-${entry.id}`} role="option" aria-selected={index === cursor} className={index === cursor ? 'on' : ''} onMouseDown={(event) => { event.preventDefault(); choose(entry) }} onMouseEnter={() => setCursor(index)}>
        <span>{entry.name}</span>{entry.regionKey !== regionKey && <small>{regionNames[entry.regionKey]}</small>}
      </li>)}
    </ul>}
  </div>
}