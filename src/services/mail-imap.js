const Imap = require('imap');
const { simpleParser } = require('mailparser');
const SpamFilter = require('./spam');
const EmailSecurity = require('./email-security');

class ImapService {
  static _buildConnection(account, password) {
    return new Imap({
      user: account.in_username,
      password: password,
      host: account.in_host,
      port: account.in_port,
      tls: !!account.in_secure,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 15000,
      connTimeout: 15000,
      keepalive: false
    });
  }

  static async testConnection(account, password) {
    return new Promise((resolve, reject) => {
      const imap = ImapService._buildConnection(account, password);
      let resolved = false;
      const done = (err) => {
        if (resolved) return;
        resolved = true;
        try { imap.end(); } catch (_) {}
        if (err) reject(err); else resolve(true);
      };
      imap.once('ready', () => done(null));
      imap.once('error', (err) => done(err));
      imap.connect();
    });
  }

  static async syncAccount(account, password, db, onProgress) {
    return new Promise((resolve, reject) => {
      const imap = ImapService._buildConnection(account, password);
      let totalNew = 0;
      let totalSpam = 0;

      // Spam kurallarını oku (her sync başında bir kez)
      const spamRules = account.spam_enabled ? db.listSpamRules(account.id) : [];
      const spamThreshold = account.spam_threshold || 50;
      const spamFolderId = account.spam_enabled ? db.ensureSpamFolder(account.id) : null;

      imap.once('ready', async () => {
        try {
          const boxes = await new Promise((res, rej) => {
            imap.getBoxes((err, boxes) => err ? rej(err) : res(boxes));
          });

          const flatFolders = ImapService._flattenBoxes(boxes);
          onProgress?.({ stage: 'folders', count: flatFolders.length });

          for (const folder of flatFolders) {
            if (folder.attribs && folder.attribs.includes('\\Noselect')) continue;

            const folderId = db.upsertFolder(account.id, {
              name: folder.displayName,
              path: folder.path,
              special_use: folder.specialUse,
              is_local: false
            });

            try {
              const stats = await ImapService._syncFolder(
                imap, account, folderId, folder.path, db, onProgress,
                {
                  spamRules,
                  spamThreshold,
                  spamFolderId,
                  isSpamFolder: folder.specialUse === '\\Junk'
                }
              );
              totalNew += stats.newMessages;
              totalSpam += stats.spamMessages;
              db.updateFolderCounts(folderId);
              if (spamFolderId) db.updateFolderCounts(spamFolderId);
            } catch (folderErr) {
              console.warn(`Klasör senkronize edilemedi (${folder.path}):`, folderErr.message);
              onProgress?.({ stage: 'folder-error', folder: folder.path, error: folderErr.message });
            }
          }

          db.setLastSync(account.id);
          imap.end();
          resolve({ newMessages: totalNew, spamMessages: totalSpam });
        } catch (err) {
          try { imap.end(); } catch (_) {}
          reject(err);
        }
      });

      imap.once('error', (err) => reject(err));
      imap.connect();
    });
  }

