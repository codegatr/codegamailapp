# CODEGA Mail

Yerel masaüstü mail istemcisi - IMAP/POP3 destekli, SQLite tabanlı, OS-level şifreleme.

## Özellikler

- ✉ Çoklu hesap (IMAP/POP3)
- 🔒 100% yerel saklama, OS şifreli (Windows DPAPI / macOS Keychain)
- 🛡 Yerel spam filtresi
- 🪂 Auto-config wizard (Gmail, Outlook, Yandex, iCloud, Yahoo + 5 sağlayıcı)
- 📥 Sistem tepsisi + Windows toast bildirim
- ⏱ Arka plan otomatik senkronizasyon
- 💾 Yedekle / Geri Yükle (.mailbackup formatı)
- 🚀 Bilgisayar açılışında otomatik başlatma
- 🔄 Otomatik güncelleme (v1.3.0+)

## Kurulum

```bash
git clone https://github.com/codegatr/codegamailapp.git
cd codegamailapp
npm install
npm start            # geliştirme modu
npm run build:win    # Windows installer üret
```

## Sürüm Geçmişi

- **v1.2.0** - Sistem tepsisi, Windows bildirim, arka plan sync, autostart
- **v1.1.x** - Auto-config wizard, spam filtresi, klasör yönetimi
- **v1.0.x** - İlk sürüm, IMAP/POP3 temel desteği

© 2025 CODEGA - codega.com.tr
