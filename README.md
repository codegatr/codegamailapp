# CODEGA Mail

Yerel masaüstü mail istemcisi - IMAP/POP3 destekli, SQLite tabanlı, OS-level şifreleme.

## 📥 Kurulum

[**🚀 En son sürümü indir →**](https://github.com/codegatr/codegamailapp/releases/latest)

`CODEGA Mail Setup x.y.z.exe` dosyasını indir, çift tıkla, kur. Bu kadar.

Güncelleme geldiğinde:
- Uygulama açıkken sağ üstte **🚀 Güncelle** rozeti çıkar (otomatik)
- Veya Releases sayfasından yeni .exe'yi indir, kur (üzerine yazar)

## Özellikler

- ✉ Çoklu hesap (IMAP/POP3)
- 📬 Birleşik gelen kutusu (tüm hesaplar tek listede, hesap rozeti ile)
- 🔒 100% yerel saklama, OS şifreli (Windows DPAPI / macOS Keychain)
- 🛡 Yerel spam filtresi
- 🪂 Auto-config wizard (10 sağlayıcı + custom)
- 📥 Sistem tepsisi + Windows toast bildirim
- ⏱ Arka plan otomatik senkronizasyon
- 📎 Drag-drop ek dosya gönderme (paste desteği)
- 💾 Yedekle / Geri Yükle
- 🚀 Otomatik başlatma + otomatik güncelleme

## Geliştirici Akışı

Senin olarak (Yunus) yeni özellik ekleme:

1. Bana özelliği söyle, kodu yazıp `git push origin main` yaparım
2. Tag at: `git tag v1.x.0 && git push origin v1.x.0`
3. **GitHub Actions otomatik:**
   - Windows runner'da `npm install && npm run release:win` çalıştırır (~5 dk)
   - Setup.exe + latest.yml üretir
   - GitHub Release'e otomatik yapıştırır
4. Sen Releases sayfasından .exe indirip kurarsın
5. Mevcut kullanıcılar otomatik bildirim alır

Lokalde Node.js, npm, electron-builder, Visual Studio Build Tools kurmana **gerek yok**.

## Lokal geliştirme (opsiyonel)

```bash
git clone https://github.com/codegatr/codegamailapp.git
cd codegamailapp
npm install
npm start
```

## Sürüm Geçmişi

- **v1.5.1** - Eksik service dosyaları repoya eklendi + GitHub Actions release workflow
- **v1.5.0** - Birleşik gelen kutusu, hesap rozeti
- **v1.4.0** - Drag-drop ek dosya, paste desteği
- **v1.3.0** - Otomatik güncelleme (electron-updater)
- **v1.2.0** - Sistem tepsisi, Windows bildirim
- **v1.1.x** - Auto-config wizard, spam filtresi
- **v1.0.x** - İlk sürüm

© 2025 CODEGA - codega.com.tr
