/**
 * Şifre saklama servisi.
 * Electron'un safeStorage API'sini kullanır:
 *   - Windows: DPAPI (kullanıcı hesabına bağlı)
 *   - macOS: Keychain
 *   - Linux: kwallet/gnome-libsecret (varsa)
 *
 * Bu sayede SQLite dosyası başka bir bilgisayara kopyalansa bile
 * hesap şifreleri çözülemez.
 */
class Crypto {
  constructor(safeStorage) {
    this.safe = safeStorage;
    if (!safeStorage.isEncryptionAvailable()) {
      console.warn('[crypto] OS düzeyi şifreleme yok, base64 fallback kullanılıyor');
      this.fallback = true;
    }
  }

  encrypt(plain) {
    if (plain == null) return null;
    if (this.fallback) {
      return Buffer.from('B64::' + Buffer.from(plain, 'utf8').toString('base64'));
    }
    return this.safe.encryptString(plain);
  }

  decrypt(buffer) {
    if (buffer == null) return null;
    // sql.js BLOB'u Uint8Array döndürür - Buffer'a çevir
    if (buffer instanceof Uint8Array && !Buffer.isBuffer(buffer)) {
      buffer = Buffer.from(buffer);
    }
    if (this.fallback) {
      const s = buffer.toString('utf8');
      if (s.startsWith('B64::')) return Buffer.from(s.slice(5), 'base64').toString('utf8');
      return s;
    }
    return this.safe.decryptString(buffer);
  }
}

module.exports = Crypto;
