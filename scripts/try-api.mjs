// /api fonksiyonlarını yerelde dener: node scripts/try-api.mjs <çıktı klasörü>
// /index.html isteğini dist/'ten karşılar, Supabase'e gerçek istek atar.
import { readFileSync, writeFileSync } from 'node:fs'
import og from '../api/og.js'
import k from '../api/k.js'
import { SUPABASE_URL, SUPABASE_KEY } from '../api/_kapsul.js'

const out = process.argv[2] || '.'
const realFetch = globalThis.fetch
globalThis.fetch = (input, init) => {
  const url = String(input)
  if (url.endsWith('/index.html')) return Promise.resolve(new Response(readFileSync('dist/index.html', 'utf8')))
  return realFetch(input, init)
}

const list = await (await realFetch(`${SUPABASE_URL}/rest/v1/rpc/kapsul_list`, {
  method: 'POST', headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' }, body: '{}',
})).json()
const sealed = list.find((c) => !c.is_open), open = list.find((c) => c.is_open)

for (const [name, c] of [['sealed', sealed], ['open', open], ['default', null]]) {
  const res = await og(new Request(`https://example.test/api/og${c ? `?id=${c.id}` : ''}`))
  writeFileSync(`${out}/og-${name}.png`, Buffer.from(await res.arrayBuffer()))
  console.log('og', name, res.status, res.headers.get('content-type'))
}
const html = await (await k(new Request(`https://example.test/api/k?id=${sealed.id}`))).text()
console.log(html.match(/<title>.*<\/title>/)[0])
console.log(html.match(/og:image" content="[^"]+"/)[0])
console.log('eski og bloğu kaldırıldı:', !html.includes('og:start'))
