/**
 * v1.53: Mail Import Service - PST, MBOX, EML
 *
 * Outlook PST, Thunderbird MBOX, ve standalone EML dosyalarından mail import.
 * Local protocol hesap altında saklanır (sync edilemez, sadece arşiv).
 */

const fs = require('fs');
const path = require('path');
const { simpleParser } = require('mailparser');

class MailImportService {
  constructor(db, crypto) {
    this.db = db;
    this.crypto = crypto;
  }

  /**
   * Dosya tipini tespit et
   */
  detectFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.pst' || ext === '.ost') return 'pst';
    if (ext === '.mbox' || ext === '.mbx') return 'mbox';
    if (ext === '.eml' || ext === '.emlx') return 'eml';
    // İçeriğe bak
    try {
      const head = Buffer.alloc(32);
      const fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, head, 0, 32, 0);
      fs.closeSync(fd);
      // PST signature: !BDN
      if (head.toString('ascii', 0, 4) === '!BDN') return 'pst';
      // MBOX: "From " ile başlar
      if (head.toString('ascii', 0, 5) === 'From ') return 'mbox';
      // EML: header'ları olur
      if (head.toString('ascii').match(/^(From|Received|Date|Subject):/i)) return 'eml';
    } catch (_) {}
    return 'unknown';
  }

  /**
   * PST dosyasından önizleme (mail/klasör sayısı)
   */
  async previewPst(filePath) {
    const { PSTFile } = require('pst-extractor');
    const pstFile = new PSTFile(filePath);
    let folderCount = 0;
    let messageCount = 0;
    const folders = [];

    const walk = (folder, depth = 0) => {
      folderCount++;
      folders.push({ name: folder.displayName, depth, count: folder.contentCount });
      if (folder.contentCount > 0) messageCount += folder.contentCount;
      if (folder.hasSubfolders) {
        for (const sub of folder.getSubFolders()) walk(sub, depth + 1);
      }
    };

    walk(pstFile.getRootFolder());
    return { folderCount, messageCount, folders: folders.slice(0, 20) };
  }

  /**
   * PST dosyasını import et
   */
  async importPst(filePath, accountId, progressCb) {
    const { PSTFile } = require('pst-extractor');
    const pstFile = new PSTFile(filePath);
    const stats = { folders: 0, messages: 0, errors: 0 };

    const importFolder = (pstFolder, parentFolderId = null) => {
      // Bazı sistem klasörleri atla
      const skipNames = ['Top of Outlook data file', 'Search Root', 'Common Views', 'Views', 'Receive Folder'];
      if (skipNames.includes(pstFolder.displayName)) {
        if (pstFolder.hasSubfolders) {
          for (const sub of pstFolder.getSubFolders()) importFolder(sub, parentFolderId);
        }
        return;
      }

      let folderId = parentFolderId;
      if (pstFolder.displayName) {
        folderId = this.db.upsertFolder(accountId, {
          name: pstFolder.displayName,
          path: '__PST_' + pstFolder.displayName.replace(/[^a-zA-Z0-9]/g, '_'),
          special_use: this._guessSpecialUse(pstFolder.displayName),
          is_local: true
        });
        stats.folders++;
      }

      // Mesajları import et
      if (pstFolder.contentCount > 0 && folderId) {
        let item = pstFolder.getNextChild();
        while (item !== null) {
          try {
            // Sadece mail (IPM.Note)
            if (item.messageClass && item.messageClass.startsWith('IPM.Note')) {
              this._insertPstMessage(accountId, folderId, item);
              stats.messages++;
              if (stats.messages % 50 === 0 && progressCb) {
                progressCb({ ...stats });
              }
            }
          } catch (e) {
            stats.errors++;
          }
          item = pstFolder.getNextChild();
        }
      }

      // Alt klasörler
      if (pstFolder.hasSubfolders) {
        for (const sub of pstFolder.getSubFolders()) importFolder(sub, folderId);
      }
    };

    importFolder(pstFile.getRootFolder());
    if (progressCb) progressCb({ ...stats, done: true });
    return stats;
  }

  _guessSpecialUse(name) {
    const lower = (name || '').toLowerCase();
    if (lower === 'inbox' || lower === 'gelen kutusu') return '\\Inbox';
    if (lower === 'sent items' || lower === 'gönderilmiş öğeler' || lower === 'gönderilenler') return '\\Sent';
    if (lower === 'drafts' || lower === 'taslaklar') return '\\Drafts';
    if (lower === 'deleted items' || lower === 'silinmiş öğeler') return '\\Trash';
    if (lower === 'junk' || lower === 'önemsiz e-posta' || lower === 'spam') return '\\Junk';
    if (lower === 'archive' || lower === 'arşiv') return '\\Archive';
    return null;
  }

  _insertPstMessage(accountId, folderId, item) {
    // PST item'dan field'ları çek
    const subject = item.subject || '(Konu yok)';
    const from = item.senderName || item.senderEmailAddress || '';
    const fromAddr = item.senderEmailAddress || '';
    const to = item.displayTo || '';
    const cc = item.displayCC || '';
    const bcc = item.displayBCC || '';
    const date = item.clientSubmitTime || item.messageDeliveryTime || new Date();
    const bodyText = item.body || '';
    const bodyHtml = item.bodyHTML || '';
    const isRead = !item.isUnread;
    const isFlagged = !!item.flagStatus;

    this.db.insertMessage({
      account_id: accountId,
      folder_id: folderId,
      message_id: item.internetMessageId || null,
      from_addr: fromAddr,
      from_name: from,
      to_addrs: to ? JSON.stringify([{ address: to }]) : null,
      cc_addrs: cc ? JSON.stringify([{ address: cc }]) : null,
      bcc_addrs: bcc ? JSON.stringify([{ address: bcc }]) : null,
      subject,
      date: new Date(date).toISOString(),
      body_text: bodyText,
      body_html: bodyHtml,
      flags: isRead ? ['\\Seen'] : [],
      is_read: isRead,
      is_flagged: isFlagged,
      size: (bodyHtml || bodyText).length,
      has_attachments: item.hasAttachments ? 1 : 0
    });
  }

  /**
   * MBOX (Thunderbird, Apple Mail) önizleme
   */
  async previewMbox(filePath) {
    const stats = fs.statSync(filePath);
    // İçerikte "From " ile başlayan satır sayısı = mail sayısı (yaklaşık)
    // Hızlı tahmin: dosya boyutuna göre
    const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
    let messageCount = 0;
    const stream = fs.createReadStream(filePath, { encoding: 'utf8', highWaterMark: 65536 });
    return new Promise((resolve, reject) => {
      let buf = '';
      stream.on('data', (chunk) => {
        buf += chunk;
        const matches = buf.match(/\nFrom /g);
        if (matches) {
          messageCount += matches.length;
          buf = buf.slice(buf.lastIndexOf('\nFrom '));
        }
        if (messageCount > 500) { stream.destroy(); resolve({ messageCount: '500+', sizeMB }); }
      });
      stream.on('end', () => resolve({ messageCount, sizeMB }));
      stream.on('error', reject);
    });
  }

  /**
   * MBOX import
   */
  async importMbox(filePath, accountId, folderId, progressCb) {
    const stats = { messages: 0, errors: 0 };
    const content = fs.readFileSync(filePath, 'utf8');

    // MBOX format: "From " ile başlayan her satır yeni mail
    const messages = content.split(/\nFrom \S+ /).filter(Boolean);

    for (let i = 0; i < messages.length; i++) {
      try {
        const raw = (i === 0 ? '' : 'From ') + messages[i];
        const parsed = await simpleParser(raw);
        this.db.insertMessage({
          account_id: accountId,
          folder_id: folderId,
          message_id: parsed.messageId || null,
          from_addr: parsed.from?.value?.[0]?.address || '',
          from_name: parsed.from?.value?.[0]?.name || '',
          to_addrs: parsed.to?.value ? JSON.stringify(parsed.to.value) : null,
          cc_addrs: parsed.cc?.value ? JSON.stringify(parsed.cc.value) : null,
          subject: parsed.subject || '(Konu yok)',
          date: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
          body_text: parsed.text || '',
          body_html: parsed.html || '',
          flags: ['\\Seen'],
          is_read: true,
          size: (parsed.html || parsed.text || '').length,
          has_attachments: parsed.attachments && parsed.attachments.length ? 1 : 0
        });
        stats.messages++;
        if (stats.messages % 25 === 0 && progressCb) progressCb({ ...stats });
      } catch (e) {
        stats.errors++;
      }
    }
    if (progressCb) progressCb({ ...stats, done: true });
    return stats;
  }

  /**
   * EML import (tek dosya)
   */
  async importEml(filePath, accountId, folderId) {
    const raw = fs.readFileSync(filePath);
    const parsed = await simpleParser(raw);
    this.db.insertMessage({
      account_id: accountId,
      folder_id: folderId,
      message_id: parsed.messageId || null,
      from_addr: parsed.from?.value?.[0]?.address || '',
      from_name: parsed.from?.value?.[0]?.name || '',
      to_addrs: parsed.to?.value ? JSON.stringify(parsed.to.value) : null,
      cc_addrs: parsed.cc?.value ? JSON.stringify(parsed.cc.value) : null,
      subject: parsed.subject || '(Konu yok)',
      date: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
      body_text: parsed.text || '',
      body_html: parsed.html || '',
      flags: ['\\Seen'],
      is_read: true,
      size: (parsed.html || parsed.text || '').length,
      has_attachments: parsed.attachments && parsed.attachments.length ? 1 : 0
    });
    return { messages: 1 };
  }

  /**
   * Yerel arşiv hesabı oluştur veya bul
   */
  ensureLocalArchiveAccount(displayName = 'Yerel Arşiv') {
    const existing = this.db.listAccounts().find(a =>
      a.protocol === 'local' && a.display_name === displayName
    );
    if (existing) return existing.id;

    const dummy = this.crypto.encrypt('local-archive-dummy');
    return this.db.addAccount({
      display_name: displayName,
      email: 'archive@local',
      protocol: 'local',
      in_host: 'local',
      in_port: 0,
      in_username: 'local',
      in_password: dummy,
      in_secure: 0,
      smtp_host: 'local',
      smtp_port: 0,
      smtp_username: 'local',
      smtp_password: dummy,
      smtp_secure: 0,
      auth_type: 'password'
    });
  }
}

module.exports = MailImportService;
