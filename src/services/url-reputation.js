/**
 * URL Reputation Servisi
 * - Heuristik kontroller (offline, hızlı)
 * - VirusTotal URL endpoint (opsiyonel, mevcut API key kullanılır)
 *
 * Heuristik kuralları:
 *   1. IP adresi URL                → critical
 *   2. Typosquatting (paypa1, vs)   → critical
 *   3. @ işareti tricki              → critical
 *   4. Marka taklidi (paypal-secure) → high
 *   5. Punycode (xn--)               → medium
 *   6. URL shortener (bit.ly vs)     → low
 *   7. Şüpheli TLD (.tk .xyz vs)     → medium
 *   8. HTTP login sayfaları          → medium
 *   9. Çok fazla subdomain           → low
 */
const https = require('https');

class UrlReputation {
  // URL kısaltıcılar - gerçek hedefi gizler
  static SHORTENERS = new Set([
    'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd',
    'buff.ly', 'lnkd.in', 'fb.me', 'tiny.cc', 'shorturl.at',
    'rebrand.ly', 'cutt.ly', 'rb.gy', 't.ly', 'shrtfly.com',
    'shrt.ly', 'soo.gd', 'mcaf.ee', 'tr.im', 'tinyarrows.com'
  ]);

  // Phishing'de yaygın ücretsiz/şüpheli TLD'ler
  static SUSPICIOUS_TLDS = new Set([
    'tk', 'ml', 'ga', 'cf', 'gq',  // Freenom (kapanmış olsa da hâlâ aktif)
    'top', 'xyz', 'click', 'download', 'stream', 'work', 'pw',
    'cam', 'rest', 'fit', 'icu', 'date', 'racing', 'review',
    'trade', 'win', 'science', 'cricket', 'party', 'faith',
    'accountant', 'loan', 'men', 'live', 'host', 'space'
  ]);

  // Bilinen markalar ve typosquatting varyantları
  static BRAND_TYPOS = {
    'paypal.com': ['paypa1.com', 'paypall.com', 'paypa1l.com', 'paypal-secure.com', 'paypall.com', 'paypol.com'],
    'apple.com':  ['app1e.com', 'aple.com', 'appie.com', 'aapple.com'],
    'microsoft.com': ['micros0ft.com', 'mircosoft.com', 'microsfot.com', 'micrcsoft.com'],
    'google.com': ['g00gle.com', 'gooogle.com', 'gogle.com', 'googel.com'],
    'amazon.com': ['amaz0n.com', 'amason.com', 'amzon.com', 'amazn.com'],
    'facebook.com': ['faceb00k.com', 'facbook.com', 'faceboook.com', 'facebok.com'],
    'instagram.com': ['lnstagram.com', 'instagran.com', 'instergram.com'],
    'netflix.com': ['netfllx.com', 'netfllix.com', 'netfllix.tv'],
    'twitter.com': ['twltter.com', 'twiter.com'],
    'whatsapp.com': ['whatsap.com', 'wha7sapp.com'],
    'gmail.com': ['gmai1.com', 'gmal.com', 'gmial.com'],
    'turkcell.com.tr': ['turkce11.com', 'turcell.com'],
    'ziraatbank.com.tr': ['ziraatbankk.com', 'zirat.com.tr'],
    'akbank.com': ['akbnk.com', 'akbank-tr.com'],
    'garantibbva.com.tr': ['garanti-bbva.com', 'garantibbav.com'],
    'isbank.com.tr': ['isbnk.com', 'isbank-tr.com'],
    'gib.gov.tr': ['gib-gov.com', 'gib.tr.online'],
    'turkiye.gov.tr': ['turkye.gov.tr', 'turkiye-gov.com', 'edevlet-tr.com']
  };

  // Marka isimleri (domain o markaya ait olmadığında uyarı)
  static BRAND_KEYWORDS = [
    'paypal', 'apple', 'microsoft', 'google', 'amazon', 'facebook',
    'netflix', 'instagram', 'whatsapp', 'twitter', 'linkedin',
    'banka', 'bank', 'ziraat', 'akbank', 'garanti', 'isbank',
    'turkcell', 'vodafone', 'turknet', 'gib', 'edevlet',
    'turk-telekom', 'turkish-airlines'
  ];

