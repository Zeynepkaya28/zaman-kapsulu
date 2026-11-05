import { describe, it, expect } from 'vitest'
import { toLocalInput, countdown, fmt } from './time.js'

describe('countdown', () => {
  it('süre dolunca "açılıyor…" der', () => {
    expect(countdown(0)).toBe('açılıyor…')
    expect(countdown(-5000)).toBe('açılıyor…')
  })
  it('bir saatten kısa sürede dakika ve saniye gösterir', () => {
    expect(countdown(65_000)).toBe('1dk 5sn')
    expect(countdown(999)).toBe('0dk 0sn')
  })
  it('saatli sürede saniyeyi de gösterir', () => {
    expect(countdown((2 * 3600 + 3 * 60 + 4) * 1000)).toBe('2s 3dk 4sn')
  })
  it('günlü sürede saniyeyi düşürür', () => {
    expect(countdown((3 * 86400 + 4 * 3600 + 5 * 60 + 59) * 1000)).toBe('3g 4s 5dk')
  })
})

describe('toLocalInput', () => {
  it('yerel saati datetime-local biçiminde verir', () => {
    expect(toLocalInput(new Date(2026, 0, 5, 9, 7, 59))).toBe('2026-01-05T09:07')
  })
  it('çift haneli ay ve günleri korur', () => {
    expect(toLocalInput(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31T23:59')
  })
  it('kendi çıktısıyla geri okunabilir (dakika hassasiyeti)', () => {
    const d = new Date(2027, 4, 17, 14, 30)
    expect(new Date(toLocalInput(d)).getTime()).toBe(d.getTime())
  })
})

describe('fmt', () => {
  it('Türkçe tarih ve saat üretir', () => {
    const s = fmt('2026-11-05T17:31:00Z', 'Europe/Istanbul')
    expect(s).toContain('2026')
    expect(s).toContain('20:31')
    expect(s).toMatch(/Kas/)
  })
})
