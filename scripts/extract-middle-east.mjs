import fs from 'node:fs'

const source = fs.readFileSync('legacy/index.html', 'utf8').replaceAll('\r\n', '\n')

function expressionAfter(marker, terminator) {
  const position = source.indexOf(marker)
  const start = position + marker.length
  const end = source.indexOf(terminator, start)
  if (position < 0 || end < 0) throw new Error(`Could not extract ${marker}`)
  return source.slice(start, end)
}

const meC = expressionAfter('const ME_C=[', '];\n/* M19').replace(/^/, '[') + ']'
const labels = expressionAfter('const LABELS=RD?RD.LABELS:', ';\nconst MARKERS')
const events = expressionAfter('const EVENTS=RD?RD.EVENTS:', ';\nconst GEO')
const geo = expressionAfter('const GEO=RD?RD.GEO:', ';\nconst CENTERS')
const centers = expressionAfter('const CENTERS=RD?RD.CENTERS:', ';\nconst LABELS')
const markers = expressionAfter('const MARKERS=RD?RD.MARKERS:', ';\nconst $=')

const econIds = "{TUR:'TUR',IRN:'IRN',AFG:'AFG',PAK:'PAK',IRQ:'IRQ',SYR:'SYR',LBN:'LBN',ISR:'ISR',PSE:'PSE',JOR:'JOR',EGY:'EGY',SAU:'SAU',KWT:'KWT',BHR:'BHR',QAT:'QAT',UAE:'ARE',OMN:'OMN',NYE:'YEM'}"
const output = `export const REGION_ME = {\n  key: 'me', defaultSel: 'IRN', ECON_IDS: ${econIds}, LABELS: ${labels}, C: ${meC}, EVENTS: ${events}, GEO: ${geo}, CENTERS: ${centers}, MARKERS: ${markers}\n}\n`
fs.writeFileSync('src/data/middle-east-data.ts', output)
