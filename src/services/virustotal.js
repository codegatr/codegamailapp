/**
 * VirusTotal API v3 Client
 * Hash bazlı sorgu (dosya upload edilmez - gizlilik korunur)
 *
 * Ücretsiz tier limitleri:
 * - 4 sorgu/dakika
 * - 500 sorgu/gün
 *
 * API key alma: https://www.virustotal.com/gui/join-us
 */
const crypto = require('crypto');
const https = require('https');

class VirusTotalScanner {
  /**
   * SHA-256 hash hesapla
   */
  static computeHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Hash ile VT'ye sorgu at
   * @param {string} sha256
   * @param {string} apiKey
   * @returns {Promise<object>}
   */
  static scanByHash(sha256, apiKey) {
    if (!apiKey) return Promise.resolve({ ok: false, error: 'API anahtarı tanımlı değil' });
    if (!sha256 || sha256.length !== 64) return Promise.resolve({ ok: false, error: 'Geçersiz hash' });

    return new Promise((resolve) => {
      const opts = {
        hostname: 'www.virustotal.com',
        path: `/api/v3/files/${sha256}`,
        method: 'GET',
        headers: {
          'x-apikey': apiKey,
          'User-Agent': 'CODEGA-Mail/1.0',
          'Accept': 'application/json'
        }
      };

      const req = https.request(opts, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const json = JSON.parse(data);
              const attrs = (json.data && json.data.attributes) || {};
              const stats = attrs.last_analysis_stats || {};
              const malicious = stats.malicious || 0;
              const suspicious = stats.suspicious || 0;
              const harmless = stats.harmless || 0;
              const undetected = stats.undetected || 0;
              const total = malicious + suspicious + harmless + undetected;

              let verdict = 'clean';
              if (malicious >= 3) verdict = 'malicious';
              else if (malicious >= 1 || suspicious >= 3) verdict = 'suspicious';
              else if (suspicious >= 1) verdict = 'low_risk';

              resolve({
                ok: true,
                found: true,
                sha256,
                verdict,
                malicious,
                suspicious,
                harmless,
                undetected,
                total,
                typeDescription: attrs.type_description || null,
                meaningfulName: attrs.meaningful_name || null,
                size: attrs.size || null,
                firstSubmissionDate: attrs.first_submission_date || null,
                lastAnalysisDate: attrs.last_analysis_date || null,
                lastModificationDate: attrs.last_modification_date || null,
                reputation: attrs.reputation || 0,
                names: (attrs.names || []).slice(0, 5)
              });
            } catch (e) {
              resolve({ ok: false, error: 'JSON parse hatası: ' + e.message });
            }
          } else if (res.statusCode === 404) {
            // VT'de bu hash yok - dosya hiç sorgulanmamış / yeni
            resolve({ ok: true, found: false, sha256, verdict: 'unknown' });
          } else if (res.statusCode === 429) {
            resolve({ ok: false, rateLimited: true, error: 'VirusTotal hız limiti (4/dk, 500/gün) aşıldı' });
          } else if (res.statusCode === 401) {
            resolve({ ok: false, invalidKey: true, error: 'Geçersiz VT API anahtarı' });
          } else {
            resolve({ ok: false, error: `VT HTTP ${res.statusCode}` });
          }
        });
      });

      req.on('error', (e) => resolve({ ok: false, error: 'Network: ' + e.message }));
      req.setTimeout(15000, () => {
        req.destroy();
        resolve({ ok: false, error: 'Zaman aşımı (15sn)' });
      });
      req.end();
    });
  }

  /**
   * API key geçerli mi test et (kullanıcının kendi info'sunu çek)
   */
  static testApiKey(apiKey) {
    if (!apiKey) return Promise.resolve({ ok: false, error: 'Boş key' });
    return new Promise((resolve) => {
      const opts = {
        hostname: 'www.virustotal.com',
        path: '/api/v3/users/' + apiKey,
        method: 'GET',
        headers: { 'x-apikey': apiKey, 'User-Agent': 'CODEGA-Mail/1.0' }
      };
      const req = https.request(opts, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const json = JSON.parse(data);
              const a = (json.data && json.data.attributes) || {};
              resolve({
                ok: true,
                user: a.first_name || a.user_id || 'Anonim',
                email: a.email,
                quotas: a.quotas || null
              });
            } catch (e) { resolve({ ok: false, error: 'Parse hatası' }); }
          } else if (res.statusCode === 401) {
            resolve({ ok: false, error: 'Geçersiz API anahtarı' });
          } else {
            resolve({ ok: false, error: `HTTP ${res.statusCode}` });
          }
        });
      });
      req.on('error', (e) => resolve({ ok: false, error: e.message }));
      req.setTimeout(10000, () => { req.destroy(); resolve({ ok: false, error: 'Zaman aşımı' }); });
      req.end();
    });
  }
}

module.exports = VirusTotalScanner;