  static async _syncFolder(imap, account, folderId, folderPath, db, onProgress, spamCtx) {
    return new Promise((resolve, reject) => {
      imap.openBox(folderPath, false, async (err, box) => {
        if (err) return reject(err);

        const total = box.messages.total;
        if (total === 0) return resolve({ newMessages: 0, spamMessages: 0 });

        const maxUidInDb = ImapService._getMaxUid(db, account.id, folderId);
        const searchCriteria = maxUidInDb > 0 ? [['UID', `${maxUidInDb + 1}:*`]] : ['ALL'];

        imap.search(searchCriteria, (err, uids) => {
          if (err) return reject(err);
          if (!uids || !uids.length) return resolve({ newMessages: 0, spamMessages: 0 });

          let toFetch = uids;
          if (maxUidInDb === 0 && uids.length > 200) toFetch = uids.slice(-200);

          toFetch = toFetch.filter(uid => !db.messageExists(account.id, folderId, { uid }));
          if (!toFetch.length) return resolve({ newMessages: 0, spamMessages: 0 });

          onProgress?.({ stage: 'fetching', folder: folderPath, count: toFetch.length });

          const fetcher = imap.fetch(toFetch, { bodies: '', struct: true, envelope: true });
          let saved = 0;
          let spammed = 0;
          let pending = 0;
          let fetchEnded = false;

          fetcher.on('message', (msg) => {
            pending++;
            let raw = '';
            let attrs = null;

            msg.on('body', (stream) => {
              stream.on('data', (chunk) => raw += chunk.toString('utf8'));
            });

            msg.once('attributes', (a) => attrs = a);

            msg.once('end', async () => {
              try {
                const parsed = await simpleParser(raw);
                const flags = (attrs && attrs.flags) || [];

                const messageData = {
                  account_id: account.id,
                  folder_id: folderId,
                  uid: attrs ? attrs.uid : null,
                  message_id: parsed.messageId || null,
                  in_reply_to: parsed.inReplyTo || null,
                  msg_references: Array.isArray(parsed.references)
                    ? parsed.references.join(' ')
                    : (parsed.references || null),
                  from_addr: parsed.from?.value?.[0]?.address || null,
                  from_name: parsed.from?.value?.[0]?.name || null,
                  reply_to_addr: parsed.replyTo?.value?.[0]?.address || null,
                  to_addrs: parsed.to ? JSON.stringify(parsed.to.value) : null,
                  cc_addrs: parsed.cc ? JSON.stringify(parsed.cc.value) : null,
                  subject: parsed.subject || '(Konu yok)',
                  date: (parsed.date || new Date()).toISOString(),
                  body_text: parsed.text || null,
                  body_html: parsed.html || null,
                  flags: flags,
                  is_read: flags.includes('\\Seen'),
                  is_flagged: flags.includes('\\Flagged'),
                  size: raw.length,
                  has_attachments: parsed.attachments && parsed.attachments.length > 0
                };

                // Spam değerlendirmesi - ama hâlihazırda Junk klasöründe gelen maile yapma
                let targetFolderId = folderId;
                if (spamCtx.spamRules && !spamCtx.isSpamFolder) {
                  const spamResult = SpamFilter.evaluate(messageData, spamCtx.spamRules, db);
                  messageData.spam_score = spamResult.score;
                  if (spamResult.action === 'spam' && spamResult.score >= spamCtx.spamThreshold) {
                    messageData.is_spam = true;
                    if (spamCtx.spamFolderId) {
                      targetFolderId = spamCtx.spamFolderId;
                      messageData.folder_id = spamCtx.spamFolderId;
                    }
                    spammed++;
                  }
                }

                const messageId = db.insertMessage(messageData);

                // v1.12: Email security analizi (DKIM/SPF/DMARC + phishing)
                try {
                  const headerObj = parsed.headers || (parsed.headerLines
                    ? Object.fromEntries(parsed.headerLines.map(h => [h.key, h.line]))
                    : null);
                  const sec = EmailSecurity.analyzeMessage(messageData, headerObj);
                  db.setMessageSecurity(messageId, {
                    dkim: sec.auth.dkim,
                    spf: sec.auth.spf,
                    dmarc: sec.auth.dmarc,
                    flags: { level: sec.level, score: sec.totalScore, ...sec.flags, reasons: sec.reasons.slice(0, 5) }
                  });
                } catch (secErr) {
                  console.warn('Security analiz hatası:', secErr.message);
                }

                // v1.12: Trusted sender otomatik kayıt (spam değilse)
                if (!messageData.is_spam && messageData.from_addr) {
                  try {
                    db.recordSenderInteraction(messageData.from_addr, messageData.from_name);
                  } catch (_) {}
                }

                if (parsed.attachments && parsed.attachments.length) {
                  for (const att of parsed.attachments) {
                    db.insertAttachment(messageId, {
                      filename: att.filename,
                      contentType: att.contentType,
                      size: att.size,
                      contentId: att.contentId,
                      content: att.content
                    });
                  }
                }
                saved++;
              } catch (parseErr) {
                console.warn('Parse hatası:', parseErr.message);
              } finally {
                pending--;
                if (fetchEnded && pending === 0) {
                  resolve({ newMessages: saved, spamMessages: spammed });
                }
              }
            });
          });

          fetcher.once('error', (err) => reject(err));
          fetcher.once('end', () => {
            fetchEnded = true;
            if (pending === 0) resolve({ newMessages: saved, spamMessages: spammed });
          });
        });
      });
    });
  }

