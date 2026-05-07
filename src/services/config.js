const fs = require('fs');
const path = require('path');

class Config {
  constructor(defaultDir) {
    this.defaultDir = defaultDir;
    this.configFile = path.join(defaultDir, 'config.json');
    this.data = {
      dataPath: defaultDir,
      firstRun: true,
      version: '1.6.1',
      // v1.2 yeni ayarlar
      notificationsEnabled: true,
      backgroundSyncMinutes: 5,    // 0 = devre dışı
      closeToTray: true,
      startMinimized: false,
      autoStart: false,            // bilgisayar açılışında başlat
      // v1.3 yeni ayarlar
      autoUpdateCheck: true        // GitHub'dan otomatik güncelleme kontrolü
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
