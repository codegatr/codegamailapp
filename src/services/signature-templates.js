/**
 * v1.38: Mail İmza Şablonları
 *
 * 6 hazır şablon. Her şablon HTML üretir, yer-tutucular veriyle doldurulur.
 * Logo data-URL olarak base64 (settings'te upload edilir).
 *
 * Kullanım:
 *   const html = SignatureTemplates.render('modern', data);
 */

class SignatureTemplates {
  static escapeHtml(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  static getTemplates() {
    return [
      { id: 'classic', name: '📜 Klasik', description: 'Sade ve geleneksel - 4 satır' },
      { id: 'modern', name: '🎨 Modern', description: 'Sol logo + sağ bilgi (2 sütun)' },
      { id: 'card', name: '🪪 Kart Stili', description: "Border'lı kompakt kart" },
      { id: 'minimal', name: '✨ Minimalist', description: 'Tek satır, sade' },
      { id: 'colorful', name: '🌈 Renkli', description: 'Büyük başlık + accent renk' },
      { id: 'corporate', name: '🏢 Kurumsal', description: 'Logo + adres + sosyal medya' }
    ];
  }

  /**
   * Şablon HTML'ini üret
   * @param {string} templateId
   * @param {object} data - { name, title, company, phone, email, website, address, logoDataUrl, accentColor, linkedin, twitter, instagram }
   */
  static render(templateId, data) {
    const d = data || {};
    const e = SignatureTemplates.escapeHtml;
    const accent = d.accentColor || '#0078d4';
    const name = e(d.name || '');
    const title = e(d.title || '');
    const company = e(d.company || '');
    const phone = e(d.phone || '');
    const email = e(d.email || '');
    const website = e(d.website || '');
    const address = e(d.address || '');
    const logoUrl = d.logoDataUrl || '';
    const linkedin = d.linkedin || '';
    const twitter = d.twitter || '';
    const instagram = d.instagram || '';

    const sep = '<span style="color:#999;">&nbsp;|&nbsp;</span>';

    switch (templateId) {
      case 'classic':
        return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:13px;color:#333;line-height:1.5;">
  <tr><td>
    <strong style="font-size:14px;color:${accent};">${name}</strong><br>
    ${title ? title + (company ? ' &bull; ' + company : '') : (company ? company : '')}<br>
    ${phone ? '<strong>T:</strong> ' + phone : ''}${phone && email ? ' &nbsp;|&nbsp; ' : ''}${email ? '<strong>E:</strong> <a href="mailto:' + email + '" style="color:' + accent + ';text-decoration:none;">' + email + '</a>' : ''}<br>
    ${website ? '<strong>W:</strong> <a href="' + (website.startsWith('http') ? website : 'https://' + website) + '" style="color:' + accent + ';text-decoration:none;">' + website + '</a>' : ''}
  </td></tr>
</table>`.trim();

      case 'modern':
        return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#333;line-height:1.5;">
  <tr>
    ${logoUrl ? `<td valign="top" style="padding-right:14px;border-right:3px solid ${accent};"><img src="${logoUrl}" alt="Logo" style="max-width:80px;max-height:80px;display:block;"></td>` : ''}
    <td valign="top" style="padding-left:${logoUrl ? '14px' : '0'};">
      <div style="font-size:16px;font-weight:600;color:${accent};margin-bottom:2px;">${name}</div>
      <div style="font-size:12px;color:#666;margin-bottom:6px;">${title}${title && company ? ' &bull; ' : ''}<strong style="color:#333;">${company}</strong></div>
      <div style="font-size:11px;color:#555;">
        ${phone ? '📱 ' + phone : ''}
        ${phone && email ? '&nbsp;&bull;&nbsp;' : ''}
        ${email ? '📧 <a href="mailto:' + email + '" style="color:' + accent + ';text-decoration:none;">' + email + '</a>' : ''}
        ${(phone || email) && website ? '&nbsp;&bull;&nbsp;' : ''}
        ${website ? '🌐 <a href="' + (website.startsWith('http') ? website : 'https://' + website) + '" style="color:' + accent + ';text-decoration:none;">' + website + '</a>' : ''}
      </div>
    </td>
  </tr>
</table>`.trim();

      case 'card':
        return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:12px;color:#333;background:#f8f9fa;border:1px solid #e0e0e0;border-left:4px solid ${accent};border-radius:4px;padding:12px 14px;max-width:380px;">
  <tr><td>
    ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="max-width:50px;max-height:50px;float:right;margin-left:10px;">` : ''}
    <div style="font-size:15px;font-weight:600;color:${accent};margin-bottom:2px;">${name}</div>
    <div style="font-size:11px;color:#666;margin-bottom:8px;">${title}${title && company ? ' &bull; ' : ''}${company}</div>
    <table cellpadding="0" cellspacing="0" border="0" style="font-size:11px;color:#555;">
      ${phone ? `<tr><td style="padding:2px 6px 2px 0;color:${accent};">📱</td><td>${phone}</td></tr>` : ''}
      ${email ? `<tr><td style="padding:2px 6px 2px 0;color:${accent};">📧</td><td><a href="mailto:${email}" style="color:#333;text-decoration:none;">${email}</a></td></tr>` : ''}
      ${website ? `<tr><td style="padding:2px 6px 2px 0;color:${accent};">🌐</td><td><a href="${website.startsWith('http') ? website : 'https://' + website}" style="color:#333;text-decoration:none;">${website}</a></td></tr>` : ''}
    </table>
  </td></tr>
</table>`.trim();

      case 'minimal':
        return `
<div style="font-family:Arial,sans-serif;font-size:12px;color:#666;line-height:1.5;">
  <strong style="color:#333;">${name}</strong>${title ? sep + title : ''}${company ? sep + '<span style="color:' + accent + ';">' + company + '</span>' : ''}${phone ? sep + phone : ''}${email ? sep + '<a href="mailto:' + email + '" style="color:' + accent + ';text-decoration:none;">' + email + '</a>' : ''}
</div>`.trim();

      case 'colorful':
        return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#333;line-height:1.5;">
  <tr><td>
    <div style="font-size:22px;font-weight:700;color:${accent};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">${name}</div>
    <div style="font-size:13px;color:#555;margin-bottom:8px;">${title}${title && company ? ' | ' : ''}<strong>${company}</strong></div>
    <div style="height:2px;background:linear-gradient(90deg,${accent},transparent);width:200px;margin-bottom:8px;"></div>
    <div style="font-size:12px;color:#555;">
      ${phone ? '📱 <strong>' + phone + '</strong>' : ''}
      ${phone && email ? '&nbsp;&bull;&nbsp;' : ''}
      ${email ? '📧 <a href="mailto:' + email + '" style="color:' + accent + ';text-decoration:none;">' + email + '</a>' : ''}
      ${website ? '<br>🌐 <a href="' + (website.startsWith('http') ? website : 'https://' + website) + '" style="color:' + accent + ';text-decoration:none;">' + website + '</a>' : ''}
    </div>
  </td></tr>
</table>`.trim();

      case 'corporate':
        return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:12px;color:#333;line-height:1.5;">
  <tr>
    ${logoUrl ? `<td valign="top" style="padding-right:18px;"><img src="${logoUrl}" alt="Logo" style="max-width:90px;max-height:90px;display:block;"></td>` : ''}
    <td valign="top" style="border-left:${logoUrl ? '2px solid ' + accent : 'none'};padding-left:${logoUrl ? '18px' : '0'};">
      <div style="font-size:15px;font-weight:bold;color:#222;">${name}</div>
      <div style="font-size:12px;color:${accent};margin-bottom:6px;">${title}</div>
      <div style="font-size:13px;color:#333;font-weight:600;margin-bottom:6px;">${company}</div>
      ${address ? `<div style="font-size:11px;color:#666;margin-bottom:6px;">📍 ${address}</div>` : ''}
      <div style="font-size:11px;color:#555;border-top:1px solid #ddd;padding-top:6px;margin-top:6px;">
        ${phone ? 'T: ' + phone : ''}
        ${phone && email ? ' | ' : ''}
        ${email ? 'E: <a href="mailto:' + email + '" style="color:' + accent + ';text-decoration:none;">' + email + '</a>' : ''}
        ${website ? ' | W: <a href="' + (website.startsWith('http') ? website : 'https://' + website) + '" style="color:' + accent + ';text-decoration:none;">' + website + '</a>' : ''}
      </div>
      ${(linkedin || twitter || instagram) ? `
        <div style="margin-top:8px;font-size:11px;">
          ${linkedin ? `<a href="${SignatureTemplates.escapeHtml(linkedin)}" style="color:${accent};text-decoration:none;margin-right:8px;">in LinkedIn</a>` : ''}
          ${twitter ? `<a href="${SignatureTemplates.escapeHtml(twitter)}" style="color:${accent};text-decoration:none;margin-right:8px;">𝕏 Twitter</a>` : ''}
          ${instagram ? `<a href="${SignatureTemplates.escapeHtml(instagram)}" style="color:${accent};text-decoration:none;">📷 Instagram</a>` : ''}
        </div>` : ''}
    </td>
  </tr>
</table>`.trim();

      default:
        return SignatureTemplates.render('classic', data);
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SignatureTemplates;
}
if (typeof window !== 'undefined') {
  window.SignatureTemplates = SignatureTemplates;
}
