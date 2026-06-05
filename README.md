# CODEGA Mail

Yerel masaüstü mail istemcisi — IMAP/POP3 + OAuth2 destekli, SQLite tabanlı, OS-level şifrelemeli. Electron ile geliştirilmiştir (Windows & macOS).

**Güncel sürüm: v1.62.0**

## 📥 Kurulum

[**🚀 En son sürümü indir →**](https://github.com/codegatr/codegamailapp/releases/latest)

`CODEGA Mail Setup x.y.z.exe` dosyasını indir, çift tıkla, kur. Bu kadar.

Güncelleme geldiğinde:

- Uygulama açıkken sağ üstte **🚀 Güncelle** rozeti çıkar (electron-updater, otomatik)
- Veya Releases sayfasından yeni `.exe`'yi indir, kur (üzerine yazar)

## ✨ Özellikler

**Hesap & protokol**
- ✉ Çoklu hesap: IMAP / POP3 / SMTP
- 🔑 OAuth2 oturum açma (Google / Gmail ve Microsoft / Outlook)
- 🪂 Auto-config wizard: 12+ hazır sağlayıcı (Gmail, Outlook/M365, Yahoo, Yandex, Zoho, iCloud, ProtonMail, Amazon SES, Mailgun, Türk hosting sağlayıcıları…) + ISPDB otomatik tespit + custom

**Gelen kutusu & arayüz**
- 📬 Birleşik gelen kutusu (tüm hesaplar tek listede, hesap rozeti ile)
- 🎀 Outlook tarzı Ribbon (şerit) toolbar — sekmeli, gruplu butonlar
- 🗂 Tarih grupları (Bugün / Dün / Bu Hafta), sıralama menüsü, hover hızlı işlemler
- ✍ Zengin metin (rich text) editörü ve imza şablonları

**Güvenlik & gizlilik**
- 🔒 %100 yerel saklama (SQLite / sql.js), OS şifreli (Windows DPAPI / macOS Keychain)
- 🛡 Yerel + Bayes tabanlı spam filtresi
- 🧪 Ek dosya güvenlik taraması (tehlikeli uzantı tespiti)
- 🔗 URL itibar kontrolü + opsiyonel VirusTotal entegrasyonu
- 📜 E-posta kimlik doğrulama göstergeleri (SPF / DKIM / DMARC, phishing işaretleri)
- 🔐 PGP şifreleme & imzalama (OpenPGP)

**Verimlilik**
- 📨 Mail Merge — 4 adımlı wizard (şablon / CSV / önizleme / gönder), değişken doldurma, hız limiti
- 🧹 Sweep (Süpür) — bir göndericiden gelen tüm maillere toplu işlem (sil / taşı / arşivle / kural)
- ⏰ Snooze (erteleme) — hızlı seçenekler, özel tarih, otomatik geri getirme
- ⚙ Mail kuralları / filtreler + otomatik kategorilendirme
- 🏷 Mail alındı onayı (RFC 3798 MDN)

**İçe / dışa aktarma**
- 📥 Mail import: PST / MBOX / EML (pst-extractor + mailparser), yerel arşiv hesabı
- 👥 Kişiler CSV içe/dışa aktarma, vCard ve iCal desteği

**Bildirim & arka plan**
- 📥 Sistem tepsisi + Windows toast bildirim
- 🔔 Birleşik bildirim paneli (son N saat, tüm hesaplar, toolbar rozeti)
- ⏱ Arka plan otomatik senkronizasyon

**Ekler & yedekleme**
- 📎 Drag-drop ek dosya gönderme (paste desteği)
- 💾 Yedekle / Geri Yükle (tek `.mailbackup` dosyası — hesaplar, mailler, ekler, notlar, şablonlar, ayarlar)

**Dağıtım**
- 🚀 Otomatik başlatma + otomatik güncelleme (electron-updater)

## 🛠 Geliştirici akışı (yeni sürüm yayınlama)

Bu repo, tag push edildiğinde sürümü **GitHub Actions** ile otomatik derler ve yayınlar.

1. Kod değişikliğini `main`'e gönder:
   ```bash
   git add -A
   git commit -m "v1.x.0 - <değişiklik özeti>"
   git push origin main
   ```
2. `package.json` içindeki `version` alanını güncelle (örn. `1.62.0`), commit'le, push'la.
3. Eşleşen tag'i at ve push'la:
   ```bash
   git tag v1.x.0
   git push origin v1.x.0
   ```
4. **GitHub Actions otomatik** ([.github/workflows/release.yml](.github/workflows/release.yml)):
   - `v*` tag push'unda (veya **Actions → Release Build → Run workflow** ile manuel) tetiklenir
   - Windows runner'da `npm install && npm run release:win` çalıştırır (~5 dk)
   - `Setup.exe` + `latest.yml` üretip GitHub Release'e yapıştırır ve taslağı otomatik yayına alır
5. Sen Releases sayfasından `.exe` indirip kurarsın; mevcut kullanıcılar otomatik güncelleme bildirimi alır.

> Not: Tag ile `package.json` sürümünün aynı olması, electron-updater'ın güncellemeyi doğru tanıması için önemlidir.

Lokalde Node.js, npm, electron-builder veya Visual Studio Build Tools kurmana **gerek yok** — derleme bulutta yapılır.

## 💻 Lokal geliştirme (opsiyonel)

```bash
git clone https://github.com/codegatr/codegamailapp.git
cd codegamailapp
npm install
npm start
```

## 📦 Sürüm Geçmişi

Tüm sürümler (68+ release) için → [**Releases sayfası**](https://github.com/codegatr/codegamailapp/releases)

Son öne çıkanlar:

- **v1.62.0** — Dokümantasyon güncellendi: gerçek özellik seti + güncel sürüm geçmişi (kod değişikliği yok)
- **v1.61.0** — OAuth2 Test butonu Client ID'i otomatik kaydeder, detaylı config tanılaması
- **v1.60.0** — OAuth2 Microsoft AADSTS hata kodları Türkçe çeviri + diagnostik mesajlar
- **v1.59.0** — Outlook.com kimlik doğrulama çözümü (OAuth2 zorunlu uyarısı, akıllı yönlendirme)
- **v1.57.0** — EPERM rename DB save retry+fallback, Electron 42 + Nodemailer 8
- **v1.56.0** — Mail Merge (4 adımlı wizard)
- **v1.55.0** — Sweep (Süpür): göndericiye toplu işlem
- **v1.54.0** — Outlook UI: tarih grupları, sort menü, hover hızlı işlemler
- **v1.53.0** — Mail import (PST / MBOX / EML)
- **v1.52.0** — Snooze (erteleme)
- **v1.51.0** — Outlook tarzı Ribbon (şerit) toolbar
- **v1.50.0** — Birleşik bildirim paneli
- **v1.47.0** — Mail alındı onayı (RFC 3798 MDN)
- **v1.5.0** — Birleşik gelen kutusu, hesap rozeti
- **v1.4.0** — Drag-drop ek dosya, paste desteği
- **v1.3.0** — Otomatik güncelleme (electron-updater)
- **v1.2.0** — Sistem tepsisi, Windows bildirim
- **v1.1.x** — Auto-config wizard, spam filtresi
- **v1.0.x** — İlk sürüm

---

© 2025 CODEGA — [codega.com.tr](https://codega.com.tr)
