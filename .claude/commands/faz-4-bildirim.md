---
description: Faz 4 — Kapsül açılınca e-posta bildirimi (Edge Function + pg_cron + Resend)
---
Zaman Kapsülü'nde **Faz 4**'ü uygula. Önce `CLAUDE.md` ve `docs/PHASES.md` (Faz 4) oku. Soru sorma.

1. Migration: `notified_at timestamptz` kolonu; `kapsul_watchers(capsule_id uuid fk, email text, created_at, unique(capsule_id,email))` tablosu (RLS açık, doğrudan erişim yok); `kapsul_watch(p_id uuid, p_email text)` RPC (e-posta biçimi kontrolü, kapsül başına en fazla 50 izleyici).
2. `supabase/functions/kapsul-notify/index.ts` Edge Function: service role ile açılmış ve `notified_at is null` kapsülleri al (en fazla 50), sahibin e-postası (auth.users) + izleyicilere Resend API ile Türkçe e-posta gönder (konu: "⏳ Kapsülün açıldı", içinde `/k/:id` linki), sonra `notified_at = now()`.
3. Deploy et. `RESEND_API_KEY` secret'ı yoksa fonksiyonu yine deploy et ama göndermeyi atla ve logla; kullanıcıya anahtarı nereye koyacağını söyle.
4. `pg_cron` + `pg_net` ile her 5 dakikada fonksiyonu çağıran job kur.
5. Arayüz: mühürlü kapsül kartında "Açılınca haber ver" → e-posta alanı → `kapsul_watch`.
6. Build, ekran görüntüsü, deploy, `docs/PHASES.md` + `PROMPTS.md` güncelle.
