/**
 * AutoConfig Servisi
 * Custom domain'lerin gerçek mail sağlayıcısını otomatik tespit eder.
 *
 * Yöntem 1: DNS MX kayıt sorgusu (en hızlı, %80 vaka)
 *   - yunusaksoy.com.tr → MX: mx.yandex.net → Yandex 360
 *   - sirketim.com → MX: aspmx.l.google.com → Google Workspace
 *   - firmam.com.tr → MX: outlook.com → Microsoft 365
 *
 * Yöntem 2: Mozilla ISPDB (Thunderbird veritabanı, fallback)
 *   - https://autoconfig.thunderbird.net/v1.1/{domain}
 *
 * Yöntem 3: Domain'in kendi autoconfig URL'i (RFC fallback)
 *   - https://autoconfig.{domain}/mail/config-v1.1.xml
 */
const dns = require('dns');
const { promisify } = require('util');
const https = require('https');

const resolveMx = promisify(dns.resolveMx);

class AutoConfig {
  // MX kaydından sağlayıcı tanı
  static MX_PATTERNS = [
    {
      pattern: /yandex\.(net|ru|com|com\.tr)/i,
      provider: 'yandex',
      providerName: 'Yandex 360 / Yandex Mail',
      imap: { host: 'imap.yandex.com', port: 993, secure: true },
      pop3: { host: 'pop.yandex.com', port: 995, secure: true },
      smtp: { host: 'smtp.yandex.com', port: 465, secure: true },
      notes: 'Yandex için **Uygulama Parolası** gereklidir (https://id.yandex.com.tr/security/app-passwords). Normal şifre çalışmaz.',
      icon: '📬',
      color: '#fc3f1d'
    },
    {
      pattern: /(google|gmail|googlemail|aspmx\.l\.google|googleemail)/i,
      provider: 'gmail',
      providerName: 'Google Workspace / Gmail',
      imap: { host: 'imap.gmail.com', port: 993, secure: true },
      pop3: { host: 'pop.gmail.com', port: 995, secure: true },
      smtp: { host: 'smtp.gmail.com', port: 465, secure: true },
      notes: 'Google Workspace için **Uygulama Şifresi** gerekir. 2FA açık olmalı.',
      helpUrl: 'https://myaccount.google.com/apppasswords',
      icon: '📧',
      color: '#ea4335'
    },
    {
      pattern: /(outlook\.com|mail\.protection\.outlook|hotmail|office365|microsoft)/i,
      provider: 'outlook',
      providerName: 'Microsoft 365 / Outlook',
      imap: { host: 'outlook.office365.com', port: 993, secure: true },
      pop3: { host: 'outlook.office365.com', port: 995, secure: true },
      smtp: { host: 'smtp.office365.com', port: 587, secure: false },
      notes: 'Microsoft 365 için **Uygulama Şifresi** gerekir (basic auth devre dışı).',
      helpUrl: 'https://account.microsoft.com/security',
      icon: '📨',
      color: '#0078d4'
    },
    {
      pattern: /zoho\.com/i,
      provider: 'zoho',
      providerName: 'Zoho Mail',
      imap: { host: 'imap.zoho.com', port: 993, secure: true },
      smtp: { host: 'smtp.zoho.com', port: 465, secure: true },
      notes: 'Zoho için Hesap Güvenliği > Uygulama Parolaları üretin.',
      icon: '✉',
      color: '#dc6e08'
    },
    {
      pattern: /(icloud|me\.com|mac\.com)/i,
      provider: 'icloud',
      providerName: 'iCloud Mail',
      imap: { host: 'imap.mail.me.com', port: 993, secure: true },
      smtp: { host: 'smtp.mail.me.com', port: 587, secure: false },
      notes: 'Apple ID için **Uygulamaya Özel Şifre** gerekir.',
      icon: '☁',
      color: '#007aff'
    },
    {
      pattern: /yahoodns\.net|yahoo\.com/i,
      provider: 'yahoo',
      providerName: 'Yahoo Mail',
      imap: { host: 'imap.mail.yahoo.com', port: 993, secure: true },
      smtp: { host: 'smtp.mail.yahoo.com', port: 465, secure: true },
      notes: 'Yahoo için Uygulama Şifresi gereklidir.',
      icon: '💌',
      color: '#6001d2'
    },
    {
      pattern: /mailgun\.org/i,
      provider: 'mailgun',
      providerName: 'Mailgun (transaktif)',
      notes: 'Bu domain Mailgun üzerinden mail GÖNDERMEK için kullanılıyor — alıcı kutusu farklı bir sağlayıcıda olabilir.'
    },
    {
      pattern: /amazonses\.com|amazonaws\.com/i,
      provider: 'aws-ses',
      providerName: 'Amazon SES',
      notes: 'Amazon SES sadece gönderim için - alıcı kutusu farklı bir yerde.'
    },
    {
      pattern: /protonmail\.ch/i,
      provider: 'protonmail',
      providerName: 'ProtonMail',
      notes: 'ProtonMail için **ProtonMail Bridge** yazılımı kurmanız gerekir, sonra localhost:1143 (IMAP) ve localhost:1025 (SMTP) kullanılır.'
    },
    {
      pattern: /natrohost|turhost|isimtescil|natro|hosting\.com\.tr/i,
      provider: 'turkish-hosting',
      providerName: 'Türk Hosting Sağlayıcısı',
      notes: 'Türk hosting sağlayıcısı tespit edildi. cPanel/DirectAdmin tipik ayarlar denenecek.'
    }
  ];