  /**
   * URL'i heuristik olarak analiz et (offline)
   */
  static analyzeHeuristic(url) {
    const reasons = [];
    let risk = 'safe';
    let category = 'normal';

    let parsed;
    try {
      parsed = new URL(url);
    } catch (e) {
      return {
        risk: 'medium',
        category: 'invalid_url',
        reasons: ['Geçersiz URL formatı'],
        url
      };
    }

    const host = parsed.hostname.toLowerCase();
    const proto = parsed.protocol.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();
    const fullUrl = url.toLowerCase();

    // 1. IP adresi (klasik phishing)
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
        /^\[?[0-9a-f:]+\]?$/i.test(host)) {
      risk = 'critical';
      category = 'ip_address';
      reasons.push('URL hostname olarak IP adresi içeriyor (klasik phishing tekniği)');
    }

    // 2. @ işareti tricki: http://google.com@evil.com → evil.com'a gider
    const protocolEnd = url.indexOf('://');
    if (protocolEnd > 0) {
      const afterProto = url.slice(protocolEnd + 3);
      const beforeSlash = afterProto.split(/[/?#]/)[0];
      if (beforeSlash.includes('@')) {
        risk = 'critical';
        category = 'at_sign_trick';
        reasons.push('URL\'de @ işareti var - kullanıcıyı kandırmak için klasik hile (gerçek hedef @ sonrası)');
      }
    }

    // 3. Typosquatting (bilinen brand'in yazım hatalı versiyonu)
    for (const [real, typos] of Object.entries(this.BRAND_TYPOS)) {
      if (typos.includes(host) || typos.some(t => host.endsWith('.' + t))) {
        risk = 'critical';
        category = 'typosquatting';
        reasons.push(`TYPOSQUATTING: "${host}" - "${real}" taklidi`);
        break;
      }
    }

    // 4. Marka taklidi (paypal-secure.com gibi - paypal'ın resmi domaini değil)
    if (risk !== 'critical') {
      for (const brand of this.BRAND_KEYWORDS) {
        if (host.includes(brand)) {
          // Resmi marka domaini mi kontrol et
          const isOfficial = Object.keys(this.BRAND_TYPOS).some(real => {
            const baseDomain = real;
            return host === baseDomain || host.endsWith('.' + baseDomain);
          });
          if (!isOfficial) {
            if (risk === 'safe' || risk === 'low' || risk === 'medium') risk = 'high';
            reasons.push(`"${brand}" markası geçiyor ama domain (${host}) bu markanın resmi sitesi değil`);
            break;
          }
        }
      }
    }

    // 5. Punycode (IDN homograph attack - аррӏе.com gibi Kiril/Latin karışık)
    if (host.includes('xn--')) {
      if (risk === 'safe' || risk === 'low') risk = 'medium';
      reasons.push('Punycode (xn--) içeren domain - IDN homograph saldırısı şüphesi');
    }

    // 6. URL kısaltıcı (gerçek hedef gizli)
    if (this.SHORTENERS.has(host)) {
      if (risk === 'safe') risk = 'low';
      category = category === 'normal' ? 'shortener' : category;
      reasons.push(`URL kısaltıcı (${host}) - gerçek hedef gizli, dikkatli olun`);
    }

    // 7. Şüpheli TLD
    const tld = host.split('.').pop();
    if (this.SUSPICIOUS_TLDS.has(tld)) {
      if (risk === 'safe' || risk === 'low') risk = 'medium';
      reasons.push(`Şüpheli TLD: .${tld} (ücretsiz/yaygın phishing kullanımı)`);
    }

    // 8. HTTP (HTTPS değil) login/auth sayfası
    if (proto === 'http:' && /\/(login|signin|signup|account|password|verify|auth|wp-admin|cpanel)/i.test(pathname)) {
      if (risk === 'safe') risk = 'medium';
      reasons.push('Şifrelenmemiş (HTTP) bağlantı üzerinde login/giriş sayfası');
    }

    // 9. Çok fazla subdomain
    const dotCount = (host.match(/\./g) || []).length;
    if (dotCount >= 5) {
      if (risk === 'safe') risk = 'low';
      reasons.push(`Anormal seviye subdomain (${dotCount} nokta) - şüpheli yapı`);
    }

    // 10. Çok uzun host (data ile gizleme tekniği)
    if (host.length > 50) {
      if (risk === 'safe') risk = 'low';
      reasons.push('Anormal uzun hostname');
    }

    // 11. URL içinde "secure", "verify", "account" + şüpheli TLD kombinasyonu
    if (/(secure|verify|account|update|confirm)/i.test(host) && this.SUSPICIOUS_TLDS.has(tld)) {
      if (risk !== 'critical' && risk !== 'high') risk = 'high';
      reasons.push('Sosyal mühendislik kelimeleri + şüpheli TLD kombinasyonu');
    }

    return { risk, category, reasons, url, host, proto };
  }

  /**
   * VirusTotal URL endpoint sorgu (mevcut analiz, POST etmeyiz)
   * URL'in base64 (URL-safe) hash'i ile /api/v3/urls/{id} sorgu
   */
  static scanWithVT(url, apiKey) {
    if (!apiKey) return Promise.resolve({ ok: false, noKey: true });

    // VT URL ID: base64(url) - URL-safe, padding'siz
    const urlId = Buffer.from(url).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return new Promise((resolve) => {
      const opts = {
        hostname: 'www.virustotal.com',
        path: `/api/v3/urls/${urlId}`,
        method: 'GET',
        headers: {
          'x-apikey': apiKey,
          'User-Agent': 'CODEGA-Mail/1.0',
          'Accept': 'application/json'
        }
      };

      const req = https.request(opts, (res) => {
        let data = '';
        res.on('data', c => data += c);
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
              if (malicious >= 2) verdict = 'malicious';
              else if (malicious >= 1 || suspicious >= 2) verdict = 'suspicious';

              resolve({
                ok: true,
                found: true,
                verdict,
                malicious, suspicious, harmless, undetected, total,
                title: attrs.title,
                lastAnalysisDate: attrs.last_analysis_date,
                reputation: attrs.reputation || 0,
                categories: Object.values(attrs.categories || {}).slice(0, 3)
              });
            } catch (e) {
              resolve({ ok: false, error: 'Parse: ' + e.message });
            }
          } else if (res.statusCode === 404) {
            resolve({ ok: true, found: false }); // VT'de yok
          } else if (res.statusCode === 429) {
            resolve({ ok: false, rateLimited: true, error: 'VT rate limit' });
          } else if (res.statusCode === 401) {
            resolve({ ok: false, invalidKey: true });
          } else {
            resolve({ ok: false, error: `VT HTTP ${res.statusCode}` });
          }
        });
      });
      req.on('error', e => resolve({ ok: false, error: 'Network: ' + e.message }));
      req.setTimeout(10000, () => { req.destroy(); resolve({ ok: false, error: 'timeout' }); });
      req.end();
    });
  }

  /**
   * Bütünleşik analiz - heuristik + opsiyonel VT
   */
  static async analyze(url, opts = {}) {
    const heuristic = this.analyzeHeuristic(url);
    let vt = null;

    if (opts.apiKey && opts.useVt !== false) {
      try {
        vt = await this.scanWithVT(url, opts.apiKey);
      } catch (e) {
        vt = { ok: false, error: e.message };
      }
    }

    // Sonuçları birleştir
    let finalRisk = heuristic.risk;
    const reasons = [...heuristic.reasons];

    if (vt && vt.ok && vt.found) {
      reasons.push(`VirusTotal: ${vt.malicious} zararlı, ${vt.suspicious} şüpheli (${vt.total} motor)`);
      if (vt.verdict === 'malicious') finalRisk = 'critical';
      else if (vt.verdict === 'suspicious' && finalRisk !== 'critical') finalRisk = 'high';
    }

    return {
      ...heuristic,
      risk: finalRisk,
      reasons,
      vt: vt && vt.ok ? {
        found: vt.found,
        verdict: vt.verdict,
        malicious: vt.malicious,
        suspicious: vt.suspicious,
        total: vt.total
      } : null
    };
  }
}

module.exports = UrlReputation;
