/**
 * v1.56: Mail Merge - Değişkenli Toplu Mail Gönderme
 *
 * CSV/Liste'den veri al, şablonla doldur, hız limitiyle gönder.
 */

class MailMergeService {
  constructor(mailService) {
    this.mailService = mailService;
  }

  /**
   * CSV içeriğini parse et (basit parser, virgülle ayrılmış, "" destekli)
   */
  parseCsv(content) {
    const rows = [];
    const lines = content.split(/\r?\n/).filter(l => l.trim());
    if (!lines.length) return { headers: [], rows: [] };

    const parseLine = (line) => {
      const cells = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
          else { inQuotes = !inQuotes; }
        } else if (ch === ',' && !inQuotes) {
          cells.push(current); current = '';
        } else { current += ch; }
      }
      cells.push(current);
      return cells.map(c => c.trim());
    };

    const headers = parseLine(lines[0]);
    for (let i = 1; i < lines.length; i++) {
      const cells = parseLine(lines[i]);
      const row = {};
      headers.forEach((h, idx) => { row[h] = cells[idx] || ''; });
      rows.push(row);
    }
    return { headers, rows };
  }

  /**
   * Şablonu değişkenlerle doldur
   * {{name}} → row.name
   * Türkçe karakterler ve nested obj desteklenir
   */
  fillTemplate(template, row) {
    if (!template) return '';
    return template.replace(/\{\{\s*([\w\u00c0-\u017f.]+?)\s*\}\}/g, (_, key) => {
      const value = row[key] !== undefined ? row[key] : '';
      return String(value);
    });
  }

  /**
   * Tüm değişken adlarını şablondan çıkart
   */
  extractVariables(template) {
    const vars = new Set();
    if (!template) return [];
    const matches = template.matchAll(/\{\{\s*([\w\u00c0-\u017f.]+?)\s*\}\}/g);
    for (const m of matches) vars.add(m[1]);
    return [...vars];
  }

  /**
   * Şablon önizlemesi (her satır için subject + body)
   */
  preview(subjectTpl, bodyTpl, rows, count = 3) {
    return rows.slice(0, count).map(row => ({
      to: row.email || row.Email || row.EMAIL || row.eposta || '',
      subject: this.fillTemplate(subjectTpl, row),
      body: this.fillTemplate(bodyTpl, row),
      row
    }));
  }

  /**
   * Mailleri sırayla gönder, hız limiti uygula, progress callback
   * @param {object} opts - { accountId, subjectTpl, bodyTpl, rows, rateLimit (saniye/mail), htmlBody }
   * @param {function} progressCb - { sent, total, success, error, lastResult }
   */
  async sendBatch(opts, progressCb) {
    const { accountId, subjectTpl, bodyTpl, rows, rateLimit = 2, htmlBody = false } = opts;
    const stats = { sent: 0, total: rows.length, success: 0, error: 0, results: [], aborted: false };

    for (let i = 0; i < rows.length; i++) {
      if (stats.aborted) break;

      const row = rows[i];
      const to = row.email || row.Email || row.EMAIL || row.eposta || row.E_POSTA || '';
      if (!to || !to.includes('@')) {
        stats.results.push({ row, error: 'Geçersiz email: ' + to });
        stats.error++; stats.sent++;
        if (progressCb) progressCb({ ...stats });
        continue;
      }

      const subject = this.fillTemplate(subjectTpl, row);
      const body = this.fillTemplate(bodyTpl, row);

      try {
        const mailData = {
          from: '', // mail.js account'tan dolduracak
          to: [{ address: to, name: row.name || row.ad || '' }],
          subject,
          text: htmlBody ? '' : body,
          html: htmlBody ? body : ''
        };
        await this.mailService.sendMail(accountId, mailData);
        stats.results.push({ row, to, success: true });
        stats.success++;
      } catch (e) {
        stats.results.push({ row, to, error: e.message });
        stats.error++;
      }
      stats.sent++;
      if (progressCb) progressCb({ ...stats });

      // Rate limit
      if (i < rows.length - 1 && rateLimit > 0) {
        await new Promise(r => setTimeout(r, rateLimit * 1000));
      }
    }

    return stats;
  }
}

module.exports = MailMergeService;
