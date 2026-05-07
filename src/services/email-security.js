/**
 * EmailSecurity - DKIM/SPF/DMARC parsing + phishing göstergeleri
 */
class EmailSecurity {
  /**
   * Authentication-Results header'ını parse et
   * @param {string|object} headersInput - raw headers string veya parsed.headers Map
   * @returns {object} { dkim, spf, dmarc }
   */
  static parseAuthResults(headersInput) {
    let raw = '';
    if (!headersInput) return { dkim: null, spf: null, dmarc: null };
    if (typeof headersInput === 'string') {
      raw = headersInput;
    } else if (headersInput instanceof Map) {
      const v = headersInput.get('authentication-results') || headersInput.get('Authentication-Results');
      raw = Array.isArray(v) ? v.join('\n') : (v || '');
    } else if (typeof headersInput === 'object') {
      raw = headersInput['authentication-results'] || headersInput['Authentication-Results'] || '';
      if (Array.isArray(raw)) raw = raw.join('\n');
    }
    if (!raw) return { dkim: null, spf: null, dmarc: null };

    const lower = String(raw).toLowerCase();
    const dkimMatch = lower.match(/dkim=(pass|fail|neutral|none|temperror|permerror|policy)/);
    const spfMatch = lower.match(/spf=(pass|fail|softfail|neutral|none|temperror|permerror)/);
    const dmarcMatch = lower.match(/dmarc=(pass|fail|none|temperror|permerror|bestguesspass)/);

    return {
      dkim: dkimMatch ? dkimMatch[1] : null,
      spf: spfMatch ? spfMatch[1] : null,
      dmarc: dmarcMatch ? dmarcMatch[1] : null
    };
  }

