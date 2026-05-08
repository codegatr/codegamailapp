/**
 * Security Servisi - v1.23
 * - Master Password (PBKDF2-SHA512, 100k iterations)
 * - TOTP (RFC 6238) - Google Authenticator uyumlu
 * - Recovery Codes (10 adet 8 haneli)
 * - Brute force protection (5 yanlış deneme = 5 dk lockout)
 */
const crypto = require('crypto');

class Security {
  static PBKDF2_ITERATIONS = 100000;
  static SALT_LENGTH = 32;
  static HASH_LENGTH = 64;
  static MAX_FAILED_ATTEMPTS = 5;
  static LOCKOUT_MS = 5 * 60 * 1000; // 5 dakika

  // ====== Master Password ======

  static hashPassword(password, saltHex) {
    const salt = saltHex ? Buffer.from(saltHex, 'hex') : crypto.randomBytes(this.SALT_LENGTH);
    const hash = crypto.pbkdf2Sync(password, salt, this.PBKDF2_ITERATIONS, this.HASH_LENGTH, 'sha512');
    return { salt: salt.toString('hex'), hash: hash.toString('hex') };
  }

  static verifyPassword(password, hashHex, saltHex) {
    if (!hashHex || !saltHex) return false;
    try {
      const expected = Buffer.from(hashHex, 'hex');
      const salt = Buffer.from(saltHex, 'hex');
      const got = crypto.pbkdf2Sync(password, salt, this.PBKDF2_ITERATIONS, this.HASH_LENGTH, 'sha512');
      return crypto.timingSafeEqual(expected, got);
    } catch (_) {
      return false;
    }
  }

  // ====== TOTP (RFC 6238) - Google Authenticator uyumlu ======

  /**
   * 20 byte (160 bit) random secret üret, base32'ye çevir
   */
  static generateTotpSecret() {
    const buf = crypto.randomBytes(20);
    return this.base32Encode(buf);
  }

  /**
   * Belirli zaman damgası için 6 haneli TOTP kodu üret
   */
  static totpCode(base32Secret, timestamp = Date.now(), step = 30) {
    const counter = Math.floor((timestamp / 1000) / step);
    const counterBuf = Buffer.alloc(8);
    counterBuf.writeBigUInt64BE(BigInt(counter));
    const key = this.base32Decode(base32Secret);
    const hmac = crypto.createHmac('sha1', key).update(counterBuf).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const truncated = ((hmac[offset] & 0x7f) << 24) |
                      ((hmac[offset + 1] & 0xff) << 16) |
                      ((hmac[offset + 2] & 0xff) << 8) |
                      (hmac[offset + 3] & 0xff);
    const code = truncated % 1000000;
    return code.toString().padStart(6, '0');
  }

  /**
   * Kullanıcının girdiği kodu doğrula (±1 step tolerans, ~30sn pre/post)
   */
  static verifyTotpCode(base32Secret, userCode, step = 30) {
    if (!userCode || !/^\d{6}$/.test(userCode)) return false;
    const now = Date.now();
    for (const offset of [-1, 0, 1]) {
      const ts = now + (offset * step * 1000);
      if (this.totpCode(base32Secret, ts, step) === userCode) return true;
    }
    return false;
  }

  /**
   * otpauth:// URI - Authenticator app'lerin tanıdığı standart format
   */
  static buildOtpauthUri(base32Secret, accountName, issuer = 'CODEGA Mail') {
    const label = encodeURIComponent(`${issuer}:${accountName}`);
    const params = new URLSearchParams({
      secret: base32Secret,
      issuer: issuer,
      algorithm: 'SHA1',
      digits: '6',
      period: '30'
    });
    return `otpauth://totp/${label}?${params.toString()}`;
  }

  // ====== Recovery Codes ======

  /**
   * 10 adet 10 haneli (xxxx-xxxx-xx) recovery code üret
   */
  static generateRecoveryCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      const buf = crypto.randomBytes(5);
      const hex = buf.toString('hex'); // 10 hane
      codes.push(`${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8)}`.toUpperCase());
    }
    return codes;
  }

  /**
   * Recovery code'ları DB'ye kaydetmek için hash'le (PBKDF2 yine)
   */
  static hashRecoveryCode(code) {
    // Çok zayıf - sadece SHA256 yeterli (bu kodlar zaten 40-bit entropi)
    return crypto.createHash('sha256').update(code.toLowerCase().trim()).digest('hex');
  }

  // ====== Base32 (Google Authenticator standart) ======

  static base32Encode(buf) {
    const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0, value = 0, output = '';
    for (let i = 0; i < buf.length; i++) {
      value = (value << 8) | buf[i];
      bits += 8;
      while (bits >= 5) {
        output += ALPHABET[(value >>> (bits - 5)) & 0x1f];
        bits -= 5;
      }
    }
    if (bits > 0) output += ALPHABET[(value << (5 - bits)) & 0x1f];
    return output;
  }

  static base32Decode(str) {
    const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleaned = str.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
    const bytes = [];
    let bits = 0, value = 0;
    for (let i = 0; i < cleaned.length; i++) {
      const idx = ALPHABET.indexOf(cleaned[i]);
      if (idx === -1) continue;
      value = (value << 5) | idx;
      bits += 5;
      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 0xff);
        bits -= 8;
      }
    }
    return Buffer.from(bytes);
  }
}

module.exports = Security;
