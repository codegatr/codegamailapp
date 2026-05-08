/**
 * Contacts CSV Service
 *
 * CSV import/export - Outlook, Google Contacts, LibreOffice uyumlu
 * UTF-8 BOM ile Excel'de Türkçe doğru görünür
 */

class ContactsCsvService {
  // Standart kolon adları (export edilen)
  static EXPORT_HEADERS = [
    'Name', 'Email', 'Phone', 'Organization', 'Tags', 'Notes', 'Favorite', 'Created'
  ];

  /**
   * Kişileri CSV string'ine çevir (UTF-8 BOM dahil)
   */
  static build(contacts) {
    const BOM = '\uFEFF'; // Excel için Türkçe karakter desteği
    const rows = [this.EXPORT_HEADERS.join(',')];
    for (const c of contacts) {
      const row = [
        this.escape(c.name || ''),
        this.escape(c.email || ''),
        this.escape(c.phone || ''),
        this.escape(c.organization || ''),
        this.escape(c.tags || ''),
        this.escape(c.notes || ''),
        c.is_favorite ? '1' : '',
        c.created_at || ''
      ];
      rows.push(row.join(','));
    }
    return BOM + rows.join('\r\n');
  }

  /**
   * CSV string'inden kişi(ler) parse et
   * - Header satırını otomatik algılar (Name, Email vs)
   * - Outlook/Google CSV'lerle de çalışır (alias kolon adları)
   */
  static parse(csv) {
    if (!csv) return [];

    // BOM temizle
    if (csv.charCodeAt(0) === 0xFEFF) csv = csv.slice(1);

    const rows = this.parseCsvRows(csv);
    if (rows.length < 2) return [];

    const headers = rows[0].map(h => h.trim().toLowerCase());

    // Header alias mapping (Outlook, Google, Apple, vs)
    const fieldMap = {
      // Name
      'name': 'name', 'full name': 'name', 'display name': 'name',
      'first name': 'firstName', 'last name': 'lastName',
      'given name': 'firstName', 'family name': 'lastName',
      'ad': 'firstName', 'soyad': 'lastName', 'ad soyad': 'name',
      // Email
      'email': 'email', 'e-mail address': 'email', 'email address': 'email',
      'primary email': 'email', 'e-posta': 'email',
      'email 1 - value': 'email', 'e-mail 1 address': 'email',
      // Phone
      'phone': 'phone', 'phone number': 'phone',
      'mobile phone': 'phone', 'business phone': 'phone',
      'telefon': 'phone', 'cep': 'phone',
      'phone 1 - value': 'phone',
      // Organization
      'organization': 'organization', 'company': 'organization',
      'kurum': 'organization', 'şirket': 'organization', 'sirket': 'organization',
      'organization 1 - name': 'organization',
      // Other
      'notes': 'notes', 'note': 'notes', 'açıklama': 'notes', 'aciklama': 'notes',
      'categories': 'tags', 'category': 'tags', 'tags': 'tags',
      'etiket': 'tags', 'etiketler': 'tags',
      'favorite': 'is_favorite', 'is_favorite': 'is_favorite',
      'created': 'created_at', 'created_at': 'created_at'
    };

    // Header indexlerini bul
    const colIdx = {};
    headers.forEach((h, i) => {
      const mapped = fieldMap[h];
      if (mapped && colIdx[mapped] === undefined) colIdx[mapped] = i;
    });

    const contacts = [];
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row.length) continue;

      const c = {};
      // Name
      if (colIdx.name !== undefined && row[colIdx.name]) {
        c.name = row[colIdx.name].trim();
      } else if (colIdx.firstName !== undefined || colIdx.lastName !== undefined) {
        const fn = colIdx.firstName !== undefined ? (row[colIdx.firstName] || '').trim() : '';
        const ln = colIdx.lastName !== undefined ? (row[colIdx.lastName] || '').trim() : '';
        c.name = (fn + ' ' + ln).trim();
      }

      // Email - olmazsa atla
      if (colIdx.email !== undefined) c.email = (row[colIdx.email] || '').trim().toLowerCase();
      if (!c.email || !c.email.includes('@')) continue;

      if (colIdx.phone !== undefined) c.phone = (row[colIdx.phone] || '').trim();
      if (colIdx.organization !== undefined) c.organization = (row[colIdx.organization] || '').trim();
      if (colIdx.notes !== undefined) c.notes = (row[colIdx.notes] || '').trim();
      if (colIdx.tags !== undefined) c.tags = (row[colIdx.tags] || '').trim();
      if (colIdx.is_favorite !== undefined) {
        const v = (row[colIdx.is_favorite] || '').trim().toLowerCase();
        c.is_favorite = (v === '1' || v === 'true' || v === 'yes' || v === 'evet') ? 1 : 0;
      }
      if (colIdx.created_at !== undefined) c.created_at = (row[colIdx.created_at] || '').trim();

      contacts.push(c);
    }

    return contacts;
  }

  /**
   * RFC 4180 uyumlu CSV parser
   * Quoted fields, escaped quotes, multiline desteği
   */
  static parseCsvRows(text) {
    const rows = [];
    let current = [];
    let field = '';
    let inQuotes = false;

    // Newline normalize et
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];

      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          field += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          current.push(field);
          field = '';
        } else if (ch === '\n') {
          current.push(field);
          field = '';
          rows.push(current);
          current = [];
        } else if (ch === ';' && current.length === 0 && rows.length === 0 && !field.length) {
          // Bazı Excel CSV'leri ; kullanır - ilk satırda algıla
          // Bu basit MVP'de ignored
          field += ch;
        } else {
          field += ch;
        }
      }
    }

    // Son satır
    if (field.length || current.length) {
      current.push(field);
      rows.push(current);
    }

    return rows;
  }

  static escape(text) {
    if (text === null || text === undefined) return '';
    const s = String(text);
    // Eğer comma, quote, newline içeriyorsa quote içine al + içerideki "leri ""ile kaçır
    if (/[",\n\r]/.test(s)) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }
}

module.exports = ContactsCsvService;
