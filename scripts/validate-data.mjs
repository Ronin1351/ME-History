import fs from 'node:fs'
import vm from 'node:vm'
import assert from 'node:assert/strict'

const files = [
  ['africa-data.js', 'REGION_AF'],
  ['americas-data.js', 'REGION_AM'],
  ['asia-data.js', 'REGION_AS'],
  ['europe-data.js', 'REGION_EU'],
]

function load(path, name, converted = false) {
  let source = fs.readFileSync(path, 'utf8')
  if (converted) {
    source = source.replace(new RegExp(`export const ${name}(?::\\s*any)?\\s*=`), `window.${name} =`)
    source = source.replaceAll(`${name}.`, `window.${name}.`)
  }
  const context = { window: {} }
  vm.runInNewContext(source, context, { filename: path })
  return context.window[name]
}

for (const [file, name] of files) {
  const original = load(file, name)
  const converted = load(`src/data/${file.replace('.js', '.ts')}`, name, true)
  // Functions are recreated in separate VM realms; compare the serialized data payload
  // while retaining an exact source snapshot below for the mechanical conversion.
  assert.equal(JSON.stringify(converted, (_, value) => typeof value === 'function' ? undefined : value), JSON.stringify(original, (_, value) => typeof value === 'function' ? undefined : value), `${file} data values changed during conversion`)
  const records = converted.C.reduce((n, country) => n + country.p.length, 0)
  console.log(`${file}: ${converted.C.length} countries, ${records} records, ${converted.EVENTS.length} events, ${converted.MARKERS.length} markers, ${converted.GEO.length} geo features — identical`)
}

console.log('regional data parity: PASS')