  /**
   * Phishing göstergeleri tespit
   * @param {object} message - parsed message
   * @returns {object} { score, flags, reasons }
   */
  static detectPhishing(message) {
    let score = 0;
    const flags = {};
    const reasons = [];

    const fromAddr = String(message.from_addr || '').toLowerCase();
    const fromName = String(message.from_name || '');
    const replyTo = String(message.reply_to_addr || '').toLowerCase();
    const subject = String(message.subject || '');
    const bodyText = String(message.body_text || '');
    const bodyHtml = String(message.body_html || '');

    // 1. Reply-To farklı domain (büyük tehlike işareti)
    if (replyTo && fromAddr) {
      const fromDomain = fromAddr.split('@')[1] || '';
      const replyDomain = replyTo.split('@')[1] || '';
      if (fromDomain && replyDomain && fromDomain !== replyDomain) {
        flags.replyToMismatch = true;
        score += 30;
        reasons.push(`Reply-To farklı domain: From=${fromDomain}, ReplyTo=${replyDomain}`);
      }
    }

    // 2. Display name içinde tanınmış marka, gerçek mail farklı
    const trustedBrands = [
      'paypal', 'apple', 'microsoft', 'google', 'amazon', 'facebook',
      'netflix', 'instagram', 'whatsapp', 'twitter', 'linkedin', 'github',
      'banka', 'bank', 'ziraat', 'akbank', 'garanti', 'isbank', 'yapikredi',
      'turkcell', 'turknet', 'vodafone', 'türk telekom', 'turkish airlines',
      'gib', 'sgk', 'e-devlet', 'edevlet'
    ];
    const fromNameLower = fromName.toLowerCase();
    const fromDomain = fromAddr.split('@')[1] || '';
    for (const brand of trustedBrands) {
      if (fromNameLower.includes(brand) && !fromDomain.includes(brand)) {
        flags.brandImpersonation = true;
        score += 40;
        reasons.push(`"${brand}" markası gönderici adında ama domain (${fromDomain}) bu markaya ait değil`);
        break;
      }
    }

    // 3. Display name email gibi görünüyor (örn: name="support@paypal.com" ama gerçek mail farklı)
    if (fromName.includes('@') && fromName !== fromAddr) {
      const m = fromName.match(/[\w.+-]+@[\w.-]+/);
      if (m && m[0].toLowerCase() !== fromAddr) {
        flags.nameContainsDifferentEmail = true;
        score += 35;
        reasons.push(`Display name'de farklı email (${m[0]}) görünüyor, gerçek gönderici: ${fromAddr}`);
      }
    }

    // 4. URL'lerde IP adresi (phishing klasik göstergesi)
    const allText = bodyText + ' ' + bodyHtml;
    const ipUrlPattern = /https?:\/\/(?:\d{1,3}\.){3}\d{1,3}/gi;
    const ipUrls = allText.match(ipUrlPattern);
    if (ipUrls && ipUrls.length > 0) {
      flags.ipAddressUrls = true;
      score += 25;
      reasons.push(`IP adresi içeren URL(ler): ${ipUrls.slice(0, 2).join(', ')}`);
    }

    // 5. URL display vs actual mismatch (HTML mailde)
    if (bodyHtml) {
      const linkPattern = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]{5,})<\/a>/gi;
      let match;
      const mismatches = [];
      while ((match = linkPattern.exec(bodyHtml)) !== null && mismatches.length < 3) {
        const href = match[1].toLowerCase();
        const text = match[2].toLowerCase().trim();
        // Eğer link text bir URL gibi görünüyor ama href farklıysa
        if (/^https?:\/\//.test(text)) {
          try {
            const textHost = new URL(text).hostname;
            const hrefHost = new URL(href.startsWith('http') ? href : 'http://' + href).hostname;
            if (textHost !== hrefHost && !hrefHost.endsWith('.' + textHost) && !textHost.endsWith('.' + hrefHost)) {
              mismatches.push({ text: textHost, actual: hrefHost });
            }
          } catch (_) {}
        }
      }
      if (mismatches.length > 0) {
        flags.urlMismatch = true;
        score += 35;
        reasons.push(`Bağlantı metni farklı URL gösteriyor: ${mismatches.map(m => `"${m.text}" → ${m.actual}`).join('; ')}`);
      }
    }

    // 6. Acil/baskı yapıcı dil (phishing klişesi)
    const urgentPatterns = [
      /hesab[ıi]n[ıi]z\s+(?:askıya|bloke|donduruldu|kapatılacak)/i,
      /(?:24|48)\s*saat\s+i[çc]inde/i,
      /(?:acil|hemen|derhal|şimdi)\s+(?:doğrulay[ıi]n|onaylay[ıi]n|tıklay[ıi]n)/i,
      /verify\s+your\s+account/i,
      /your\s+account\s+(?:will be|has been)\s+(?:suspended|locked|disabled)/i,
      /click\s+here\s+(?:immediately|now|to verify)/i,
      /immediate\s+action\s+required/i,
      /şifrenizi\s+yenileyin/i,
      /son\s+uyarı/i
    ];
    let urgentHit = 0;
    for (const p of urgentPatterns) {
      if (p.test(bodyText) || p.test(subject)) urgentHit++;
    }
    if (urgentHit > 0) {
      flags.urgentLanguage = urgentHit;
      score += Math.min(20, urgentHit * 10);
      reasons.push(`Acil/baskı yapıcı dil (${urgentHit} eşleşme)`);
    }

    // 7. Gönderici domain typosquatting (paypal vs paypa1, microsoft vs micros0ft)
    if (fromDomain) {
      const suspiciousChars = /[0-9]/.test(fromDomain.split('.')[0]) && fromDomain.split('.')[0].length > 6;
      const knownTypos = [
        ['paypa1', 'paypal'], ['micros0ft', 'microsoft'], ['app1e', 'apple'],
        ['amaz0n', 'amazon'], ['g00gle', 'google'], ['faceb00k', 'facebook']
      ];
      for (const [typo, real] of knownTypos) {
        if (fromDomain.includes(typo)) {
          flags.typosquatting = true;
          score += 50;
          reasons.push(`Yazım hatalı domain: ${fromDomain} (${real} taklidi olabilir)`);
          break;
        }
      }
    }

    // 8. Yüksek miktarda dış URL
    const allUrls = (allText.match(/https?:\/\/\S+/gi) || []);
    if (allUrls.length > 10) {
      flags.manyUrls = allUrls.length;
      score += Math.min(15, allUrls.length);
      reasons.push(`${allUrls.length} URL içeriyor (çok fazla)`);
    }

    return {
      score: Math.min(100, score),
      flags,
      reasons,
      isPhishingSuspected: score >= 50
    };
  }

  /**
   * Bütünleşik güvenlik raporu
   */
  static analyzeMessage(message, headersRaw) {
    const auth = this.parseAuthResults(headersRaw);
    const phishing = this.detectPhishing(message);

    let combinedFlags = Object.assign({}, phishing.flags);
    let combinedScore = phishing.score;
    const reasons = [...phishing.reasons];

    // Auth fail = ciddi
    if (auth.spf === 'fail') { combinedScore += 25; reasons.push('SPF doğrulaması BAŞARISIZ'); combinedFlags.spfFail = true; }
    if (auth.dkim === 'fail') { combinedScore += 25; reasons.push('DKIM imzası GEÇERSİZ'); combinedFlags.dkimFail = true; }
    if (auth.dmarc === 'fail') { combinedScore += 30; reasons.push('DMARC politikası BAŞARISIZ'); combinedFlags.dmarcFail = true; }

    // Auth bilgisi yok = orta seviye şüphe
    if (!auth.spf && !auth.dkim && !auth.dmarc) {
      combinedFlags.authMissing = true;
      // bu bir uyarı, ek puan yok (eski sistemler bunu desteklemeyebilir)
    }

    return {
      auth,
      phishingScore: phishing.score,
      totalScore: Math.min(100, combinedScore),
      flags: combinedFlags,
      reasons,
      level: this._riskLevel(combinedScore, combinedFlags)
    };
  }

  static _riskLevel(score, flags) {
    if (flags.spfFail || flags.dkimFail || flags.dmarcFail || flags.brandImpersonation || flags.typosquatting) {
      return 'high';
    }
    if (score >= 60) return 'high';
    if (score >= 30) return 'medium';
    if (score >= 10) return 'low';
    return 'safe';
  }
}

module.exports = EmailSecurity;
