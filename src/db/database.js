const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

class Database {
  static async open(dbPath) {
    // KRİTİK: Paketlenmiş .exe'de sql.js'in WASM dosyası
    // app.asar içinden değil app.asar.unpacked'tan yüklenmeli (asarUnpack kuralı gereği)
    const sqlJsDir = path.dirname(require.resolve('sql.js'));
    const wasmDir = sqlJsDir.replace('app.asar' + path.sep, 'app.asar.unpacked' + path.sep)
                            .replace('app.asar/', 'app.asar.unpacked/');

    const SQL = await initSqlJs({
      locateFile: (file) => path.join(wasmDir, file)
    });

    let sqlDb;
    if (fs.existsSync(dbPath)) {
      const buf = fs.readFileSync(dbPath);
      sqlDb = new SQL.Database(buf);
    } else {
      sqlDb = new SQL.Database();
    }

    const instance = new Database(sqlDb, dbPath);
    instance._migrate();
    instance.save();
    return instance;
  }

  constructor(sqlDb, dbPath) {
    this._sql = sqlDb;
    this.dbPath = dbPath;
    this._dirty = false;
    this._saveTimer = null;
    this.db = this;
  }

  _markDirty() {
    this._dirty = true;
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this.save(), 500);
  }

  save() {
    if (!this._dirty && fs.existsSync(this.dbPath)) return;
    const data = this._sql.export();
    const tmp = this.dbPath + '.tmp';
    fs.writeFileSync(tmp, Buffer.from(data));
    fs.renameSync(tmp, this.dbPath);
    this._dirty = false;
  }

  pragma(_) { /* sql.js no-op */ }

  exec(sql) {
    this._sql.exec(sql);
    this._markDirty();
  }

  prepare(sql) {
    return new Statement(this, sql);
  }

  close() {
    if (this._saveTimer) {
      clearTimeout(this._saveTimer);
      this._saveTimer = null;
    }
    this.save();
    this._sql.close();
  }

  _safeAlter(sql) {
    try { this._sql.exec(sql); } catch (_) { /* zaten var */ }
  }

  _migrate() {
    this._sql.exec(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        display_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        protocol TEXT NOT NULL CHECK(protocol IN ('imap', 'pop3')),
        in_host TEXT NOT NULL,
        in_port INTEGER NOT NULL,
        in_secure INTEGER DEFAULT 1,
        in_username TEXT NOT NULL,
        in_password BLOB NOT NULL,
        smtp_host TEXT NOT NULL,
        smtp_port INTEGER NOT NULL,
        smtp_secure INTEGER DEFAULT 1,
        smtp_username TEXT,
        smtp_password BLOB,
        pop3_leave_on_server INTEGER DEFAULT 1,
        signature TEXT,
        last_sync TEXT,
        spam_enabled INTEGER DEFAULT 1,
        spam_threshold INTEGER DEFAULT 50,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS folders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        special_use TEXT,
        uidvalidity INTEGER,
        is_local INTEGER DEFAULT 0,
        unread_count INTEGER DEFAULT 0,
        total_count INTEGER DEFAULT 0,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
        UNIQUE(account_id, path)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL,
        folder_id INTEGER NOT NULL,
        uid INTEGER,
        uidl TEXT,
        message_id TEXT,
        from_addr TEXT,
        from_name TEXT,
        reply_to_addr TEXT,
        to_addrs TEXT,
        cc_addrs TEXT,
        bcc_addrs TEXT,
        subject TEXT,
        date TEXT,
        body_text TEXT,
        body_html TEXT,
        flags TEXT DEFAULT '[]',
        is_read INTEGER DEFAULT 0,
        is_flagged INTEGER DEFAULT 0,
        is_spam INTEGER DEFAULT 0,
        spam_score INTEGER DEFAULT 0,
        size INTEGER,
        has_attachments INTEGER DEFAULT 0,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
        FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_msg_acc_folder ON messages(account_id, folder_id);
      CREATE INDEX IF NOT EXISTS idx_msg_uid ON messages(account_id, folder_id, uid);
      CREATE INDEX IF NOT EXISTS idx_msg_uidl ON messages(account_id, uidl);
      CREATE INDEX IF NOT EXISTS idx_msg_date ON messages(date DESC);

      CREATE TABLE IF NOT EXISTS attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id INTEGER NOT NULL,
        filename TEXT,
        content_type TEXT,
        size INTEGER,
        content_id TEXT,
        data BLOB,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_att_msg ON attachments(message_id);

      CREATE TABLE IF NOT EXISTS spam_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER,
        type TEXT NOT NULL CHECK(type IN ('sender', 'domain', 'subject', 'body')),
        pattern TEXT NOT NULL,
        action TEXT NOT NULL CHECK(action IN ('allow', 'block')),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_spam_acc ON spam_rules(account_id);

      CREATE TABLE IF NOT EXISTS rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER,
        name TEXT NOT NULL,
        enabled INTEGER DEFAULT 1,
        priority INTEGER DEFAULT 100,
        conditions TEXT NOT NULL DEFAULT '[]',
        actions TEXT NOT NULL DEFAULT '[]',
        match_type TEXT DEFAULT 'all',
        last_run TEXT,
        run_count INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_rules_acc ON rules(account_id, enabled, priority);

      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        color TEXT NOT NULL,
        shortcut TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS message_categories (
        message_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        PRIMARY KEY (message_id, category_id),
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_msg_cat_msg ON message_categories(message_id);
      CREATE INDEX IF NOT EXISTS idx_msg_cat_cat ON message_categories(category_id);
    `);

    this._safeAlter('ALTER TABLE accounts ADD COLUMN spam_enabled INTEGER DEFAULT 1');
    this._safeAlter('ALTER TABLE accounts ADD COLUMN spam_threshold INTEGER DEFAULT 50');
    this._safeAlter('ALTER TABLE accounts ADD COLUMN sort_order INTEGER DEFAULT 0');
    this._safeAlter('ALTER TABLE folders ADD COLUMN is_local INTEGER DEFAULT 0');
    this._safeAlter('ALTER TABLE messages ADD COLUMN reply_to_addr TEXT');
    this._safeAlter('ALTER TABLE messages ADD COLUMN is_spam INTEGER DEFAULT 0');
    this._safeAlter('ALTER TABLE messages ADD COLUMN spam_score INTEGER DEFAULT 0');
    this._safeAlter('ALTER TABLE messages ADD COLUMN is_important INTEGER DEFAULT 0');

    // v1.9: Threading kolonları
    this._safeAlter('ALTER TABLE messages ADD COLUMN in_reply_to TEXT');
    this._safeAlter('ALTER TABLE messages ADD COLUMN msg_references TEXT');
    this._safeAlter('ALTER TABLE messages ADD COLUMN thread_id TEXT');
    this._safeAlter('ALTER TABLE messages ADD COLUMN subject_normalized TEXT');
    try {
      this.exec('CREATE INDEX IF NOT EXISTS idx_msg_thread ON messages(account_id, thread_id)');
      this.exec('CREATE INDEX IF NOT EXISTS idx_msg_subj_norm ON messages(account_id, subject_normalized)');
      this.exec('CREATE INDEX IF NOT EXISTS idx_msg_messageid ON messages(account_id, message_id)');
    } catch (_) {}

    // v1.8: Default kategoriler (sadece kategori tablosu boşsa)
    this._seedDefaultCategories();
  }

  // v1.9: Subject normalization (Re:, Fwd:, vs. temizle)
  _normalizeSubject(s) {
    if (!s) return '';
    return String(s)
      .replace(/^\s*(re|fwd|fw|yan|ilt|sv|aw|wg)\s*:\s*/gi, '')
      .replace(/^\s*(re|fwd|fw|yan|ilt|sv|aw|wg)\s*:\s*/gi, '')  // 2 kez (Re: Re:)
      .replace(/^\s*(re|fwd|fw|yan|ilt|sv|aw|wg)\s*:\s*/gi, '')  // 3 kez
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  // v1.9: Bir mesajın thread_id'sini çöz - In-Reply-To, References, subject normalize ile
  _resolveThreadId(accountId, msg) {
    // 1. in_reply_to varsa parent'ın thread_id'sini al
    if (msg.in_reply_to) {
      const cleaned = String(msg.in_reply_to).replace(/[<>]/g, '').trim();
      if (cleaned) {
        const parent = this.prepare(
          'SELECT thread_id FROM messages WHERE account_id = ? AND message_id = ? AND thread_id IS NOT NULL LIMIT 1'
        ).get(accountId, cleaned);
        if (parent && parent.thread_id) return parent.thread_id;
      }
    }

    // 2. References varsa - en son referans (en yakın parent)
    if (msg.msg_references) {
      const refs = String(msg.msg_references)
        .split(/\s+/)
        .map(r => r.replace(/[<>]/g, '').trim())
        .filter(Boolean);
      for (let i = refs.length - 1; i >= 0; i--) {
        const parent = this.prepare(
          'SELECT thread_id FROM messages WHERE account_id = ? AND message_id = ? AND thread_id IS NOT NULL LIMIT 1'
        ).get(accountId, refs[i]);
        if (parent && parent.thread_id) return parent.thread_id;
      }
    }

    // 3. Subject normalization fallback - son 90 gün, aynı normalized subject
    const norm = msg.subject_normalized || this._normalizeSubject(msg.subject || '');
    if (norm.length >= 3) {
      try {
        const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        const candidate = this.prepare(`
          SELECT thread_id FROM messages
          WHERE account_id = ? AND subject_normalized = ? AND date > ?
            AND thread_id IS NOT NULL
          ORDER BY date DESC LIMIT 1
        `).get(accountId, norm, cutoff);
        if (candidate && candidate.thread_id) return candidate.thread_id;
      } catch (_) {}
    }

    // 4. Yeni thread - kendi message_id'si veya unique fallback
    return msg.message_id || ('t-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8));
  }

  // v1.9: Mevcut tüm mesajların thread_id'lerini doldur (idempotent backfill)
  backfillThreadIds() {
    const accounts = this.listAccounts();
    let updatedCount = 0;
    for (const acc of accounts) {
      const msgs = this.prepare(`
        SELECT id, message_id, in_reply_to, msg_references, subject, subject_normalized, thread_id, date
        FROM messages WHERE account_id = ? AND (thread_id IS NULL OR subject_normalized IS NULL)
        ORDER BY date ASC
      `).all(acc.id);

      for (const m of msgs) {
        const updates = [];
        const vals = [];
        if (!m.subject_normalized) {
          const norm = this._normalizeSubject(m.subject || '');
          updates.push('subject_normalized = ?');
          vals.push(norm);
          m.subject_normalized = norm;
        }
        if (!m.thread_id) {
          const tid = this._resolveThreadId(acc.id, m);
          updates.push('thread_id = ?');
          vals.push(tid);
        }
        if (updates.length) {
          this.prepare(`UPDATE messages SET ${updates.join(', ')} WHERE id = ?`)
            .run(...vals, m.id);
          updatedCount++;
        }
      }
    }
    return updatedCount;
  }

  _seedDefaultCategories() {
    try {
      const r = this.prepare('SELECT COUNT(*) AS c FROM categories').get();
      if ((r && r.c) > 0) return;
      const defaults = [
        { name: 'Acil',      color: '#e74c3c', sort_order: 1 },
        { name: 'Önemli',    color: '#f39c12', sort_order: 2 },
        { name: 'İş',        color: '#3498db', sort_order: 3 },
        { name: 'Kişisel',   color: '#27ae60', sort_order: 4 },
        { name: 'Müşteri',   color: '#9b59b6', sort_order: 5 },
        { name: 'Fatura',    color: '#e67e22', sort_order: 6 },
        { name: 'Takip',     color: '#1abc9c', sort_order: 7 }
      ];
      const stmt = this.prepare('INSERT INTO categories (name, color, sort_order) VALUES (?, ?, ?)');
      for (const c of defaults) stmt.run(c.name, c.color, c.sort_order);
    } catch (e) {
      console.warn('Default kategoriler eklenemedi:', e.message);
    }
  }

  // ====== Hesaplar ======
  listAccounts() {
    return this.prepare(`
      SELECT id, display_name, email, protocol, in_host, in_port, in_secure,
             in_username, smtp_host, smtp_port, smtp_secure, smtp_username,
             pop3_leave_on_server, signature, last_sync,
             spam_enabled, spam_threshold, sort_order
      FROM accounts ORDER BY sort_order ASC, created_at ASC
    `).all();
  }

  getAccount(id) {
    return this.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
  }

  addAccount(a) {
    const r = this.prepare(`
      INSERT INTO accounts (
        display_name, email, protocol,
        in_host, in_port, in_secure, in_username, in_password,
        smtp_host, smtp_port, smtp_secure, smtp_username, smtp_password,
        pop3_leave_on_server, signature, spam_enabled, spam_threshold
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      a.display_name, a.email, a.protocol,
      a.in_host, a.in_port, a.in_secure ? 1 : 0, a.in_username, a.in_password,
      a.smtp_host, a.smtp_port, a.smtp_secure ? 1 : 0,
      a.smtp_username || a.in_username, a.smtp_password,
      a.pop3_leave_on_server ? 1 : 0, a.signature || null,
      a.spam_enabled === false ? 0 : 1,
      a.spam_threshold || 50
    );
    return r.lastInsertRowid;
  }

  updateAccount(id, updates) {
    const allowed = ['display_name', 'in_host', 'in_port', 'in_secure', 'in_username',
      'in_password', 'smtp_host', 'smtp_port', 'smtp_secure', 'smtp_username',
      'smtp_password', 'pop3_leave_on_server', 'signature',
      'spam_enabled', 'spam_threshold', 'sort_order'];
    const fields = Object.keys(updates).filter(k => allowed.includes(k));
    if (!fields.length) return;
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const vals = fields.map(f => {
      const v = updates[f];
      if (typeof v === 'boolean') return v ? 1 : 0;
      return v;
    });
    this.prepare(`UPDATE accounts SET ${setClause} WHERE id = ?`).run(...vals, id);
  }

  deleteAccount(id) {
    this.prepare('DELETE FROM accounts WHERE id = ?').run(id);
  }

  setLastSync(accountId) {
    this.prepare('UPDATE accounts SET last_sync = ? WHERE id = ?')
      .run(new Date().toISOString(), accountId);
  }

  // ====== Klasörler ======
  listFolders(accountId) {
    return this.prepare(`
      SELECT * FROM folders WHERE account_id = ? ORDER BY
        CASE special_use
          WHEN '\\Inbox' THEN 1
          WHEN '\\Drafts' THEN 2
          WHEN '\\Sent' THEN 3
          WHEN '\\Junk' THEN 4
          WHEN '\\Trash' THEN 5
          ELSE 6
        END, is_local ASC, name ASC
    `).all(accountId);
  }

  upsertFolder(accountId, folder) {
    const existing = this.prepare(
      'SELECT id FROM folders WHERE account_id = ? AND path = ?'
    ).get(accountId, folder.path);

    if (existing) {
      this.prepare(`
        UPDATE folders SET name = ?, special_use = ?, uidvalidity = ?, is_local = ?
        WHERE id = ?
      `).run(folder.name, folder.special_use || null, folder.uidvalidity || null,
             folder.is_local ? 1 : 0, existing.id);
      return existing.id;
    } else {
      const r = this.prepare(`
        INSERT INTO folders (account_id, name, path, special_use, uidvalidity, is_local)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(accountId, folder.name, folder.path, folder.special_use || null,
             folder.uidvalidity || null, folder.is_local ? 1 : 0);
      return r.lastInsertRowid;
    }
  }

  createLocalFolder(accountId, name) {
    const path = '__LOCAL__/' + name + '/' + Date.now();
    return this.upsertFolder(accountId, { name, path, is_local: true });
  }

  ensureSpamFolder(accountId) {
    const existing = this.prepare(`
      SELECT id FROM folders WHERE account_id = ? AND special_use = '\\Junk'
    `).get(accountId);
    if (existing) return existing.id;

    const r = this.prepare(`
      INSERT INTO folders (account_id, name, path, special_use, is_local)
      VALUES (?, ?, ?, ?, ?)
    `).run(accountId, 'Spam', '__SPAM__', '\\Junk', 1);
    return r.lastInsertRowid;
  }

  renameFolder(folderId, newName) {
    this.prepare('UPDATE folders SET name = ? WHERE id = ?').run(newName, folderId);
  }

  deleteFolder(folderId) {
    const folder = this.prepare('SELECT is_local FROM folders WHERE id = ?').get(folderId);
    if (!folder || !folder.is_local) {
      throw new Error('Sadece yerel klasörler silinebilir');
    }
    this.prepare('DELETE FROM folders WHERE id = ?').run(folderId);
  }

  updateFolderCounts(folderId) {
    const total = this.prepare('SELECT COUNT(*) AS c FROM messages WHERE folder_id = ?').get(folderId)?.c || 0;
    const unread = this.prepare('SELECT COUNT(*) AS c FROM messages WHERE folder_id = ? AND is_read = 0').get(folderId)?.c || 0;
    this.prepare('UPDATE folders SET total_count = ?, unread_count = ? WHERE id = ?')
      .run(total, unread, folderId);
  }

  getFolder(folderId) {
    return this.prepare('SELECT * FROM folders WHERE id = ?').get(folderId);
  }

  // ====== Mesajlar ======
  listMessages(folderId, opts = {}) {
    const limit = opts.limit || 200;
    const offset = opts.offset || 0;
    let where = 'm.folder_id = ?';
    const params = [folderId];

    if (opts.search) {
      where += ' AND (m.subject LIKE ? OR m.from_addr LIKE ? OR m.from_name LIKE ? OR m.body_text LIKE ?)';
      const q = `%${opts.search}%`;
      params.push(q, q, q, q);
    }

    // v1.9: Konuşma görünümü - thread_id ile grupla, her thread'in son mesajını getir
    if (opts.threaded) {
      return this.prepare(`
        SELECT m.id, m.uid, m.uidl, m.from_addr, m.from_name, m.to_addrs, m.subject, m.date,
               m.is_read, m.is_flagged, m.is_spam, m.is_important, m.spam_score, m.has_attachments, m.size,
               m.thread_id,
               SUBSTR(m.body_text, 1, 200) AS preview,
               (SELECT COUNT(*) FROM messages m2 WHERE m2.thread_id = m.thread_id AND m2.folder_id = m.folder_id) AS thread_count,
               (SELECT SUM(CASE WHEN m3.is_read = 0 THEN 1 ELSE 0 END) FROM messages m3 WHERE m3.thread_id = m.thread_id AND m3.folder_id = m.folder_id) AS thread_unread,
               (SELECT GROUP_CONCAT(c.id || char(31) || c.name || char(31) || c.color, char(30))
                FROM message_categories mc JOIN categories c ON c.id = mc.category_id
                WHERE mc.message_id = m.id) AS categories
        FROM messages m
        WHERE ${where} AND m.id IN (
          SELECT MAX(id) FROM messages
          WHERE folder_id = ? AND thread_id IS NOT NULL
          GROUP BY thread_id
          UNION
          SELECT id FROM messages WHERE folder_id = ? AND thread_id IS NULL
        )
        ORDER BY m.date DESC LIMIT ? OFFSET ?
      `).all(...params, folderId, folderId, limit, offset);
    }

    return this.prepare(`
      SELECT m.id, m.uid, m.uidl, m.from_addr, m.from_name, m.to_addrs, m.subject, m.date,
             m.is_read, m.is_flagged, m.is_spam, m.is_important, m.spam_score, m.has_attachments, m.size,
             m.thread_id,
             SUBSTR(m.body_text, 1, 200) AS preview,
             (SELECT GROUP_CONCAT(c.id || char(31) || c.name || char(31) || c.color, char(30))
              FROM message_categories mc JOIN categories c ON c.id = mc.category_id
              WHERE mc.message_id = m.id) AS categories
      FROM messages m WHERE ${where}
      ORDER BY m.date DESC LIMIT ? OFFSET ?
    `).all(...params, limit, offset);
  }

  // v1.9: Bir thread'deki tüm mesajları getir (folder bağımsız - account içinde)
  getThread(threadId, accountId) {
    return this.prepare(`
      SELECT m.id, m.uid, m.uidl, m.from_addr, m.from_name, m.to_addrs, m.cc_addrs, m.subject, m.date,
             m.is_read, m.is_flagged, m.is_spam, m.is_important, m.spam_score, m.has_attachments, m.size,
             m.body_text, m.body_html, m.folder_id,
             (SELECT GROUP_CONCAT(c.id || char(31) || c.name || char(31) || c.color, char(30))
              FROM message_categories mc JOIN categories c ON c.id = mc.category_id
              WHERE mc.message_id = m.id) AS categories
      FROM messages m
      WHERE m.thread_id = ? AND m.account_id = ?
      ORDER BY m.date ASC
    `).all(threadId, accountId);
  }

  getMessage(id) {
    const msg = this.prepare('SELECT * FROM messages WHERE id = ?').get(id);
    if (!msg) return null;
    msg.attachments = this.prepare(
      'SELECT id, filename, content_type, size, content_id FROM attachments WHERE message_id = ?'
    ).all(id);
    msg.categories = this.getMessageCategories(id);
    return msg;
  }

  messageExists(accountId, folderId, identifier) {
    if (identifier.uid != null) {
      return !!this.prepare(
        'SELECT 1 AS x FROM messages WHERE account_id = ? AND folder_id = ? AND uid = ? LIMIT 1'
      ).get(accountId, folderId, identifier.uid);
    }
    if (identifier.uidl != null) {
      return !!this.prepare(
        'SELECT 1 AS x FROM messages WHERE account_id = ? AND uidl = ? LIMIT 1'
      ).get(accountId, identifier.uidl);
    }
    return false;
  }

  insertMessage(msg) {
    // v1.9: Threading - subject_normalized ve thread_id'yi resolve et
    const subjectNormalized = this._normalizeSubject(msg.subject || '');
    const msgWithNorm = Object.assign({}, msg, { subject_normalized: subjectNormalized });
    const threadId = this._resolveThreadId(msg.account_id, msgWithNorm);

    const r = this.prepare(`
      INSERT INTO messages (
        account_id, folder_id, uid, uidl, message_id,
        from_addr, from_name, reply_to_addr,
        to_addrs, cc_addrs, bcc_addrs,
        subject, date, body_text, body_html, flags,
        is_read, is_flagged, is_spam, spam_score,
        size, has_attachments,
        in_reply_to, msg_references, thread_id, subject_normalized
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      msg.account_id, msg.folder_id, msg.uid || null, msg.uidl || null, msg.message_id || null,
      msg.from_addr || null, msg.from_name || null, msg.reply_to_addr || null,
      msg.to_addrs || null, msg.cc_addrs || null, msg.bcc_addrs || null,
      msg.subject || null, msg.date || null,
      msg.body_text || null, msg.body_html || null,
      JSON.stringify(msg.flags || []),
      msg.is_read ? 1 : 0, msg.is_flagged ? 1 : 0,
      msg.is_spam ? 1 : 0, msg.spam_score || 0,
      msg.size || 0, msg.has_attachments ? 1 : 0,
      msg.in_reply_to || null, msg.msg_references || null,
      threadId, subjectNormalized
    );
    return r.lastInsertRowid;
  }

  insertAttachment(messageId, att) {
    this.prepare(`
      INSERT INTO attachments (message_id, filename, content_type, size, content_id, data)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      messageId,
      att.filename || 'ek',
      att.contentType || 'application/octet-stream',
      att.size || 0,
      att.contentId || null,
      att.content || null
    );
  }

  markMessageRead(id, isRead) {
    const msg = this.prepare('SELECT folder_id FROM messages WHERE id = ?').get(id);
    if (!msg) return;
    this.prepare('UPDATE messages SET is_read = ? WHERE id = ?').run(isRead ? 1 : 0, id);
    this.updateFolderCounts(msg.folder_id);
  }

  moveMessage(messageId, newFolderId) {
    const msg = this.prepare('SELECT folder_id FROM messages WHERE id = ?').get(messageId);
    if (!msg) return;
    const oldFolder = msg.folder_id;
    this.prepare('UPDATE messages SET folder_id = ? WHERE id = ?').run(newFolderId, messageId);
    this.updateFolderCounts(oldFolder);
    this.updateFolderCounts(newFolderId);
  }

  deleteMessage(id) {
    const msg = this.prepare('SELECT folder_id FROM messages WHERE id = ?').get(id);
    if (!msg) return;
    this.prepare('DELETE FROM messages WHERE id = ?').run(id);
    this.updateFolderCounts(msg.folder_id);
  }

  setSpam(messageId, isSpam) {
    this.prepare('UPDATE messages SET is_spam = ? WHERE id = ?').run(isSpam ? 1 : 0, messageId);
  }

  // ====== Spam kuralları ======
  listSpamRules(accountId) {
    if (accountId == null) {
      return this.prepare('SELECT * FROM spam_rules ORDER BY created_at DESC').all();
    }
    return this.prepare(
      'SELECT * FROM spam_rules WHERE account_id IS NULL OR account_id = ? ORDER BY created_at DESC'
    ).all(accountId);
  }

  addSpamRule(rule) {
    const existing = this.prepare(`
      SELECT id FROM spam_rules
      WHERE COALESCE(account_id, -1) = COALESCE(?, -1) AND type = ? AND pattern = ? AND action = ?
    `).get(rule.account_id || null, rule.type, rule.pattern, rule.action);
    if (existing) return existing.id;

    const r = this.prepare(`
      INSERT INTO spam_rules (account_id, type, pattern, action)
      VALUES (?, ?, ?, ?)
    `).run(rule.account_id || null, rule.type, rule.pattern, rule.action);
    return r.lastInsertRowid;
  }

  deleteSpamRule(id) {
    this.prepare('DELETE FROM spam_rules WHERE id = ?').run(id);
  }

  // ====== v1.7: Kurallar (Rules) ======
  listRules(accountId) {
    if (accountId) {
      return this.prepare(`
        SELECT * FROM rules WHERE account_id = ? OR account_id IS NULL
        ORDER BY priority ASC, id ASC
      `).all(accountId);
    }
    return this.prepare('SELECT * FROM rules ORDER BY priority ASC, id ASC').all();
  }

  getRule(id) {
    return this.prepare('SELECT * FROM rules WHERE id = ?').get(id);
  }

  addRule(rule) {
    const r = this.prepare(`
      INSERT INTO rules (account_id, name, enabled, priority, conditions, actions, match_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      rule.account_id || null,
      rule.name,
      rule.enabled === false ? 0 : 1,
      rule.priority || 100,
      typeof rule.conditions === 'string' ? rule.conditions : JSON.stringify(rule.conditions || []),
      typeof rule.actions === 'string' ? rule.actions : JSON.stringify(rule.actions || []),
      rule.match_type || 'all'
    );
    return r.lastInsertRowid;
  }

  updateRule(id, updates) {
    const allowed = ['name', 'enabled', 'priority', 'conditions', 'actions', 'match_type', 'account_id'];
    const fields = Object.keys(updates).filter(k => allowed.includes(k));
    if (!fields.length) return;
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const vals = fields.map(f => {
      let v = updates[f];
      if (typeof v === 'boolean') v = v ? 1 : 0;
      if (f === 'conditions' || f === 'actions') {
        if (typeof v !== 'string') v = JSON.stringify(v || []);
      }
      return v;
    });
    this.prepare(`UPDATE rules SET ${setClause} WHERE id = ?`).run(...vals, id);
  }

  deleteRule(id) {
    this.prepare('DELETE FROM rules WHERE id = ?').run(id);
  }

  incrementRuleRunCount(id) {
    this.prepare(`
      UPDATE rules SET run_count = run_count + 1, last_run = ? WHERE id = ?
    `).run(new Date().toISOString(), id);
  }

  // ====== v1.7: Çöp kovasını boşalt ======
  emptyFolder(folderId) {
    const r = this.prepare('SELECT COUNT(*) AS c FROM messages WHERE folder_id = ?').get(folderId);
    const count = (r && r.c) || 0;
    this.prepare('DELETE FROM messages WHERE folder_id = ?').run(folderId);
    this.updateFolderCounts(folderId);
    return count;
  }

  // ====== v1.7: Önemli işaretleme ======
  markMessageImportant(id, isImportant) {
    this.prepare('UPDATE messages SET is_important = ? WHERE id = ?').run(isImportant ? 1 : 0, id);
  }

  // ====== v1.8: Kategoriler ======
  listCategories() {
    return this.prepare('SELECT * FROM categories ORDER BY sort_order ASC, name ASC').all();
  }

  getCategory(id) {
    return this.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  }

  addCategory(cat) {
    const r = this.prepare(`
      INSERT INTO categories (name, color, shortcut, sort_order)
      VALUES (?, ?, ?, ?)
    `).run(cat.name, cat.color || '#888888', cat.shortcut || null, cat.sort_order || 0);
    return r.lastInsertRowid;
  }

  updateCategory(id, updates) {
    const allowed = ['name', 'color', 'shortcut', 'sort_order'];
    const fields = Object.keys(updates).filter(k => allowed.includes(k));
    if (!fields.length) return;
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const vals = fields.map(f => updates[f]);
    this.prepare(`UPDATE categories SET ${setClause} WHERE id = ?`).run(...vals, id);
  }

  deleteCategory(id) {
    // ON DELETE CASCADE message_categories'i de temizler
    this.prepare('DELETE FROM categories WHERE id = ?').run(id);
  }

  // ====== v1.8: Mesaj-kategori ilişkisi ======
  getMessageCategories(messageId) {
    return this.prepare(`
      SELECT c.id, c.name, c.color, c.shortcut
      FROM categories c JOIN message_categories mc ON mc.category_id = c.id
      WHERE mc.message_id = ?
      ORDER BY c.sort_order ASC, c.name ASC
    `).all(messageId);
  }

  addMessageCategory(messageId, categoryId) {
    try {
      this.prepare(`
        INSERT OR IGNORE INTO message_categories (message_id, category_id) VALUES (?, ?)
      `).run(messageId, categoryId);
      return true;
    } catch (_) { return false; }
  }

  removeMessageCategory(messageId, categoryId) {
    this.prepare('DELETE FROM message_categories WHERE message_id = ? AND category_id = ?')
      .run(messageId, categoryId);
  }

  setMessageCategories(messageId, categoryIds) {
    this.prepare('DELETE FROM message_categories WHERE message_id = ?').run(messageId);
    const stmt = this.prepare('INSERT INTO message_categories (message_id, category_id) VALUES (?, ?)');
    for (const cid of (categoryIds || [])) {
      try { stmt.run(messageId, cid); } catch (_) {}
    }
  }
}

class Statement {
  constructor(parent, sql) {
    this.parent = parent;
    this.sql = sql;
  }

  _normalize(params) {
    return params.map(v => {
      if (v === undefined) return null;
      if (typeof v === 'boolean') return v ? 1 : 0;
      if (Buffer.isBuffer(v)) return new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
      return v;
    });
  }

  run(...params) {
    const stmt = this.parent._sql.prepare(this.sql);
    try {
      stmt.bind(this._normalize(params));
      stmt.step();
    } finally {
      stmt.free();
    }
    this.parent._markDirty();

    const idStmt = this.parent._sql.prepare('SELECT last_insert_rowid() AS id, changes() AS ch');
    let lastInsertRowid = 0;
    let changes = 0;
    try {
      if (idStmt.step()) {
        const row = idStmt.getAsObject();
        lastInsertRowid = row.id;
        changes = row.ch;
      }
    } finally {
      idStmt.free();
    }
    return { lastInsertRowid, changes };
  }

  get(...params) {
    const stmt = this.parent._sql.prepare(this.sql);
    try {
      stmt.bind(this._normalize(params));
      if (stmt.step()) return stmt.getAsObject();
      return undefined;
    } finally {
      stmt.free();
    }
  }

  all(...params) {
    const stmt = this.parent._sql.prepare(this.sql);
    const rows = [];
    try {
      stmt.bind(this._normalize(params));
      while (stmt.step()) rows.push(stmt.getAsObject());
    } finally {
      stmt.free();
    }
    return rows;
  }
}

module.exports = Database;