  static _getMaxUid(db, accountId, folderId) {
    const row = db.prepare(
      'SELECT MAX(uid) AS m FROM messages WHERE account_id = ? AND folder_id = ?'
    ).get(accountId, folderId);
    return row?.m || 0;
  }

  static _flattenBoxes(boxes, prefix = '', delimiter = '/') {
    const result = [];
    for (const [name, box] of Object.entries(boxes)) {
      const path = prefix ? prefix + (box.delimiter || delimiter) + name : name;
      let specialUse = null;
      if (box.attribs) {
        for (const a of box.attribs) {
          if (['\\Inbox', '\\Drafts', '\\Sent', '\\Junk', '\\Trash', '\\All', '\\Archive'].includes(a)) {
            specialUse = a;
            break;
          }
        }
      }
      if (name.toUpperCase() === 'INBOX' && !specialUse) specialUse = '\\Inbox';

      result.push({
        path,
        displayName: name,
        attribs: box.attribs || [],
        specialUse,
        delimiter: box.delimiter || delimiter
      });

      if (box.children) {
        result.push(...ImapService._flattenBoxes(box.children, path, box.delimiter || delimiter));
      }
    }
    return result;
  }

  static async setFlag(account, password, folderPath, uid, flag, add) {
    return new Promise((resolve, reject) => {
      const imap = ImapService._buildConnection(account, password);
      imap.once('ready', () => {
        imap.openBox(folderPath, false, (err) => {
          if (err) { imap.end(); return reject(err); }
          const op = add ? imap.addFlags.bind(imap) : imap.delFlags.bind(imap);
          op(uid, flag, (err) => {
            imap.end();
            if (err) reject(err); else resolve();
          });
        });
      });
      imap.once('error', reject);
      imap.connect();
    });
  }

  static async deleteMessage(account, password, folderPath, uid) {
    return new Promise((resolve, reject) => {
      const imap = ImapService._buildConnection(account, password);
      imap.once('ready', () => {
        imap.openBox(folderPath, false, (err) => {
          if (err) { imap.end(); return reject(err); }
          imap.addFlags(uid, '\\Deleted', (err) => {
            if (err) { imap.end(); return reject(err); }
            imap.expunge(uid, (err) => {
              imap.end();
              if (err) reject(err); else resolve();
            });
          });
        });
      });
      imap.once('error', reject);
      imap.connect();
    });
  }

  /** Sunucuda yeni klasör oluştur */
  static async createBox(account, password, boxName) {
    return new Promise((resolve, reject) => {
      const imap = ImapService._buildConnection(account, password);
      imap.once('ready', () => {
        imap.addBox(boxName, (err) => {
          imap.end();
          if (err) reject(err); else resolve();
        });
      });
      imap.once('error', reject);
      imap.connect();
    });
  }

  /** Sunucuda mesajı bir klasörden başka bir klasöre taşı */
  static async moveMessage(account, password, fromPath, toPath, uid) {
    return new Promise((resolve, reject) => {
      const imap = ImapService._buildConnection(account, password);
      imap.once('ready', () => {
        imap.openBox(fromPath, false, (err) => {
          if (err) { imap.end(); return reject(err); }
          imap.move(uid, toPath, (err) => {
            imap.end();
            if (err) reject(err); else resolve();
          });
        });
      });
      imap.once('error', reject);
      imap.connect();
    });
  }
}

module.exports = ImapService;
