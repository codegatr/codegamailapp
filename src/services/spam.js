/**
 * Heuristic Spam Filtresi
 *
 * Her gelen maile 0-100 arası puan atar:
 *   < 30  → temiz
 *   30-50 → şüpheli (uyarı, ama spam'e taşımaz)
 *   ≥ 50  → spam (otomatik Spam klasörüne taşınır)
 *
 * Kontroller:
 *   - Blacklist eşleşmesi → 100 (direkt spam)
 *   - Whitelist eşleşmesi → 0 (hiç değerlendirme yapma)
 *   - Heuristik puanlar (toplanır):
 *       * Konu tamamen büyük harf
 *       * Konu çok ünlem/soru işareti
 *       * Konu içinde spam anahtarı (TR + EN listesi)
 *       * Body'de aşırı link
 *       * Body'de spam anahtarı
 *       * From <-> Reply-To domain uyuşmazlığı
 *       * Boş subject + boş body
 *       * Latin-only kullanıcının hiç olmayan dilden mail alması (placeholder, kapalı)
 *
 * Kullanıcı "Bu spam" / "Spam değil" diyince:
 *   - Gönderici sender bazlı blacklist/whitelist'e eklenir
 */
const SPAM_KEYWORDS_SUBJECT = [
  // TR
  'kazandınız', 'tebrikler', 'ücretsiz', 'bedava', 'çekiliş', 'kupon',
  'son fırsat', 'hemen tıkla', 'müjde', 'şanslısınız',
  // EN
  'congrats', 'congratulations', 'winner', 'free', 'bonus', 'lottery',
  'urgent', 'act now', 'click here', 'limited time', 'risk free',
  'guaranteed', 'cash prize', 'no obligation', 'winner!!',
  // Sektör
  'viagra', 'cialis', 'casino', 'bet', 'bahis', 'kredi onay',
  // Crypto
  'bitcoin', 'btc', 'crypto', 'investment opportunity'
];

const SPAM_KEYWORDS_BODY = [
  'click here', 'unsubscribe to stop', 'limited offer', 'act now',
  'cash bonus', 'risk-free', 'no credit check',
  'iban', 'send me your', 'urgent help needed', 'bank transfer',
  'million dollars', 'million euros', 'inheritance',
  'paypal verification needed', 'account suspended',
  'kazandığınız', 'tebrikler kazandınız', 'iban no'
];

class SpamFilter {
  /**
   * Bir mailin spam puanını hesaplar.
   * @param {Object} message - parsed mail nesnesi (subject, from_addr, body_text, ...)
   * @param {Array} rules - DB'den gelen spam_rules listesi
   * @returns {Object} { score, reasons, action }
   *   action: 'allow' | 'inbox' | 'spam'
   */
  static evaluate(message, rules = []) {
    const reasons = [];

    // 1) Whitelist eşleşmesi -> direkt geç
    for (const rule of rules.filter(r => r.action === 'allow')) {
      if (SpamFilter._matches(rule, message)) {
        return { score: 0, reasons: ['whitelist eşleşmesi: ' + rule.pattern], action: 'allow' };
      }
    }

    // 2) Blacklist eşleşmesi -> direkt spam
    for (const rule of rules.filter(r => r.action === 'block')) {
      if (SpamFilter._matches(rule, message)) {
        return { score: 100, reasons: ['blacklist eşleşmesi: ' + rule.pattern], action: 'spam' };
      }
    }

    // 3) Heuristik puanlama
    let score = 0;
    const subject = (message.subject || '').toLowerCase();
    const subjectRaw = message.subject || '';
    const body = (message.body_text || '').toLowerCase();
    const fromAddr = (message.from_addr || '').toLowerCase();

    // Konu tamamen büyük harf (en az 10 karakter)
    if (subjectRaw.length >= 10 && subjectRaw === subjectRaw.toUpperCase() && /[A-ZĞÜŞİÖÇ]/.test(subjectRaw)) {
      score += 20; reasons.push('konu tamamen büyük harf');
    }

    // Çok ünlem/soru
    const exclaimCount = (subjectRaw.match(/[!?]{2,}/g) || []).length;
    if (exclaimCount > 0) { score += 10 * exclaimCount; reasons.push('konuda ardarda noktalama'); }

    // Konuda spam anahtarı
    let subjectMatchCount = 0;
    for (const kw of SPAM_KEYWORDS_SUBJECT) {
      if (subject.includes(kw)) subjectMatchCount++;
    }
    if (subjectMatchCount > 0) {
      score += 12 * subjectMatchCount;
      reasons.push(`konuda ${subjectMatchCount} spam anahtarı`);
    }

    // Body kontrolleri (sadece body varsa)
    if (body.length > 0) {
      // Aşırı link
      const linkCount = (body.match(/https?:\/\//g) || []).length;
      if (linkCount > 5) { score += 10; reasons.push(`body'de ${linkCount} link`); }
      if (linkCount > 10) { score += 15; }

      // Body spam anahtarları
      let bodyMatchCount = 0;
      for (const kw of SPAM_KEYWORDS_BODY) {
        if (body.includes(kw)) bodyMatchCount++;
      }
      if (bodyMatchCount > 0) {
        score += 8 * bodyMatchCount;
        reasons.push(`body'de ${bodyMatchCount} spam ifade`);
      }

      // Body neredeyse tamamen büyük harf
      const upperRatio = (body.match(/[A-ZĞÜŞİÖÇ]/g) || []).length / Math.max(1, body.length);
      if (upperRatio > 0.6 && body.length > 50) {
        score += 15; reasons.push('body büyük harf ağırlıklı');
      }
    }

    // Boş başlık + boş body kombinasyonu
    if (!subjectRaw && body.length < 20) {
      score += 25; reasons.push('boş konu ve içerik');
    }

    // Şüpheli sahte gönderen formatı (örn: "bank-info@xn--randomly-encoded.tld")
    if (fromAddr.includes('xn--')) {
      score += 30; reasons.push('punycode (IDN) gönderici domaini');
    }

    // Reply-To uyumsuzluğu
    if (message.reply_to_addr && message.from_addr) {
      const fromDomain = message.from_addr.split('@')[1] || '';
      const replyDomain = (message.reply_to_addr.split('@')[1] || '');
      if (fromDomain && replyDomain && fromDomain !== replyDomain) {
        score += 20; reasons.push("Reply-To domaini From'den farklı");
      }
    }

    score = Math.max(0, Math.min(100, score));

    let action = 'inbox';
    if (score >= 50) action = 'spam';

    return { score, reasons, action };
  }

  static _matches(rule, message) {
    const pattern = (rule.pattern || '').toLowerCase().trim();
    if (!pattern) return false;

    switch (rule.type) {
      case 'sender': {
        const from = (message.from_addr || '').toLowerCase();
        return from === pattern || from.includes(pattern);
      }
      case 'domain': {
        const from = (message.from_addr || '').toLowerCase();
        const domain = from.split('@')[1] || '';
        return domain === pattern || domain.endsWith('.' + pattern);
      }
      case 'subject': {
        const subj = (message.subject || '').toLowerCase();
        return subj.includes(pattern);
      }
      case 'body': {
        const body = (message.body_text || '').toLowerCase();
        return body.includes(pattern);
      }
      default:
        return false;
    }
  }
}

module.exports = SpamFilter;
