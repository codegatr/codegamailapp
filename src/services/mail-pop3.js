const Pop3Command = require('node-pop3');
const { simpleParser } = require('mailparser');
const SpamFilter = require('./spam');

class Pop3Service {
  static _buildClient(account, password) {
    return new Pop3Command({
      user: account.in_username,
      password: password,
      host: account.in_host,
      port: account.in_port,
      tls: !!account.in_secure,
      tlsOptions: { rejectUnauthorized: false },
      timeout: 30000
    });
  }

  static async testConnection(account, password) {
    const client = Pop3Service._buildClient(account, password);
    try {
      await client.STAT();
      await client.QUIT();
      return true;
    } catch (err) {
      try { await client.QUIT(); } catch (_) {}
      throw err;
    }
  }

  static async syncAccount(account, password, db, onProgress) {
    const folderId = db.upsertFolder(account.id, {
      name: 'Gelen Kutusu', path: 'INBOX', special_use: '\\Inbox', is_local: false
    });

    const spamRules = account.spam_enabled ? db.listSpamRules(account.id) : [];
    const spamThreshold = account.spam_threshold || 50;
    const spamFolderId = account.spam_enabled ? db.ensureSpamFolder(account.id) : null;

    const client = Pop3Service._buildClient(account, password);
    let totalNew = 0;
    let totalSpam = 0;

    try {
      const uidlList = await client.UIDL();
      onProgress?.({ stage: 'folders', count: 1 });

      const newOnes = [];
      for (const entry of uidlList) {
        const seqnoStr = entry[0];
        const uidl = entry[1];
        if (!db.messageExists(account.id, folderId, { uidl })) {
          newOnes.push({ seqno: parseInt(seqnoStr, 10), uidl });
        }
      }

      const dbHasAny = db.prepare(
        'SELECT 1 AS x FROM messages WHERE account_id = ? LIMIT 1'
      ).get(account.id);

      let toFetch = newOnes;
      if (!dbHasAny && newOnes.length > 200) {
        toFetch = newOnes.sort((a, b) => b.seqno - a.seqno).slice(0, 200);
      }

      onProgress?.({ stage: 'fetching', folder: 'INBOX', count: toFetch.length });

      for (const item of toFetch) {
        try {
          const raw = await client.RETR(item.seqno);
          const parsed = await simpleParser(raw);

          const messageData = {
            account_id: account.id,
            folder_id: folderId,
            uidl: item.uidl,
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
            flags: [],
            is_read: false,
            is_flagged: false,
            size: typeof raw === 'string' ? raw.length : (raw?.length || 0),
            has_attachments: parsed.attachments && parsed.attachments.length > 0
          };

          // Spam değerlendirme
          if (spamRules) {
            const spamResult = SpamFilter.evaluate(messageData, spamRules);
            messageData.spam_score = spamResult.score;
            if (spamResult.action === 'spam' && spamResult.score >= spamThreshold) {
              messageData.is_spam = true;
              if (spamFolderId) messageData.folder_id = spamFolderId;
              totalSpam++;
            }
          }

          const messageId = db.insertMessage(messageData);

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

          totalNew++;

          if (!account.pop3_leave_on_server) {
            try { await client.DELE(item.seqno); }
            catch (delErr) { console.warn('POP3 DELE başarısız:', delErr.message); }
          }
        } catch (msgErr) {
          console.warn(`POP3 mesaj #${item.seqno} alınamadı:`, msgErr.message);
        }
      }

      await client.QUIT();
      db.updateFolderCounts(folderId);
      if (spamFolderId) db.updateFolderCounts(spamFolderId);
      db.setLastSync(account.id);

      return { newMessages: totalNew, spamMessages: totalSpam };
    } catch (err) {
      try { await client.QUIT(); } catch (_) {}
      throw err;
    }
  }
}

module.exports = Pop3Service;
