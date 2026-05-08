/**
 * Bayesian Spam Filter
 * Klasik Paul Graham "A Plan for Spam" yaklaşımı + Türkçe iyileştirmeler
 *
 * Algoritma:
 * 1. Mesaj tokenize edilir (kelimeler, header değerleri, özel patternler)
 * 2. Her token için spam ve ham (spam değil) sayıları tutulur
 * 3. Bir mesajın spam olasılığı için "en ilginç" 15 token seçilir (0.5'ten en uzak)
 * 4. Naive Bayes ile bu token'ların olasılıkları birleştirilir
 * 5. Sonuç 0-1 arası bir olasılıktır
 *
 * Hazır olma: en az 5 spam + 5 ham mesaj eğitilmiş olmalı
 */
class BayesFilter {
  // Türkçe karakterler dahil tokenize regex
  static TOKEN_REGEX = /[a-zçğıöşüâîû0-9_-]+/gi;

  // Çok kısa veya çok uzun token'lar atlanır
  static MIN_TOKEN_LENGTH = 3;
  static MAX_TOKEN_LENGTH = 30;
  static TOP_TOKENS_FOR_PREDICTION = 15;
  static SPAM_BIAS = 2; // Spam'a ufak önyargı (false positive azaltır)

  // Olasılığı hafifletmek için (extreme değerlerden kaçın)
  static PROB_FLOOR = 0.001;
  static PROB_CEILING = 0.999;

