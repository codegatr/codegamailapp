const ImapService = require('./mail-imap');
const Pop3Service = require('./mail-pop3');
const SmtpService = require('./smtp');

class MailService {
  constructor(db, crypto) {
    this.db = db;
    this.crypto = crypto;
  }

  setDb(db) { this.db = db; }

  /**
   * v1.42: Access token süresi dolmadan önce yenile
   * @returns {Promise<string>} geçerli accessToken
   */
  async _ensureValidOAuthToken(acc) {
    const oauth2 = require('./oauth2');
    let accessToken = acc.oauth_access_token ? this.crypto.decrypt(acc.oauth_access_token) : '';
    let refreshToken = acc.oauth_refresh_token ? this.crypto.decrypt(acc.oauth_refresh_token) : '';
    const expiresAt = acc.oauth_expires_at ? new Date(acc.oauth_expires_at).getTime() : 0;
    const now = Date.now();
    // 60 saniye buffer
    if (accessToken && expiresAt - now > 60000) {
      return accessToken;
    }
    // Refresh
    if (!refreshToken) throw new Error('OAuth2 hesabı: yeniden giriş gerekli (refresh token yok)');
    const provider = acc.auth_type.replace('oauth2_', '');
    const result = await oauth2.refreshAccessToken(provider, refreshToken);
    this.db.updateAccount(acc.id, {
      oauth_access_token: this.crypto.encrypt(result.accessToken),
      oauth_refresh_token: this.crypto.encrypt(result.refreshToken),
      oauth_expires_at: result.expiresAt
    });
    this.db.save();
    return result.accessToken;
  }

  async _getDecryptedAccountAsync(accountId) {
    const acc = this.db.getAccount(accountId);
    if (!acc) throw new Error('Hesap bulunamadı: ' + accountId);
    if (acc.auth_type && acc.auth_type.startsWith('oauth2_')) {
      const token = await this._ensureValidOAuthToken(acc);
      return { account: acc, inPassword: token, smtpPassword: token };
    }
    return {
      account: acc,
      inPassword: this.crypto.decrypt(acc.in_password),
      smtpPassword: acc.smtp_password
        ? this.crypto.decrypt(acc.smtp_password)
        : this.crypto.decrypt(acc.in_password)
    };
  }

  _getDecryptedAccount(accountId) {
    const acc = this.db.getAccount(accountId);
    if (!acc) throw new Error('Hesap bulunamadı: ' + accountId);
    // Sync versiyon - OAuth için _getDecryptedAccountAsync kullanılmalı
    if (acc.auth_type && acc.auth_type.startsWith('oauth2_')) {
      // OAuth hesapları için sync versiyon: token süresi dolmuşsa hata
      const accessToken = acc.oauth_access_token ? this.crypto.decrypt(acc.oauth_access_token) : '';
      const expiresAt = acc.oauth_expires_at ? new Date(acc.oauth_expires_at).getTime() : 0;
      if (!accessToken || expiresAt - Date.now() <= 60000) {
        throw new Error('OAuth2 token süresi doldu - yeniden senkronize edin (otomatik yenilenir)');
      }
      return { account: acc, inPassword: accessToken, smtpPassword: accessToken };
    }
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
    const { account, inPassword } = await this._getDecryptedAccountAsync(accountId);

    // Sync öncesi en yüksek mesaj id'sini al (kurallar için)
    let beforeMaxId = 0;
    try {
      const r = this.db.prepare('SELECT MAX(id) AS m FROM messages WHERE account_id = ?').get(accountId);
      beforeMaxId = (r && r.m) || 0;
    } catch (_) {}

    let result;
    if (account.protocol === 'pop3') {
      result = await Pop3Service.syncAccount(account, inPassword, this.db, onProgress);
    } else {
      result = await ImapService.syncAccount(account, inPassword, this.db, onProgress);
    }

    // v1.7: Yeni gelen mesajlara kuralları uygula
    try {
      const rulesApplied = this._applyRulesToNewMessages(accountId, beforeMaxId);
      if (rulesApplied > 0) {
        result.rulesApplied = rulesApplied;
      }
    } catch (e) {
      console.warn('Kural uygulama hatası:', e.message);
    }

    return result;
  }

