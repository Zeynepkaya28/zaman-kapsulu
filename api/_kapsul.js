// /api fonksiyonları için ortak yardımcılar. Publishable anahtar herkese açık olabilir (bkz. CLAUDE.md).
export const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://tygzleyywkiwjxvrnprp.supabase.co'
export const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_gD5zk0bRPCZC0_OK3vqSsQ_UzC83ZxT'

export const isId = (id) => /^[0-9a-f-]{36}$/i.test(id || '')

export async function getCapsule(id) {
  if (!isId(id)) return null
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/kapsul_get`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_id: id }),
  })
  if (!res.ok) return null
  const rows = await res.json()
  return rows?.[0] || null
}

export const fmtDate = (iso) =>
  new Date(iso).toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Istanbul' })

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