  /**
   * Mesajdan token'ları çıkar
   */
  static tokenize(message) {
    const tokens = new Set();

    // Body text + html'den text
    let text = '';
    if (message.subject) text += message.subject + ' ';
    if (message.from_name) text += message.from_name + ' ';
    if (message.body_text) text += message.body_text + ' ';
    if (message.body_html) {
      // Basit HTML strip (taglar)
      text += message.body_html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ') + ' ';
    }

    // Kelime token'ları
    const matches = text.match(this.TOKEN_REGEX) || [];
    for (let w of matches) {
      w = w.toLowerCase();
      if (w.length < this.MIN_TOKEN_LENGTH || w.length > this.MAX_TOKEN_LENGTH) continue;
      // Sadece rakam olan token'ları atla (1234, 0001 vs)
      if (/^\d+$/.test(w)) continue;
      tokens.add(w);
    }

    // Özel pattern token'ları
    if (message.from_addr) {
      const fromLower = message.from_addr.toLowerCase();
      tokens.add('from:' + fromLower);
      const domain = fromLower.split('@')[1];
      if (domain) {
        tokens.add('domain:' + domain);
        // TLD
        const parts = domain.split('.');
        if (parts.length >= 2) tokens.add('tld:' + parts[parts.length - 1]);
      }
    }

    if (message.subject) {
      // Subject'in bütününü de bir token olarak ekle (ortak spam başlıklar tespiti için)
      const subjLower = message.subject.toLowerCase().trim();
      if (subjLower.length >= 5 && subjLower.length <= 80) {
        tokens.add('subj:' + subjLower);
      }

      // Subject'te BÜYÜK HARF orani yüksekse flag
      const upperRatio = (message.subject.match(/[A-ZÇĞİÖŞÜ]/g) || []).length / message.subject.length;
      if (upperRatio > 0.5 && message.subject.length > 10) tokens.add('feature:loud_subject');
      if (/[!]{2,}/.test(message.subject)) tokens.add('feature:multi_exclaim');
    }

    // HTML/text oranı (HTML mailler genellikle spam)
    if (message.body_html && message.body_html.length > 0) {
      const htmlLen = message.body_html.length;
      const textLen = (message.body_text || '').length;
      if (textLen === 0 || htmlLen / Math.max(1, textLen) > 5) {
        tokens.add('feature:heavy_html');
      }
    }

    // URL sayısı flag'leri
    const urlCount = ((message.body_text || '') + (message.body_html || '')).match(/https?:\/\//gi)?.length || 0;
    if (urlCount > 5) tokens.add('feature:many_urls');
    if (urlCount > 15) tokens.add('feature:very_many_urls');

    return Array.from(tokens);
  }

  /**
   * Mesajı eğit (spam veya ham olarak işaretle)
   */
  static train(db, message, isSpam) {
    const tokens = this.tokenize(message);
    if (!tokens.length) return { ok: false, reason: 'no_tokens' };

    db.bayesAddTokens(tokens, isSpam);
    db.bayesIncrementMeta(isSpam ? 'total_spam_msgs' : 'total_ham_msgs');
    return { ok: true, tokensAdded: tokens.length };
  }

  /**
   * Önceki bir eğitimi geri al (ör. kullanıcı yanlış işaretledi)
   */
  static untrain(db, message, wasSpam) {
    const tokens = this.tokenize(message);
    if (!tokens.length) return;
    db.bayesRemoveTokens(tokens, wasSpam);
    db.bayesIncrementMeta(wasSpam ? 'total_spam_msgs' : 'total_ham_msgs', -1);
  }

  /**
   * Mesajın spam olasılığını tahmin et
   * @returns {object} { ready, probability (0-1), score (0-100), topTokens, indeterminate }
   */
  static predict(db, message) {
    const meta = db.bayesGetMeta();
    const totalSpam = meta.total_spam_msgs || 0;
    const totalHam = meta.total_ham_msgs || 0;

    if (totalSpam < 5 || totalHam < 5) {
      return { ready: false, probability: 0.5, score: 0, reason: 'not_enough_training' };
    }

    const tokens = this.tokenize(message);
    if (!tokens.length) return { ready: true, probability: 0.5, score: 50, indeterminate: true };

    const statsMap = db.bayesGetTokenStatsBatch(tokens);
    const tokenProbs = [];

    for (const tok of tokens) {
      const stats = statsMap.get(tok);
      if (!stats) continue; // Hiç görmediği token (yeni)

      const occurrences = stats.spam_count + stats.ham_count;
      if (occurrences < 2) continue; // Çok seyrek görülen token

      // Frekans
      const spamFreq = stats.spam_count / totalSpam;
      const hamFreq = stats.ham_count / totalHam;

      // Olasılık (spam'a hafif önyargı)
      let prob = (spamFreq * this.SPAM_BIAS) / ((spamFreq * this.SPAM_BIAS) + hamFreq);
      if (isNaN(prob)) prob = 0.5;

      // Smoothing (token az görülmüşse 0.5'e yaklaştır)
      const smoothing = Math.min(1.0, occurrences / 10);
      prob = 0.5 + (prob - 0.5) * smoothing;

      // Floor/ceiling
      prob = Math.max(this.PROB_FLOOR, Math.min(this.PROB_CEILING, prob));

      tokenProbs.push({
        token: tok,
        prob,
        distance: Math.abs(prob - 0.5),
        spam: stats.spam_count,
        ham: stats.ham_count
      });
    }

    if (tokenProbs.length === 0) {
      return { ready: true, probability: 0.5, score: 50, indeterminate: true, knownTokens: 0 };
    }

    // En "ilginç" N token'ı al (0.5'ten en uzak)
    tokenProbs.sort((a, b) => b.distance - a.distance);
    const topTokens = tokenProbs.slice(0, this.TOP_TOKENS_FOR_PREDICTION);

    // Naive Bayes combine - log space (numerical stability)
    let logProd = 0;
    let logProdInv = 0;
    for (const t of topTokens) {
      logProd += Math.log(t.prob);
      logProdInv += Math.log(1 - t.prob);
    }

    // Math.exp(logProd) / (Math.exp(logProd) + Math.exp(logProdInv))
    // Tek logaritma çıkararak numerical stability:
    const maxLog = Math.max(logProd, logProdInv);
    const num = Math.exp(logProd - maxLog);
    const den = num + Math.exp(logProdInv - maxLog);
    const probability = num / den;

    return {
      ready: true,
      probability,
      score: Math.round(probability * 100),
      knownTokens: tokenProbs.length,
      topTokens: topTokens.slice(0, 5).map(t => ({
        token: t.token,
        prob: Math.round(t.prob * 100) / 100,
        spam: t.spam,
        ham: t.ham
      }))
    };
  }
}

module.exports = BayesFilter;