  // v1.7: Belirli mesajlara kuralları uygula
  _applyRulesToNewMessages(accountId, sinceId) {
    if (!this.db) return 0;
    const rules = this.db.listRules(accountId).filter(r => r.enabled);
    if (!rules.length) return 0;

    // Yeni mesajları al (id > sinceId, spam değil)
    const newMessages = this.db.prepare(`
      SELECT * FROM messages WHERE account_id = ? AND id > ? AND is_spam = 0
    `).all(accountId, sinceId);

    if (!newMessages.length) return 0;

    let appliedCount = 0;
    for (const msg of newMessages) {
      for (const rule of rules) {
        try {
          const conditions = JSON.parse(rule.conditions || '[]');
          const actions = JSON.parse(rule.actions || '[]');
          const matchType = rule.match_type || 'all';

          // Conditions değerlendir
          const results = conditions.map(c => this._evalCondition(msg, c));
          const matched = matchType === 'any' ? results.some(r => r) : results.every(r => r);

          if (matched) {
            // Aksiyonları uygula
            for (const action of actions) {
              this._applyAction(msg, action);
            }
            this.db.incrementRuleRunCount(rule.id);
            appliedCount++;
          }
        } catch (e) {
          console.warn(`Kural ${rule.id} hatası:`, e.message);
        }
      }
    }
    return appliedCount;
  }

  _evalCondition(msg, c) {
    const field = String(c.field || '').toLowerCase();
    const op = String(c.operator || 'contains').toLowerCase();
    const value = String(c.value || '').toLowerCase().trim();
    if (!value) return false;

    let target = '';
    switch (field) {
      case 'from': target = (msg.from_addr || '') + ' ' + (msg.from_name || ''); break;
      case 'fromdomain': target = (msg.from_addr || '').split('@')[1] || ''; break;
      case 'to': target = msg.to_addrs || ''; break;
      case 'subject': target = msg.subject || ''; break;
      case 'body': target = msg.body_text || ''; break;
      case 'hasattachment': return op === 'is' ? msg.has_attachments == 1 : msg.has_attachments == 0;
      default: return false;
    }
    target = target.toLowerCase();

    switch (op) {
      case 'contains': return target.includes(value);
      case 'notcontains': return !target.includes(value);
      case 'equals': return target === value;
      case 'startswith': return target.startsWith(value);
      case 'endswith': return target.endsWith(value);
      case 'matches':
        try { return new RegExp(value, 'i').test(target); }
        catch (_) { return false; }
      default: return false;
    }
  }

  _applyAction(msg, action) {
    const type = action.type;
    switch (type) {
      case 'movetofolder':
      case 'moveToFolder': {
        const targetFolderId = parseInt(action.value, 10);
        if (targetFolderId && targetFolderId !== msg.folder_id) {
          // Sadece DB seviyesinde taşı (sunucudan ayrı)
          this.db.prepare('UPDATE messages SET folder_id = ? WHERE id = ?')
            .run(targetFolderId, msg.id);
          this.db.updateFolderCounts(msg.folder_id);
          this.db.updateFolderCounts(targetFolderId);
          msg.folder_id = targetFolderId;
        }
        break;
      }
      case 'markasread':
      case 'markAsRead':
        this.db.markMessageRead(msg.id, true);
        msg.is_read = 1;
        break;
      case 'markasimportant':
      case 'markAsImportant':
        this.db.markMessageImportant(msg.id, true);
        msg.is_important = 1;
        break;
      case 'delete':
        this.db.deleteMessage(msg.id);
        break;
      case 'markasspam':
      case 'markAsSpam':
        this.db.prepare('UPDATE messages SET is_spam = 1, spam_score = 100 WHERE id = ?').run(msg.id);
        break;
      case 'addcategory':
      case 'addCategory': {
        const catId = parseInt(action.value, 10);
        if (catId) {
          this.db.addMessageCategory(msg.id, catId);
        }
        break;
      }
    }
  }

  async sendMail(accountId, mailData) {
    const { account, smtpPassword } = await this._getDecryptedAccountAsync(accountId);
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
        size: (mailData.html || mailData.text || '').length,
        // v1.47: Read receipt isteği işaretle
        request_read_receipt: mailData.requestReadReceipt ? 1 : 0
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

    const { account, inPassword } = await this._getDecryptedAccountAsync(msg.account_id);
    if (account.protocol !== 'imap') return;
    await ImapService.setFlag(account, inPassword, folder.path, msg.uid, flag, isAdd);
  }

  async deleteMessage(messageId) {
    const msg = this.db.getMessage(messageId);
    if (!msg) return;
    const folder = this.db.getFolder(msg.folder_id);

    try {
      if (msg.uid && folder && !folder.is_local) {
        const { account, inPassword } = await this._getDecryptedAccountAsync(msg.account_id);
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
        const { account, inPassword } = await this._getDecryptedAccountAsync(msg.account_id);
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

    const { account, inPassword } = await this._getDecryptedAccountAsync(accountId);

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
