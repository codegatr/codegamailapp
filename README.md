# CODEGA Mail

Yerel masaüstü mail istemcisi - IMAP/POP3 destekli, SQLite tabanlı, OS-level şifreleme.

## Özellikler

- ✉ Çoklu hesap (IMAP/POP3)
- 📬 **Birleşik gelen kutusu (tüm hesaplar tek listede, hesap rozeti ile)**
- 🔒 100% yerel saklama, OS şifreli (Windows DPAPI / macOS Keychain)
- 🛡 Yerel spam filtresi
- 🪂 Auto-config wizard (10 sağlayıcı + custom)
- 📥 Sistem tepsisi + Windows toast bildirim
- ⏱ Arka plan otomatik senkronizasyon
- 📎 Drag-drop ek dosya gönderme (paste desteği dahil)
- 💾 Yedekle / Geri Yükle
- 🚀 Otomatik başlatma + otomatik güncelleme

## Kurulum
```bash
git clone https://github.com/codegatr/codegamailapp.git
cd codegamailapp
npm install
npm run build:win
```

## Sürüm Geçmişi
- **v1.5.0** - Birleşik gelen kutusu, hesap rozeti, okunmamış sayacı
- **v1.4.0** - Drag-drop ek dosya, paste desteği, icon.ico fix
- **v1.3.0** - Otomatik güncelleme (electron-updater)
- **v1.2.0** - Sistem tepsisi, Windows bildirim
- **v1.1.x** - Auto-config wizard, spam filtresi
- **v1.0.x** - İlk sürüm

© 2025 CODEGA - codega.com.tr
