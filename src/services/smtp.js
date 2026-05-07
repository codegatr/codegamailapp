const nodemailer = require('nodemailer');

class SmtpService {
  static _buildTransport(account, smtpPassword) {
    return nodemailer.createTransport({
      host: account.smtp_host,
      port: account.smtp_port,
      secure: !!account.smtp_secure, // 465 için true, 587 için false (STARTTLS)
      auth: {
        user: account.smtp_username || account.in_username,
        pass: smtpPassword
      },
      tls: { rejectUnauthorized: false }
    });
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
