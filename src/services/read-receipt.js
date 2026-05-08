/**
 * v1.46: Read Receipt (RFC 3798 MDN) gönderme yardımcısı
 *
 * Multipart/report mesajı oluştur:
 *   - text/plain insan-okunur kısım
 *   - message/disposition-notification yapısal kısım
 */

const nodemailer = require('nodemailer');

class ReadReceiptService {
  /**
   * MDN (Mail Disposition Notification) gönder
   * @param {object} account - göndericinin hesabı
   * @param {string} smtpPassword - şifrelenmiş şifre
   * @param {object} originalMsg - okunan orijinal mesaj
   * @returns {Promise<object>}
   */
  static async sendMDN(account, smtpPassword, originalMsg) {
    const recipientAddr = originalMsg.read_receipt_to || originalMsg.from_addr;
    if (!recipientAddr) throw new Error('Disposition-Notification-To adresi yok');

    const isOAuth = account.auth_type && account.auth_type.startsWith('oauth2_');
    const baseConfig = {
      host: account.smtp_host,
      port: account.smtp_port,
      secure: !!account.smtp_secure,
      tls: { rejectUnauthorized: false }
    };
    if (isOAuth) {
      baseConfig.auth = {
        type: 'OAuth2',
        user: account.smtp_username || account.in_username,
        accessToken: smtpPassword
      };
    } else {
      baseConfig.auth = {
        user: account.smtp_username || account.in_username,
        pass: smtpPassword
      };
    }
    const transporter = nodemailer.createTransport(baseConfig);

    const fromName = account.display_name || account.email;
    const subject = `Read: ${originalMsg.subject || ''}`;
    const dateStr = new Date().toUTCString();

    // RFC 3798 multipart/report
    const humanText =
      `Bu otomatik bir okundu onayıdır.\n\n` +
      `Aşağıdaki mailiniz alıcı tarafından görüntülendi:\n\n` +
      `  Konu: ${originalMsg.subject || '(konusuz)'}\n` +
      `  Gönderilme: ${originalMsg.date || ''}\n\n` +
      `Bu, mesajın okunduğunu garanti etmez - sadece açıldığını bildirir.\n` +
      `Otomatik gönderildi: CODEGA Mail (${dateStr})\n`;

    // disposition-notification body (yapısal)
    const reportingUA = `${account.email}; CODEGA-Mail`;
    const dispositionBody =
      `Reporting-UA: ${reportingUA}\r\n` +
      `Original-Recipient: rfc822;${account.email}\r\n` +
      `Final-Recipient: rfc822;${account.email}\r\n` +
      (originalMsg.message_id ? `Original-Message-ID: ${originalMsg.message_id}\r\n` : '') +
      `Disposition: manual-action/MDN-sent-manually; displayed\r\n`;

    const info = await transporter.sendMail({
      from: `"${fromName}" <${account.email}>`,
      to: recipientAddr,
      subject,
      headers: {
        'Content-Type': 'multipart/report; report-type=disposition-notification'
      },
      // nodemailer'ın multipart/report'a doğrudan desteği yok, raw alternative kullanıyoruz
      alternatives: [
        {
          contentType: 'message/disposition-notification',
          content: dispositionBody
        }
      ],
      text: humanText
    });

    transporter.close();
    return { ok: true, messageId: info.messageId };
  }
}

module.exports = ReadReceiptService;
