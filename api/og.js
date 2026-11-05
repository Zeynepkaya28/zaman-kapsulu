// Dinamik paylaşım görseli: /api/og?id=<kapsül id> → 1200×630 PNG
import { ImageResponse } from '@vercel/og'
import { getCapsule, fmtDate } from './_kapsul.js'

export const config = { runtime: 'edge' }

const h = (type, style, children) => ({ type, props: { style, children } })

export default async function handler(req) {
  const id = new URL(req.url).searchParams.get('id')
  const c = id ? await getCapsule(id) : null
  const sealed = c && !c.is_open
  const bg = sealed ? '#2a2420' : '#f6f1e8'
  const ink = sealed ? '#f3ece1' : '#1f1a14'
  const muted = sealed ? '#a39887' : '#6b6052'

  let title, body
  if (!c) { title = 'Geleceğe mühürlü bir not bırak.'; body = 'Yazdığın not, seçtiğin ana kadar kilitli kalır.' }
  else if (sealed) { title = `${c.mood} Bu kapsül mühürlü`; body = `🔒 ${fmtDate(c.unlock_at)} tarihinde açılacak.` }
  else {
    const m = c.message || ''
    title = `${c.mood} ${c.nickname} yazdı`
    body = `“${m.length > 140 ? m.slice(0, 139) + '…' : m}”`
  }

  return new ImageResponse(
    h('div', {
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      background: bg, color: ink, padding: '64px 72px', fontFamily: 'sans-serif',
    }, [
      h('div', { display: 'flex', fontSize: 30, color: muted }, '⏳ Zaman Kapsülü'),
      h('div', { display: 'flex', flexDirection: 'column', gap: 24 }, [
        h('div', { display: 'flex', fontSize: 64, fontWeight: 700, lineHeight: 1.1 }, title),
        h('div', { display: 'flex', fontSize: 36, color: sealed ? '#e9e1d4' : ink, lineHeight: 1.35 }, body),
      ]),
      h('div', { display: 'flex', height: 10, borderRadius: 10, background: '#c2410c', width: sealed ? '40%' : '100%' }, ''),
    ]),
    { width: 1200, height: 630, headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } }
  )
}
