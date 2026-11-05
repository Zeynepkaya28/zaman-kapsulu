---
description: Faz 5 — OG görseli, PWA, erişilebilirlik ve durum cilası
---
Zaman Kapsülü'nde **Faz 5**'i uygula. Önce `CLAUDE.md` ve `docs/PHASES.md` (Faz 5) oku. Soru sorma.

1. `api/og.jsx` Vercel Function (`@vercel/og`): `?id=` ile kapsülü `kapsul_get` üzerinden çek, mühürlü ise kilit + açılış tarihi, açık ise mesajın ilk 140 karakteri; sıcak kâğıt tonlu 1200×630 görsel.
2. `/k/:id` için `api/k.js` (veya Edge Middleware) ile `og:title`, `og:image`, `twitter:card` meta etiketli HTML döndür; `vercel.json`'u güncelle.
3. `public/manifest.webmanifest`, 192/512 ikonlar, basit service worker (uygulama kabuğu önbelleği).
4. Erişilebilirlik: tüm düğmelerde görünür odak, geri sayım için `aria-live="polite"` özet, kontrast ≥ 4.5:1, mobil 360px'te yatay kaydırma yok.
5. Yükleme için iskelet kartlar; ağ hatasında "Tekrar dene" düğmesi.
6. Build, Playwright ile masaüstü + mobil ekran görüntüsü, deploy, dokümanları güncelle.
