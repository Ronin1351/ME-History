export type EconomicData = Record<string, Record<string, Record<number, number>>>
export type IndicatorData = Record<string, Record<number, number>>
export const indicators = { gdp: { id: 'NY.GDP.MKTP.CD', label: 'GDP, current US$' }, growth: { id: 'NY.GDP.MKTP.KD.ZG', label: 'Real GDP growth, annual %' }, unemployment: { id: 'SL.UEM.TOTL.ZS', label: 'Unemployment, % of labor force' } }
export function parseWorldBank(json: unknown): { pages: number; rows: unknown[] } { if (!Array.isArray(json) || !Array.isArray(json[1])) throw new Error('unexpected response shape'); return { pages: Number((json[0] as { pages?: number })?.pages) || 1, rows: json[1] } }
export function ingestRows(rows: unknown[], target: IndicatorData) { let count = 0; for (const item of rows) { const row = item as { countryiso3code?: string; date?: string; value?: unknown }; const year = Number(row.date); if (!row.countryiso3code || !Number.isFinite(year) || typeof row.value !== 'number' || !Number.isFinite(row.value)) continue; (target[row.countryiso3code] ??= {})[year] = row.value; count++ } return count }

export type LoadState = 'loaded' | 'partial' | 'unavailable'
export interface LoadResult { data: EconomicData; state: LoadState; cached: boolean; failed: string[] }

const cache = new Map<string, Omit<LoadResult, 'cached'>>()

/** Fetches every indicator for the given World Bank ISO codes. Results are cached per country set for the session. */
export async function loadIndicators(isoCodes: string[], signal?: AbortSignal, force = false): Promise<LoadResult> {
  const key = [...new Set(isoCodes)].sort().join(';')
  const hit = cache.get(key)
  if (hit && !force) return { ...hit, cached: true }
  const data: EconomicData = {}
  const failed: string[] = []
  await Promise.all(Object.entries(indicators).map(async ([name, meta]) => {
    try {
      const response = await fetch(`https://api.worldbank.org/v2/country/${key}/indicator/${meta.id}?format=json&date=1960:2026&per_page=20000`, { signal })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const { pages, rows } = parseWorldBank(await response.json())
      const target: IndicatorData = {}
      const count = ingestRows(rows, target)
      data[name] = target
      if (count === 0 || pages > 1) failed.push(name)
    } catch (error) {
      if ((error as Error).name === 'AbortError') throw error
      failed.push(name)
    }
  }))
  const state: LoadState = failed.length === 0 ? 'loaded' : failed.length < Object.keys(indicators).length ? 'partial' : 'unavailable'
  const result = { data, state, failed }
  if (state !== 'unavailable') cache.set(key, result)
  return { ...result, cached: false }
}
