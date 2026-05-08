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
      attachments: mailData.attachments || []
    });

    transporter.close();
    return { messageId: info.messageId, response: info.response };
  }

  static async testConnection(account, smtpPassword) {
    const transporter = SmtpService._buildTransport(account, smtpPassword);
    await transporter.verify();
    transporter.close();
    return true;
  }
}

module.exports = SmtpService;