  /**
   * DNS MX sorgusundan sağlayıcı tespiti
   */
  static async detectFromMX(domain) {
    try {
      const records = await resolveMx(domain);
      if (!records || !records.length) return null;
      records.sort((a, b) => a.priority - b.priority);

      for (const r of records) {
        const exchange = (r.exchange || '').toLowerCase();
        for (const p of this.MX_PATTERNS) {
          if (p.pattern.test(exchange)) {
            // Türk hosting için domain'in kendi sunucusunu kullan
            if (p.provider === 'turkish-hosting') {
              return {
                provider: 'custom',
                providerName: p.providerName,
                domain,
                imap: { host: 'mail.' + domain, port: 993, secure: true },
                pop3: { host: 'mail.' + domain, port: 995, secure: true },
                smtp: { host: 'mail.' + domain, port: 465, secure: true },
                notes: p.notes,
                source: 'mx',
                mxRecord: exchange
              };
            }
            return {
              provider: p.provider,
              providerName: p.providerName,
              domain,
              imap: p.imap,
              pop3: p.pop3,
              smtp: p.smtp,
              notes: p.notes,
              helpUrl: p.helpUrl,
              icon: p.icon,
              color: p.color,
              source: 'mx',
              mxRecord: exchange
            };
          }
        }
      }
      // MX bulundu ama bilinen patternlere uymuyor
      return {
        provider: 'unknown',
        providerName: 'Bilinmeyen sağlayıcı',
        domain,
        source: 'mx',
        mxRecord: records[0].exchange,
        // MX'in kendisini deneyelim varsayılan port'larla
        imap: { host: records[0].exchange.replace(/^mx\.|^mail\./, 'imap.'), port: 993, secure: true },
        smtp: { host: records[0].exchange.replace(/^mx\.|^mail\./, 'smtp.'), port: 465, secure: true },
        notes: `MX kaydı: ${records[0].exchange} - bilinen sağlayıcılar arasında değil. Manuel kontrol önerilir.`
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * HTTPS GET helper
   */
  static fetchUrl(url, timeout = 8000) {
    return new Promise((resolve, reject) => {
      const req = https.get(url, {
        timeout,
        headers: { 'User-Agent': 'CODEGA-Mail/1.0' }
      }, (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    });
  }

  /**
   * Mozilla ISPDB sorgusu (Thunderbird veritabanı)
   */
  static async detectFromISPDB(domain) {
    try {
      const xml = await this.fetchUrl(`https://autoconfig.thunderbird.net/v1.1/${domain}`);
      return this.parseAutoconfigXml(xml, domain);
    } catch (e) {
      return null;
    }
  }

  /**
   * Domain'in kendi autoconfig URL'i (RFC autoconfig)
   */
  static async detectFromDomainAutoconfig(domain) {
    const urls = [
      `https://autoconfig.${domain}/mail/config-v1.1.xml`,
      `https://${domain}/.well-known/autoconfig/mail/config-v1.1.xml`,
      `https://autoconfig.${domain}/mail/config-v1.1.xml?emailaddress=user@${domain}`
    ];
    for (const url of urls) {
      try {
        const xml = await this.fetchUrl(url, 4000);
        const result = this.parseAutoconfigXml(xml, domain);
        if (result) return Object.assign(result, { source: 'domain-autoconfig' });
      } catch (_) {}
    }
    return null;
  }

  /**
   * Mozilla autoconfig XML parser (regex tabanlı, Node'da DOMParser yok)
   */
  static parseAutoconfigXml(xml, domain) {
    if (!xml || xml.length < 100) return null;

    const findServer = (type) => {
      const re = new RegExp(
        `<incomingServer\\s+type=["']${type}["'][^>]*>([\\s\\S]*?)</incomingServer>`,
        'i'
      );
      const m = xml.match(re);
      if (!m) return null;
      const inner = m[1];
      const host = (inner.match(/<hostname>([^<]+)<\/hostname>/i) || [])[1];
      const portStr = (inner.match(/<port>(\d+)<\/port>/i) || [])[1];
      const socketType = (inner.match(/<socketType>([^<]+)<\/socketType>/i) || [])[1];
      if (!host || !portStr) return null;
      return {
        host: host.replace(/%EMAILDOMAIN%/g, domain || ''),
        port: parseInt(portStr, 10),
        secure: /^SSL$/i.test(socketType || '')
      };
    };

    const findSmtp = () => {
      const m = xml.match(/<outgoingServer\s+type=["']smtp["'][^>]*>([\s\S]*?)<\/outgoingServer>/i);
      if (!m) return null;
      const inner = m[1];
      const host = (inner.match(/<hostname>([^<]+)<\/hostname>/i) || [])[1];
      const portStr = (inner.match(/<port>(\d+)<\/port>/i) || [])[1];
      const socketType = (inner.match(/<socketType>([^<]+)<\/socketType>/i) || [])[1];
      if (!host || !portStr) return null;
      return {
        host: host.replace(/%EMAILDOMAIN%/g, domain || ''),
        port: parseInt(portStr, 10),
        secure: /^SSL$/i.test(socketType || '')
      };
    };

    const imap = findServer('imap');
    const pop3 = findServer('pop3');
    const smtp = findSmtp();

    if (!imap && !pop3) return null;

    const displayName = (xml.match(/<displayName>([^<]+)<\/displayName>/i) || [])[1];
    const shortName = (xml.match(/<displayShortName>([^<]+)<\/displayShortName>/i) || [])[1];

    return {
      provider: shortName ? shortName.toLowerCase().replace(/\s+/g, '-') : 'ispdb',
      providerName: displayName || shortName || 'ISPDB sonucu',
      domain,
      imap, pop3, smtp,
      source: 'ispdb'
    };
  }

  /**
   * Bütünleşik tespit - MX → ISPDB → Domain autoconfig
   */
  static async detect(email) {
    if (!email || !email.includes('@')) return null;
    const domain = email.split('@')[1].toLowerCase().trim();
    if (!domain) return null;

    // 1. DNS MX sorgusu (en hızlı, ~100ms)
    const mx = await this.detectFromMX(domain);
    if (mx && mx.provider !== 'unknown' && mx.imap) {
      return mx;
    }

    // 2. Mozilla ISPDB (büyük veritabanı, ~500ms)
    const ispdb = await this.detectFromISPDB(domain);
    if (ispdb) return ispdb;

    // 3. Domain'in kendi autoconfig'i
    const dom = await this.detectFromDomainAutoconfig(domain);
    if (dom) return dom;

    // MX bulundu ama bilinmeyen
    if (mx) return mx;

    return null;
  }
}

module.exports = AutoConfig;
