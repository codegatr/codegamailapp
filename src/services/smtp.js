const nodemailer = require('nodemailer');

class SmtpService {
  static _buildTransport(account, smtpPassword) {
    const isOAuth = account.auth_type && account.auth_type.startsWith('oauth2_');
    const baseConfig = {
      host: account.smtp_host,
      port: account.smtp_port,
      secure: !!account.smtp_secure,
      tls: { rejectUnauthorized: false }
    };
    if (isOAuth) {
      // Nodemailer XOAUTH2 desteği - access token doğrudan
      baseConfig.auth = {
        type: 'OAuth2',
        user: account.smtp_username || account.in_username,
        accessToken: smtpPassword // OAuth flow'da access_token şifrelenmiş şekilde geliyor
      };
    } else {
      baseConfig.auth = {
        user: account.smtp_username || account.in_username,
        pass: smtpPassword
      };
    }
    return nodemailer.createTransport(baseConfig);
  }

  static async sendMail(account, smtpPassword, mailData) {
    const transporter = SmtpService._buildTransport(account, smtpPassword);

    const fromName = account.display_name || account.email;
    const headers = {};
    // v1.46: Read receipt isteği
    if (mailData.requestReadReceipt) {
      headers['Disposition-Notification-To'] = `<${account.email}>`;
      headers['Return-Receipt-To'] = `<${account.email}>`; // Eski standart, bazı server'lar bunu kullanır
    }

    const info = await transporter.sendMail({
      from: `"${fromName}" <${account.email}>`,
      to: mailData.to,
      cc: mailData.cc || undefined,
      bcc: mailData.bcc || undefined,
      subject: mailData.subject,
      text: mailData.text,
      html: mailData.html,
      replyTo: mailData.replyTo || undefined,
      inReplyTo: mailData.inReplyTo || undefined,
      references: mailData.references || undefined,
      attachments: mailData.attachments || [],
      headers: Object.keys(headers).length ? headers : undefined
    });

    transporter.close();
    return { messageId: info.messageId, response: info.response };
  }

  /**
   * v1.46: MDN (Message Disposition Notification) gönder - RFC 3798
   * Read receipt request alındığında bu fonksiyonla yanıt mail'i gönderilir.
   */
  static async sendReadReceipt(account, smtpPassword, originalMsg) {
    const transporter = SmtpService._buildTransport(account, smtpPassword);
    const recipient = originalMsg.read_receipt_to || originalMsg.from_addr;
    if (!recipient) throw new Error('MDN için alıcı adresi yok');

    const fromName = account.display_name || account.email;
    const subject = `Read: ${originalMsg.subject || '(Konusuz)'}`;
    const dateStr = new Date().toUTCString();

    // RFC 3798 multipart/report
    const boundary = `----codega-mdn-${Date.now()}`;
    const textBody =
      `Bu bir otomatik okundu onayıdır.\r\n` +
      `Aşağıdaki mailinizin okundu olarak işaretlendiğini bildirir:\r\n\r\n` +
      `Konu: ${originalMsg.subject || '(Konusuz)'}\r\n` +
      `Gönderim tarihi: ${originalMsg.date || ''}\r\n` +
      `Okundu zamanı: ${dateStr}\r\n`;

    const dispositionNotification =
      `Reporting-UA: CODEGA Mail; 1.46.0\r\n` +
      `Original-Recipient: rfc822;${account.email}\r\n` +
      `Final-Recipient: rfc822;${account.email}\r\n` +
      `Original-Message-ID: ${originalMsg.message_id || '<unknown>'}\r\n` +
      `Disposition: manual-action/MDN-sent-manually; displayed\r\n`;

    // Nodemailer ile multipart mail
    const info = await transporter.sendMail({
      from: `"${fromName}" <${account.email}>`,
      to: recipient,
      subject: subject,
      headers: {
        'In-Reply-To': originalMsg.message_id || undefined,
        'References': originalMsg.message_id || undefined
      },
      // multipart/report - alternative yapıyla yaklaşıyoruz
      text: textBody,
      attachments: [{
        filename: 'disposition-notification.txt',
        content: dispositionNotification,
        contentType: 'message/disposition-notification'
      }]
    });

    transporter.close();
    return { messageId: info.messageId };
  }

  static async testConnection(account, smtpPassword) {
    const transporter = SmtpService._buildTransport(account, smtpPassword);
    await transporter.verify();
    transporter.close();
    return true;
  }
}

module.exports = SmtpService;
