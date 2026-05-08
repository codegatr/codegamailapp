const fs = require('fs');
const path = require('path');

class Config {
  constructor(defaultDir) {
    this.defaultDir = defaultDir;
    this.configFile = path.join(defaultDir, 'config.json');
    this.data = {
      dataPath: defaultDir,
      firstRun: true,
      version: '1.46.0',
      // v1.2 yeni ayarlar
      notificationsEnabled: true,
      backgroundSyncMinutes: 5,    // 0 = devre dışı
      closeToTray: true,
      startMinimized: false,
      autoStart: false,            // bilgisayar açılışında başlat
      // v1.3 yeni ayarlar
      autoUpdateCheck: true,       // GitHub'dan otomatik güncelleme kontrolü
      // v1.9 yeni ayarlar
      conversationView: false,     // Konuşma görünümü (Re: zincirleri grupla)
      // v1.13: VirusTotal entegrasyonu
      virustotalApiKey: '',        // Boş = devre dışı
      virustotalAutoScan: true,    // Medium+ riskli ekler için otomatik tarama
      // v1.15: URL Reputation
      urlScanWithVt: true,         // VT API key varsa URL'leri de VT ile tara
      // v1.44: OAuth2 client ID'leri (UI'dan kullanıcı doldurur)
      oauth2MicrosoftClientId: '',
      oauth2GoogleClientId: '',
      // v1.46: Read receipt (RFC 3798 MDN)
      readReceiptRequestDefault: false,    // Compose'da varsayılan açık mı
      readReceiptResponsePolicy: 'ask',    // 'always' | 'never' | 'ask'
      readReceiptIgnoredSenders: [],       // 'asla sorma' işaretli adresler
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.configFile)) {
        const raw = fs.readFileSync(this.configFile, 'utf8');
        const parsed = JSON.parse(raw);
        Object.assign(this.data, parsed);
      } else {
        if (!fs.existsSync(this.defaultDir)) {
          fs.mkdirSync(this.defaultDir, { recursive: true });
        }
        this.save();
      }
    } catch (e) {
      console.warn('Config yükleme hatası:', e.message);
    }
  }

  save() {
    try {
      if (!fs.existsSync(this.defaultDir)) {
        fs.mkdirSync(this.defaultDir, { recursive: true });
      }
      fs.writeFileSync(this.configFile, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('Config kaydetme hatası:', e.message);
    }
  }

  get(key) { return this.data[key]; }

  set(key, value) {
    this.data[key] = value;
    this.save();
  }

  // Birden çok ayarı tek seferde değiştirip bir kere kaydetme
  setMany(updates) {
    Object.assign(this.data, updates);
    this.save();
  }

  getDataPath() {
    const p = this.data.dataPath || this.defaultDir;
    if (!fs.existsSync(p)) {
      try { fs.mkdirSync(p, { recursive: true }); } catch (_) {}
    }
    return p;
  }

  changeDataPath(newPath) {
    if (!fs.existsSync(newPath)) {
      fs.mkdirSync(newPath, { recursive: true });
    }
    const oldPath = this.getDataPath();
    if (path.resolve(newPath) === path.resolve(oldPath)) return;

    const dbFile = path.join(oldPath, 'codega-mail.db');
    if (fs.existsSync(dbFile)) {
      const newDbFile = path.join(newPath, 'codega-mail.db');
      fs.copyFileSync(dbFile, newDbFile);
      fs.renameSync(dbFile, dbFile + '.moved-' + Date.now());
    }

    this.data.dataPath = newPath;
    this.save();
  }
}

module.exports = Config;
