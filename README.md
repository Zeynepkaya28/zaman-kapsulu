# ⏳ Zaman Kapsülü

Geleceğe mühürlü notlar bırak; zamanı gelince herkes için açılsın.
Canlı: https://zaman-kapsulu-three.vercel.app

## Claude Code ile başlat
```bash
cd zaman-kapsulu
npm install
claude
```
Claude Code açılınca `CLAUDE.md` otomatik okunur. Sıradaki fazı başlatmak için:

| Komut | Ne yapar |
|---|---|
| `/durum` | Faz durumu + canlı site + Supabase kontrolü |
| `/faz-3-auth` | Giriş sistemi, cihazlar arası "Benimkiler" |
| `/faz-4-bildirim` | Kapsül açılınca e-posta |
| `/faz-5-cilalama` | OG görseli, PWA, erişilebilirlik |
| `/faz-6-kalite` | Testler, CI, GitHub + Vercel bağlantısı |

Yol haritası: `docs/PHASES.md` · Promptlar: `PROMPTS.md` · Şema: `supabase/migrations/`
