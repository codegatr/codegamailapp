/**
 * vCard 3.0 / 4.0 Parse + Build
 *
 * Outlook, Apple Contacts, Google Contacts, Thunderbird hepsi vCard kullanır.
 * Standart: RFC 6350 (vCard 4.0), RFC 2426 (vCard 3.0)
 *
 * Bizim ürettiğimiz: vCard 3.0 (en uyumlu)
 * Bizim parse ettiğimiz: 3.0 + 4.0 (geriye dönük)
 */

class VCardService {
  /**
   * Tek kişiyi vCard string'ine çevir
   */
  static buildSingle(contact) {
    const lines = ['BEGIN:VCARD', 'VERSION:3.0'];

    const fn = (contact.name || contact.email || '').trim();
    if (fn) lines.push('FN:' + this.escape(fn));

    // N: Family;Given;Middle;Prefix;Suffix
    if (fn) {
      const parts = fn.split(/\s+/);
      if (parts.length >= 2) {
        const family = parts[parts.length - 1];
        const given = parts.slice(0, -1).join(' ');
        lines.push(`N:${this.escape(family)};${this.escape(given)};;;`);
      } else {
        lines.push(`N:${this.escape(fn)};;;;`);
      }
    }

    if (contact.email) {
      lines.push('EMAIL;TYPE=INTERNET:' + this.escape(contact.email));
    }
    if (contact.phone) {
      lines.push('TEL;TYPE=CELL:' + this.escape(contact.phone));
    }
    if (contact.organization) {
      lines.push('ORG:' + this.escape(contact.organization));
    }
    if (contact.notes) {
      lines.push('NOTE:' + this.escape(contact.notes));
    }
    if (contact.tags) {
      // CATEGORIES virgülle ayrılır, vCard standardında
      const cats = String(contact.tags).split(',').map(t => t.trim()).filter(Boolean);
      if (cats.length) lines.push('CATEGORIES:' + cats.map(c => this.escape(c)).join(','));
    }
    if (contact.is_favorite) {
      // X-Apple-FAVORITE veya CATEGORIES'e Favorites eklenebilir
      lines.push('X-FAVORITE:1');
    }
    if (contact.created_at) {
      // REV: Son güncelleme
      lines.push('REV:' + new Date(contact.created_at).toISOString());
    }

    lines.push('END:VCARD');
    return lines.join('\r\n');
  }

  /**
   * Birden fazla kişiyi tek dosyada
   */
  static buildMultiple(contacts) {
    return contacts.map(c => this.buildSingle(c)).join('\r\n');
  }

  /**
   * vCard escape (newline, comma, semicolon, backslash)
   */
  static escape(text) {
    if (text === null || text === undefined) return '';
    return String(text)
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
  }

  static unescape(text) {
    if (!text) return '';
    return String(text)
      .replace(/\\n/g, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\');
  }

  /**
   * vCard string'inden kişi(ler) parse et
   * @param {string} text - .vcf dosya içeriği
   * @returns {Array} - kişi objeleri listesi
   */
  static parse(text) {
    if (!text) return [];

    // Multiline values'u birleştir (RFC: continuation = satır başında space/tab)
    const normalized = text.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '');
    const lines = normalized.split('\n').map(l => l.trim()).filter(Boolean);

    const contacts = [];
    let current = null;

    for (const line of lines) {
      const upperLine = line.toUpperCase();
      if (upperLine === 'BEGIN:VCARD') {
        current = {};
      } else if (upperLine === 'END:VCARD') {
        if (current) {
          // Email yoksa atla (bizim için kritik)
          if (current.email) contacts.push(current);
          current = null;
        }
      } else if (current) {
        // PROPERTY[;params]:value
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) continue;
        const head = line.slice(0, colonIdx);
        const value = line.slice(colonIdx + 1);
        const [propRaw] = head.split(';');
        const prop = propRaw.toUpperCase();
        const val = this.unescape(value);

        if (prop === 'FN') {
          current.name = val;
        } else if (prop === 'N' && !current.name) {
          // family;given;middle;prefix;suffix
          const nParts = value.split(';').map(p => this.unescape(p).trim());
          const given = nParts[1] || '';
          const family = nParts[0] || '';
          current.name = (given + ' ' + family).trim();
        } else if (prop === 'EMAIL') {
          // İlk email'i al (varsa)
          if (!current.email) current.email = val;
        } else if (prop === 'TEL') {
          if (!current.phone) current.phone = val;
        } else if (prop === 'ORG') {
          // ORG;name;dept şeklinde olabilir
          current.organization = val.split(';')[0].trim();
        } else if (prop === 'NOTE') {
          current.notes = val;
        } else if (prop === 'CATEGORIES') {
          current.tags = val;
        } else if (prop === 'X-FAVORITE' || prop === 'X-APPLE-FAVORITE') {
          if (val === '1' || val.toLowerCase() === 'true') current.is_favorite = 1;
        }
      }
    }

    return contacts;
  }
}

module.exports = VCardService;
