---
description: Faz 3 — Supabase Auth ile hesaplar ve cihazlar arası "Benimkiler"
---
Zaman Kapsülü'nde **Faz 3**'ü baştan sona uygula. Önce `CLAUDE.md` ve `docs/PHASES.md` (Faz 3 bölümü) dosyalarını oku. Soru sorma, tüm yetki sende.

1. `supabase/migrations/` altına yeni migration yaz ve Supabase'e (`tygzleyywkiwjxvrnprp`) uygula:
   - `kapsul_capsules.owner_id uuid references auth.users(id) on delete set null`
   - `kapsul_create` → `owner_id = auth.uid()` (anon ise null)
   - `kapsul_mine()` → sadece `owner_id = auth.uid()`; açılmamışların `message`'ı NULL
   - `kapsul_claim(p_ids uuid[])` → yalnız `owner_id is null` olanları çağıranın hesabına bağla, sayıyı döndür
   - `execute` yetkilerini `kapsul_mine`/`kapsul_claim` için yalnız `authenticated`'a ver
2. Fonksiyonları SQL ile test et (`set local role authenticated; set local request.jwt.claims ...` + rollback).
3. Arayüz: başlıkta "Giriş yap" düğmesi → e-posta formu → `signInWithOtp` (emailRedirectTo = location.origin). Oturum açıksa e-posta + "Çıkış". Giriş olunca localStorage ID'lerini `kapsul_claim` ile sahiplen, "Benimkiler" sekmesi oturum varsa `kapsul_mine()` kullansın.
4. `npm run build`, Playwright ile ekran görüntüsü, Vercel'e production deploy.
5. `docs/PHASES.md`'de Faz 3'ü ✅ yap, `PROMPTS.md`'yi güncelle.
6. Sonunda kullanıcıya şunu hatırlat: Supabase → Authentication → URL Configuration'a canlı adresi ve localhost'u eklemesi gerekiyor (bu panelden yapılır).
