/**
 * Otomatik Mail Kategorileme - v1.29
 *
 * Heuristic kurallarla gelen mailleri kategorilere atar:
 * - Gönderici domain pattern'leri (n11.com, gov.tr vs)
 * - Konu satırı anahtar kelimeleri (TR + EN)
 * - Body içeriği (.ics tespiti, IBAN, vs)
 *
 * Skor sistemi:
 * - Domain match: +5 puan
 * - Subject keyword: +2 puan
 * - Body keyword: +1 puan
 * - Eşik: 3 puan (en az bir güçlü sinyal veya iki orta sinyal)
 */

class AutoCategorizer {
  /**
   * Yerleşik kategori şablonları
   * Kullanıcı bunları silebilir/düzenleyebilir, ancak ilk kez seed edilirler
   */
  static getBuiltinCategories() {
    return [
      { name: '💰 Finans', color: '#27ae60', sort_order: 10 },
      { name: '🛒 Alışveriş', color: '#e67e22', sort_order: 20 },
      { name: '🚚 Kargo', color: '#3498db', sort_order: 30 },
      { name: '✈️ Seyahat', color: '#9b59b6', sort_order: 40 },
      { name: '📰 Bülten', color: '#95a5a6', sort_order: 50 },
      { name: '👥 Sosyal Medya', color: '#1abc9c', sort_order: 60 },
      { name: '🏛️ Resmi', color: '#c0392b', sort_order: 70 },
      { name: '📅 Etkinlik', color: '#f39c12', sort_order: 80 }
    ];
  }

  /**
   * Kategori → Heuristic kurallar mapping
   * Kategorinin name'i builtin'lerle birebir eşleşmeli
   */
  static getRules() {
    return {
      '💰 Finans': {
        domains: [
          'akbank', 'isbank', 'garanti', 'ziraat', 'yapikredi', 'denizbank',
          'vakifbank', 'kuveyttu', 'finansbank', 'qnbfb', 'halkbank',
          'paypal', 'iyzico', 'parasut', 'logo', 'parolapara',
          'fatura', 'efatura', 'turkcellfatura', 'vodafonefatura',
          'pttbank', 'fibabanka', 'odeabank', 'enpara', 'ingbank'
        ],
        subjectKeywords: [
          'fatura', 'ödeme', 'odeme', 'tahsilat', 'borç', 'borc', 'havale',
          'eft ', 'iban', 'invoice', 'payment', 'receipt', 'kart ekstresi',
          'maaş', 'maas', 'banka', 'kredi', 'taksit', 'limit', 'masraf',
          'son ödeme', 'son odeme', 'ödenmedi', 'odenmedi', 'gecikmiş', 'gecikmis'
        ],
        bodyKeywords: ['iyzico', 'sanal pos', ' iban ', 'bsmv', 'bvzv', 'kredi kartı']
      },
      '🛒 Alışveriş': {
        domains: [
          'n11', 'hepsiburada', 'trendyol', 'amazon', 'gittigidiyor',
          'mediamarkt', 'teknosa', 'ciceksepeti', 'morhipo', 'pttavm',
          'modanisa', 'lcwaikiki', 'koton', 'defacto', 'mavi', 'boyner',
          'getir', 'yemeksepeti', 'migros', 'a101', 'carrefoursa', 'bim',
          'vatan', 'gold-standard', 'idefix', 'kitapyurdu', 'dr.com.tr',
          'flo', 'ikea', 'koctas', 'koçtaş', 'banaayin', 'mahmure'
        ],
        subjectKeywords: [
          'sipariş', 'siparis', 'order', 'kampanya', 'indirim', 'fırsat', 'firsat',
          'discount', 'sale', 'flaş indirim', 'flas indirim', '%', 'sezon sonu',
          'sepet', 'cart', 'siparişiniz', 'siparisiniz', 'yeni ürün', 'yeni urun'
        ],
        bodyKeywords: ['siparişiniz', 'siparisiniz', 'kargoya verildi', 'sepete']
      },
      '🚚 Kargo': {
        domains: [
          'yurtici', 'yurticikargo', 'aras', 'araskargo', 'mng', 'mngkargo',
          'sürat', 'surat', 'suratkargo', 'ptt', 'pttkargo', 'fedex', 'dhl',
          'ups', 'tnt', 'horoz', 'horozlojistik', 'getir', 'trendyolexpress'
        ],
        subjectKeywords: [
          'kargo', 'shipment', 'tracking', 'takip kodu', 'teslimat', 'delivery',
          'paket', 'gönderi', 'gonderi', 'shipped', 'yola çıktı', 'yola cikti',
          'teslim alındı', 'teslim alindi', 'şubeye', 'subeye'
        ]
      },
      '✈️ Seyahat': {
        domains: [
          'turkishairlines', 'thy', 'pegasus', 'flypgs', 'sunexpress',
          'anadolujet', 'corendon', 'onurair', 'booking', 'expedia', 'trivago',
          'enuygun', 'tatilbudur', 'tatilsepeti', 'jolly', 'etstur',
          'hotels', 'agoda', 'airbnb', 'rentalcars', 'opentable',
          'rezzap', 'tatilkredisi'
        ],
        subjectKeywords: [
          'rezervasyon', 'reservation', 'uçuş', 'ucus', 'flight', 'biletiniz',
          'rezervasyonunuz', 'check-in', 'otel', 'hotel', 'booking',
          'kalkış', 'kalkis', 'iniş', 'inis', 'pnr', 'aktarmalı', 'aktarmali',
          'tatil', 'paket tatil', 'transfer', 'araç kiralama', 'arac kiralama'
        ]
      },
      '📰 Bülten': {
        domains: ['mailchimp', 'mlsend', 'sendgrid', 'mailerlite', 'sendpulse',
                  'getresponse', 'klaviyo', 'campaign-archive'],
        subjectKeywords: [
          'bülten', 'bulten', 'newsletter', 'haber bülteni', 'haber bulteni',
          'aboneliği', 'aboneligi', 'abone olduğunuz', 'abone oldugunuz',
          'haftalık', 'haftalik', 'aylık özet', 'aylik ozet'
        ],
        bodyKeywords: [
          'unsubscribe', 'aboneliği iptal', 'aboneligi iptal',
          'abonelikten çık', 'abonelikten cik', 'mail listesi',
          'view in browser', 'tarayıcıda görüntüle', 'tarayicida goruntule'
        ]
      },
      '👥 Sosyal Medya': {
        domains: [
          'facebook', 'facebookmail', 'instagram', 'twitter', 'x.com',
          'linkedin', 'linkedinmail', 'youtube', 'tiktok', 'pinterest',
          'whatsapp', 'reddit', 'quora', 'medium', 'substack',
          'discord', 'slack', 'zoom', 'telegram'
        ],
        subjectKeywords: [
          'sizi takip', 'beğendi', 'begendi', 'yorum yaptı', 'yorum yapti',
          'paylaştı', 'paylasti', 'arkadaş isteği', 'arkadas istegi',
          'liked your', 'commented', 'mentioned you', 'shared',
          'connection request', 'tag etti'
        ]
      },
      '🏛️ Resmi': {
        domains: [
          'gov.tr', 'gib.gov.tr', 'turkiye.gov.tr', 'sgk.gov.tr',
          'meb.gov.tr', 'edevlet.gov.tr', 'tuik.gov.tr', 'pttkep',
          'kep.tr', 'mernis.gov.tr', 'noterler.org.tr', 'hsk.gov.tr',
          'iskur.gov.tr', 'tcmb.gov.tr', 'sgkbilgi'
        ],
        subjectKeywords: [
          'e-devlet', 'edevlet', 'gib', 'sgk', 'tebligat', 'beyanname',
          'vergi', 'noter', 'mernis', 'iskur', 'mhv', 'ihtarname',
          'icra', 'tahsilat', 'cezası', 'cezasi', 'bağ-kur', 'bag-kur',
          'kep', 'e-imza', 'e-tebligat', 'belediye'
        ]
      },
      '📅 Etkinlik': {
        domains: ['calendar.google', 'meetup', 'eventbrite', 'biletix',
                  'biletinial', 'mybilet', 'passolig'],
        subjectKeywords: [
          'toplantı', 'toplanti', 'meeting', 'davet', 'invite', 'invitation',
          'zoom', 'teams', 'webinar', 'etkinlik', 'event', 'konferans',
          'seminer', 'workshop', 'eğitim', 'egitim', 'panel', 'fuar',
          'açılış', 'acilis', 'gala', 'kokteyl', 'imza günü', 'imza gunu'
        ],
        bodyKeywords: ['BEGIN:VCALENDAR', 'BEGIN:VEVENT', 'meet.google.com',
                       'zoom.us/j/', 'teams.microsoft.com/l/', 'webex.com']
      }
    };
  }

