const ImapService = require('./mail-imap');
const Pop3Service = require('./mail-pop3');
const SmtpService = require('./smtp');

class MailService {
  constructor(db, crypto) {
    this.db = db;
    this.crypto = crypto;
  }

  setDb(db) { this.db = db; }

  _getDecryptedAccount(accountId) {
    const acc = this.db.getAccount(accountId);
    if (!acc) throw new Error('Hesap bulunamadı: ' + accountId);
    return {
      account: acc,
      inPassword: this.crypto.decrypt(acc.in_password),
      smtpPassword: acc.smtp_password
        ? this.crypto.decrypt(acc.smtp_password)
        : this.crypto.decrypt(acc.in_password)
    };
  }

  async testConnection(accountData) {
    const result = { incoming: false, outgoing: false, errors: [] };

    try {
      if (accountData.protocol === 'pop3') {
        await Pop3Service.testConnection(accountData, accountData.in_password);
      } else {
        await ImapService.testConnection(accountData, accountData.in_password);
      }
      result.incoming = true;
    } catch (err) {
      result.errors.push(`Gelen sunucu (${accountData.protocol.toUpperCase()}): ${err.message}`);
    }

    try {
      const smtpAcc = { ...accountData };
      const smtpPw = accountData.smtp_password || accountData.in_password;
      await SmtpService.testConnection(smtpAcc, smtpPw);
      result.outgoing = true;
    } catch (err) {
      result.errors.push(`Giden sunucu (SMTP): ${err.message}`);
    }

    result.ok = result.incoming && result.outgoing;
    return result;
  }

  async syncAccount(accountId, onProgress) {
    const { account, inPassword } = this._getDecryptedAccount(accountId);
    if (account.protocol === 'pop3') {
      return await Pop3Service.syncAccount(account, inPassword, this.db, onProgress);
    } else {
      return await ImapService.syncAccount(account, inPassword, this.db, onProgress);
    }
  }

  async sendMail(accountId, mailData) {
    const { account, smtpPassword } = this._getDecryptedAccount(accountId);
    const result = await SmtpService.sendMail(account, smtpPassword, mailData);

    try {
      const folders = this.db.listFolders(accountId);
      let sentFolder = folders.find(f => f.special_use === '\\Sent');
      if (!sentFolder) {
        const folderId = this.db.upsertFolder(accountId, {
          name: 'Gönderilenler', path: '__SENT__', special_use: '\\Sent', is_local: true
        });
        sentFolder = { id: folderId };
      }

      this.db.insertMessage({
        account_id: accountId,
        folder_id: sentFolder.id,
        message_id: result.messageId,
        from_addr: account.email,
        from_name: account.display_name,
        to_addrs: JSON.stringify(
          (mailData.to || '').split(',').map(s => ({ address: s.trim() }))
        ),
        cc_addrs: mailData.cc
          ? JSON.stringify(mailData.cc.split(',').map(s => ({ address: s.trim() })))
          : null,
        subject: mailData.subject,
        date: new Date().toISOString(),
        body_text: mailData.text,
        body_html: mailData.html,
        flags: ['\\Seen'],
        is_read: true,
        size: (mailData.html || mailData.text || '').length
      });
      this.db.updateFolderCounts(sentFolder.id);
    } catch (e) {
      console.warn('Gönderilenler klasörüne yazılamadı:', e.message);
    }

    return result;
  }

  async setFlag(messageId, flag, isAdd) {
    const msg = this.db.getMessage(messageId);
    if (!msg || !msg.uid) return;
    const folder = this.db.getFolder(msg.folder_id);
    if (!folder || folder.is_local) return;

    const { account, inPassword } = this._getDecryptedAccount(msg.account_id);
    if (account.protocol !== 'imap') return;
    await ImapService.setFlag(account, inPassword, folder.path, msg.uid, flag, isAdd);
  }

  async deleteMessage(messageId) {
    const msg = this.db.getMessage(messageId);
    if (!msg) return;
    const folder = this.db.getFolder(msg.folder_id);

    try {
      if (msg.uid && folder && !folder.is_local) {
        const { account, inPassword } = this._getDecryptedAccount(msg.account_id);
        if (account.protocol === 'imap') {
          await ImapService.deleteMessage(account, inPassword, folder.path, msg.uid);
        }
      }
    } catch (e) {
      console.warn('Sunucudan silinemedi:', e.message);
    }

    this.db.deleteMessage(messageId);
  }

