# Zaman Kapsülü — Fazlar

| Faz | Kapsam | Durum |
|---|---|---|
| 1 | MVP: kapsül oluştur, duvar, geri sayım, otomatik açılma | ✅ Tamam (v1.0) |
| 2 | Paylaşım linki `/k/:id`, IP başına spam sınırı, "Benimkiler" (cihaz bazlı) | ✅ Tamam (v1.1) |
| 3 | Supabase Auth (e-posta magic link), kapsülün hesaba bağlanması | ✅ Tamam (v1.2) — deploy bekliyor |
| 4 | Açılınca e-posta bildirimi (Edge Function + pg_cron + Resend) | ✅ Tamam (v1.3) — `RESEND_API_KEY` bekliyor |
| 5 | Cilalama: dinamik OG görseli, PWA, erişilebilirlik, boş/yükleme durumları | ✅ Tamam (v1.4) — deploy bekliyor |
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

## Faz 4 — Bildirim ✅
Yapılanlar: `notified_at` kolonu (eski açık kapsüller işaretli, geriye dönük e-posta yok), `kapsul_watchers` tablosu,
`kapsul_watch(id, email)` RPC (biçim kontrolü, mühürlü kapsül, en fazla 50 takipçi), yalnız `service_role` için
`kapsul_take_due()` / `kapsul_due_count()`. Edge Function `kapsul-notify` (verify_jwt kapalı; idempotent, her kapsül bir kez işlenir),
`pg_net` + `pg_cron` işi `kapsul-notify` her 5 dakikada. Kartta "🔔 Açılınca haber ver".
Anahtar yokken fonksiyon kapsülleri işaretlemez; anahtar eklenince bekleyenler gönderilir.
Gönderen adresi varsayılan `onboarding@resend.dev` (yalnız Resend hesabının kendi e-postasına gider); kendi alan adın için `RESEND_FROM` secret'ı ekle.
Migration: `supabase/migrations/20261105000004_kapsul_notify.sql`

**Hedef:** Kapsül açıldığında sahibine (ve isteyen takipçilere) e-posta.
- `kapsul_capsules.notified_at`, `kapsul_watchers(capsule_id, email)` tablosu + `kapsul_watch(id, email)` RPC
- Edge Function `kapsul-notify`: açılmış ve `notified_at is null` kapsülleri bulur, Resend ile gönderir
- `pg_cron` her 5 dakikada fonksiyonu çağırır
- **Gerekli secret:** `RESEND_API_KEY` (Supabase Edge Function secret)

## Faz 5 — Cilalama ✅
Yapılanlar: `api/og.js` (Edge, `@vercel/og`, mühürlü = koyu kart + açılış tarihi, açık = mesajın ilk 140 karakteri),
`api/k.js` (`/k/:id` → index.html + og/twitter meta; `vercel.json` rewrite), `public/manifest.webmanifest`,
192/512/maskable ikonlar, `public/sw.js` (kabuk önbelleği; Supabase ve /api önbelleğe alınmaz),
`:focus-visible` halkası, `aria-pressed` sekmeler, dakikalık `aria-live` özet, `--muted` kontrastı 5.4:1,
koyu modda turuncu düğme metni koyu (7.5:1), iskelet kartlar, "Tekrar dene". 360px'te yatay kaydırma yok.
Yerel deneme: `npm run build && node scripts/try-api.mjs <klasör>` (OG PNG'leri ve meta HTML'i üretir).
- Vercel Function `/api/og?id=` ile dinamik OG görseli (mühürlü/açık), `/k/:id` için meta etiketleri
- PWA manifest + ikon, çevrimdışı kabuk
- Klavye erişimi, `aria-live` geri sayım, renk kontrastı kontrolü
- İskelet yükleme kartları, hata durumunda yeniden dene

## Faz 6 — Kalite ve otomasyon
- Vitest: `countdown`, `toLocalInput` birim testleri
- Playwright: Supabase mock'lu duvar / tek kapsül / form akışları
- GitHub reposu + Actions (build + test), Vercel Git bağlantısı (push = deploy)
