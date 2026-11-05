// Açılmış ve henüz bildirilmemiş kapsüllerin sahibine ve takipçilerine e-posta gönderir.
// pg_cron her 5 dakikada çağırır. İşlem idempotent: her kapsül en fazla bir kez işlenir.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const SITE = Deno.env.get('SITE_URL') ?? 'https://zaman-kapsulu-three.vercel.app'
const FROM = Deno.env.get('RESEND_FROM') ?? 'Zaman Kapsülü <onboarding@resend.dev>'

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

function emailHtml(c: { id: string; nickname: string; mood: string }) {
  const url = `${SITE}/k/${c.id}`
  return `<div style="font-family:Georgia,serif;background:#f6f1e8;padding:32px;color:#1f1a14">
  <div style="max-width:520px;margin:0 auto;background:#fffdf8;border:1px solid #e6dccb;border-radius:18px;padding:28px">
    <p style="margin:0 0 8px;color:#7a6f60;font-size:14px">⏳ Zaman Kapsülü</p>
    <h1 style="margin:0 0 12px;font-size:28px">${esc(c.mood)} Kapsül açıldı.</h1>
    <p style="font-size:16px;line-height:1.5">${esc(c.nickname)} adlı kişinin mühürlediği not artık okunabilir.</p>
    <p style="margin:24px 0"><a href="${url}" style="background:#c2410c;color:#fff;text-decoration:none;padding:12px 18px;border-radius:12px;font-family:Arial,sans-serif;font-weight:600">Kapsülü aç</a></p>
    <p style="font-size:12px;color:#7a6f60">Bu e-postayı kapsülün sahibi olduğun ya da açılınca haber almak istediğin için aldın.</p>
  </div></div>`
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const key = Deno.env.get('RESEND_API_KEY')

  if (!key) {
    // anahtar yokken kapsülleri işaretleme: anahtar eklenince bekleyenler gönderilsin
    const { data } = await db.rpc('kapsul_due_count')
    console.log(`RESEND_API_KEY yok, gönderim atlandı. Bekleyen kapsül: ${data ?? '?'}`)
    return Response.json({ skipped: true, pending: data ?? null })
  }

  const { data: due, error } = await db.rpc('kapsul_take_due', { p_limit: 50 })
  if (error) {
    console.error('kapsul_take_due hatası', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }

  let sent = 0, failed = 0
  for (const c of due ?? []) {
    for (const to of c.recipients ?? []) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM, to, subject: '⏳ Kapsülün açıldı', html: emailHtml(c) }),
      })
      if (res.ok) sent++
      else { failed++; console.error('Resend hatası', c.id, res.status, await res.text()) }
    }
  }
  console.log(`işlenen kapsül: ${due?.length ?? 0}, gönderilen: ${sent}, hatalı: ${failed}`)
  return Response.json({ capsules: due?.length ?? 0, sent, failed })
})
