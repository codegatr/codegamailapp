/**
 * Mail Kural Motoru - v1.35
 *
 * Outlook Rules / Gmail Filters tarzı:
 * - Koşullar (conditions): from contains, subject contains, body contains, hasAttachment, account
 * - Eylemler (actions): moveToFolder, addCategory, markRead, markImportant, markSpam, archive, delete
 * - Kurallar sıraya göre çalışır, stop_processing ile zincir kesilebilir
 */

class MailRulesEngine {
  /**
   * Bir mesaja tüm kuralları sırayla uygula.
   * @param {object} message - DB mesaj objesi
   * @param {object} db - Database instance
   * @returns {object} - { applied: [{ruleId, name, actions}], stopped: bool }
   */
  static applyRulesToMessage(message, db) {
    if (!message) return { applied: [], stopped: false };

    const rules = db.listMailRules({ enabledOnly: true });
    const applied = [];
    let stopped = false;

    for (const rule of rules) {
      try {
        // Hesap filtresi
        if (rule.account_id && rule.account_id !== message.account_id) continue;

        const conditions = JSON.parse(rule.conditions || '[]');
        const actions = JSON.parse(rule.actions || '[]');

        if (this.matchesConditions(message, conditions, rule.match_type || 'all')) {
          this.executeActions(message, actions, db, rule.id);
          db.recordMailRuleRun(rule.id);
          applied.push({ ruleId: rule.id, name: rule.name, actions });

          if (rule.stop_processing) {
            stopped = true;
            break;
          }
        }
      } catch (e) {
        console.warn(`Kural #${rule.id} (${rule.name}) hata:`, e.message);
      }
    }

    return { applied, stopped };
  }

  /**
   * Mesajın koşullara uyup uymadığını kontrol et
   * conditions: [{ type: 'fromContains', value: '...' }, ...]
   * matchType: 'all' (AND) | 'any' (OR)
   */
  static matchesConditions(message, conditions, matchType = 'all') {
    if (!conditions || !conditions.length) return false;

    const results = conditions.map(c => this.evaluateCondition(message, c));

    if (matchType === 'any') return results.some(Boolean);
    return results.every(Boolean);
  }

  static evaluateCondition(message, cond) {
    if (!cond || !cond.type) return false;
    const val = (cond.value || '').toLowerCase();

    const fromAddr = (message.from_addr || '').toLowerCase();
    const fromName = (message.from_name || '').toLowerCase();
    const subject = (message.subject || '').toLowerCase();
    const body = (message.body_text || '').toLowerCase();
    const toAddrs = (message.to_addrs || '').toLowerCase();

    switch (cond.type) {
      case 'fromContains':
        return val ? (fromAddr.includes(val) || fromName.includes(val)) : false;
      case 'fromEquals':
        return val ? fromAddr === val : false;
      case 'subjectContains':
        return val ? subject.includes(val) : false;
      case 'subjectEquals':
        return val ? subject === val : false;
      case 'bodyContains':
        return val ? body.includes(val) : false;
      case 'toContains':
        return val ? toAddrs.includes(val) : false;
      case 'hasAttachment':
        return !!message.has_attachments;
      case 'noAttachment':
        return !message.has_attachments;
      case 'isSpam':
        return !!message.is_spam;
      case 'sizeGreaterThan':
        // Value: KB cinsinden
        return (message.size || 0) > (parseInt(cond.value, 10) * 1024);
      default:
        return false;
    }
  }

  /**
   * Eylemleri uygula
   * actions: [{ type: 'moveToFolder', folderId: 5 }, ...]
   */
  static executeActions(message, actions, db, ruleId) {
    if (!actions || !actions.length) return;

    for (const action of actions) {
      try {
        this.executeAction(message, action, db);
      } catch (e) {
        console.warn(`Eylem hatası (kural ${ruleId}):`, e.message);
      }
    }
  }

  static executeAction(message, action, db) {
    if (!action || !action.type) return;
    const messageId = message.id;

    switch (action.type) {
      case 'moveToFolder':
        if (action.folderId && action.folderId !== message.folder_id) {
          // Aynı hesap içinde olmalı
          const folder = db.getFolder(action.folderId);
          if (folder && folder.account_id === message.account_id) {
            db.prepare('UPDATE messages SET folder_id = ? WHERE id = ?').run(action.folderId, messageId);
            db.updateFolderCounts(message.folder_id);
            db.updateFolderCounts(action.folderId);
            // Local move sadece (sunucuda taşıma için ayrı bir akış var, mevcut)
          }
        }
        break;

      case 'addCategory':
        if (action.categoryId) {
          db.addMessageCategory(messageId, action.categoryId);
        }
        break;

      case 'markRead':
        db.prepare('UPDATE messages SET is_read = 1 WHERE id = ?').run(messageId);
        if (message.folder_id) db.updateFolderCounts(message.folder_id);
        break;

      case 'markImportant':
        db.prepare('UPDATE messages SET is_important = 1 WHERE id = ?').run(messageId);
        break;

      case 'markSpam':
        db.prepare('UPDATE messages SET is_spam = 1 WHERE id = ?').run(messageId);
        if (message.folder_id) db.updateFolderCounts(message.folder_id);
        break;

      case 'archive':
        db.archiveMessage(messageId);
        break;

      case 'delete':
        db.prepare('DELETE FROM messages WHERE id = ?').run(messageId);
        if (message.folder_id) db.updateFolderCounts(message.folder_id);
        break;
    }
  }

  /**
   * Koşul tiplerini insan-okunabilir göster (UI için)
   */
  static describeCondition(cond) {
    const map = {
      fromContains: 'Gönderen içerir',
      fromEquals: 'Gönderen tam eşleşir',
      subjectContains: 'Konu içerir',
      subjectEquals: 'Konu tam eşleşir',
      bodyContains: 'İçerik içerir',
      toContains: 'Alıcı içerir',
      hasAttachment: 'Eki var',
      noAttachment: 'Eki yok',
      isSpam: 'Spam olarak işaretlenmiş',
      sizeGreaterThan: 'Boyutu büyük (KB)'
    };
    const label = map[cond.type] || cond.type;
    if (cond.type === 'hasAttachment' || cond.type === 'noAttachment' || cond.type === 'isSpam') {
      return label;
    }
    return `${label}: "${cond.value || ''}"`;
  }

  static describeAction(action, db) {
    switch (action.type) {
      case 'moveToFolder': {
        const f = action.folderId ? db.getFolder(action.folderId) : null;
        return `📁 Klasöre taşı: ${f ? f.name : '?'}`;
      }
      case 'addCategory': {
        const c = action.categoryId ? db.prepare('SELECT name FROM categories WHERE id = ?').get(action.categoryId) : null;
        return `🏷 Kategori ekle: ${c ? c.name : '?'}`;
      }
      case 'markRead': return '✓ Okundu işaretle';
      case 'markImportant': return '⭐ Önemli işaretle';
      case 'markSpam': return '🚫 Spam olarak işaretle';
      case 'archive': return '📦 Arşivle';
      case 'delete': return '🗑 Sil';
      default: return action.type;
    }
  }
}

module.exports = MailRulesEngine;
