# Zaman Kapsülü — Fazlar

| Faz | Kapsam | Durum |
|---|---|---|
| 1 | MVP: kapsül oluştur, duvar, geri sayım, otomatik açılma | ✅ Tamam (v1.0) |
| 2 | Paylaşım linki `/k/:id`, IP başına spam sınırı, "Benimkiler" (cihaz bazlı) | ✅ Tamam (v1.1) |
| 3 | Supabase Auth (e-posta magic link), kapsülün hesaba bağlanması | ✅ Tamam (v1.2) — deploy bekliyor |
| 4 | Açılınca e-posta bildirimi (Edge Function + pg_cron + Resend) | ⏳ `/faz-4-bildirim` |
| 5 | Cilalama: dinamik OG görseli, PWA, erişilebilirlik, boş/yükleme durumları | ⏳ `/faz-5-cilalama` |
| 6 | Kalite: Vitest + Playwright testleri, GitHub Actions CI, Vercel Git bağlantısı | ⏳ `/faz-6-kalite` |

---

## Faz 1 — MVP ✅
- `kapsul_capsules` tablosu, RLS açık, doğrudan erişim kapalı
- `kapsul_list()` açılmamış mesajları gizler
- Vite + React arayüz, geri sayım, ruh hali emojisi, hızlı tarih seçimleri, filtreler
- Migration: `supabase/migrations/20261105000001_kapsul_init.sql`

## Faz 2 — Paylaşım ve koruma ✅
- `kapsul_get(id)` + `/k/:id` sayfası, oluşturunca link otomatik kopyalanır / paylaşım menüsü
- `kapsul_create` içinde hash'li IP ile dakikada 3 kapsül sınırı
- "Benimkiler" sekmesi (localStorage — Faz 3'te hesaba taşınacak)
- Migration: `supabase/migrations/20261105000002_kapsul_share_ratelimit.sql`

## Faz 3 — Hesaplar ✅
Yapılanlar: `owner_id` kolonu, `kapsul_create` sahibi yazıyor, `kapsul_mine()` ve `kapsul_claim(uuid[])` (yalnız `authenticated`).
Başlıkta "Giriş yap" → magic link; girişte cihazdaki kapsüller hesaba bağlanıyor, "Benimkiler" hesaptan geliyor.
SQL testi: claim yalnız sahipsizleri aldı, açılmamış mesaj NULL, anon `kapsul_mine` çağıramıyor.
Migration: `supabase/migrations/20261105000003_kapsul_auth.sql`

**Hedef:** Giriş isteğe bağlı kalsın; giriş yapan kullanıcının kapsülleri hesabına bağlansın, cihazlar arası "Benimkiler".
- `owner_id uuid references auth.users` kolonu; `kapsul_create` `auth.uid()`'yi yazsın
- `kapsul_mine()` RPC (sadece `auth.uid()` sahibi olanlar; mesaj yine açılana kadar gizli)
- Girişte localStorage'daki kapsül ID'lerini hesaba sahiplendiren `kapsul_claim(ids uuid[])` (yalnız `owner_id is null` olanlar)
- Arayüz: üstte "Giriş yap" → e-posta → magic link; çıkış
- **Manuel adım:** Supabase → Authentication → URL Configuration'a `https://zaman-kapsulu-three.vercel.app` ve `http://localhost:5173` ekle

## Faz 4 — Bildirim
**Hedef:** Kapsül açıldığında sahibine (ve isteyen takipçilere) e-posta.
- `kapsul_capsules.notified_at`, `kapsul_watchers(capsule_id, email)` tablosu + `kapsul_watch(id, email)` RPC
- Edge Function `kapsul-notify`: açılmış ve `notified_at is null` kapsülleri bulur, Resend ile gönderir
- `pg_cron` her 5 dakikada fonksiyonu çağırır
- **Gerekli secret:** `RESEND_API_KEY` (Supabase Edge Function secret)

## Faz 5 — Cilalama
- Vercel Function `/api/og?id=` ile dinamik OG görseli (mühürlü/açık), `/k/:id` için meta etiketleri
- PWA manifest + ikon, çevrimdışı kabuk
- Klavye erişimi, `aria-live` geri sayım, renk kontrastı kontrolü
- İskelet yükleme kartları, hata durumunda yeniden dene

## Faz 6 — Kalite ve otomasyon
- Vitest: `countdown`, `toLocalInput` birim testleri
- Playwright: Supabase mock'lu duvar / tek kapsül / form akışları
- GitHub reposu + Actions (build + test), Vercel Git bağlantısı (push = deploy)
