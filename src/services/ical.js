/**
 * iCalendar (RFC 5545) Parse + Build
 *
 * .ics dosyaları, mail eklerinde gelen toplantı davetleri vs.
 * Standart: VCALENDAR > VEVENT
 */

class ICalService {
  /**
   * .ics içeriğinden VEVENT'leri çıkar
   */
  static parse(text) {
    if (!text) return [];

    // Multi-line continuation (CR LF SPACE = uzantı)
    const normalized = text.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '');
    const lines = normalized.split('\n').map(l => l.trim()).filter(Boolean);

    const events = [];
    let currentEvent = null;

    for (const line of lines) {
      const upper = line.toUpperCase();
      if (upper === 'BEGIN:VEVENT') {
        currentEvent = {};
      } else if (upper === 'END:VEVENT') {
        if (currentEvent && currentEvent.start_at) {
          events.push(currentEvent);
        }
        currentEvent = null;
      } else if (currentEvent) {
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) continue;
        const head = line.slice(0, colonIdx);
        const value = line.slice(colonIdx + 1);
        const [propRaw, ...paramsArr] = head.split(';');
        const prop = propRaw.toUpperCase();
        const params = {};
        for (const p of paramsArr) {
          const [pk, pv] = p.split('=');
          if (pk) params[pk.toUpperCase()] = pv;
        }
        const val = this.unescape(value);

        if (prop === 'SUMMARY') {
          currentEvent.title = val;
        } else if (prop === 'DESCRIPTION') {
          currentEvent.description = val;
        } else if (prop === 'LOCATION') {
          currentEvent.location = val;
        } else if (prop === 'DTSTART') {
          const isAllDay = (params['VALUE'] === 'DATE') || /^\d{8}$/.test(value);
          currentEvent.start_at = this.parseDateTime(value, params);
          if (isAllDay) currentEvent.all_day = 1;
        } else if (prop === 'DTEND') {
          currentEvent.end_at = this.parseDateTime(value, params);
        } else if (prop === 'UID') {
          currentEvent.uid = val;
        } else if (prop === 'ATTENDEE') {
          // ATTENDEE;CN=Name:mailto:email
          const m = value.match(/mailto:(.+)$/i);
          const email = m ? m[1] : value;
          const cn = params['CN'] || '';
          const att = cn ? `${cn} <${email}>` : email;
          if (!currentEvent.attendees) currentEvent.attendees = att;
          else currentEvent.attendees += ', ' + att;
        } else if (prop === 'ORGANIZER') {
          const m = value.match(/mailto:(.+)$/i);
          if (m) currentEvent.organizer = m[1];
        }
      }
    }

    return events;
  }

  /**
   * iCalendar tarih formatını ISO 8601'e çevir
   * 20260108T143000Z → 2026-01-08T14:30:00.000Z
   * 20260108T143000  → 2026-01-08T14:30:00 (local)
   * 20260108         → 2026-01-08T00:00:00 (all day)
   */
  static parseDateTime(value, params = {}) {
    if (!value) return null;
    const v = value.trim().replace(/[Z]+$/, '');
    if (/^\d{8}$/.test(v)) {
      // All day
      const y = v.slice(0, 4), m = v.slice(4, 6), d = v.slice(6, 8);
      return `${y}-${m}-${d}T00:00:00.000Z`;
    }
    if (/^\d{8}T\d{6}/.test(v)) {
      const y = v.slice(0, 4), mo = v.slice(4, 6), d = v.slice(6, 8);
      const h = v.slice(9, 11), mi = v.slice(11, 13), s = v.slice(13, 15);
      const isUtc = value.endsWith('Z');
      if (isUtc) return `${y}-${mo}-${d}T${h}:${mi}:${s}.000Z`;
      // TZID veya local kabul et - şu an local olarak parse
      const localDate = new Date(parseInt(y, 10), parseInt(mo, 10) - 1, parseInt(d, 10),
                                  parseInt(h, 10), parseInt(mi, 10), parseInt(s, 10));
      return localDate.toISOString();
    }
    return value;
  }

  static unescape(text) {
    if (!text) return '';
    return String(text)
      .replace(/\\n/gi, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\');
  }

  /**
   * Tek event için iCalendar string üret
   */
  static buildEvent(event) {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CODEGA Mail//TR',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT'
    ];
    lines.push('UID:' + (event.uid || ('codega-' + Date.now() + '@codega.com.tr')));
    lines.push('DTSTAMP:' + this.toICalDate(new Date().toISOString()));
    if (event.start_at) lines.push('DTSTART:' + this.toICalDate(event.start_at, event.all_day));
    if (event.end_at) lines.push('DTEND:' + this.toICalDate(event.end_at, event.all_day));
    if (event.title) lines.push('SUMMARY:' + this.escape(event.title));
    if (event.description) lines.push('DESCRIPTION:' + this.escape(event.description));
    if (event.location) lines.push('LOCATION:' + this.escape(event.location));
    lines.push('END:VEVENT');
    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  /**
   * ISO datetime → iCalendar formatı
   */
  static toICalDate(iso, allDay = false) {
    const d = new Date(iso);
    if (allDay) {
      return d.toISOString().slice(0, 10).replace(/-/g, '');
    }
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  static escape(text) {
    if (!text) return '';
    return String(text)
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
  }

  /**
   * Mail body'sinden tarih/saat parse et (etkinlik öneri için)
   * Örnek pattern'ler:
   *   "15 Ocak 2026 saat 14:30"
   *   "January 15, 2026 at 2:30 PM"
   *   "15.01.2026 14:30"
   *   "15/01/2026 14:30"
   */
  static guessDateTimeFromText(text) {
    if (!text) return null;
    const txt = text.toLowerCase();

    // Türkçe ay adları
    const trMonths = {
      'ocak': 0, 'şubat': 1, 'subat': 1, 'mart': 2, 'nisan': 3, 'mayıs': 4, 'mayis': 4,
      'haziran': 5, 'temmuz': 6, 'ağustos': 7, 'agustos': 7, 'eylül': 8, 'eylul': 8,
      'ekim': 9, 'kasım': 10, 'kasim': 10, 'aralık': 11, 'aralik': 11
    };

    // 15 Ocak 2026 saat 14:30 / 15 Ocak 14:30
    let m = txt.match(/(\d{1,2})\s+(ocak|şubat|subat|mart|nisan|mayıs|mayis|haziran|temmuz|ağustos|agustos|eylül|eylul|ekim|kasım|kasim|aralık|aralik)\s*(\d{4})?(?:[\s,]+saat[\s]+)?(\d{1,2})[:.](\d{2})/);
    if (m) {
      const day = parseInt(m[1], 10);
      const month = trMonths[m[2]];
      const year = m[3] ? parseInt(m[3], 10) : new Date().getFullYear();
      const hour = parseInt(m[4], 10);
      const min = parseInt(m[5], 10);
      const d = new Date(year, month, day, hour, min);
      if (d > new Date(0)) return d.toISOString();
    }

    // 15.01.2026 14:30 veya 15/01/2026 14:30
    m = txt.match(/(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{4})\s+(\d{1,2})[:.](\d{2})/);
    if (m) {
      const day = parseInt(m[1], 10);
      const month = parseInt(m[2], 10) - 1;
      const year = parseInt(m[3], 10);
      const hour = parseInt(m[4], 10);
      const min = parseInt(m[5], 10);
      const d = new Date(year, month, day, hour, min);
      if (d > new Date(0)) return d.toISOString();
    }

    // 15.01.2026 (sadece tarih)
    m = txt.match(/(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{4})/);
    if (m) {
      const day = parseInt(m[1], 10);
      const month = parseInt(m[2], 10) - 1;
      const year = parseInt(m[3], 10);
      const d = new Date(year, month, day, 9, 0); // Default 09:00
      if (d > new Date(0)) return d.toISOString();
    }

    return null;
  }
}

module.exports = ICalService;
