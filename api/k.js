// /k/:id → uygulamanın index.html'i, kapsüle özel og/twitter meta etiketleriyle.
// Sosyal ağ önizlemeleri JavaScript çalıştırmadığı için etiketler sunucuda yazılır.
import { getCapsule, fmtDate, esc, isId } from './_kapsul.js'

export const config = { runtime: 'edge' }

export default async function handler(req) {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const [shell, c] = await Promise.all([
    fetch(new URL('/index.html', url.origin)).then((r) => r.text()),
    isId(id) ? getCapsule(id) : null,
  ])

  const title = !c ? 'Zaman Kapsülü'
    : c.is_open ? `${c.nickname} bir kapsül bıraktı — açıldı` : `Mühürlü bir kapsül · ${fmtDate(c.unlock_at)}`
  const desc = !c ? 'Geleceğe mühürlü notlar bırak. Zamanı gelince herkes için açılır.'
    : c.is_open ? (c.message || '').slice(0, 160) : 'Bu not açılış anına kadar kilitli. Linki sakla, o gün geri dön.'
  const pageUrl = `${url.origin}/k/${isId(id) ? id : ''}`
  const img = `${url.origin}/api/og?id=${isId(id) ? id : ''}`

  const meta = `
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Zaman Kapsülü" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(desc)}" />
    <meta property="og:url" content="${esc(pageUrl)}" />
    <meta property="og:image" content="${esc(img)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(desc)}" />
    <meta name="twitter:image" content="${esc(img)}" />`

  const html = shell
    .replace(/<!-- og:start -->[\s\S]*<!-- og:end -->/, '')
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace('</head>', `${meta}\n  </head>`)

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=60' },
  })
}
