---
description: Faz 6 — Testler, CI ve Git tabanlı deploy
---
Zaman Kapsülü'nde **Faz 6**'yı uygula. Önce `CLAUDE.md` ve `docs/PHASES.md` (Faz 6) oku. Soru sorma.

1. Yardımcı fonksiyonları (`countdown`, `toLocalInput`, `fmt`) `src/lib/time.js`'e taşı; Vitest birim testleri yaz.
2. Playwright testleri: Supabase isteklerini `page.route` ile mock'la; duvar, filtreler, form gönderimi, `/k/:id` sayfası.
3. `npm test` ve `npm run test:e2e` script'leri.
4. `git init`, anlamlı commit'ler; `gh` ile `zaman-kapsulu` adında özel GitHub reposu oluştur ve push et.
5. `.github/workflows/ci.yml`: install → build → vitest → playwright.
6. Vercel projesini bu repoya bağla (push = production deploy). `.env` yerine Vercel ortam değişkenlerini kullan, `.env`'i `.gitignore`'a ekle ve `.env.example` bırak.
7. Dokümanları güncelle.