  /**
   * Mesajı başka klasöre taşı.
   * IMAP'te ve hedef klasör de sunucuda ise sunucu üzerinde de taşır.
   */
  async moveMessage(messageId, targetFolderId) {
    const msg = this.db.getMessage(messageId);
    if (!msg) throw new Error('Mesaj bulunamadı');
    const fromFolder = this.db.getFolder(msg.folder_id);
    const toFolder = this.db.getFolder(targetFolderId);
    if (!toFolder) throw new Error('Hedef klasör bulunamadı');

    // Sunucu tarafı taşıma (IMAP, ikisi de sunucuda ise)
    try {
      if (msg.uid && fromFolder && !fromFolder.is_local && !toFolder.is_local) {
        const { account, inPassword } = this._getDecryptedAccount(msg.account_id);
        if (account.protocol === 'imap') {
          await ImapService.moveMessage(account, inPassword, fromFolder.path, toFolder.path, msg.uid);
          // Sunucu taşıdı ise yerel kaydı SİL (yeni UID ile yeni sync'te gelir)
          this.db.deleteMessage(messageId);
          return { ok: true, serverMoved: true };
        }
      }
    } catch (e) {
      console.warn('Sunucu taşıma hatası, yerel taşıma yapılıyor:', e.message);
    }

    // Yerel taşıma
    this.db.moveMessage(messageId, targetFolderId);
    return { ok: true, serverMoved: false };
  }

  /**
   * Yeni klasör oluştur.
   * onServer=true ise IMAP sunucusunda da yaratır.
   */
  async createFolder(accountId, name, onServer = false) {
    if (!name || !name.trim()) throw new Error('Klasör adı boş olamaz');
    name = name.trim();

    const { account, inPassword } = this._getDecryptedAccount(accountId);

    if (onServer && account.protocol === 'imap') {
      try {
        await ImapService.createBox(account, inPassword, name);
        // Sunucuda oluştu - sync ile zaten görünür olur, ama hemen ekleyelim
        const folderId = this.db.upsertFolder(accountId, {
          name, path: name, is_local: false
        });
        return { ok: true, folderId, onServer: true };
      } catch (e) {
        throw new Error('Sunucuda klasör oluşturulamadı: ' + e.message);
      }
    } else {
      // Yerel klasör
      const folderId = this.db.createLocalFolder(accountId, name);
      return { ok: true, folderId, onServer: false };
    }
  }

  /**
   * Bir mesajı spam olarak işaretle:
   *  - Spam klasörüne taşı
   *  - Göndericiyi blacklist'e ekle
   */
  async markAsSpam(messageId) {
    const msg = this.db.getMessage(messageId);
    if (!msg) return;

    const spamFolderId = this.db.ensureSpamFolder(msg.account_id);

    // Göndericiyi blacklist'e ekle
    if (msg.from_addr) {
      this.db.addSpamRule({
        account_id: msg.account_id,
        type: 'sender',
        pattern: msg.from_addr,
        action: 'block'
      });
    }

    this.db.setSpam(messageId, true);
    if (msg.folder_id !== spamFolderId) {
      this.db.moveMessage(messageId, spamFolderId);
    }

    return { ok: true, spamFolderId };
  }

  /**
   * "Spam değil" işaretle:
   *  - Mesajı Inbox'a geri taşı
   *  - Göndericiyi whitelist'e ekle
   *  - Eğer aynı gönderici için block kuralı varsa kaldır
   */
  async markAsNotSpam(messageId) {
    const msg = this.db.getMessage(messageId);
    if (!msg) return;

    if (msg.from_addr) {
      // Whitelist'e ekle
      this.db.addSpamRule({
        account_id: msg.account_id,
        type: 'sender',
        pattern: msg.from_addr,
        action: 'allow'
      });
      // Bu göndericiye ait block kurallarını sil
      const rules = this.db.listSpamRules(msg.account_id);
      for (const r of rules) {
        if (r.action === 'block' && r.type === 'sender' &&
            r.pattern.toLowerCase() === msg.from_addr.toLowerCase()) {
          this.db.deleteSpamRule(r.id);
        }
      }
    }

    this.db.setSpam(messageId, false);

    // Inbox'a taşı
    const folders = this.db.listFolders(msg.account_id);
    const inbox = folders.find(f => f.special_use === '\\Inbox');
    if (inbox && inbox.id !== msg.folder_id) {
      this.db.moveMessage(messageId, inbox.id);
    }

    return { ok: true };
  }
}

module.exports = MailService;
