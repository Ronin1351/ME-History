/** Government-type icons ported from the legacy atlas (24×24 stroke paths). */
export const GOV_ICONS: Record<string, string> = {
  IP: 'M5 21V8l7-5 7 5v13 M9 21v-9h6v9 M3 21h18',
  CO: 'M5 21V3 M5 4h15l-4 4 4 4H5',
  AM: 'M3 18l2-10 5 4 2-8 2 8 5-4 2 10z M3 21h18',
  CM: 'M3 19h18 M5 16V9l7-6 7 6v7 M9 16v-5h6v5 M3 21h18',
  MR: 'M4 20h16 M6 17V8l6-5 6 5v9 M9 12h6 M9 15h6',
  TH: 'M12 2v4 M6 20V11a6 6 0 0 1 12 0v9 M9 20v-6a3 3 0 0 1 6 0v6 M3 21h18',
  DR: 'M3 10l9-7 9 7 M5 11v8 M10 11v8 M14 11v8 M19 11v8 M3 21h18 M3 11h18',
  TR: 'M5 4h14 M5 20h14 M7 4l5 8-5 8 M17 4l-5 8 5 8',
  CW: 'M3 3h3l10 10 M3 3v3l10 10 M12 17l5-5 M15.5 15.5l4 4 M18 20.5l2.5-2.5 M21 3h-3L8 13 M21 3v3L11 16 M7 12l5 5 M8.5 15.5l-4 4 M3.5 18l2.5 2.5',
  NA: 'M4 4l16 16 M20 4L4 20',
}

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

/** Symbol definitions for use inside the map SVG. */
export function GovSymbols() {
  return <defs>{Object.entries(GOV_ICONS).map(([code, d]) => <symbol key={code} id={`gov-${code}`} viewBox="0 0 24 24"><path d={d} {...stroke} /></symbol>)}</defs>
}

/** Map badge: dark disc with the white government icon, centered on (x, y). */
export function GovBadge({ code, x, y }: { code: string; x: number; y: number }) {
  return <g className="mapgov"><circle cx={x} cy={y} r={11} /><use href={`#gov-${GOV_ICONS[code] ? code : 'NA'}`} x={x - 7.8} y={y - 7.8} width={15.6} height={15.6} /></g>
}

/** Inline icon for panels and legends. */
export function GovIcon({ code }: { code: string }) {
  return <svg viewBox="0 0 24 24" className="govicon" aria-hidden="true"><path d={GOV_ICONS[code] ?? GOV_ICONS.NA} {...stroke} /></svg>
}