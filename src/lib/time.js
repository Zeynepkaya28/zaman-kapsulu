// Tarih/zaman yardımcıları (saf fonksiyonlar, birim testli)

/** Date → <input type="datetime-local"> değeri (yerel saat, dakika hassasiyeti) */
export function toLocalInput(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

/** Kalan milisaniye → "3g 4s 5dk" / "4s 5dk 6sn" / "5dk 6sn"; süre dolduysa "açılıyor…" */
export function countdown(ms) {
  if (ms <= 0) return 'açılıyor…'
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60), sec = s % 60
  if (d > 0) return `${d}g ${h}s ${m}dk`
  if (h > 0) return `${h}s ${m}dk ${sec}sn`
  return `${m}dk ${sec}sn`
}

/** ISO tarih → "5 Kas 2026 20:31" (tr-TR) */
export const fmt = (iso, timeZone) =>
  new Date(iso).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short', ...(timeZone && { timeZone }) })