  /**
   * Mailleri analiz et ve uygun kategori adlarını döner
   * @param {object} message - { subject, body_text, from_addr, from_name, ... }
   * @returns {Array<string>} - eşleşen kategori isimleri
   */
  static categorize(message) {
    const matches = [];
    const rules = this.getRules();

    const fromLower = (message.from_addr || '').toLowerCase();
    const subjectLower = (message.subject || '').toLowerCase();
    const bodyLower = (message.body_text || '').toLowerCase().slice(0, 5000); // Performans

    for (const [categoryName, rule] of Object.entries(rules)) {
      let score = 0;

      // Domain match (en güçlü sinyal)
      if (rule.domains) {
        for (const domain of rule.domains) {
          if (fromLower.includes(domain.toLowerCase())) {
            score += 5;
            break;
          }
        }
      }

      // Subject keyword match
      if (rule.subjectKeywords) {
        for (const kw of rule.subjectKeywords) {
          if (subjectLower.includes(kw.toLowerCase())) {
            score += 2;
            break;
          }
        }
      }

      // Body keyword match
      if (rule.bodyKeywords) {
        for (const kw of rule.bodyKeywords) {
          if (bodyLower.includes(kw.toLowerCase())) {
            score += 1;
            break;
          }
        }
      }

      // Eşik: 3 puan
      if (score >= 3) {
        matches.push({ name: categoryName, score });
      }
    }

    // Skor azalan sırada
    matches.sort((a, b) => b.score - a.score);
    return matches.map(m => m.name);
  }
}

module.exports = AutoCategorizer;
