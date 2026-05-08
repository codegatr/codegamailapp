/* CODEGA Mail v1.2 - Renderer (tepsi + bildirim + autoconfig wizard) */

// ============= PROVIDER DATABASE =============
const PROVIDERS = {
  gmail: {
    name: 'Gmail', icon: '📧', color: '#ea4335',
    domains: ['gmail.com', 'googlemail.com'],
    imap: { host: 'imap.gmail.com', port: 993, secure: true },
    pop3: { host: 'pop.gmail.com', port: 995, secure: true },
    smtp: { host: 'smtp.gmail.com', port: 465, secure: true },
    notes: 'Gmail için **Uygulama Şifresi** gerekir. 2 Adımlı Doğrulama açık olmalı.',
    helpUrl: 'https://myaccount.google.com/apppasswords',
    helpText: 'Gmail Uygulama Şifresi al'
  },
  outlook: {
    name: 'Outlook / Hotmail', icon: '📨', color: '#0078d4',
    domains: ['outlook.com', 'hotmail.com', 'live.com', 'msn.com',
              'outlook.com.tr', 'hotmail.com.tr', 'live.com.tr',
              'outlook.de', 'hotmail.de', 'outlook.fr', 'hotmail.fr'],
    imap: { host: 'outlook.office365.com', port: 993, secure: true },
    pop3: { host: 'outlook.office365.com', port: 995, secure: true },
    smtp: { host: 'smtp.office365.com', port: 587, secure: false },
    notes: 'Microsoft basic auth\'u kapattığı için **Uygulama Şifresi** gerekir.',
    helpUrl: 'https://account.microsoft.com/security',
    helpText: 'Microsoft Uygulama Şifresi al'
  },
  yandex: {
    name: 'Yandex Mail', icon: '📬', color: '#fc3f1d',
    domains: ['yandex.com', 'yandex.ru', 'yandex.com.tr', 'ya.ru',
              'yandex.ua', 'yandex.kz', 'yandex.by'],
    imap: { host: 'imap.yandex.com', port: 993, secure: true },
    pop3: { host: 'pop.yandex.com', port: 995, secure: true },
    smtp: { host: 'smtp.yandex.com', port: 465, secure: true },
    notes: 'Yandex için **Uygulama Parolası** üretmeniz gerekir.',
    helpUrl: 'https://passport.yandex.com/profile/security',
    helpText: 'Yandex Uygulama Parolası al'
  },
  icloud: {
    name: 'iCloud Mail', icon: '☁', color: '#007aff',
    domains: ['icloud.com', 'me.com', 'mac.com'],
    imap: { host: 'imap.mail.me.com', port: 993, secure: true },
    smtp: { host: 'smtp.mail.me.com', port: 587, secure: false },
    notes: 'Apple ID için **Uygulamaya Özel Şifre** gerekir (2FA aktif olmalı).',
    helpUrl: 'https://appleid.apple.com',
    helpText: 'Apple Uygulama Şifresi al'
  },
  yahoo: {
    name: 'Yahoo Mail', icon: '💌', color: '#6001d2',
    domains: ['yahoo.com', 'yahoo.com.tr', 'ymail.com', 'rocketmail.com',
              'yahoo.de', 'yahoo.fr', 'yahoo.co.uk', 'yahoo.it', 'yahoo.es'],
    imap: { host: 'imap.mail.yahoo.com', port: 993, secure: true },
    pop3: { host: 'pop.mail.yahoo.com', port: 995, secure: true },
    smtp: { host: 'smtp.mail.yahoo.com', port: 465, secure: true },
    notes: 'Yahoo için **Uygulama Şifresi** gerekir.',
    helpUrl: 'https://login.yahoo.com/account/security',
    helpText: 'Yahoo Uygulama Şifresi al'
  },
  aol: {
    name: 'AOL Mail', icon: '📩', color: '#1bb14e',
    domains: ['aol.com'],
    imap: { host: 'imap.aol.com', port: 993, secure: true },
    smtp: { host: 'smtp.aol.com', port: 465, secure: true },
    notes: 'AOL için **Uygulama Şifresi** gerekir.'
  },
  gmx: {
    name: 'GMX', icon: '📭', color: '#1c449b',
    domains: ['gmx.com', 'gmx.net', 'gmx.de', 'gmx.at', 'gmx.ch', 'gmx.fr'],
    imap: { host: 'imap.gmx.com', port: 993, secure: true },
    smtp: { host: 'mail.gmx.com', port: 465, secure: true }
  },
  zoho: {
    name: 'Zoho Mail', icon: '✉', color: '#dc6e08',
    domains: ['zoho.com', 'zohomail.com'],
    imap: { host: 'imap.zoho.com', port: 993, secure: true },
    smtp: { host: 'smtp.zoho.com', port: 465, secure: true }
  },
  mailru: {
    name: 'Mail.ru', icon: '📫', color: '#168de2',
    domains: ['mail.ru', 'inbox.ru', 'list.ru', 'bk.ru'],
    imap: { host: 'imap.mail.ru', port: 993, secure: true },
    smtp: { host: 'smtp.mail.ru', port: 465, secure: true },
    notes: 'Mail.ru için **Uygulama Parolası** gerekir.'
  },
  fastmail: {
    name: 'Fastmail', icon: '⚡', color: '#0067b9',
    domains: ['fastmail.com', 'fastmail.fm'],
    imap: { host: 'imap.fastmail.com', port: 993, secure: true },
    smtp: { host: 'smtp.fastmail.com', port: 465, secure: true },
    notes: 'Fastmail için **Uygulama Parolası** gerekir.'
  }
};

function detectProvider(email) {
  if (!email || !email.includes('@')) return null;
  const domain = email.split('@')[1].toLowerCase().trim();
  if (!domain) return null;
  for (const [key, p] of Object.entries(PROVIDERS)) {
    if (p.domains && p.domains.includes(domain)) {
      return Object.assign({}, p, { key, domain });
    }
  }
  return null;
}

function customProvider(domain) {
  return {
    name: 'Özel Sunucu', icon: '📂', color: '#cba6f7', key: 'custom', domain,
    imap: { host: 'mail.' + domain, port: 993, secure: true },
    pop3: { host: 'mail.' + domain, port: 995, secure: true },
    smtp: { host: 'mail.' + domain, port: 465, secure: true },
    notes: 'Sağlayıcı tanınamadı. **mail.' + domain + '** olarak tahmin edildi (DirectAdmin/cPanel). Yanlışsa "Sunucu ayarlarını düzenle" altından değiştirebilirsiniz.'
  };
}

const state = {
  accounts: [],
  selectedFolder: null,
  selectedMessage: null,
  messages: [],
  searchQuery: '',
  editingAccountId: null,
  wizardStep: 1,
  lastConfiguredEmail: '',
  composeAttachments: [],  // v1.4: yeni mesaj ekleri
  composeEditor: null,     // v1.6: zengin editör compose
  signatureEditor: null,   // v1.6: zengin editör imza
  conversationView: false, // v1.9: konuşma görünümü
  templateEditor: null,    // v1.10: şablon editörü
  // v1.33: Çoklu seçim + sürükle-bırak
  multiSelectIds: new Set(),
  lastSelectedId: null
};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  // v1.23: Lock screen kontrolü - şifre yoksa veya doğrulandıysa devam
  await checkLockScreen();
  bindToolbar();
  bindModals();
  bindAccountWizard();
  bindCompose();
  bindSearch();
  bindKeyboard();
  bindFirstRun();
  bindSettings();
  bindNewFolder();
  bindSpam();
  bindTrayEvents();
  bindUpdater();
  bindUnifiedInbox();

  window.api.sync.onProgress((data) => {
    if (data.stage === 'fetching') setStatus(`Yeni mesajlar indiriliyor: ${data.folder} (${data.count})`);
    else if (data.stage === 'folders') setStatus(`${data.count} klasör senkronize ediliyor…`);
    else if (data.stage === 'folder-error') setStatus(`Hata: ${data.folder}`, 'error');
  });

  const cfg = await window.api.config.get();
  if (cfg.firstRun) {
    document.getElementById('firstRunPath').value = cfg.dataPath;
    document.getElementById('modalFirstRun').classList.remove('hidden');
  }
  // v1.20: Kullanıcının tercih ettiği varsayılan protokol
  state.defaultProtocol = cfg.defaultProtocol || 'imap';

  await loadAccounts();
  await updateStorageInfo();
  await loadConversationViewState();

  // v1.10.1: Footer'da kalıcı version göstergesi
  try {
    const v = await window.api.updater.appVersion();
    const fv = document.getElementById('footerVersion');
    if (fv && v) fv.textContent = 'v' + v;
  } catch (_) {}

  // v1.18: Görev badge'ini yenile (acık/geciken görev sayacı)
  refreshTasksBadge().catch(() => {});
  // Her dakika yenile
  setInterval(() => refreshTasksBadge().catch(() => {}), 60 * 1000);
}

// ============= TEPSİDEN GELEN OLAYLAR =============
function bindTrayEvents() {
  // Tepsi menüsü → "Yeni Mesaj"
  window.api.on('open-compose', () => openCompose());

  // Tepsi menüsü → "Ayarlar"
  window.api.on('open-settings', () => openSettings());

  // Bildirim tıklama → mesajı aç
  window.api.on('open-message', async (messageId) => {
    if (!messageId) return;
    const msg = await window.api.messages.get(messageId);
    if (!msg) return;
    await selectFolder(msg.folder_id, msg.account_id);
    await openMessage(messageId);
  });

  // Arka plan sync bitti → listeyi yenile
  window.api.on('background-sync-done', async (data) => {
    await loadAccounts();
    if (state.selectedFolder) await loadMessages();
    if (data && data.newCount > 0) {
      setStatus(`📬 ${data.newCount} yeni mesaj geldi`);
    }
  });

  // Güncelleme durumu değişti
  window.api.on('update-status', (status) => {
    renderUpdateStatus(status);
  });
}

// ============= GÜNCELLEYİCİ (auto-updater UI) =============
function bindUpdater() {
  const badge = document.getElementById('btnUpdateBadge');
  badge.onclick = () => openSettings();

  document.getElementById('btnCheckUpdate').onclick = async () => {
    setUpdaterStatus('Kontrol ediliyor…', 'info');
    const r = await window.api.updater.check();
    if (!r.ok) {
      setUpdaterStatus('Kontrol başarısız: ' + r.error, 'error');
    }
  };

  // settings_auto_update toggle
  const autoEl = document.getElementById('settings_auto_update');
  if (autoEl) {
    autoEl.addEventListener('change', async () => {
      await window.api.config.updatePrefs({ autoUpdateCheck: autoEl.checked });
      flashSettingsSavedIndicator();
      setStatus('Otomatik güncelleme ' + (autoEl.checked ? 'açıldı' : 'kapatıldı'));
    });
  }

  // Repo linki
  const repoLink = document.getElementById('linkRepo');
  if (repoLink) {
    repoLink.onclick = (e) => {
      e.preventDefault();
      window.api.app.openExternal('https://github.com/codegatr/codegamailapp');
    };
  }

  // Açılışta mevcut durumu çek
  setTimeout(async () => {
    const status = await window.api.updater.status();
    if (status) renderUpdateStatus(status);
    const v = await window.api.updater.appVersion();
    document.getElementById('appVersion').textContent = v;
    document.getElementById('updaterCurrentVersion').textContent = v;
  }, 500);
}

function setUpdaterStatus(text, kind) {
  const el = document.getElementById('updaterStatus');
  if (!el) return;
  el.textContent = text;
  el.className = 'updater-status ' + (kind || '');
}

// ============= v1.5: BİRLEŞİK GELEN KUTUSU =============
function bindUnifiedInbox() {
  const el = document.getElementById('unifiedInbox');
  if (!el) return;
  el.onclick = () => selectUnifiedInbox();
}

async function selectUnifiedInbox() {
  state.selectedFolder = { unified: true };
  state.selectedMessage = null;

  // Görsel: tüm folder-item'lerden active'i kaldır, unified'e ekle
  document.querySelectorAll('.folder-item.active').forEach(el => el.classList.remove('active'));
  document.getElementById('unifiedInbox').classList.add('active');

  document.getElementById('messageView').innerHTML = '<div class="empty-state">Okumak için bir mesaj seçin</div>';
  await loadMessages();
}

async function updateUnifiedSummary() {
  const sub = document.getElementById('unifiedSub');
  const badge = document.getElementById('unifiedBadge');
  if (!sub || !badge) return;

  if (!state.accounts.length) {
    sub.textContent = 'Henüz hesap yok';
    badge.classList.add('hidden');
    return;
  }

  // Quick query - sadece toplam okunmamış sayısını al
  try {
    const r = await window.api.messages.listUnified({ limit: 1 });
    const unread = r.totalUnread || 0;
    const accCount = r.accountCount || 0;
    sub.textContent = `${accCount} hesap · ${r.totalCount || 0} mesaj`;
    if (unread > 0) {
      badge.textContent = unread > 99 ? '99+' : String(unread);
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  } catch (e) {
    sub.textContent = state.accounts.length + ' hesap';
    badge.classList.add('hidden');
  }
}

function renderUpdateStatus(status) {
  const badge = document.getElementById('btnUpdateBadge');
  const details = document.getElementById('updaterDetails');
  const progress = document.getElementById('updaterProgress');
  const checkBtn = document.getElementById('btnCheckUpdate');
  if (!badge) return;

  // Toolbar rozeti
  if (status.stage === 'available' || status.stage === 'downloading' || status.stage === 'downloaded') {
    badge.classList.remove('hidden');
    if (status.stage === 'downloaded') {
      badge.textContent = `🎉 v${status.version} - Yeniden Başlat`;
    } else if (status.stage === 'downloading') {
      badge.textContent = `⬇ İndiriliyor %${status.percent}`;
    } else {
      badge.textContent = `🚀 v${status.version} mevcut`;
    }
  } else {
    badge.classList.add('hidden');
  }

  // Ayarlar paneli (Ayarlar açıksa)
  if (!details || !progress) return;

  switch (status.stage) {
    case 'idle':
      setUpdaterStatus('Hazır', '');
      details.classList.add('hidden');
      progress.classList.add('hidden');
      checkBtn.disabled = false;
      checkBtn.textContent = 'Şimdi Kontrol Et';
      break;
    case 'checking':
      setUpdaterStatus('Kontrol ediliyor…', 'info');
      details.classList.add('hidden');
      progress.classList.add('hidden');
      checkBtn.disabled = true;
      break;
    case 'not-available':
      setUpdaterStatus('✓ Güncel sürüm', 'success');
      details.classList.add('hidden');
      progress.classList.add('hidden');
      checkBtn.disabled = false;
      break;
    case 'available':
      setUpdaterStatus(`🚀 v${status.version} mevcut`, 'success');
      details.classList.remove('hidden');
      progress.classList.add('hidden');
      checkBtn.disabled = true;
      details.innerHTML = `
        <div style="margin-bottom:10px;">
          <strong>Yeni sürüm:</strong> v${escapeHtml(status.version)}<br>
          ${status.releaseNotes ? `<div class="release-notes">${escapeHtml(status.releaseNotes).replace(/\n/g, '<br>')}</div>` : ''}
        </div>
        <button class="btn btn-primary" id="btnDownloadUpdate">⬇ Şimdi İndir</button>
        <button class="btn btn-ghost" id="btnDeferUpdate">Sonra</button>
      `;
      document.getElementById('btnDownloadUpdate').onclick = async () => {
        const r = await window.api.updater.download();
        if (!r.ok) setUpdaterStatus('İndirme hatası: ' + r.error, 'error');
      };
      document.getElementById('btnDeferUpdate').onclick = () => {
        details.classList.add('hidden');
      };
      break;
    case 'downloading':
      setUpdaterStatus(`İndiriliyor… %${status.percent}`, 'info');
      details.classList.add('hidden');
      progress.classList.remove('hidden');
      document.getElementById('progressFill').style.width = status.percent + '%';
      document.getElementById('progressText').textContent = `%${status.percent}`;
      checkBtn.disabled = true;
      break;
    case 'downloaded':
      setUpdaterStatus(`✓ v${status.version} indirildi`, 'success');
      details.classList.remove('hidden');
      progress.classList.add('hidden');
      checkBtn.disabled = true;
      details.innerHTML = `
        <div style="margin-bottom:10px;">
          <strong>v${escapeHtml(status.version)}</strong> indirildi ve kuruluma hazır.
        </div>
        <button class="btn btn-primary" id="btnInstallUpdate">⟲ Şimdi Yeniden Başlat</button>
        <button class="btn btn-ghost" id="btnDeferInstall">Sonraki açılışta uygula</button>
      `;
      document.getElementById('btnInstallUpdate').onclick = () => window.api.updater.install();
      document.getElementById('btnDeferInstall').onclick = () => {
        details.classList.add('hidden');
        setStatus('Güncelleme bir sonraki çıkışta uygulanacak');
      };
      break;
    case 'error':
      setUpdaterStatus('Hata: ' + (status.error || 'bilinmeyen'), 'error');
      details.classList.add('hidden');
      progress.classList.add('hidden');
      checkBtn.disabled = false;
      break;
  }
}

// ============= Toolbar =============
function bindToolbar() {
  document.getElementById('btnAddAccount').onclick = () => openAccountModal();
  document.getElementById('btnSyncAll').onclick = syncAll;
  document.getElementById('btnCompose').onclick = () => openCompose();
  document.getElementById('btnSettings').onclick = openSettings;
  document.getElementById('btnSpamRules').onclick = openSpamRules;
  document.getElementById('btnNewFolder').onclick = openNewFolder;
  document.getElementById('btnAbout').onclick = openAbout;
  document.getElementById('btnRules').onclick = openRules;
  document.getElementById('btnCategories').onclick = openCategories;
  document.getElementById('btnConversationView').onclick = toggleConversationView;
  document.getElementById('btnTemplates').onclick = openTemplatesManager;
  document.getElementById('btnScheduled').onclick = openScheduledManager;
  document.getElementById('btnNotes').onclick = openNotes;
  document.getElementById('btnTasks').onclick = openTasks;
  document.getElementById('btnArchive').onclick = openArchive;
  document.getElementById('btnPGP').onclick = openPGP;
  document.getElementById('btnCalendar').onclick = openCalendar;
  document.getElementById('btnContacts').onclick = openContacts;
  document.getElementById('btnTrustedSenders').onclick = openTrustedSenders;
}

function bindModals() {
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.onclick = () => document.getElementById(btn.dataset.close).classList.add('hidden');
  });
}

function bindKeyboard() {
  document.addEventListener('keydown', (e) => {
    // Input/textarea/contenteditable içindeyse tek-harf kısayolları (J/K/R/A vs) çalışmasın
    const inEditable = isEditableElement(e.target);

    // ===== Genel kısayollar (her yerde) =====
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openCommandPalette();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      document.getElementById('modalKeyboardHelp').classList.remove('hidden');
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === ',') {
      e.preventDefault();
      openSettings();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      openCompose();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && /^[1-9]$/.test(e.key)) {
      e.preventDefault();
      const idx = parseInt(e.key, 10) - 1;
      if (state.accounts && state.accounts[idx]) {
        selectAccount(state.accounts[idx].id);
      }
      return;
    }
    if (e.key === 'F5') { e.preventDefault(); syncAll(); return; }
    if (e.key === 'Escape') hideContextMenu();

    // Düzenlenebilir alandayken (input/textarea/editor) tek harfli kısayolları yakalamayalım
    if (inEditable) {
      // Compose'da Ctrl+Enter gönder
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const composeOpen = !document.getElementById('modalCompose').classList.contains('hidden');
        if (composeOpen) { e.preventDefault(); sendMail(); }
      }
      return;
    }

    // ===== Mesaj listesi kısayolları (Gmail tarzı) =====
    // Açık modal varsa karışmasın
    const anyModalOpen = !!document.querySelector('.modal:not(.hidden):not(#modalKeyboardHelp):not(#modalCommandPalette)');
    if (anyModalOpen) return;

    if (e.key === 'j' || e.key === 'ArrowDown') {
      if (state.messages && state.messages.length) {
        e.preventDefault();
        navigateMessage(1);
      }
    } else if (e.key === 'k' || e.key === 'ArrowUp') {
      if (state.messages && state.messages.length) {
        e.preventDefault();
        navigateMessage(-1);
      }
    } else if ((e.key === 'Enter' || e.key === 'o') && state.selectedMessage) {
      // Mesajı detay panelinde aç (zaten açık olabilir)
      // Hiçbir şey yapmayalım - mesaj zaten seçili durumda
    } else if (e.key === 'r' && state.selectedMessage) {
      e.preventDefault();
      openCompose({ replyTo: state.selectedMessage });
    } else if (e.key === 'a' && state.selectedMessage) {
      e.preventDefault();
      openCompose({ replyTo: state.selectedMessage, replyAll: true });
    } else if (e.key === 'f' && state.selectedMessage) {
      e.preventDefault();
      openCompose({ forward: state.selectedMessage });
    } else if ((e.key === 'Delete' || e.key === '#') && state.selectedMessage) {
      e.preventDefault();
      if (confirm('Bu mesajı silmek istediğinizden emin misiniz?')) deleteCurrentMessage();
    } else if (e.key === 's' && state.selectedMessage) {
      e.preventDefault();
      toggleImportantCurrentMessage();
    } else if (e.key === '!' && state.selectedMessage) {
      e.preventDefault();
      markCurrentMessageAsSpam();
    } else if (e.key === 'u' && state.selectedMessage) {
      e.preventDefault();
      toggleReadCurrentMessage();
    } else if (e.key === 'e' && state.selectedMessage && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      archiveMessageFromList(state.selectedMessage);
    } else if (e.key === 'c' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      openCompose();
    } else if (e.key === '/' && !e.ctrlKey) {
      e.preventDefault();
      const sb = document.getElementById('searchBox');
      if (sb) { sb.focus(); sb.select(); }
    }
  });
  document.addEventListener('click', hideContextMenu);
}

function isEditableElement(el) {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (el.isContentEditable) return true;
  // Closest contenteditable kontrolü
  return !!el.closest && !!el.closest('[contenteditable="true"]');
}

function navigateMessage(dir) {
  if (!state.messages || !state.messages.length) return;
  let idx = -1;
  if (state.selectedMessage) {
    idx = state.messages.findIndex(m => m.id === state.selectedMessage.id);
  }
  let newIdx = idx + dir;
  if (newIdx < 0) newIdx = 0;
  if (newIdx >= state.messages.length) newIdx = state.messages.length - 1;
  const next = state.messages[newIdx];
  if (next) {
    openMessage(next.id);
    // Kaydır
    setTimeout(() => {
      const row = document.querySelector(`.message-item[data-id="${next.id}"]`);
      if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 50);
  }
}

// Mevcut seçili mesaj eylemleri
async function toggleImportantCurrentMessage() {
  if (!state.selectedMessage) return;
  const newVal = !state.selectedMessage.is_important;
  await window.api.messages.markImportant(state.selectedMessage.id, newVal);
  state.selectedMessage.is_important = newVal;
  await loadMessages();
  setStatus(newVal ? '⭐ Önemli işaretlendi' : 'Önem kaldırıldı');
}

async function markCurrentMessageAsSpam() {
  if (!state.selectedMessage) return;
  await window.api.messages.markSpam(state.selectedMessage.id);
  setStatus('Spam olarak işaretlendi');
  await loadMessages();
}

async function toggleReadCurrentMessage() {
  if (!state.selectedMessage) return;
  const newRead = !state.selectedMessage.is_read;
  await window.api.messages.markRead(state.selectedMessage.id, newRead);
  state.selectedMessage.is_read = newRead;
  await loadMessages();
  setStatus(newRead ? 'Okundu' : 'Okunmadı');
}

async function markAllRead() {
  if (!state.messages || !state.messages.length) {
    setStatus('Klasör boş');
    return;
  }
  const unread = state.messages.filter(m => !m.is_read);
  if (!unread.length) { setStatus('Tüm mesajlar zaten okunmuş'); return; }
  if (!confirm(`${unread.length} okunmamış mesaj okundu olarak işaretlensin mi?`)) return;
  for (const m of unread) {
    try { await window.api.messages.markRead(m.id, true); } catch (_) {}
  }
  setStatus(`✓ ${unread.length} mesaj okundu olarak işaretlendi`);
  await loadMessages();
  await loadAccounts();
}

async function selectAccount(accountId) {
  // Hesabın inbox/ilk klasörüne geç
  try {
    const folders = await window.api.folders.list(accountId);
    if (!folders || !folders.length) { setStatus('Bu hesap için klasör bulunamadı'); return; }
    // Inbox bul
    const inbox = folders.find(f => /inbox|gelen/i.test(f.name) || f.special_use === 'inbox') || folders[0];
    const folderEl = document.querySelector(`.folder-item[data-folder-id="${inbox.id}"]`);
    if (folderEl) folderEl.click();
    else {
      // Click event yoksa programatik geç
      state.selectedFolder = inbox;
      await loadMessages();
    }
    const acc = state.accounts.find(a => a.id === accountId);
    if (acc) setStatus(`📧 ${acc.display_name} hesabına geçildi`);
  } catch (e) {
    setStatus('Hesap geçişi hatası: ' + e.message, 'error');
  }
}

// ============= İlk Çalıştırma =============
function bindFirstRun() {
  document.getElementById('firstRunBrowse').onclick = async () => {
    const r = await window.api.config.chooseDataPath();
    if (r.ok) document.getElementById('firstRunPath').value = r.path;
  };
  document.getElementById('firstRunContinue').onclick = async () => {
    const newPath = document.getElementById('firstRunPath').value;
    const cfg = await window.api.config.get();
    if (newPath !== cfg.defaultDataPath) {
      const r = await window.api.config.setDataPath(newPath);
      if (!r.ok) { alert('Veri konumu ayarlanamadı: ' + r.error); return; }
    }
    await window.api.config.setFirstRunDone();
    document.getElementById('modalFirstRun').classList.add('hidden');
    await updateStorageInfo();
  };
}

// ============= AYARLAR (v1.2: tepsi/bildirim ekli) =============
function bindSettings() {
  document.getElementById('settingsBrowsePath').onclick = async () => {
    const r = await window.api.config.chooseDataPath();
    if (!r.ok) return;
    if (!confirm(`Veri konumu değiştirilecek:\n\n→ ${r.path}\n\nMevcut veritabanı yeni konuma taşınacak. Devam edilsin mi?`)) return;
    const result = await window.api.config.setDataPath(r.path);
    if (result.ok) {
      document.getElementById('settingsPath').value = r.path;
      await updateStorageInfo();
      await loadAccounts();
      setStatus('Veri konumu değiştirildi: ' + r.path);
    } else alert('Hata: ' + result.error);
  };
  document.getElementById('settingsOpenFolder').onclick = () => window.api.app.openDataFolder();

  // v1.2: Bildirim/tepsi tercihleri - değişince anında kaydet
  const prefIds = [
    ['settings_notifications', 'notificationsEnabled', 'checkbox'],
    ['settings_sync_interval', 'backgroundSyncMinutes', 'number'],
    ['settings_close_to_tray', 'closeToTray', 'checkbox'],
    ['settings_auto_start', 'autoStart', 'checkbox'],
    ['settings_start_minimized', 'startMinimized', 'checkbox'],
    ['settings_default_protocol', 'defaultProtocol', 'string'],
    ['settings_auto_archive', 'autoArchiveEnabled', 'checkbox'],
    ['settings_auto_archive_months', 'autoArchiveMonths', 'number'],
    ['settings_auto_lock', 'autoLockEnabled', 'checkbox'],
    ['settings_auto_lock_minutes', 'autoLockMinutes', 'number'],
    ['settings_auto_categorize', 'autoCategorizeEnabled', 'checkbox'],
    ['vt_autoScan', 'virustotalAutoScan', 'checkbox'],
    ['url_scanWithVt', 'urlScanWithVt', 'checkbox']
  ];
  for (const [domId, key, type] of prefIds) {
    const el = document.getElementById(domId);
    if (!el) continue;
    el.addEventListener('change', async () => {
      const value = type === 'checkbox' ? el.checked
                   : type === 'number' ? parseInt(el.value, 10)
                   : el.value;
      await window.api.config.updatePrefs({ [key]: value });
      flashSettingsSavedIndicator();
      setStatus('Ayar kaydedildi');
      // v1.28: autoLock ayarları değiştiyse idle monitor'ü yenile
      if (key === 'autoLockEnabled' || key === 'autoLockMinutes') {
        refreshIdleLockState().catch(() => {});
      }
    });
  }

  // v1.13.1: Settings içindeki Yedekleme butonları
  const sBackup = document.getElementById('btnSettingsBackup');
  const sRestore = document.getElementById('btnSettingsRestore');
  if (sBackup) sBackup.onclick = doBackup;
  if (sRestore) sRestore.onclick = doRestore;

  document.getElementById('btnTestNotif').onclick = async () => {
    const r = await window.api.config.testNotification();
    if (r && r.ok) {
      const layers = (r.layers || []).map(l => {
        if (l === 'snoretoast') return 'SnoreToast';
        if (l === 'electron') return 'Electron';
        if (l === 'tray_balloon') return 'Tray Balon';
        if (l === 'inapp_banner') return 'In-app Banner';
        return l;
      }).join(', ');
      setStatus(`✓ Test bildirimi gönderildi - paralel: ${layers}`);
      // In-app banner zaten görünmeli (sağ üstte). 2 sn sonra konfirm
      setTimeout(() => {
        const seen = confirm(`Test bildirimi gönderildi.\n\nÇalışan katmanlar: ${layers}\n\nNeresini gördün?\n• Sağ üstte mavi BANNER (in-app, garantili)\n• Windows toast (sağ alt köşe)\n• Tepside balon\n\nHerhangi birini gördüysen "Tamam".\nHiçbirini görmediysen "İptal" - kontrol listesi.`);
        if (!seen) showNotificationTroubleshoot(r);
      }, 2500);
    } else {
      let msg = 'Bildirim gönderilemedi.\n\n';
      if (!r) msg += 'Sebep: IPC dönmedi';
      else if (!r.enabled) msg += 'Sebep: Bildirimler config\'de kapalı';
      else msg += 'Tüm 4 katman da başarısız';
      alert(msg);
      setStatus('Test bildirimi başarısız', 'error');
    }
  };

  // v1.13: VirusTotal handler'ları
  bindVirusTotalSettings();

  // v1.14: Bayes handler'ları
  bindBayesSettings();
}

function showNotificationTroubleshoot(result) {
  let msg = 'Bildirim sorunu giderme:\n\n';
  msg += `Çalıştırılan katmanlar: ${(result.layers || []).join(', ') || 'hiçbiri'}\n\n`;
  msg += '🔍 ÖNERİLER:\n';
  msg += '1. Sağ üstte küçük mavi banner çıktı mı? (In-app, her zaman çalışmalı)\n';
  msg += '   Çıkmadıysa pencere DOM render olmuyor, restart gerek\n';
  msg += '2. Windows Ayarlar > Sistem > Bildirimler:\n';
  msg += '   • "Bildirimleri al" AÇIK\n';
  msg += '   • "CODEGA Mail" varsa AÇIK\n';
  msg += '3. Windows Ayarlar > Sistem > "Odaklanma" → Kapalı\n';
  msg += '4. Bildirim Merkezi (saat yanı) içinde birikmiş mi kontrol et\n';
  msg += '5. Tray icon (sistem tepsisi) görünüyor mu? Görünmüyorsa balloon da çalışmaz\n';
  msg += '6. Uygulamayı tepsiden kapat, yeniden başlat\n';
  msg += '7. CODEGA Mail\'i Başlat menüsüne sabitle (sağ tık > Sabitle)';
  alert(msg);
}

async function openSettings() {
  const cfg = await window.api.config.get();
  document.getElementById('settingsPath').value = cfg.dataPath;
  // v1.10.2: Settings'te de runtime app version kullan
  let runtimeVer = cfg.version || '?';
  try {
    const v = await window.api.updater.appVersion();
    if (v) runtimeVer = v;
  } catch (_) {}
  document.getElementById('appVersion').textContent = runtimeVer;

  // v1.2: Bildirim tercihlerini yükle
  document.getElementById('settings_notifications').checked = cfg.notificationsEnabled !== false;
  document.getElementById('settings_sync_interval').value = String(cfg.backgroundSyncMinutes || 0);
  document.getElementById('settings_close_to_tray').checked = cfg.closeToTray !== false;
  document.getElementById('settings_auto_start').checked = !!cfg.autoStart;
  document.getElementById('settings_start_minimized').checked = !!cfg.startMinimized;
  // v1.20: Varsayılan protokol
  const dpEl = document.getElementById('settings_default_protocol');
  if (dpEl) dpEl.value = cfg.defaultProtocol || 'imap';
  state.defaultProtocol = cfg.defaultProtocol || 'imap';

  // v1.24: Otomatik arşivleme ayarları
  const aaEl = document.getElementById('settings_auto_archive');
  if (aaEl) aaEl.checked = !!cfg.autoArchiveEnabled;
  const aamEl = document.getElementById('settings_auto_archive_months');
  if (aamEl) aamEl.value = String(cfg.autoArchiveMonths || 6);

  // v1.28: Boşta kalma kilidi
  const alEl = document.getElementById('settings_auto_lock');
  if (alEl) alEl.checked = !!cfg.autoLockEnabled;
  const almEl = document.getElementById('settings_auto_lock_minutes');
  if (almEl) almEl.value = String(cfg.autoLockMinutes || 15);
  // Master password yoksa uyarı göster
  try {
    const secStatus = await window.api.security.status();
    const warnEl = document.getElementById('autoLockNoMasterWarning');
    if (warnEl) {
      if (secStatus.hasMasterPassword) warnEl.classList.add('hidden');
      else warnEl.classList.remove('hidden');
    }
  } catch (_) {}

  // v1.29: Otomatik kategorize
  const acEl = document.getElementById('settings_auto_categorize');
  if (acEl) acEl.checked = cfg.autoCategorizeEnabled !== false;
  const btnAcAll = document.getElementById('btnAutoCategorizeAll');
  if (btnAcAll && !btnAcAll.dataset.bound) {
    btnAcAll.dataset.bound = '1';
    btnAcAll.onclick = async () => {
      const resultEl = document.getElementById('autoCategorizeResult');
      btnAcAll.disabled = true;
      btnAcAll.textContent = '⏳ Taranıyor...';
      resultEl.textContent = '';
      try {
        const r = await window.api.autoCategorize.all({ onlyUntagged: true });
        if (r.ok) {
          resultEl.innerHTML = `✅ <strong>${r.scanned}</strong> mail tarandı, <strong>${r.categorized}</strong> mail kategorize edildi (toplam ${r.totalLabels} etiket eklendi).`;
          resultEl.style.color = '#2ecc71';
          setStatus(`✓ ${r.categorized} mail kategorize edildi`);
          // Mesajları yenile
          if (state.selectedFolder) await loadMessages();
        } else {
          resultEl.textContent = '❌ Hata: ' + r.error;
          resultEl.style.color = 'var(--danger)';
        }
      } finally {
        btnAcAll.disabled = false;
        btnAcAll.textContent = '⚡ Mevcut tüm etiketsiz maillere uygula';
      }
    };
  }

  // v1.22: Yazım denetimi ayarları
  await loadSpellSettings();

  // v1.23: Güvenlik panelini yenile
  await refreshSecuritySettings();

  // v1.30: Görünüm ayarları
  await refreshAppearanceSettings();

  // v1.31: Layout ayarları
  await refreshLayoutSettings();
  // v1.3: Güncelleme tercihi
  const autoUpdEl = document.getElementById('settings_auto_update');
  if (autoUpdEl) autoUpdEl.checked = cfg.autoUpdateCheck !== false;

  // v1.13: VirusTotal değerleri
  const vtKey = document.getElementById('vt_apiKey');
  if (vtKey) {
    vtKey.value = cfg.virustotalApiKey || '';
    const vtStatus = document.getElementById('vt_keyStatus');
    if (vtStatus) {
      vtStatus.textContent = cfg.virustotalApiKey ? 'Kayıtlı (doğrulamak için Test Et\'e tıklayın)' : 'Anahtar yok - VT taraması devre dışı';
      vtStatus.style.color = 'var(--muted)';
    }
  }
  const vtAuto = document.getElementById('vt_autoScan');
  if (vtAuto) vtAuto.checked = cfg.virustotalAutoScan !== false;

  // v1.14: Bayes istatistik
  await refreshBayesStats();

  // v1.15: URL settings
  const urlVt = document.getElementById('url_scanWithVt');
  if (urlVt) urlVt.checked = cfg.urlScanWithVt !== false;
  const btnUrlClear = document.getElementById('btnUrlClearCache');
  if (btnUrlClear && !btnUrlClear.dataset.bound) {
    btnUrlClear.dataset.bound = '1';
    btnUrlClear.onclick = async () => {
      if (!confirm('URL kontrol önbelleği temizlensin mi? (Bir sonraki kontrolde her URL yeniden taranır)')) return;
      const r = await window.api.url.clearCache();
      if (r.ok) setStatus('✓ URL önbelleği temizlendi');
    };
  }

  await renderSettingsAccountList();
  document.getElementById('modalSettings').classList.remove('hidden');
}

async function renderSettingsAccountList() {
  const container = document.getElementById('settingsAccountList');
  const accounts = await window.api.accounts.list();
  if (!accounts.length) {
    container.innerHTML = '<div class="empty-state">Hesap yok</div>';
    return;
  }
  container.innerHTML = accounts.map(a => `
    <div class="settings-account-item">
      <div style="flex:1;">
        <div style="font-weight:600;">${escapeHtml(a.display_name)}</div>
        <div style="font-size:11px;color:var(--muted);">
          ${escapeHtml(a.email)} · ${a.protocol.toUpperCase()}
          · Spam: ${a.spam_enabled ? 'aktif' : 'kapalı'}
          ${a.last_sync ? '· Son sync: ' + formatDate(a.last_sync) : ''}
        </div>
      </div>
      <button class="btn btn-ghost" data-edit-acc="${a.id}">Düzenle</button>
      <button class="btn btn-ghost" data-delete-acc="${a.id}" style="color:var(--danger);">Sil</button>
    </div>
  `).join('');

  container.querySelectorAll('[data-edit-acc]').forEach(btn => {
    btn.onclick = async () => {
      document.getElementById('modalSettings').classList.add('hidden');
      await openAccountModal(parseInt(btn.dataset.editAcc, 10));
    };
  });
  container.querySelectorAll('[data-delete-acc]').forEach(btn => {
    btn.onclick = async () => {
      const id = parseInt(btn.dataset.deleteAcc, 10);
      const acc = accounts.find(a => a.id === id);
      if (!confirm(`"${acc.email}" hesabını silmek istediğinizden emin misiniz?`)) return;
      await window.api.accounts.delete(id);
      await loadAccounts();
      await renderSettingsAccountList();
    };
  });
}

// ============= HESAP WIZARD =============
function bindAccountWizard() {
  const emailInput = document.getElementById('acc_email');
  // v1.19: Email yazılırken anlık (yerel), bittiğinde async (DNS/ISPDB)
  emailInput.addEventListener('input', debounce(updateProviderHint, 500));
  emailInput.addEventListener('blur', () => {
    const email = emailInput.value.trim();
    const usernameField = document.getElementById('acc_in_username');
    if (email.includes('@') && !usernameField.value) usernameField.value = email;
    // Tam autoconfig çalıştır (yerelde yoksa ISPDB+MX)
    updateProviderHint();
  });

  document.getElementById('acc_protocol').onchange = (e) => {
    const isPop3 = e.target.value === 'pop3';
    const provider = state.detectedProvider;
    const portField = document.getElementById('acc_in_port');
    const hostField = document.getElementById('acc_in_host');
    const secureField = document.getElementById('acc_in_secure');
    if (isPop3) {
      const cfg = (provider && provider.pop3) || { host: hostField.value.replace(/^imap\./, 'pop.'), port: 995, secure: true };
      portField.value = cfg.port;
      hostField.value = cfg.host;
      secureField.value = cfg.secure ? '1' : '0';
    } else {
      const cfg = (provider && provider.imap) || { host: hostField.value.replace(/^pop\./, 'imap.'), port: 993, secure: true };
      portField.value = cfg.port;
      hostField.value = cfg.host;
      secureField.value = cfg.secure ? '1' : '0';
    }
    document.getElementById('pop3OptionsWrap').style.display = isPop3 ? 'flex' : 'none';
  };

  document.getElementById('btnWizardNext').onclick = wizardNext;
  document.getElementById('btnWizardBack').onclick = wizardBack;
  document.getElementById('btnTestAccount').onclick = testAccount;
  document.getElementById('btnSaveAccount').onclick = saveAccount;
}

async function updateProviderHint() {
  const email = document.getElementById('acc_email').value.trim();
  const hint = document.getElementById('providerHint');
  if (!email.includes('@')) { hint.innerHTML = ''; hint.className = 'provider-hint'; return; }

  // Önce yerel veritabanı kontrol (anlık)
  const local = detectProvider(email);
  if (local) {
    hint.innerHTML = `<span style="color:${local.color};">${local.icon}</span> <strong>${local.name}</strong> tespit edildi · ayarlar otomatik doldurulacak`;
    hint.className = 'provider-hint detected';
    return;
  }

  // Yerelde yoksa: DNS MX + ISPDB sorgusu (1-2 sn sürebilir)
  hint.innerHTML = `<span class="ac-spinner">↻</span> <em>${escapeHtml(email.split('@')[1])} sağlayıcısı tespit ediliyor...</em>`;
  hint.className = 'provider-hint detecting';

  try {
    const r = await window.api.autoconfig.detect(email);
    if (r && r.ok && r.imap) {
      // Cache'le state'e
      state.autoconfigResult = r;
      const sourceLabel = r.source === 'mx' ? 'MX kaydı' :
                          r.source === 'ispdb' ? 'Mozilla veritabanı' :
                          r.source === 'domain-autoconfig' ? 'domain autoconfig' : '';
      hint.innerHTML = `<span style="color:${r.color || '#2ecc71'};">${r.icon || '🌐'}</span> <strong>${escapeHtml(r.providerName)}</strong> tespit edildi · <small style="color:var(--muted);">${sourceLabel}${r.mxRecord ? ': ' + escapeHtml(r.mxRecord) : ''}</small>`;
      hint.className = 'provider-hint detected';
    } else {
      const domain = email.split('@')[1];
      hint.innerHTML = `📂 <strong>Özel sunucu</strong> · <code>mail.${escapeHtml(domain)}</code> denenecek<br><small style="color:var(--muted);">Sağlayıcı otomatik tanınamadı (MX/ISPDB sonuç vermedi)</small>`;
      hint.className = 'provider-hint custom';
      state.autoconfigResult = null;
    }
  } catch (e) {
    const domain = email.split('@')[1];
    hint.innerHTML = `📂 <strong>Özel sunucu</strong> · <code>mail.${escapeHtml(domain)}</code> denenecek`;
    hint.className = 'provider-hint custom';
    state.autoconfigResult = null;
  }
}

function setWizardStep(step) {
  state.wizardStep = step;
  document.querySelectorAll('.wizard-page').forEach(el => {
    el.classList.toggle('hidden', parseInt(el.dataset.step, 10) !== step);
  });
  document.querySelectorAll('.wizard-step-indicator').forEach(el => {
    const s = parseInt(el.dataset.step, 10);
    el.classList.toggle('active', s === step);
    el.classList.toggle('completed', s < step);
  });
  const editing = !!state.editingAccountId;
  document.getElementById('btnWizardBack').style.display = (step > 1 && !editing) ? '' : 'none';
  document.getElementById('btnWizardNext').style.display = (step < 3 && !editing) ? '' : 'none';
  document.getElementById('btnTestAccount').style.display = (step >= 2) ? '' : 'none';
  document.getElementById('btnSaveAccount').style.display = (step === 3 || editing) ? '' : 'none';
}

function wizardNext() {
  if (state.wizardStep === 1) {
    const email = document.getElementById('acc_email').value.trim();
    const password = document.getElementById('acc_in_password').value;
    const displayName = document.getElementById('acc_display_name').value.trim();
    if (!displayName) return alert('Görünen ad gerekli');
    if (!email.includes('@')) return alert('Geçerli bir e-posta adresi girin');
    if (!password) return alert('Şifre gerekli');
    if (email !== state.lastConfiguredEmail) {
      applyProviderConfig(email);
      state.lastConfiguredEmail = email;
    }
    setWizardStep(2);
  } else if (state.wizardStep === 2) setWizardStep(3);
}

function wizardBack() { if (state.wizardStep > 1) setWizardStep(state.wizardStep - 1); }

function applyProviderConfig(email) {
  // v1.19: Önce yerel, yoksa autoconfig sonucu, yoksa fallback
  let provider = detectProvider(email);
  if (!provider && state.autoconfigResult && state.autoconfigResult.imap) {
    // Autoconfig sonucundan provider objesi oluştur
    const ac = state.autoconfigResult;
    provider = {
      name: ac.providerName,
      icon: ac.icon || '🌐',
      color: ac.color || '#3498db',
      key: ac.provider,
      domain: ac.domain,
      imap: ac.imap,
      pop3: ac.pop3,
      smtp: ac.smtp,
      notes: ac.notes,
      helpUrl: ac.helpUrl,
      detectionSource: ac.source,
      mxRecord: ac.mxRecord
    };
  }
  if (!provider) provider = customProvider(email.split('@')[1]);

  state.detectedProvider = provider;
  document.getElementById('acc_in_username').value = email;

  // v1.20: Kullanıcı POP3 tercih ediyorsa ve provider POP3 destekliyorsa onu uygula
  const preferProtocol = state.defaultProtocol || 'imap';
  const usePop3 = (preferProtocol === 'pop3' && provider.pop3);

  if (usePop3) {
    document.getElementById('acc_in_host').value = provider.pop3.host;
    document.getElementById('acc_in_port').value = provider.pop3.port;
    document.getElementById('acc_in_secure').value = provider.pop3.secure ? '1' : '0';
    document.getElementById('acc_protocol').value = 'pop3';
    document.getElementById('pop3OptionsWrap').style.display = 'flex';
  } else {
    document.getElementById('acc_in_host').value = provider.imap.host;
    document.getElementById('acc_in_port').value = provider.imap.port;
    document.getElementById('acc_in_secure').value = provider.imap.secure ? '1' : '0';
    document.getElementById('acc_protocol').value = 'imap';
    document.getElementById('pop3OptionsWrap').style.display = 'none';
  }
  document.getElementById('acc_smtp_host').value = provider.smtp.host;
  document.getElementById('acc_smtp_port').value = provider.smtp.port;
  document.getElementById('acc_smtp_secure').value = provider.smtp.secure ? '1' : '0';
  renderProviderCard(provider);
  renderAutoConfigSummary(provider);
}

function renderProviderCard(provider) {
  const card = document.getElementById('providerCard');
  const isCustom = provider.key === 'custom';
  const formattedNotes = (provider.notes || '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  let html = `
    <div class="provider-card-header">
      <div class="provider-icon-large" style="background:${provider.color}22;color:${provider.color};">${provider.icon}</div>
      <div class="provider-info">
        <div class="provider-name-large">${escapeHtml(provider.name)}</div>
        <div class="provider-domain">@${escapeHtml(provider.domain)}</div>
      </div>
      <span class="provider-tag ${isCustom ? 'custom' : 'detected'}">${isCustom ? 'tahmin' : '✓ tespit edildi'}</span>
    </div>
  `;
  if (provider.notes) html += `<div class="provider-notes">⚠ ${formattedNotes}</div>`;
  if (provider.helpUrl) html += `<button class="btn provider-help-btn" data-url="${provider.helpUrl}">${escapeHtml(provider.helpText)} ↗</button>`;
  card.innerHTML = html;
  const helpBtn = card.querySelector('.provider-help-btn');
  if (helpBtn) helpBtn.onclick = () => window.api.app.openExternal(helpBtn.dataset.url);
}

function renderAutoConfigSummary(provider) {
  document.getElementById('autoConfigSummary').innerHTML = `
    <div class="cfg-row">
      <span class="cfg-label">📥 Gelen:</span>
      <code>${escapeHtml(provider.imap.host)}:${provider.imap.port}</code>
      <span class="cfg-tag">IMAP/${provider.imap.secure ? 'SSL' : 'STARTTLS'}</span>
    </div>
    <div class="cfg-row">
      <span class="cfg-label">📤 Giden:</span>
      <code>${escapeHtml(provider.smtp.host)}:${provider.smtp.port}</code>
      <span class="cfg-tag">SMTP/${provider.smtp.secure ? 'SSL' : 'STARTTLS'}</span>
    </div>
  `;
}

async function openAccountModal(editAccountId = null) {
  state.editingAccountId = editAccountId;
  state.lastConfiguredEmail = '';
  state.detectedProvider = null;

  ['acc_display_name','acc_email','acc_in_host','acc_in_username','acc_in_password',
   'acc_smtp_host','acc_smtp_username','acc_smtp_password'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('acc_protocol').value = 'imap';
  document.getElementById('acc_in_port').value = 993;
  document.getElementById('acc_smtp_port').value = 465;
  document.getElementById('acc_in_secure').value = '1';
  document.getElementById('acc_smtp_secure').value = '1';
  document.getElementById('acc_pop3_leave').checked = true;
  document.getElementById('acc_spam_enabled').value = '1';
  document.getElementById('acc_spam_threshold').value = 50;
  document.getElementById('pop3OptionsWrap').style.display = 'none';
  document.getElementById('testResult').style.display = 'none';
  document.getElementById('testResult').className = 'test-result';
  document.getElementById('acc_pw_hint').textContent = '';
  document.getElementById('acc_smtp_pw_hint').textContent = '(boşsa gelen ile aynı)';
  document.getElementById('providerHint').innerHTML = '';
  document.getElementById('providerCard').innerHTML = '';
  document.getElementById('autoConfigSummary').innerHTML = '';
  document.getElementById('acc_email').readOnly = false;
  document.getElementById('acc_protocol').disabled = false;
  document.getElementById('advancedToggle').open = false;

  // v1.6: imza editörünü init (sadece bir kere) ve içeriği temizle
  if (!state.signatureEditor && typeof RichEditor !== 'undefined') {
    state.signatureEditor = new RichEditor('signatureEditor', {
      placeholder: '-- imzanızı buraya yazın (Bold, italic, link, vs.) --',
      compact: true
    });
  }
  if (state.signatureEditor) state.signatureEditor.clear();

  if (editAccountId) {
    document.getElementById('wizardSteps').style.display = 'none';
    document.querySelectorAll('.wizard-page').forEach(el => el.classList.remove('hidden'));
    document.getElementById('advancedToggle').open = true;
    const acc = await window.api.accounts.get(editAccountId);
    if (acc) {
      document.getElementById('accountModalTitle').textContent = 'Hesabı Düzenle: ' + acc.email;
      document.getElementById('acc_display_name').value = acc.display_name || '';
      document.getElementById('acc_email').value = acc.email || '';
      document.getElementById('acc_email').readOnly = true;
      document.getElementById('acc_protocol').value = acc.protocol;
      document.getElementById('acc_protocol').disabled = true;
      document.getElementById('acc_in_host').value = acc.in_host;
      document.getElementById('acc_in_port').value = acc.in_port;
      document.getElementById('acc_in_secure').value = String(acc.in_secure);
      document.getElementById('acc_in_username').value = acc.in_username;
      document.getElementById('acc_smtp_host').value = acc.smtp_host;
      document.getElementById('acc_smtp_port').value = acc.smtp_port;
      document.getElementById('acc_smtp_secure').value = String(acc.smtp_secure);
      document.getElementById('acc_smtp_username').value = acc.smtp_username || '';
      // v1.6: imzayı editor'e yükle (HTML veya plain - ikisini de destekle)
      if (state.signatureEditor) {
        const sig = acc.signature || '';
        const sigIsHtml = /<[a-z][\s\S]*>/i.test(sig);
        state.signatureEditor.setHTML(sigIsHtml ? sig : sig.replace(/\n/g, '<br>'));
      }
      document.getElementById('acc_spam_enabled').value = String(acc.spam_enabled || 0);
      document.getElementById('acc_spam_threshold').value = acc.spam_threshold || 50;
      document.getElementById('acc_pop3_leave').checked = !!acc.pop3_leave_on_server;
      if (acc.protocol === 'pop3') document.getElementById('pop3OptionsWrap').style.display = 'flex';
      if (acc.has_in_password) document.getElementById('acc_pw_hint').textContent = 'Boş bırakılırsa mevcut şifre korunur';
      if (acc.has_smtp_password) document.getElementById('acc_smtp_pw_hint').textContent = '(boş bırakılırsa mevcut korunur)';
      state.wizardStep = 3;
      document.getElementById('btnWizardBack').style.display = 'none';
      document.getElementById('btnWizardNext').style.display = 'none';
      document.getElementById('btnTestAccount').style.display = '';
      document.getElementById('btnSaveAccount').style.display = '';
    }
  } else {
    document.getElementById('accountModalTitle').textContent = '+ Mail Hesabı Ekle';
    document.getElementById('wizardSteps').style.display = '';
    setWizardStep(1);
  }

  document.getElementById('modalAccount').classList.remove('hidden');
}

function readAccountForm() {
  return {
    display_name: document.getElementById('acc_display_name').value.trim(),
    email: document.getElementById('acc_email').value.trim(),
    protocol: document.getElementById('acc_protocol').value,
    in_host: document.getElementById('acc_in_host').value.trim(),
    in_port: parseInt(document.getElementById('acc_in_port').value, 10),
    in_secure: document.getElementById('acc_in_secure').value === '1',
    in_username: document.getElementById('acc_in_username').value.trim(),
    in_password: document.getElementById('acc_in_password').value,
    smtp_host: document.getElementById('acc_smtp_host').value.trim(),
    smtp_port: parseInt(document.getElementById('acc_smtp_port').value, 10),
    smtp_secure: document.getElementById('acc_smtp_secure').value === '1',
    smtp_username: document.getElementById('acc_smtp_username').value.trim() || null,
    smtp_password: document.getElementById('acc_smtp_password').value || null,
    pop3_leave_on_server: document.getElementById('acc_pop3_leave').checked,
    spam_enabled: document.getElementById('acc_spam_enabled').value === '1',
    spam_threshold: parseInt(document.getElementById('acc_spam_threshold').value, 10) || 50,
    signature: state.signatureEditor ? state.signatureEditor.getHTML() : ''
  };
}

function validateAccount(a, isEdit) {
  if (!a.display_name) return 'Görünen ad gerekli';
  if (!a.email) return 'E-posta gerekli';
  if (!a.in_host) return 'Gelen sunucu gerekli';
  if (!a.in_username) return 'Kullanıcı adı gerekli';
  if (!isEdit && !a.in_password) return 'Şifre gerekli';
  if (!a.smtp_host) return 'SMTP sunucu gerekli';
  return null;
}

async function testAccount() {
  const data = readAccountForm();
  const err = validateAccount(data, false);
  if (err) return showTestResult(err, 'error');
  showTestResult('Bağlantı test ediliyor…', 'info');
  if (state.wizardStep < 3 && !state.editingAccountId) setWizardStep(3);
  const result = await window.api.accounts.test(data);
  if (result.ok) {
    showTestResult('✓ Bağlantı başarılı\n  Gelen sunucu: OK\n  Giden sunucu (SMTP): OK', 'success');
  } else {
    let msg = '';
    msg += result.incoming ? '✓ Gelen sunucu: OK\n' : '✗ Gelen sunucu: BAŞARISIZ\n';
    msg += result.outgoing ? '✓ Giden sunucu: OK\n' : '✗ Giden sunucu: BAŞARISIZ\n';
    if (result.errors && result.errors.length) msg += '\n' + result.errors.join('\n');
    showTestResult(msg, 'error');
  }
}

function showTestResult(text, kind) {
  const el = document.getElementById('testResult');
  el.textContent = text;
  el.className = 'test-result ' + kind;
}

async function saveAccount() {
  const data = readAccountForm();
  const isEdit = !!state.editingAccountId;
  const err = validateAccount(data, isEdit);
  if (err) return showTestResult(err, 'error');
  showTestResult('Kaydediliyor…', 'info');
  try {
    if (isEdit) {
      const updates = Object.assign({}, data);
      if (!updates.in_password) delete updates.in_password;
      if (!updates.smtp_password) delete updates.smtp_password;
      await window.api.accounts.update(state.editingAccountId, updates);
      document.getElementById('modalAccount').classList.add('hidden');
      setStatus(`Hesap güncellendi: ${data.email}`);
      await loadAccounts();
    } else {
      const res = await window.api.accounts.add(data);
      document.getElementById('modalAccount').classList.add('hidden');
      setStatus(`Hesap eklendi: ${data.email} - ilk senkronizasyon başlatılıyor…`);
      await loadAccounts();
      syncAccount(res.id);
    }
  } catch (e) { showTestResult('Hata: ' + e.message, 'error'); }
}

// ============= Klasör Oluşturma =============
function bindNewFolder() {
  const accSel = document.getElementById('folder_account');
  accSel.onchange = () => {
    const acc = state.accounts.find(a => a.id === parseInt(accSel.value, 10));
    document.getElementById('folder_server_option').style.display =
      (acc && acc.protocol === 'imap') ? 'block' : 'none';
  };
  document.getElementById('btnCreateFolder').onclick = async () => {
    const accountId = parseInt(accSel.value, 10);
    const name = document.getElementById('folder_name').value.trim();
    const onServer = document.getElementById('folder_on_server').checked;
    if (!name) return alert('Klasör adı gerekli');
    const result = await window.api.folders.create(accountId, name, onServer);
    if (result.ok) {
      document.getElementById('modalNewFolder').classList.add('hidden');
      setStatus(`✓ Klasör oluşturuldu: ${name}` + (result.onServer ? ' (sunucuda)' : ' (yerel)'));
      await loadAccounts();
    } else alert('Hata: ' + (result.error || 'bilinmeyen'));
  };
}

function openNewFolder() {
  if (!state.accounts.length) return alert('Önce bir hesap eklemelisiniz');
  const accSel = document.getElementById('folder_account');
  accSel.innerHTML = state.accounts.map(a =>
    `<option value="${a.id}">${escapeHtml(a.display_name)} (${a.protocol.toUpperCase()})</option>`
  ).join('');
  if (state.selectedFolder) accSel.value = state.selectedFolder.accountId;
  document.getElementById('folder_name').value = '';
  document.getElementById('folder_on_server').checked = false;
  accSel.dispatchEvent(new Event('change'));
  document.getElementById('modalNewFolder').classList.remove('hidden');
}

// ============= Spam Kuralları =============
function bindSpam() {
  document.getElementById('btnAddSpamRule').onclick = async () => {
    const accountId = document.getElementById('spam_account_filter').value;
    const type = document.getElementById('spam_type').value;
    const pattern = document.getElementById('spam_pattern').value.trim();
    const action = document.getElementById('spam_action').value;
    if (!pattern) return alert('Desen alanı boş olamaz');
    await window.api.spam.add({
      account_id: accountId === 'all' ? null : parseInt(accountId, 10),
      type, pattern, action
    });
    document.getElementById('spam_pattern').value = '';
    await renderSpamRules();
  };
}

async function openSpamRules() {
  const accSel = document.getElementById('spam_account_filter');
  accSel.innerHTML = '<option value="all">Tüm hesaplar</option>' +
    state.accounts.map(a => `<option value="${a.id}">${escapeHtml(a.email)}</option>`).join('');
  await renderSpamRules();
  document.getElementById('modalSpam').classList.remove('hidden');
}

async function renderSpamRules() {
  const rules = await window.api.spam.list();
  const list = document.getElementById('spamRulesList');
  if (!rules.length) { list.innerHTML = '<div class="empty-state">Henüz kural yok</div>'; return; }
  const typeLabels = { sender: 'Gönderici', domain: 'Domain', subject: 'Konu', body: 'İçerik' };
  list.innerHTML = rules.map(r => {
    const accLabel = r.account_id ? (state.accounts.find(a => a.id === r.account_id)?.email || '?') : 'Tüm hesaplar';
    const actionClass = r.action === 'block' ? 'block' : 'allow';
    const actionLabel = r.action === 'block' ? '🚫 ENGELLE' : '✓ GÜVENLİ';
    return `
      <div class="spam-rule-item ${actionClass}">
        <div style="flex:1;">
          <span class="rule-action">${actionLabel}</span>
          <strong>${typeLabels[r.type] || r.type}</strong> içerir
          <code>${escapeHtml(r.pattern)}</code>
          <small style="color:var(--muted);display:block;">${escapeHtml(accLabel)}</small>
        </div>
        <button class="btn btn-ghost" data-rule-id="${r.id}">Sil</button>
      </div>`;
  }).join('');
  list.querySelectorAll('[data-rule-id]').forEach(btn => {
    btn.onclick = async () => {
      await window.api.spam.delete(parseInt(btn.dataset.ruleId, 10));
      await renderSpamRules();
    };
  });
}

// ============= Sağ Tık Menüsü =============
function showContextMenu(e, items) {
  const menu = document.getElementById('contextMenu');
  menu.innerHTML = items.map((item, i) => {
    if (item === '---') return '<div class="ctx-divider"></div>';
    return `<div class="ctx-item ${item.danger ? 'ctx-danger' : ''}" data-i="${i}">${item.label}</div>`;
  }).join('');
  menu.classList.remove('hidden');
  menu.style.left = e.clientX + 'px';
  menu.style.top = e.clientY + 'px';
  menu.querySelectorAll('.ctx-item').forEach(el => {
    el.onclick = () => {
      const item = items[parseInt(el.dataset.i, 10)];
      hideContextMenu();
      if (item && typeof item.action === 'function') item.action();
    };
  });
}

function hideContextMenu() { document.getElementById('contextMenu').classList.add('hidden'); }

async function showMessageContextMenu(e, message) {
  e.preventDefault(); e.stopPropagation();
  const allFolders = [];
  for (const acc of state.accounts) {
    const folders = await window.api.folders.list(acc.id);
    folders.forEach(f => allFolders.push(Object.assign({}, f, { accountName: acc.display_name })));
  }
  const moveItems = allFolders
    .filter(f => f.id !== message.folder_id && f.account_id === message.account_id)
    .map(f => ({
      label: `📁 ${f.name}` + (f.is_local ? ' (yerel)' : ''),
      action: async () => {
        const r = await window.api.messages.move(message.id, f.id);
        if (r.ok) {
          setStatus(`Mesaj taşındı: ${f.name}`);
          await loadAccounts(); await loadMessages();
        } else alert('Taşıma hatası: ' + r.error);
      }
    }));
  const items = [
    { label: message.is_read ? '↩ Okunmadı işaretle' : '✓ Okundu işaretle', action: async () => {
      await window.api.messages.markRead(message.id, !message.is_read);
      await loadAccounts(); await loadMessages();
    }},
    { label: message.is_important ? '☆ Önemli işaretini kaldır' : '⭐ Önemli işaretle', action: async () => {
      await window.api.messages.markImportant(message.id, !message.is_important);
      setStatus(message.is_important ? 'Önemli işareti kaldırıldı' : 'Önemli olarak işaretlendi');
      await loadMessages();
    }},
    { label: '🏷 Kategoriler...', action: async () => {
      const currentCats = await window.api.messages.getCategories(message.id);
      const currentIds = currentCats.map(c => c.id);
      // Menüyü yeniden, biraz gecikmeli aç
      setTimeout(() => showCategorizeMenu(message.id, currentIds, e), 50);
    }},
    { label: '📓 Mesajdan Not Oluştur', action: () => createNoteFromMessage(message) },
    { label: '🪟 Yeni Pencerede Aç', action: () => window.api.messages.openInWindow(message.id) },
    { label: '✅ Mesajdan Görev Oluştur', action: () => createTaskFromMessage(message) },
    { label: '📅 Mesajdan Etkinlik Oluştur', action: () => createEventFromMessage(message) },
    { label: '🏷 Otomatik Kategorize Et', action: () => autoCategorizeMessageManual(message) },
    { label: '📦 Arşivle', action: () => archiveMessageFromList(message) },
    '---',
    ...moveItems,
    '---',
    { label: '🛡 Bu spam', action: async () => {
      await window.api.messages.markSpam(message.id);
      setStatus('Spam olarak işaretlendi');
      state.selectedMessage = null;
      document.getElementById('messageView').innerHTML = '<div class="empty-state">Okumak için bir mesaj seçin</div>';
      await loadAccounts(); await loadMessages();
    }},
    { label: '✓ Spam değil', action: async () => {
      await window.api.messages.markNotSpam(message.id);
      setStatus('Spam değil olarak işaretlendi');
      state.selectedMessage = null;
      await loadAccounts(); await loadMessages();
    }},
    '---',
    { label: '🗑 Sil', danger: true, action: async () => {
      if (confirm('Mesajı silmek istediğinizden emin misiniz?')) {
        await window.api.messages.delete(message.id);
        state.selectedMessage = null;
        document.getElementById('messageView').innerHTML = '<div class="empty-state">Okumak için bir mesaj seçin</div>';
        await loadAccounts(); await loadMessages();
      }
    }}
  ];
  showContextMenu(e, items);
}

// ============= Hesap & Klasör Listesi =============
async function loadAccounts() {
  state.accounts = await window.api.accounts.list();
  await renderAccounts();
  await updateUnifiedSummary();
}

async function renderAccounts() {
  const container = document.getElementById('accountList');
  if (!state.accounts.length) {
    container.innerHTML = '<div class="empty-state">Henüz hesap eklenmemiş.<br><small>"+ Hesap" ile başlayın.</small></div>';
    return;
  }
  container.innerHTML = '';
  for (const acc of state.accounts) {
    const item = document.createElement('div');
    item.className = 'account-item';
    const folders = await window.api.folders.list(acc.id);
    item.innerHTML = `
      <div class="account-header" data-acc-id="${acc.id}">
        <span>📧 ${escapeHtml(acc.display_name)}</span>
        <span class="protocol-badge">${acc.protocol.toUpperCase()}</span>
      </div>
      <div class="folder-list">
        ${folders.map(f => `
          <div class="folder-item ${state.selectedFolder?.id === f.id ? 'active' : ''}"
               data-folder-id="${f.id}" data-account-id="${acc.id}"
               data-is-local="${f.is_local ? 1 : 0}"
               data-folder-name="${escapeHtml(f.name || '')}"
               data-special="${f.special_use || ''}">
            <span class="folder-icon">${folderIcon(f.special_use, f.is_local)}</span>
            <span class="folder-name">${escapeHtml(f.name)}</span>
            ${f.unread_count > 0 ? `<span class="unread-count">${f.unread_count}</span>` : ''}
          </div>`).join('')}
        ${folders.length === 0 ? '<div class="empty-state" style="padding:8px 24px;">Senkronize edilmemiş</div>' : ''}
      </div>`;
    container.appendChild(item);
  }
  container.querySelectorAll('.folder-item').forEach(el => {
    el.onclick = () => {
      const folderId = parseInt(el.dataset.folderId, 10);
      const accountId = parseInt(el.dataset.accountId, 10);
      selectFolder(folderId, accountId);
    };
    // v1.33: Folder drop zone
    el.ondragover = (e) => {
      if (!e.dataTransfer.types.includes('application/x-codega-msgs')) return;
      const folderAccountId = parseInt(el.dataset.accountId, 10);
      const folderId = parseInt(el.dataset.folderId, 10);
      // Mevcut klasöre drop'u engelle
      if (state.selectedFolder && state.selectedFolder.id === folderId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      el.classList.add('drop-target');
    };
    el.ondragleave = () => {
      el.classList.remove('drop-target');
    };
    el.ondrop = async (e) => {
      e.preventDefault();
      el.classList.remove('drop-target');
      try {
        const raw = e.dataTransfer.getData('application/x-codega-msgs');
        if (!raw) return;
        const data = JSON.parse(raw);
        const targetFolderId = parseInt(el.dataset.folderId, 10);
        const targetAccountId = parseInt(el.dataset.accountId, 10);
        const folderName = el.dataset.folderName || 'klasör';

        // Kaynak ile hedef hesap aynı mı?
        if (data.accountId && data.accountId !== targetAccountId) {
          alert('Mesajlar farklı bir hesabın klasörüne taşınamaz. Aynı hesap içinde sürükleyin.');
          return;
        }
        if (data.sourceFolderId === targetFolderId) return;

        if (data.ids.length > 1) {
          if (!confirm(`${data.ids.length} mesaj "${folderName}" klasörüne taşınsın mı?`)) return;
        }

        setStatus(`📤 ${data.ids.length} mesaj taşınıyor...`);
        let success = 0, errors = 0;
        for (const id of data.ids) {
          try {
            await window.api.messages.move(id, targetFolderId);
            success++;
          } catch (e) {
            console.warn('Move hatası:', e.message);
            errors++;
          }
        }
        clearMultiSelect();
        await loadAccounts();
        await loadMessages();
        if (errors === 0) {
          setStatus(`✓ ${success} mesaj "${folderName}" klasörüne taşındı`);
        } else {
          setStatus(`${success} taşındı, ${errors} hata`, 'error');
          alert(`${success} mesaj taşındı, ${errors} mesaj taşınamadı (sunucu hatası olabilir)`);
        }
      } catch (e) {
        alert('Hata: ' + e.message);
      }
    };
    el.oncontextmenu = (e) => {
      const isLocal = el.dataset.isLocal === '1';
      const special = el.dataset.special;
      const folderId = parseInt(el.dataset.folderId, 10);
      const folderName = el.dataset.folderName || 'Klasör';
      e.preventDefault(); e.stopPropagation();

      const items = [];

      // v1.7: Trash/Junk için ÖZELLİKLE "Boşalt" üstte vurgulu
      if (special === '\\Trash' || special === '\\Junk' || /trash|junk|spam|deleted|çöp/i.test(folderName)) {
        items.push({ label: '🗑️ Çöp Kovasını Boşalt', danger: true, action: async () => {
          if (!confirm(`"${folderName}" klasöründeki TÜM mesajlar kalıcı olarak silinecek. Bu işlem geri alınamaz.\n\nDevam etmek istiyor musunuz?`)) return;
          const r = await window.api.folders.empty(folderId);
          if (!r.ok) return alert(r.error || 'Hata');
          setStatus(`${r.count} mesaj silindi (${folderName})`);
          await loadAccounts();
          if (state.selectedFolder?.id === folderId) await loadMessages();
        }});
        items.push('---');
      }

      // Local olmayan ve özel klasörler için sadece "boşalt" göster
      if (!isLocal || special === '\\Inbox' || special === '\\Sent') {
        // Inbox/Sent için boşaltma yok ama yine de yukarıdaki Trash/Junk varsa zaten gösterildi
        if (!items.length) return; // hiçbir şey yoksa menü açma
      } else {
        // Yerel klasör seçenekleri
        items.push(
          { label: '✏ Yeniden Adlandır', action: async () => {
            const newName = prompt('Yeni klasör adı:', folderName);
            if (newName && newName.trim()) {
              await window.api.folders.rename(folderId, newName.trim());
              await loadAccounts();
            }
          }},
          { label: '🗑 Klasörü Boşalt', action: async () => {
            if (!confirm(`"${folderName}" klasöründeki tüm mesajlar silinecek. Devam?`)) return;
            const r = await window.api.folders.empty(folderId);
            if (!r.ok) return alert(r.error || 'Hata');
            setStatus(`${r.count} mesaj silindi`);
            await loadAccounts();
            if (state.selectedFolder?.id === folderId) await loadMessages();
          }},
          { label: '🗑 Klasörü Sil', danger: true, action: async () => {
            if (!confirm('Klasörü silmek istediğinizden emin misiniz?')) return;
            const r = await window.api.folders.delete(folderId);
            if (!r.ok) return alert(r.error);
            await loadAccounts();
          }}
        );
      }

      showContextMenu(e, items);
    };
  });
  container.querySelectorAll('.account-header').forEach(el => {
    el.oncontextmenu = (e) => {
      e.preventDefault(); e.stopPropagation();
      const accId = parseInt(el.dataset.accId, 10);
      const items = [
        { label: '↻ Senkronize Et', action: () => syncAccount(accId) },
        { label: '✏ Hesabı Düzenle', action: () => openAccountModal(accId) },
        { label: '+ Yeni Klasör', action: () => {
          state.selectedFolder = { accountId: accId };
          openNewFolder();
        }},
        '---',
        { label: '🗑 Hesabı Sil', danger: true, action: async () => {
          const acc = state.accounts.find(a => a.id === accId);
          if (!confirm(`"${acc.email}" hesabını silmek istediğinizden emin misiniz?`)) return;
          await window.api.accounts.delete(accId);
          await loadAccounts();
        }}
      ];
      showContextMenu(e, items);
    };
  });
}

function folderIcon(specialUse, isLocal) {
  if (specialUse === '\\Inbox') return '📥';
  if (specialUse === '\\Sent') return '📤';
  if (specialUse === '\\Drafts') return '📝';
  if (specialUse === '\\Trash') return '🗑';
  if (specialUse === '\\Junk') return '🛡';
  if (specialUse === '\\Archive') return '📦';
  if (isLocal) return '📁';
  return '📂';
}

// ============= Mesaj Listesi & Görüntüleme =============
async function selectFolder(folderId, accountId) {
  // v1.33: Klasör değişince çoklu seçimi temizle
  if (state.multiSelectIds && state.multiSelectIds.size) clearMultiSelect();
  state.selectedFolder = { id: folderId, accountId, account_id: accountId };
  state.selectedMessage = null;
  document.querySelectorAll('.folder-item').forEach(el => el.classList.remove('active'));
  document.getElementById('unifiedInbox')?.classList.remove('active');
  document.querySelector(`.folder-item[data-folder-id="${folderId}"]`)?.classList.add('active');
  const acc = state.accounts.find(a => a.id === accountId);
  const folders = await window.api.folders.list(accountId);
  const folder = folders.find(f => f.id === folderId);
  if (folder) {
    Object.assign(state.selectedFolder, folder);
    document.getElementById('folderTitle').textContent =
      `${acc?.display_name || ''} › ${folder.name} (${folder.total_count})`;
  }
  await loadMessages();
}

async function loadMessages() {
  if (!state.selectedFolder) return;
  state.messages = [];

  if (state.selectedFolder.unified) {
    // v1.5: Birleşik gelen kutusu
    const r = await window.api.messages.listUnified({
      search: state.searchQuery || undefined,
      limit: 300
    });
    state.messages = r.messages || [];
    document.getElementById('folderTitle').textContent =
      `📬 Birleşik Gelen Kutusu · ${r.accountCount || 0} hesap · ${r.totalCount || 0} mesaj` +
      (r.totalUnread > 0 ? ` · ${r.totalUnread} okunmamış` : '');
  } else {
    state.messages = await window.api.messages.list(state.selectedFolder.id, {
      search: state.searchQuery || undefined,
      limit: 300,
      threaded: state.conversationView && !state.searchQuery  // arama varsa threading kapat
    });
  }
  renderMessageList();
}

function renderMessageList() {
  const container = document.getElementById('messageList');
  if (!state.messages.length) {
    container.innerHTML = '<div class="empty-state">Bu klasörde mesaj yok</div>'; return;
  }
  const isUnified = state.selectedFolder?.unified;

  container.innerHTML = state.messages.map(m => {
    const date = m.date ? formatDate(m.date) : '';
    const fromDisplay = m.from_name || m.from_addr || '(bilinmeyen)';
    const spamBadge = m.is_spam ? '<span class="spam-badge">SPAM</span>' : '';
    const scoreBadge = (m.spam_score >= 30 && m.spam_score < 50)
      ? `<span class="warn-badge" title="Şüpheli puan: ${m.spam_score}">⚠</span>` : '';
    // v1.5: unified modda hesap rozeti
    const accBadge = isUnified && m._accountName
      ? `<span class="acc-badge" style="background:hsl(${m._accountHue},55%,22%);color:hsl(${m._accountHue},80%,75%);border:1px solid hsl(${m._accountHue},45%,40%);" title="${escapeHtml(m._accountEmail || '')}">${escapeHtml(m._accountName)}</span>`
      : '';
    // v1.7: önemli yıldız
    const importantStar = m.is_important
      ? `<span class="msg-important" title="Önemli (kaldır)" data-toggle-important="${m.id}">⭐</span>`
      : `<span class="msg-important-empty" title="Önemli işaretle" data-toggle-important="${m.id}">☆</span>`;
    // v1.8: kategoriler (renkli noktalar/chip)
    const cats = parseCategoriesField(m.categories);
    const catDots = cats.length
      ? '<span class="msg-cats">' + cats.map(c =>
          `<span class="msg-cat-chip" style="background:${c.color}25;color:${c.color};border:1px solid ${c.color};" title="${escapeHtml(c.name)}">${escapeHtml(c.name)}</span>`
        ).join('') + '</span>'
      : '';
    // v1.9: konuşma sayacı (threaded modda)
    const threadCount = (state.conversationView && m.thread_count > 1)
      ? `<span class="thread-count" title="${m.thread_count} mesaj zincirde${m.thread_unread ? ' (' + m.thread_unread + ' okunmamış)' : ''}">💬 ${m.thread_count}</span>`
      : '';
    return `
      <div class="message-item ${m.is_read ? '' : 'unread'} ${m.is_spam ? 'is-spam' : ''} ${m.is_important ? 'is-important' : ''} ${state.selectedMessage?.id === m.id ? 'active' : ''}"
           data-id="${m.id}">
        <div class="msg-line1">
          <span class="msg-from">${importantStar}${accBadge}${escapeHtml(fromDisplay)}${threadCount}</span>
          <span class="msg-date">${date}</span>
        </div>
        <div class="msg-subject">${spamBadge}${scoreBadge}${escapeHtml(m.subject || '(Konu yok)')}</div>
        ${catDots}
        <div class="msg-preview">
          <span class="msg-flags">${m.has_attachments ? '<span class="flag-attach">📎</span>' : ''}</span>
          ${escapeHtml((m.preview || '').replace(/\s+/g, ' ').slice(0, 100))}
        </div>
      </div>`;
  }).join('');
  container.querySelectorAll('.message-item').forEach(el => {
    const id = parseInt(el.dataset.id, 10);
    el.onclick = (e) => {
      // Yıldız tıklamaysa mesajı açma
      if (e.target.dataset.toggleImportant) return;
      // v1.33: Ctrl/Shift ile çoklu seçim
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        toggleMultiSelect(id);
        return;
      }
      if (e.shiftKey && state.lastSelectedId) {
        e.preventDefault();
        rangeMultiSelect(state.lastSelectedId, id);
        return;
      }
      // Normal tıklama: çoklu seçimi temizle
      clearMultiSelect();
      state.lastSelectedId = id;
      openMessage(id);
    };
    // v1.32: Çift tıklama → ayrı pencerede aç (Outlook tarzı)
    el.ondblclick = (e) => {
      if (e.target.dataset.toggleImportant) return;
      e.preventDefault();
      window.api.messages.openInWindow(id);
    };
    el.oncontextmenu = async (e) => {
      const fullMsg = await window.api.messages.get(id);
      if (fullMsg) showMessageContextMenu(e, fullMsg);
    };
    // v1.33: Sürükle-bırak
    el.draggable = true;
    el.ondragstart = (e) => {
      // Eğer bu mesaj çoklu seçimde değilse, çoklu seçimi temizle ve sadece bunu sürükle
      if (!state.multiSelectIds.has(id)) {
        clearMultiSelect();
        state.multiSelectIds.add(id);
        el.classList.add('multi-selected');
      }
      const ids = Array.from(state.multiSelectIds);
      const accountId = parseInt(el.dataset.accountId, 10) ||
                        (state.selectedFolder ? state.selectedFolder.account_id : null);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('application/x-codega-msgs',
        JSON.stringify({ ids, accountId, sourceFolderId: state.selectedFolder?.id }));
      // Drag preview
      const dragGhost = document.createElement('div');
      dragGhost.className = 'drag-ghost';
      dragGhost.textContent = ids.length === 1 ? '📧 1 mesaj taşınıyor' : `📧 ${ids.length} mesaj taşınıyor`;
      document.body.appendChild(dragGhost);
      e.dataTransfer.setDragImage(dragGhost, 10, 10);
      setTimeout(() => dragGhost.remove(), 100);
      document.body.classList.add('dragging-message');
    };
    el.ondragend = () => {
      document.body.classList.remove('dragging-message');
      document.querySelectorAll('.drop-target').forEach(d => d.classList.remove('drop-target'));
    };
  });
  // Yıldız toggle
  container.querySelectorAll('[data-toggle-important]').forEach(el => {
    el.onclick = async (e) => {
      e.stopPropagation();
      const id = parseInt(el.dataset.toggleImportant, 10);
      const msg = state.messages.find(m => m.id === id);
      await toggleMessageImportant(id, msg?.is_important);
    };
  });
}

async function openMessage(id) {
  const msg = await window.api.messages.get(id);
  if (!msg) return;
  state.selectedMessage = msg;
  if (!msg.is_read) {
    await window.api.messages.markRead(id, true);
    await loadAccounts(); await loadMessages();
  }

  // v1.9: Konuşma görünümü açıksa ve thread'de birden fazla mesaj varsa, hepsini göster
  if (state.conversationView && msg.thread_id) {
    try {
      const threadMessages = await window.api.messages.getThread(msg.thread_id, msg.account_id);
      if (threadMessages && threadMessages.length > 1) {
        // Tüm thread mesajlarını okundu işaretle
        for (const tm of threadMessages) {
          if (!tm.is_read) await window.api.messages.markRead(tm.id, true);
        }
        renderThreadView(threadMessages, msg);
        document.querySelectorAll('.message-item').forEach(el => el.classList.remove('active'));
        document.querySelector(`.message-item[data-id="${id}"]`)?.classList.add('active');
        await loadAccounts();
        return;
      }
    } catch (e) {
      console.warn('Thread yüklenemedi:', e.message);
    }
  }

  renderMessageView(msg);
  document.querySelectorAll('.message-item').forEach(el => el.classList.remove('active'));
  document.querySelector(`.message-item[data-id="${id}"]`)?.classList.add('active');

  // v1.31: Sade modda overlay olarak göster
  ensureMsgOverlayUI();

  // v1.25: PGP detect - şifreli/imzalı mesajsa badge göster
  setTimeout(() => checkAndShowPgpStatus(msg), 100);
}

// v1.9: Thread (konuşma) görünümü - tüm mesajları timeline'da listele
function renderThreadView(messages, currentMsg) {
  const view = document.getElementById('messageView');
  const subject = currentMsg.subject || '(Konu yok)';

  let html = `
    <div class="msg-view-header">
      <div class="msg-view-subject">${escapeHtml(subject)}
        <span class="thread-header-badge">💬 ${messages.length} mesaj</span>
      </div>
    </div>
    <div class="thread-timeline">
  `;

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const isLast = i === messages.length - 1;
    const fromDisplay = m.from_name
      ? `${escapeHtml(m.from_name)} <small>&lt;${escapeHtml(m.from_addr || '')}&gt;</small>`
      : escapeHtml(m.from_addr || '');
    const date = m.date ? new Date(m.date).toLocaleString('tr-TR') : '';
    let bodyHtml = '';
    if (m.body_html) {
      bodyHtml = `<iframe sandbox="allow-same-origin" srcdoc="${escapeHtmlAttr(m.body_html)}" style="width:100%;border:0;height:300px;"></iframe>`;
    } else if (m.body_text) {
      bodyHtml = `<pre>${escapeHtml(m.body_text)}</pre>`;
    }

    // Kategori chip'leri
    const cats = m.categories ? parseCategoriesField(m.categories) : [];
    const catChips = cats.length
      ? '<div class="msg-view-cats">' + cats.map(c =>
          `<span class="msg-cat-chip msg-cat-chip-lg" style="background:${c.color}25;color:${c.color};border:1px solid ${c.color};">🏷 ${escapeHtml(c.name)}</span>`
        ).join('') + '</div>'
      : '';

    html += `
      <div class="thread-msg ${isLast ? 'thread-msg-current' : ''}" data-msg-id="${m.id}">
        <div class="thread-msg-header">
          <div class="thread-msg-from">${fromDisplay}</div>
          <div class="thread-msg-date">${date}</div>
        </div>
        ${catChips}
        <div class="thread-msg-body">${bodyHtml}</div>
        ${m.attachments && m.attachments.length ? `<div class="msg-view-attachments">📎 ${m.attachments.length} ek</div>` : ''}
      </div>
    `;
  }
  html += `
    </div>
    <div class="msg-view-actions">
      <button class="btn" id="btnReply">↩ En son mesaja yanıtla</button>
      <button class="btn" id="btnReplyAll">↩↩ Tümüne yanıtla</button>
      <button class="btn" id="btnForward">→ İlet</button>
    </div>
  `;
  view.innerHTML = html;

  document.getElementById('btnReply').onclick = () => openCompose({ replyTo: currentMsg });
  document.getElementById('btnReplyAll').onclick = () => openCompose({ replyTo: currentMsg, replyAll: true });
  document.getElementById('btnForward').onclick = () => openCompose({ forward: currentMsg });

  // Otomatik en son mesaja scroll
  setTimeout(() => {
    const lastMsg = view.querySelector('.thread-msg-current');
    if (lastMsg) lastMsg.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

function renderMessageView(msg) {
  const view = document.getElementById('messageView');
  const fromName = msg.from_name || '';
  const fromAddr = msg.from_addr || '';
  const fromDisplay = fromName ? `${escapeHtml(fromName)} &lt;${escapeHtml(fromAddr)}&gt;` : escapeHtml(fromAddr);
  const toList = msg.to_addrs ? JSON.parse(msg.to_addrs) : [];
  const toDisplay = toList.map(t => escapeHtml(t.address || '')).join(', ');
  const ccList = msg.cc_addrs ? JSON.parse(msg.cc_addrs) : [];
  const ccDisplay = ccList.length ? ccList.map(t => escapeHtml(t.address || '')).join(', ') : '';
  const date = msg.date ? new Date(msg.date).toLocaleString('tr-TR') : '';

  let bodyHtml = '';
  if (msg.body_html) {
    bodyHtml = `<iframe sandbox="allow-same-origin" srcdoc="${escapeHtmlAttr(msg.body_html)}" style="height:60vh;"></iframe>`;
  } else if (msg.body_text) {
    bodyHtml = `<pre>${escapeHtml(msg.body_text)}</pre>`;
  } else {
    bodyHtml = '<em style="color:var(--muted)">İçerik yok</em>';
  }

  let attachmentsHtml = '';
  if (msg.attachments && msg.attachments.length) {
    attachmentsHtml = `
      <div class="msg-view-attachments">
        <div style="margin-bottom:6px;font-size:11px;color:var(--muted);font-weight:600;">EKLER (${msg.attachments.length})</div>
        <div id="attachmentChipsContainer">
          ${msg.attachments.map(a => `
            <span class="attachment-chip att-pending" data-att-id="${a.id}" data-filename="${escapeHtml(a.filename || 'ek')}">
              ⏳ ${escapeHtml(a.filename || 'ek')}
              <span style="color:var(--muted)">${formatSize(a.size || 0)}</span>
            </span>`).join('')}
        </div>
      </div>`;
  }

  let spamBanner = '';
  if (msg.is_spam) {
    spamBanner = `<div class="spam-banner">🛡 Bu mesaj <strong>spam</strong> olarak işaretlendi (puan: ${msg.spam_score}).</div>`;
  } else if (msg.spam_score >= 30) {
    spamBanner = `<div class="spam-banner warn">⚠ Bu mesaj şüpheli görünüyor (puan: ${msg.spam_score}).</div>`;
  }

  // v1.12: Güvenlik durumu banner'ı (DKIM/SPF/DMARC + phishing)
  let securityBanner = '';
  let securityFlags = null;
  try {
    if (msg.security_flags) securityFlags = JSON.parse(msg.security_flags);
  } catch (_) {}

  const authBadges = [];
  const renderBadge = (label, val) => {
    if (!val) return `<span class="auth-badge auth-none">${label}: yok</span>`;
    if (val === 'pass') return `<span class="auth-badge auth-pass">${label}: ✓</span>`;
    if (val === 'fail') return `<span class="auth-badge auth-fail">${label}: ✗</span>`;
    return `<span class="auth-badge auth-other">${label}: ${val}</span>`;
  };
  if (msg.auth_dkim || msg.auth_spf || msg.auth_dmarc) {
    authBadges.push(renderBadge('DKIM', msg.auth_dkim));
    authBadges.push(renderBadge('SPF', msg.auth_spf));
    authBadges.push(renderBadge('DMARC', msg.auth_dmarc));
  }

  const secLevel = securityFlags?.level || 'safe';
  const phishingReasons = securityFlags?.reasons || [];

  if (secLevel === 'high' || secLevel === 'medium' || (authBadges.length > 0 && (msg.auth_dkim === 'fail' || msg.auth_spf === 'fail' || msg.auth_dmarc === 'fail'))) {
    const cls = secLevel === 'high' ? 'sec-banner-high' : 'sec-banner-medium';
    const icon = secLevel === 'high' ? '🚨' : '⚠️';
    const title = secLevel === 'high' ? 'YÜKSEK RİSKLİ MESAJ' : 'Şüpheli mesaj';
    securityBanner = `
      <div class="sec-banner ${cls}">
        <div class="sec-banner-head">${icon} ${title}</div>
        ${phishingReasons.length ? `<ul class="sec-reasons">${phishingReasons.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul>` : ''}
        ${authBadges.length ? `<div class="auth-badges">${authBadges.join('')}</div>` : ''}
        <div class="sec-banner-tip">⚠ Bağlantılara tıklamayın, ek dosyaları açmayın, bilgilerinizi vermeyin.</div>
      </div>`;
  } else if (authBadges.length > 0) {
    // Auth bilgisi var ama sorunsuz - kompakt durum gösterimi
    securityBanner = `<div class="sec-banner sec-banner-info"><div class="auth-badges">${authBadges.join('')}</div></div>`;
  }

  // v1.8: Kategoriler chip
  const cats = msg.categories || [];
  const categoriesHtml = cats.length
    ? `<div class="msg-view-cats">
        ${cats.map(c => `<span class="msg-cat-chip msg-cat-chip-lg" style="background:${c.color}25;color:${c.color};border:1px solid ${c.color};">🏷 ${escapeHtml(c.name)}</span>`).join('')}
       </div>`
    : '';

  view.innerHTML = `
    <div class="msg-view-header">
      <div class="msg-view-subject">${escapeHtml(msg.subject || '(Konu yok)')}</div>
      ${categoriesHtml}
      <div class="msg-view-meta">
        <strong>Gönderen:</strong><span>${fromDisplay}</span>
        <strong>Alıcı:</strong><span>${toDisplay}</span>
        ${ccDisplay ? `<strong>CC:</strong><span>${ccDisplay}</span>` : ''}
        <strong>Tarih:</strong><span>${date}</span>
      </div>
    </div>
    ${spamBanner}
    ${securityBanner}
    <div class="msg-view-actions">
      <button class="btn" id="btnReply">↩ Yanıtla</button>
      <button class="btn" id="btnForward">↪ İlet</button>
      ${msg.is_spam
        ? '<button class="btn" id="btnNotSpam">✓ Spam Değil</button>'
        : '<button class="btn" id="btnMarkSpam">🛡 Bu Spam</button>'}
      <button class="btn btn-danger" id="btnDelete">🗑 Sil</button>
    </div>
    <div class="msg-view-body">${bodyHtml}</div>
    ${attachmentsHtml}
  `;

  // v1.12: Attachment chip'leri risk-renklendir + tıklama onayı
  if (msg.attachments && msg.attachments.length) {
    setupAttachmentChips(msg);
  }

  // v1.15: Mail body içindeki tüm linkleri analyze et + click intercept
  setupBodyLinks();

  document.getElementById('btnReply').onclick = () => openCompose({ replyTo: msg });
  document.getElementById('btnForward').onclick = () => openCompose({ forward: msg });
  document.getElementById('btnDelete').onclick = deleteCurrentMessage;
  if (msg.is_spam) {
    document.getElementById('btnNotSpam').onclick = async () => {
      await window.api.messages.markNotSpam(msg.id);
      setStatus('Mesaj Inbox\'a taşındı');
      state.selectedMessage = null;
      document.getElementById('messageView').innerHTML = '<div class="empty-state">Okumak için bir mesaj seçin</div>';
      await loadAccounts(); await loadMessages();
    };
  } else {
    document.getElementById('btnMarkSpam').onclick = async () => {
      await window.api.messages.markSpam(msg.id);
      setStatus('Spam olarak işaretlendi');
      state.selectedMessage = null;
      document.getElementById('messageView').innerHTML = '<div class="empty-state">Okumak için bir mesaj seçin</div>';
      await loadAccounts(); await loadMessages();
    };
  }
}

async function deleteCurrentMessage() {
  if (!state.selectedMessage) return;
  const id = state.selectedMessage.id;
  setStatus('Mesaj siliniyor…');
  try {
    await window.api.messages.delete(id);
    state.selectedMessage = null;
    document.getElementById('messageView').innerHTML = '<div class="empty-state">Okumak için bir mesaj seçin</div>';
    await loadAccounts(); await loadMessages();
    setStatus('Mesaj silindi');
  } catch (e) { setStatus('Silme hatası: ' + e.message, 'error'); }
}

// ============= v1.17: Senkronizasyon İlerleme Penceresi (Outlook tarzı) =============
const syncState = {
  accounts: new Map(),  // accountId → { displayName, email, status, progress, currentFolder, newMessages, error }
  errors: [],
  totalAccounts: 0,
  doneAccounts: 0,
  active: false,
  bound: false
};

async function syncAll() {
  if (!state.accounts.length) return setStatus('Önce bir hesap ekleyin');
  if (syncState.active) {
    // Zaten devam ediyor - sadece pencereyi göster
    document.getElementById('modalSyncProgress').classList.remove('hidden');
    return;
  }

  // UI hazırla
  syncState.active = true;
  syncState.accounts.clear();
  syncState.errors = [];
  syncState.doneAccounts = 0;
  syncState.totalAccounts = 0;
  bindSyncProgressUI();
  resetSyncProgressUI();
  document.getElementById('modalSyncProgress').classList.remove('hidden');

  setStatus('Senkronizasyon başladı...');

  try {
    const results = await window.api.sync.all();
    const total = results.reduce((acc, r) => acc + (r.newMessages || 0), 0);
    const totalSpam = results.reduce((acc, r) => acc + (r.spamMessages || 0), 0);
    const errors = results.filter(r => !r.ok);
    let msg = `Senkronizasyon tamamlandı - ${total} yeni mesaj`;
    if (totalSpam > 0) msg += `, ${totalSpam} spam`;
    if (errors.length) msg += `, ${errors.length} hata`;
    setStatus(msg);
    await loadAccounts();
    if (state.selectedFolder) await loadMessages();
  } finally {
    syncState.active = false;
  }
}

function bindSyncProgressUI() {
  if (syncState.bound) return;
  syncState.bound = true;

  // Tab'lar
  document.querySelectorAll('.sync-tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.sync-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      document.getElementById('syncTasksPane').classList.toggle('hidden', target !== 'tasks');
      document.getElementById('syncErrorsPane').classList.toggle('hidden', target !== 'errors');
    };
  });

  // Kapat butonu
  document.getElementById('btnCloseSyncModal').onclick = () => {
    document.getElementById('modalSyncProgress').classList.add('hidden');
  };

  // sync:overall event'leri
  window.api.on('sync:overall', (data) => {
    if (data.stage === 'start') {
      syncState.totalAccounts = data.total;
      syncState.doneAccounts = 0;
      for (const a of (data.accounts || [])) {
        syncState.accounts.set(a.id, {
          id: a.id,
          displayName: a.displayName,
          email: a.email,
          status: 'pending',
          progress: 0,
          newMessages: 0
        });
      }
      renderSyncTasks();
      updateSyncSummary();
    } else if (data.stage === 'account-start') {
      const acc = syncState.accounts.get(data.accountId);
      if (acc) {
        acc.status = 'syncing';
        acc.progress = 5;
        acc.currentFolder = 'Bağlanıyor...';
      }
      renderSyncTasks();
      document.getElementById('syncCurrentTask').textContent =
        `${data.displayName || data.email} - Senkronize ediliyor...`;
    } else if (data.stage === 'account-done') {
      const acc = syncState.accounts.get(data.accountId);
      if (acc) {
        if (data.ok) {
          acc.status = 'done';
          acc.progress = 100;
          acc.newMessages = data.newMessages || 0;
          acc.spamMessages = data.spamMessages || 0;
          acc.currentFolder = null;
        } else {
          acc.status = 'error';
          acc.progress = 100;
          acc.error = data.error || 'Bilinmeyen hata';
          syncState.errors.push({
            accountId: data.accountId,
            displayName: acc.displayName,
            email: acc.email,
            error: acc.error,
            time: new Date()
          });
          renderSyncErrors();
        }
      }
      syncState.doneAccounts++;
      renderSyncTasks();
      updateSyncSummary();
    } else if (data.stage === 'all-done') {
      document.getElementById('syncCurrentTask').textContent =
        `✓ Tamamlandı: ${data.totalNew} yeni mesaj` +
        (data.totalSpam > 0 ? `, ${data.totalSpam} spam` : '') +
        (data.errors > 0 ? `, ${data.errors} hata` : '');
      // Otomatik kapat
      const autoClose = document.getElementById('syncAutoClose');
      if (autoClose && autoClose.checked && data.errors === 0) {
        setTimeout(() => {
          if (!syncState.active) document.getElementById('modalSyncProgress').classList.add('hidden');
        }, 1500);
      }
    }
  });

  // sync:progress (klasör/fetch detayları)
  window.api.on('sync:progress', (data) => {
    const acc = syncState.accounts.get(data.accountId);
    if (!acc) return;

    if (data.stage === 'folders') {
      acc.totalFolders = data.count;
      acc.doneFolders = 0;
      acc.progress = 10;
      acc.currentFolder = `${data.count} klasör bulundu`;
    } else if (data.stage === 'fetching') {
      acc.currentFolder = `${data.folder} - ${data.count} mail çekiliyor`;
      // İlerleme hesapla
      if (acc.totalFolders) {
        acc.doneFolders = (acc.doneFolders || 0) + 1;
        acc.progress = Math.min(95, 10 + (acc.doneFolders / acc.totalFolders) * 85);
      }
    } else if (data.stage === 'folder-error') {
      acc.lastWarning = `Klasör hatası: ${data.folder} - ${data.error}`;
    }
    renderSyncTasks();
    document.getElementById('syncCurrentTask').textContent =
      `${acc.displayName} - ${acc.currentFolder || ''}`;
  });
}

function resetSyncProgressUI() {
  document.getElementById('syncTasksList').innerHTML = '';
  document.getElementById('syncErrorsList').innerHTML =
    '<div class="empty-state" style="padding:20px;font-size:12px;">Hata yok</div>';
  document.getElementById('syncCurrentTask').textContent = 'Başlatılıyor...';
  document.getElementById('syncTaskCount').textContent = '0';
  document.getElementById('syncErrorCount').textContent = '0';
  document.getElementById('syncOverallBar').style.width = '0%';
  document.getElementById('syncSummaryText').innerHTML = '<strong>0 / 0</strong> hesap senkronize ediliyor';
  // Görevler tab'ı aktif
  document.querySelectorAll('.sync-tab').forEach(t => t.classList.remove('active'));
  document.querySelector('.sync-tab[data-tab="tasks"]')?.classList.add('active');
  document.getElementById('syncTasksPane').classList.remove('hidden');
  document.getElementById('syncErrorsPane').classList.add('hidden');
}

function renderSyncTasks() {
  const list = document.getElementById('syncTasksList');
  if (!list) return;
  const accounts = Array.from(syncState.accounts.values());
  list.innerHTML = accounts.map(a => {
    let statusIcon = '⏳', statusText = 'Bekliyor', statusClass = 'pending';
    if (a.status === 'syncing') { statusIcon = '↻'; statusText = 'Senkronize ediliyor'; statusClass = 'syncing'; }
    else if (a.status === 'done') { statusIcon = '✓'; statusText = `Tamamlandı (${a.newMessages || 0} yeni)`; statusClass = 'done'; }
    else if (a.status === 'error') { statusIcon = '✗'; statusText = 'Hata'; statusClass = 'error'; }

    return `
      <div class="sync-task-row sync-task-${statusClass}">
        <div class="sync-col-name">
          <span class="sync-task-icon">${statusIcon}</span>
          <span class="sync-task-name" title="${escapeHtml(a.email)}">${escapeHtml(a.displayName)}</span>
        </div>
        <div class="sync-col-progress">
          <div class="sync-mini-bar"><div class="sync-mini-fill" style="width:${a.progress || 0}%;"></div></div>
        </div>
        <div class="sync-col-status">${escapeHtml(statusText)}</div>
      </div>
    `;
  }).join('');

  document.getElementById('syncTaskCount').textContent = String(accounts.length);
}

function renderSyncErrors() {
  const list = document.getElementById('syncErrorsList');
  if (!list) return;
  if (!syncState.errors.length) {
    list.innerHTML = '<div class="empty-state" style="padding:20px;font-size:12px;">Hata yok</div>';
    document.getElementById('syncErrorCount').textContent = '0';
    return;
  }
  list.innerHTML = syncState.errors.map(e => `
    <div class="sync-error-item">
      <div class="sync-error-account">⚠ ${escapeHtml(e.displayName)} <span style="color:var(--muted);font-weight:400;font-size:11px;">${escapeHtml(e.email)}</span></div>
      <div class="sync-error-msg">${escapeHtml(e.error)}</div>
      <div class="sync-error-time">${e.time.toLocaleTimeString('tr-TR')}</div>
    </div>
  `).join('');
  document.getElementById('syncErrorCount').textContent = String(syncState.errors.length);
}

function updateSyncSummary() {
  const summary = document.getElementById('syncSummaryText');
  const bar = document.getElementById('syncOverallBar');
  const total = syncState.totalAccounts;
  const done = syncState.doneAccounts;
  if (summary) {
    summary.innerHTML = `<strong>${done} / ${total}</strong> hesap senkronize edildi`;
  }
  if (bar) {
    const pct = total > 0 ? (done / total) * 100 : 0;
    bar.style.width = pct + '%';
  }
}

async function syncAccount(accountId) {
  setStatus('Senkronize ediliyor…');
  const result = await window.api.sync.account(accountId);
  if (result.ok) {
    let msg = `${result.newMessages} yeni mesaj`;
    if (result.spamMessages > 0) msg += `, ${result.spamMessages} spam`;
    setStatus(msg);
  } else setStatus(`Senkronizasyon hatası: ${result.error}`, 'error');
  await loadAccounts();
  if (state.selectedFolder) await loadMessages();
}

// ============= Yeni Mesaj =============
function bindCompose() {
  document.getElementById('btnSendMail').onclick = sendMail;

  // v1.6: zengin metin editörü
  if (!state.composeEditor && typeof RichEditor !== 'undefined') {
    state.composeEditor = new RichEditor('composeEditor', {
      placeholder: 'Mesajınızı yazın...'
    });
  }

  // v1.10: şablon dropdown
  const tplSel = document.getElementById('composeTemplateSelect');
  if (tplSel) {
    tplSel.onchange = async () => {
      const id = parseInt(tplSel.value, 10);
      if (!id) return;
      const tpl = await window.api.templates.get(id);
      if (!tpl) return;
      // Subject ve body doldur (üzerine yazar)
      if (tpl.subject) document.getElementById('compose_subject').value = tpl.subject;
      if (state.composeEditor && tpl.body_html) {
        state.composeEditor.setHTML(tpl.body_html);
      }
      await window.api.templates.incrementUse(id);
      tplSel.value = '';  // reset dropdown
      setStatus(`Şablon yüklendi: ${tpl.name}`);
    };
  }

  // v1.10: "Bu mesajı şablon olarak kaydet"
  const saveTplBtn = document.getElementById('btnSaveAsTemplate');
  if (saveTplBtn) {
    saveTplBtn.onclick = async () => {
      const subject = document.getElementById('compose_subject').value.trim();
      const html = state.composeEditor ? state.composeEditor.getHTML() : '';
      const text = state.composeEditor ? state.composeEditor.getText() : '';
      if (!subject && !text) return alert('Boş şablon kaydedilemez. Önce konu/içerik yazın.');
      const name = prompt('Şablon adı:', subject.slice(0, 50) || 'Yeni Şablon');
      if (!name || !name.trim()) return;
      const category = prompt('Kategori (opsiyonel):', '') || null;
      try {
        await window.api.templates.add({ name: name.trim(), category, subject, body_html: html, body_text: text });
        setStatus(`Şablon kaydedildi: ${name}`);
        await refreshComposeTemplateDropdown();
      } catch (e) { alert('Hata: ' + e.message); }
    };
  }

  // v1.10: Zamanla butonu
  const schedBtn = document.getElementById('btnScheduleMail');
  if (schedBtn) {
    schedBtn.onclick = openSchedulePicker;
  }

  // v1.11: Tam ekran toggle
  const fsBtn = document.getElementById('btnComposeFullscreen');
  if (fsBtn) {
    fsBtn.onclick = () => {
      const content = document.getElementById('composeModalContent');
      content.classList.toggle('compose-fullscreen');
      fsBtn.textContent = content.classList.contains('compose-fullscreen') ? '⛶' : '⛶';
      fsBtn.title = content.classList.contains('compose-fullscreen') ? 'Pencere boyutuna küçült' : 'Tam ekran';
    };
  }

  // v1.4: Drag-drop ek dosya
  const dropZone = document.getElementById('attachmentDropZone');
  const fileInput = document.getElementById('attachmentInput');
  const browseLink = document.getElementById('attachmentBrowse');

  if (dropZone && fileInput) {
    // Drag eventleri
    ['dragenter', 'dragover'].forEach(ev => {
      dropZone.addEventListener(ev, (e) => {
        e.preventDefault(); e.stopPropagation();
        dropZone.classList.add('drag-over');
      });
    });
    ['dragleave', 'drop'].forEach(ev => {
      dropZone.addEventListener(ev, (e) => {
        e.preventDefault(); e.stopPropagation();
        dropZone.classList.remove('drag-over');
      });
    });
    dropZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      await addAttachments(files);
    });

    // Click → file picker
    dropZone.addEventListener('click', (e) => {
      // Sadece "tıklayıp seçin" linkine tıklarsa veya boş alana
      if (e.target.id === 'attachmentBrowse' || e.target === dropZone ||
          e.target.classList.contains('drop-zone-text') ||
          e.target.classList.contains('drop-zone-icon') ||
          e.target.classList.contains('drop-zone-hint')) {
        fileInput.click();
      }
    });
    fileInput.addEventListener('change', async (e) => {
      await addAttachments(Array.from(e.target.files));
      e.target.value = '';
    });

    // Pencere genelinde sürükleme - kullanıcı dropzone dışına bırakırsa sayfa açılmasın
    document.addEventListener('dragover', (e) => {
      const composeOpen = !document.getElementById('modalCompose').classList.contains('hidden');
      if (composeOpen) e.preventDefault();
    });
    document.addEventListener('drop', (e) => {
      const composeOpen = !document.getElementById('modalCompose').classList.contains('hidden');
      if (composeOpen) e.preventDefault();
    });

    // Paste - panodaki dosyayı/görüntüyü ek olarak al
    // v1.6: artık compose_body div editör. Editor element'inde paste'i yakala
    const composeEditorEl = document.querySelector('#composeEditor .rte-content');
    if (composeEditorEl) {
      composeEditorEl.addEventListener('paste', async (e) => {
        const items = Array.from(e.clipboardData?.items || []);
        const fileItems = items.filter(i => i.kind === 'file');
        if (fileItems.length > 0) {
          e.preventDefault();
          const files = fileItems.map(i => i.getAsFile()).filter(Boolean);
          await addAttachments(files);
        }
        // dosya yoksa default davranış (RichEditor sanitizer çalışacak)
      });
    }
  }
}

async function addAttachments(files) {
  if (!files || !files.length) return;
  for (const f of files) {
    if (f.size > 30 * 1024 * 1024) {
      alert(`"${f.name}" 30MB üstünde, eklenmedi. SMTP sağlayıcılarının çoğu zaten 25MB üstüne izin vermez.`);
      continue;
    }
    try {
      const buf = await f.arrayBuffer();
      // Pasted dosyalarda name boş olabilir
      const name = f.name || `pasted-${Date.now()}.${(f.type || '').split('/')[1] || 'bin'}`;
      state.composeAttachments.push({
        name,
        size: f.size,
        type: f.type || 'application/octet-stream',
        bytes: Array.from(new Uint8Array(buf))   // IPC için serileştirilebilir
      });
    } catch (e) {
      alert(`"${f.name}" okunamadı: ${e.message}`);
    }
  }
  renderAttachmentList();
}

function renderAttachmentList() {
  const list = document.getElementById('attachmentList');
  const counter = document.getElementById('composeAttCount');
  if (!list) return;
  if (!state.composeAttachments.length) {
    list.innerHTML = '';
    if (counter) counter.textContent = '';
    return;
  }
  const total = state.composeAttachments.reduce((s, a) => s + a.size, 0);
  const totalMB = (total / 1024 / 1024).toFixed(1);
  const overLimit = total > 25 * 1024 * 1024;

  list.innerHTML = state.composeAttachments.map((a, i) => {
    const icon = getFileIcon(a.name, a.type);
    return `
      <div class="att-chip-compose">
        <span class="att-chip-icon">${icon}</span>
        <span class="att-chip-name" title="${escapeHtml(a.name)}">${escapeHtml(a.name)}</span>
        <span class="att-chip-size">${formatSize(a.size)}</span>
        <button class="att-chip-remove" data-i="${i}" title="Kaldır">×</button>
      </div>`;
  }).join('') + `
    <div class="att-total ${overLimit ? 'warn' : ''}">
      ${state.composeAttachments.length} dosya · Toplam: ${totalMB} MB
      ${overLimit ? ' ⚠ 25 MB üstü - sağlayıcı reddedebilir' : ''}
    </div>`;

  if (counter) counter.textContent = `📎 ${state.composeAttachments.length} ek (${totalMB} MB)`;

  list.querySelectorAll('.att-chip-remove').forEach(btn => {
    btn.onclick = () => {
      state.composeAttachments.splice(parseInt(btn.dataset.i, 10), 1);
      renderAttachmentList();
    };
  });
}

function getFileIcon(name, type) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (type?.startsWith('image/')) return '🖼';
  if (type?.startsWith('video/')) return '🎬';
  if (type?.startsWith('audio/')) return '🎵';
  if (['pdf'].includes(ext)) return '📕';
  if (['doc','docx'].includes(ext)) return '📘';
  if (['xls','xlsx','csv'].includes(ext)) return '📗';
  if (['ppt','pptx'].includes(ext)) return '📙';
  if (['zip','rar','7z','tar','gz'].includes(ext)) return '🗜';
  if (['txt','md','log'].includes(ext)) return '📄';
  if (['js','ts','php','py','html','css','json','sql'].includes(ext)) return '💻';
  return '📎';
}

function openCompose(opts = {}) {
  const fromSel = document.getElementById('compose_from');
  fromSel.innerHTML = state.accounts.map(a =>
    `<option value="${a.id}">${escapeHtml(a.display_name)} &lt;${escapeHtml(a.email)}&gt;</option>`
  ).join('');
  if (!state.accounts.length) return alert('Önce bir hesap eklemelisiniz');

  // v1.4: ek listesini her açılışta sıfırla
  state.composeAttachments = [];
  renderAttachmentList();

  // v1.16: Autocomplete bağla
  attachAutocompleteToCompose();

  // v1.25: PGP toggle listener bağla + ilk durum
  bindComposeEncryptListener();
  refreshComposeEncryptToggle().catch(() => {});

  // v1.6: editor varsa init et (modal hidden iken init zor olabilir, burada da güvence)
  if (!state.composeEditor && typeof RichEditor !== 'undefined') {
    state.composeEditor = new RichEditor('composeEditor', {
      placeholder: 'Mesajınızı yazın...'
    });
  }

  let to = '', subject = '', initialHTML = '<p><br></p>';
  if (opts.to) to = opts.to;
  if (opts.replyTo) {
    to = opts.replyTo.from_addr || '';
    subject = (opts.replyTo.subject || '').startsWith('Re:') ? opts.replyTo.subject : 'Re: ' + (opts.replyTo.subject || '');
    const quotedBody = opts.replyTo.body_html
      ? opts.replyTo.body_html
      : '<pre>' + escapeHtml(opts.replyTo.body_text || '') + '</pre>';
    initialHTML = `<p><br></p><blockquote style="border-left:3px solid #ccc;padding-left:10px;color:#888;">
      <div><strong>${escapeHtml(opts.replyTo.from_name || opts.replyTo.from_addr || '')}</strong>
      &lt;${escapeHtml(opts.replyTo.from_addr || '')}&gt; (${formatDate(opts.replyTo.date)}) yazdı:</div>
      ${quotedBody}
    </blockquote>`;
    fromSel.value = opts.replyTo.account_id;
  } else if (opts.forward) {
    subject = (opts.forward.subject || '').startsWith('Fwd:') ? opts.forward.subject : 'Fwd: ' + (opts.forward.subject || '');
    const quotedBody = opts.forward.body_html
      ? opts.forward.body_html
      : '<pre>' + escapeHtml(opts.forward.body_text || '') + '</pre>';
    initialHTML = `<p><br></p><div style="border-top:1px solid #ccc;margin-top:10px;padding-top:10px;">
      <strong>İletilen mesaj</strong><br>
      Gönderen: ${escapeHtml(opts.forward.from_addr || '')}<br>
      Konu: ${escapeHtml(opts.forward.subject || '')}
      <hr>
      ${quotedBody}
    </div>`;
    fromSel.value = opts.forward.account_id;
  }
  document.getElementById('compose_to').value = to;
  document.getElementById('compose_cc').value = '';
  document.getElementById('compose_subject').value = subject;
  if (state.composeEditor) state.composeEditor.setHTML(initialHTML);
  // v1.10: şablon dropdown'unu doldur
  refreshComposeTemplateDropdown().catch(() => {});
  document.getElementById('modalCompose').classList.remove('hidden');
  // Cursor en başa
  setTimeout(() => state.composeEditor?.focus(), 100);
}

async function sendMail() {
  const accountId = parseInt(document.getElementById('compose_from').value, 10);
  const to = document.getElementById('compose_to').value.trim();
  const cc = document.getElementById('compose_cc').value.trim();
  const bcc = (document.getElementById('compose_bcc')?.value || '').trim();
  const subject = document.getElementById('compose_subject').value.trim();
  // v1.6: zengin editör'den HTML + text al
  const html = state.composeEditor ? state.composeEditor.getHTML() : '';
  const text = state.composeEditor ? state.composeEditor.getText() : '';
  if (!to && !cc && !bcc) return alert('En az bir alıcı (Kime/Cc/Bcc) gerekli');
  if (!subject && !confirm('Konu boş - yine de göndermek istiyor musunuz?')) return;

  // v1.4: ek dosya boyut uyarısı
  const totalAttSize = state.composeAttachments.reduce((s, a) => s + a.size, 0);
  if (totalAttSize > 25 * 1024 * 1024) {
    if (!confirm(`Toplam ek boyutu ${(totalAttSize/1024/1024).toFixed(1)} MB - SMTP sağlayıcısı reddedebilir. Yine de göndermek istiyor musunuz?`)) return;
  }

  // v1.6: imzayı HTML olarak ekle
  const acc = state.accounts.find(a => a.id === accountId);
  let finalText = text;
  let finalHtml = html;
  if (acc?.signature) {
    // Eski textonly imzaları da destekle (içinde HTML tag yoksa düz metin sayalım)
    const sigIsHtml = /<[a-z][\s\S]*>/i.test(acc.signature);
    if (sigIsHtml) {
      finalHtml = html + '<br><br>' + acc.signature;
      // Plain text için stripped versiyon
      const tmp = document.createElement('div');
      tmp.innerHTML = acc.signature;
      finalText = text + '\n\n' + (tmp.innerText || tmp.textContent || '');
    } else {
      finalHtml = html + '<br><br>' + acc.signature.replace(/\n/g, '<br>');
      finalText = text + '\n\n' + acc.signature;
    }
  }

  // Attachments → nodemailer formatına çevir
  const attachments = state.composeAttachments.map(a => ({
    filename: a.name,
    content: a.bytes,
    contentType: a.type
  }));

  setStatus('Gönderiliyor…' + (attachments.length ? ` (${attachments.length} ek)` : ''));
  try {
    // v1.25: PGP şifreleme - alıcı public key'leri varsa ve toggle açıksa
    const pgpEncrypt = document.getElementById('compose_pgp_encrypt');
    if (pgpEncrypt && pgpEncrypt.checked) {
      const recipientEmails = parseEmailAddresses(to + (cc ? ',' + cc : ''));
      if (recipientEmails.length === 0) throw new Error('Alıcı adresleri okunamadı');

      // Ek dosyalar uyarısı (PGP/MIME standart değil bu MVP'de)
      if (attachments.length) {
        if (!confirm('PGP şifreleme aktif - ekler ŞİFRELENMEDEN gönderilecek. Devam edilsin mi?')) {
          setStatus('Gönderim iptal edildi');
          return;
        }
      }

      const enc = await window.api.pgp.encrypt({
        plainText: finalText,
        recipientEmails,
        // İmzalama opsiyonel - şu MVP'de imzasız
      });
      if (!enc.ok) throw new Error('PGP şifreleme: ' + enc.error);

      // body'yi PGP MESSAGE BLOCK ile değiştir
      finalText = enc.armored;
      // HTML body'yi de plain wrapper ile gönder (gmail vs uyumlu)
      finalHtml = `<pre style="font-family:ui-monospace,monospace;font-size:11px;white-space:pre-wrap;">${escapeHtml(enc.armored)}</pre>`;
    }

    await window.api.mail.send(accountId, {
      to: to || undefined, cc: cc || undefined, bcc: bcc || undefined, subject,
      text: finalText, html: finalHtml,
      attachments: attachments.length ? attachments : undefined
    });
    document.getElementById('modalCompose').classList.add('hidden');
    setStatus('Mesaj gönderildi ✓' + (attachments.length ? ` (${attachments.length} ek)` : '') + (pgpEncrypt && pgpEncrypt.checked ? ' [🔐 PGP]' : ''));
    state.composeAttachments = [];
    renderAttachmentList();
    if (state.composeEditor) state.composeEditor.clear();
    if (pgpEncrypt) pgpEncrypt.checked = false;
    await loadAccounts();
    if (state.selectedFolder) await loadMessages();
  } catch (e) {
    setStatus('Gönderme hatası: ' + e.message, 'error');
    alert('Gönderme hatası:\n' + e.message);
  }
}

// ============= Arama =============
function bindSearch() {
  let timer;
  document.getElementById('searchBox').oninput = (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.searchQuery = e.target.value.trim();
      if (state.selectedFolder) loadMessages();
    }, 300);
  };
}

// ============= Yedekleme =============
async function doBackup() {
  setStatus('Yedek hazırlanıyor…');
  const result = await window.api.backup.export();
  if (result.canceled) return setStatus('Yedekleme iptal edildi');
  if (result.ok) setStatus('✓ Yedek kaydedildi: ' + result.path);
  else setStatus('Yedek hatası: ' + result.error, 'error');
}

async function doRestore() {
  const result = await window.api.backup.import();
  if (result.canceled) return;
  if (result.ok) {
    alert('Yedek yüklendi. Uygulamayı yeniden başlatın.');
    location.reload();
  } else alert('Geri yükleme hatası: ' + result.error);
}

async function updateStorageInfo() {
  const path = await window.api.app.dataPath();
  const el = document.getElementById('storageInfo');
  el.textContent = '📁 ' + path;
  el.title = path;
}

// ============= Yardımcılar =============
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function escapeHtmlAttr(str) { return escapeHtml(str).replace(/\n/g, '&#10;'); }
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  if (d.getFullYear() === now.getFullYear())
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
  return d.toLocaleDateString('tr-TR');
}
function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}
function setStatus(text, kind) {
  const el = document.getElementById('statusText');
  el.textContent = text;
  el.style.color = kind === 'error' ? 'var(--danger)' : '';
}

// ============= v1.7: HAKKINDA =============
async function openAbout() {
  const cfg = await window.api.config.get();
  // v1.10.1: Sağlam version yükleme - 3 kaynak fallback
  let appVer = '?';
  try {
    appVer = await window.api.updater.appVersion();
  } catch (e) { console.warn('appVersion IPC hatası:', e); }
  if (!appVer || appVer === '?') {
    // Fallback: config'den
    appVer = cfg.version || 'bilinmiyor';
  }
  const aboutVerEl = document.getElementById('aboutVersion');
  if (aboutVerEl) aboutVerEl.textContent = appVer;

  const aboutDataPathEl = document.getElementById('aboutDataPath');
  if (aboutDataPathEl) aboutDataPathEl.textContent = cfg.dataPath || '?';

  // İstatistikler
  try {
    const accounts = await window.api.accounts.list();
    let totalFolders = 0, totalMessages = 0;
    for (const acc of accounts) {
      const folders = await window.api.folders.list(acc.id);
      totalFolders += folders.length;
      for (const f of folders) totalMessages += (f.total_count || 0);
    }
    const rules = await window.api.rules.list();
    document.getElementById('statAccounts').textContent = accounts.length;
    document.getElementById('statFolders').textContent = totalFolders;
    document.getElementById('statMessages').textContent = totalMessages.toLocaleString('tr-TR');
    document.getElementById('statRules').textContent = rules.length;
  } catch (e) {}

  // Link click handler
  document.querySelectorAll('#modalAbout [data-link]').forEach(el => {
    el.onclick = (e) => {
      e.preventDefault();
      window.api.app.openExternal(el.dataset.link);
    };
  });

  document.getElementById('modalAbout').classList.remove('hidden');
}

// ============= v1.7: KURALLAR =============
let currentRule = null;  // editlenmekte olan kural

async function openRules() {
  await populateRulesAccountFilter();
  await renderRulesList();
  hideRuleEditor();
  bindRulesUI();
  document.getElementById('modalRules').classList.remove('hidden');
}

async function populateRulesAccountFilter() {
  const sel1 = document.getElementById('rulesAccountFilter');
  const sel2 = document.getElementById('rule_account');
  const opts = '<option value="all">Tüm hesaplar</option>' +
    state.accounts.map(a => `<option value="${a.id}">${escapeHtml(a.email)}</option>`).join('');
  sel1.innerHTML = opts;
  sel2.innerHTML = '<option value="">Tüm hesaplar</option>' +
    state.accounts.map(a => `<option value="${a.id}">${escapeHtml(a.email)}</option>`).join('');
}

let rulesUIBound = false;
function bindRulesUI() {
  if (rulesUIBound) return;
  rulesUIBound = true;
  document.getElementById('btnNewRule').onclick = () => showRuleEditor(null);
  document.getElementById('btnAddCondition').onclick = () => addConditionRow();
  document.getElementById('btnAddAction').onclick = () => addActionRow();
  document.getElementById('btnCancelRule').onclick = () => hideRuleEditor();
  document.getElementById('btnSaveRule').onclick = saveRule;
  document.getElementById('rulesAccountFilter').onchange = renderRulesList;
}

async function renderRulesList() {
  const sel = document.getElementById('rulesAccountFilter');
  const accountId = sel.value === 'all' ? null : parseInt(sel.value, 10);
  const rules = accountId ? await window.api.rules.list(accountId) : await window.api.rules.list();
  const list = document.getElementById('rulesList');
  if (!rules.length) {
    list.innerHTML = '<div class="empty-state">Henüz kural yok. "+ Yeni Kural" ile başlayın.</div>';
    return;
  }
  list.innerHTML = rules.map(r => {
    const conditions = JSON.parse(r.conditions || '[]');
    const actions = JSON.parse(r.actions || '[]');
    const accLabel = r.account_id
      ? (state.accounts.find(a => a.id === r.account_id)?.email || '?')
      : 'Tüm hesaplar';
    return `
      <div class="rule-item ${r.enabled ? '' : 'disabled'}">
        <div class="rule-toggle">
          <input type="checkbox" ${r.enabled ? 'checked' : ''} data-toggle="${r.id}">
        </div>
        <div class="rule-info">
          <div class="rule-name">${escapeHtml(r.name)}</div>
          <div class="rule-meta">
            ${escapeHtml(accLabel)} · Öncelik: ${r.priority} · ${conditions.length} koşul → ${actions.length} aksiyon
            ${r.run_count > 0 ? ` · ${r.run_count} kez çalıştı` : ''}
          </div>
        </div>
        <button class="btn btn-ghost" data-edit="${r.id}">Düzenle</button>
        <button class="btn btn-ghost" data-delete="${r.id}" style="color:var(--danger);">Sil</button>
      </div>
    `;
  }).join('');

  list.querySelectorAll('[data-toggle]').forEach(el => {
    el.onchange = async () => {
      await window.api.rules.update(parseInt(el.dataset.toggle, 10), { enabled: el.checked });
      await renderRulesList();
    };
  });
  list.querySelectorAll('[data-edit]').forEach(el => {
    el.onclick = async () => {
      const rule = await window.api.rules.get(parseInt(el.dataset.edit, 10));
      showRuleEditor(rule);
    };
  });
  list.querySelectorAll('[data-delete]').forEach(el => {
    el.onclick = async () => {
      if (!confirm('Bu kuralı silmek istediğinizden emin misiniz?')) return;
      await window.api.rules.delete(parseInt(el.dataset.delete, 10));
      await renderRulesList();
    };
  });
}

function showRuleEditor(rule) {
  currentRule = rule;
  document.getElementById('ruleEditor').classList.remove('hidden');
  document.getElementById('rule_name').value = rule?.name || '';
  document.getElementById('rule_account').value = rule?.account_id || '';
  document.getElementById('rule_match_type').value = rule?.match_type || 'all';
  document.getElementById('rule_priority').value = rule?.priority || 100;
  document.getElementById('rule_enabled').checked = rule ? rule.enabled !== 0 : true;

  document.getElementById('conditionsList').innerHTML = '';
  document.getElementById('actionsList').innerHTML = '';

  const conditions = rule ? JSON.parse(rule.conditions || '[]') : [{ field: 'from', operator: 'contains', value: '' }];
  const actions = rule ? JSON.parse(rule.actions || '[]') : [{ type: 'markAsRead' }];

  conditions.forEach(c => addConditionRow(c));
  actions.forEach(a => addActionRow(a));
}

function hideRuleEditor() {
  document.getElementById('ruleEditor').classList.add('hidden');
  currentRule = null;
}

function addConditionRow(cond = { field: 'from', operator: 'contains', value: '' }) {
  const wrap = document.getElementById('conditionsList');
  const row = document.createElement('div');
  row.className = 'condition-row';
  row.innerHTML = `
    <select class="cond-field">
      <option value="from"${cond.field==='from'?' selected':''}>Gönderen</option>
      <option value="fromDomain"${cond.field==='fromDomain'?' selected':''}>Gönderen Domain</option>
      <option value="to"${cond.field==='to'?' selected':''}>Alıcı</option>
      <option value="subject"${cond.field==='subject'?' selected':''}>Konu</option>
      <option value="body"${cond.field==='body'?' selected':''}>İçerik</option>
      <option value="hasAttachment"${cond.field==='hasAttachment'?' selected':''}>Ek Dosya</option>
    </select>
    <select class="cond-op">
      <option value="contains"${cond.operator==='contains'?' selected':''}>içerir</option>
      <option value="notContains"${cond.operator==='notContains'?' selected':''}>içermez</option>
      <option value="equals"${cond.operator==='equals'?' selected':''}>eşittir</option>
      <option value="startsWith"${cond.operator==='startsWith'?' selected':''}>ile başlar</option>
      <option value="endsWith"${cond.operator==='endsWith'?' selected':''}>ile biter</option>
      <option value="matches"${cond.operator==='matches'?' selected':''}>regex</option>
      <option value="is"${cond.operator==='is'?' selected':''}>vardır/yoktur</option>
    </select>
    <input type="text" class="cond-value" value="${escapeHtml(cond.value || '')}" placeholder="değer">
    <button class="btn btn-ghost cond-remove" title="Kaldır">×</button>
  `;
  row.querySelector('.cond-remove').onclick = () => row.remove();
  wrap.appendChild(row);
}

function addActionRow(act = { type: 'markAsRead' }) {
  const wrap = document.getElementById('actionsList');
  const row = document.createElement('div');
  row.className = 'action-row';

  // Tüm klasörleri topla (folder seçimi için)
  const folderOptions = [];
  // Bu sync olarak bilemeyiz, async olarak doldur
  row.innerHTML = `
    <select class="act-type">
      <option value="moveToFolder"${act.type==='moveToFolder'?' selected':''}>Klasöre taşı</option>
      <option value="addCategory"${act.type==='addCategory'?' selected':''}>Kategori ekle</option>
      <option value="markAsRead"${act.type==='markAsRead'?' selected':''}>Okundu işaretle</option>
      <option value="markAsImportant"${act.type==='markAsImportant'?' selected':''}>Önemli işaretle</option>
      <option value="markAsSpam"${act.type==='markAsSpam'?' selected':''}>Spam işaretle</option>
      <option value="delete"${act.type==='delete'?' selected':''}>Sil</option>
    </select>
    <select class="act-value" style="display:none;"></select>
    <button class="btn btn-ghost act-remove" title="Kaldır">×</button>
  `;
  const typeSel = row.querySelector('.act-type');
  const valueSel = row.querySelector('.act-value');

  const updateValue = async () => {
    if (typeSel.value === 'moveToFolder') {
      let html = '';
      for (const acc of state.accounts) {
        const folders = await window.api.folders.list(acc.id);
        for (const f of folders) {
          const sel = String(f.id) === String(act.value) ? ' selected' : '';
          html += `<option value="${f.id}"${sel}>${escapeHtml(acc.display_name)} › ${escapeHtml(f.name)}</option>`;
        }
      }
      valueSel.innerHTML = html;
      valueSel.style.display = '';
    } else if (typeSel.value === 'addCategory') {
      const cats = await window.api.categories.list();
      valueSel.innerHTML = cats.map(c => {
        const sel = String(c.id) === String(act.value) ? ' selected' : '';
        return `<option value="${c.id}"${sel}>${escapeHtml(c.name)}</option>`;
      }).join('');
      valueSel.style.display = '';
    } else {
      valueSel.style.display = 'none';
    }
  };
  typeSel.onchange = updateValue;
  updateValue();
  row.querySelector('.act-remove').onclick = () => row.remove();
  wrap.appendChild(row);
}

async function saveRule() {
  const name = document.getElementById('rule_name').value.trim();
  if (!name) return alert('Kural adı gerekli');

  const accountId = document.getElementById('rule_account').value;
  const matchType = document.getElementById('rule_match_type').value;
  const priority = parseInt(document.getElementById('rule_priority').value, 10) || 100;
  const enabled = document.getElementById('rule_enabled').checked;

  // Koşulları topla
  const conditions = [];
  document.querySelectorAll('#conditionsList .condition-row').forEach(row => {
    const field = row.querySelector('.cond-field').value;
    const operator = row.querySelector('.cond-op').value;
    const value = row.querySelector('.cond-value').value.trim();
    if (value || field === 'hasAttachment') conditions.push({ field, operator, value });
  });
  if (!conditions.length) return alert('En az bir koşul gerekli');

  // Aksiyonları topla
  const actions = [];
  document.querySelectorAll('#actionsList .action-row').forEach(row => {
    const type = row.querySelector('.act-type').value;
    const valueSel = row.querySelector('.act-value');
    const value = valueSel.style.display !== 'none' ? valueSel.value : null;
    actions.push({ type, value });
  });
  if (!actions.length) return alert('En az bir aksiyon gerekli');

  const ruleData = {
    name, account_id: accountId || null, match_type: matchType,
    priority, enabled, conditions, actions
  };

  try {
    if (currentRule) {
      await window.api.rules.update(currentRule.id, ruleData);
    } else {
      await window.api.rules.add(ruleData);
    }
    hideRuleEditor();
    await renderRulesList();
    setStatus('Kural kaydedildi');
  } catch (e) {
    alert('Hata: ' + e.message);
  }
}

// ============= v1.7: Önemli işaretleme - mesaj listesi yıldız =============
// Mesaj satırına yıldız butonu eklemek için renderMessageList'i wrap etmiyoruz,
// sağ tık menüsüne Önemli ekleyeceğiz ve renderMessageList'te yıldız ikonu göstereceğiz
async function toggleMessageImportant(messageId, currentValue) {
  await window.api.messages.markImportant(messageId, !currentValue);
  if (state.selectedFolder) await loadMessages();
}

// ============= v1.8: KATEGORİLER =============
const CAT_SEP_OUTER = String.fromCharCode(30); // record separator
const CAT_SEP_INNER = String.fromCharCode(31); // unit separator

function parseCategoriesField(str) {
  // listMessages SQL'inden gelen "id\x1Fname\x1Fcolor\x1E..." formatını parse eder
  if (!str) return [];
  return String(str).split(CAT_SEP_OUTER).filter(Boolean).map(part => {
    const [id, name, color] = part.split(CAT_SEP_INNER);
    return { id: parseInt(id, 10), name: name || '', color: color || '#888' };
  });
}

let categoriesUIBound = false;
async function openCategories() {
  await renderCategoriesList();
  if (!categoriesUIBound) {
    categoriesUIBound = true;
    document.getElementById('btnAddCategory').onclick = async () => {
      const name = document.getElementById('cat_name').value.trim();
      const color = document.getElementById('cat_color').value;
      if (!name) return alert('Kategori adı gerekli');
      try {
        await window.api.categories.add({ name, color });
        document.getElementById('cat_name').value = '';
        document.getElementById('cat_color').value = '#3498db';
        await renderCategoriesList();
      } catch (e) {
        alert('Hata: ' + e.message + '\n(Aynı isimde kategori olabilir)');
      }
    };
  }
  document.getElementById('modalCategories').classList.remove('hidden');
}

async function renderCategoriesList() {
  const list = document.getElementById('categoriesList');
  const cats = await window.api.categories.list();
  if (!cats.length) {
    list.innerHTML = '<div class="empty-state">Henüz kategori yok.</div>';
    return;
  }
  list.innerHTML = cats.map(c => `
    <div class="cat-item" data-id="${c.id}">
      <input type="color" class="cat-color-edit" value="${c.color}" data-id="${c.id}" title="Rengi değiştir">
      <input type="text" class="cat-name-edit" value="${escapeHtml(c.name)}" data-id="${c.id}" title="Adı değiştir">
      <span class="cat-chip" style="background:${c.color}20;color:${c.color};border:1px solid ${c.color};">
        ${escapeHtml(c.name)}
      </span>
      <button class="btn btn-ghost cat-delete" data-id="${c.id}" title="Kategoriyi sil" style="color:var(--danger);">×</button>
    </div>
  `).join('');

  list.querySelectorAll('.cat-color-edit').forEach(el => {
    el.onchange = async () => {
      await window.api.categories.update(parseInt(el.dataset.id, 10), { color: el.value });
      await renderCategoriesList();
    };
  });
  list.querySelectorAll('.cat-name-edit').forEach(el => {
    el.onchange = async () => {
      const newName = el.value.trim();
      if (!newName) return;
      try {
        await window.api.categories.update(parseInt(el.dataset.id, 10), { name: newName });
        await renderCategoriesList();
      } catch (e) {
        alert('Hata: ' + e.message);
        await renderCategoriesList();
      }
    };
  });
  list.querySelectorAll('.cat-delete').forEach(el => {
    el.onclick = async () => {
      const id = parseInt(el.dataset.id, 10);
      const cat = (await window.api.categories.list()).find(c => c.id === id);
      if (!confirm(`"${cat?.name}" kategorisini sil? Bu kategori atanmış mesajlardan da kaldırılacak.`)) return;
      await window.api.categories.delete(id);
      await renderCategoriesList();
      if (state.selectedFolder) await loadMessages();
    };
  });
}

// Mesaja kategori ata/kaldır - sağ tık menü submenüsü için
async function showCategorizeMenu(messageId, currentCategoryIds, anchorEvent) {
  hideContextMenu();
  const cats = await window.api.categories.list();
  if (!cats.length) {
    alert('Henüz kategori yok. Önce toolbar > Kategoriler menüsünden ekleyin.');
    return;
  }
  const items = cats.map(c => ({
    label: `${currentCategoryIds.includes(c.id) ? '✓' : '  '} ● ${c.name}`,
    color: c.color,
    action: async () => {
      if (currentCategoryIds.includes(c.id)) {
        await window.api.messages.removeCategory(messageId, c.id);
        setStatus(`Kategori kaldırıldı: ${c.name}`);
      } else {
        await window.api.messages.addCategory(messageId, c.id);
        setStatus(`Kategori eklendi: ${c.name}`);
      }
      await loadMessages();
    }
  }));
  // Ayrıca tümünü temizle
  if (currentCategoryIds.length > 0) {
    items.push('---');
    items.push({ label: '✗ Tüm Kategorileri Kaldır', action: async () => {
      await window.api.messages.setCategories(messageId, []);
      setStatus('Tüm kategoriler kaldırıldı');
      await loadMessages();
    }});
  }
  items.push('---');
  items.push({ label: '+ Yeni Kategori Yönet...', action: () => openCategories() });
  showContextMenu(anchorEvent, items);
}

// ============= v1.9: Konuşma görünümü =============
async function toggleConversationView() {
  state.conversationView = !state.conversationView;
  const cfg = await window.api.config.get();
  cfg.conversationView = state.conversationView;
  await window.api.config.set(cfg);

  const btn = document.getElementById('btnConversationView');
  btn.classList.toggle('btn-primary', state.conversationView);
  btn.classList.toggle('btn-ghost', !state.conversationView);

  // İlk açılışta backfill yap (mevcut mesajların thread_id'leri yoksa)
  if (state.conversationView) {
    setStatus('Konuşmalar gruplandırılıyor...');
    try {
      const r = await window.api.messages.backfillThreads();
      if (r.ok && r.updated > 0) {
        setStatus(`Konuşma görünümü açık - ${r.updated} mesaj gruplandırıldı`);
      } else {
        setStatus('Konuşma görünümü açık');
      }
    } catch (e) {
      setStatus('Konuşma görünümü açık (backfill atlandı)');
    }
  } else {
    setStatus('Konuşma görünümü kapalı - liste görünümü');
  }

  if (state.selectedFolder) await loadMessages();
}

// İlk yüklemede config'den oku
async function loadConversationViewState() {
  try {
    const cfg = await window.api.config.get();
    state.conversationView = !!cfg.conversationView;
    const btn = document.getElementById('btnConversationView');
    if (btn) {
      btn.classList.toggle('btn-primary', state.conversationView);
      btn.classList.toggle('btn-ghost', !state.conversationView);
    }
  } catch (_) {}
}

// ============= v1.10: ŞABLONLAR =============
async function refreshComposeTemplateDropdown() {
  const sel = document.getElementById('composeTemplateSelect');
  if (!sel) return;
  const tpls = await window.api.templates.list();
  let html = '<option value="">📝 Şablon Yükle...</option>';
  // Kategoriye göre grupla
  const byCategory = {};
  for (const t of tpls) {
    const cat = t.category || 'Genel';
    (byCategory[cat] = byCategory[cat] || []).push(t);
  }
  for (const cat of Object.keys(byCategory).sort()) {
    html += `<optgroup label="${escapeHtml(cat)}">`;
    for (const t of byCategory[cat]) {
      html += `<option value="${t.id}">${escapeHtml(t.name)}${t.use_count > 0 ? ` (${t.use_count})` : ''}</option>`;
    }
    html += '</optgroup>';
  }
  sel.innerHTML = html;
}

let templatesUIBound = false;
async function openTemplatesManager() {
  await renderTemplatesList();
  hideTemplateEditor();
  if (!templatesUIBound) {
    templatesUIBound = true;
    document.getElementById('btnNewTemplate').onclick = () => showTemplateEditor(null);
    document.getElementById('btnCancelTemplate').onclick = () => hideTemplateEditor();
    document.getElementById('btnSaveTemplate').onclick = saveTemplate;
  }
  document.getElementById('modalTemplates').classList.remove('hidden');
}

async function renderTemplatesList() {
  const list = document.getElementById('templatesList');
  const tpls = await window.api.templates.list();
  if (!tpls.length) {
    list.innerHTML = '<div class="empty-state">Henüz şablon yok. "+ Yeni Şablon" ile başlayın.</div>';
    return;
  }
  list.innerHTML = tpls.map(t => `
    <div class="rule-item">
      <div class="rule-info">
        <div class="rule-name">${escapeHtml(t.name)}</div>
        <div class="rule-meta">
          ${t.category ? '🏷 ' + escapeHtml(t.category) + ' · ' : ''}
          ${t.subject ? 'Konu: ' + escapeHtml(t.subject.slice(0,50)) : 'Konusuz'} · 
          ${t.use_count} kez kullanıldı
        </div>
      </div>
      <button class="btn btn-ghost" data-edit-tpl="${t.id}">Düzenle</button>
      <button class="btn btn-ghost" data-delete-tpl="${t.id}" style="color:var(--danger);">Sil</button>
    </div>
  `).join('');

  list.querySelectorAll('[data-edit-tpl]').forEach(el => {
    el.onclick = async () => {
      const tpl = await window.api.templates.get(parseInt(el.dataset.editTpl, 10));
      showTemplateEditor(tpl);
    };
  });
  list.querySelectorAll('[data-delete-tpl]').forEach(el => {
    el.onclick = async () => {
      if (!confirm('Bu şablonu silmek istediğinizden emin misiniz?')) return;
      await window.api.templates.delete(parseInt(el.dataset.deleteTpl, 10));
      await renderTemplatesList();
    };
  });
}

let currentTemplate = null;
function showTemplateEditor(tpl) {
  currentTemplate = tpl;
  document.getElementById('templateEditor').classList.remove('hidden');
  document.getElementById('tpl_name').value = tpl?.name || '';
  document.getElementById('tpl_category').value = tpl?.category || '';
  document.getElementById('tpl_subject').value = tpl?.subject || '';
  // Editor init/set
  if (!state.templateEditor && typeof RichEditor !== 'undefined') {
    state.templateEditor = new RichEditor('tpl_editor', {
      placeholder: 'Şablon içeriği (Bold, italic, link, vs. desteklenir)',
      compact: true
    });
  }
  if (state.templateEditor) {
    state.templateEditor.setHTML(tpl?.body_html || '');
  }
}

function hideTemplateEditor() {
  document.getElementById('templateEditor').classList.add('hidden');
  currentTemplate = null;
}

async function saveTemplate() {
  const name = document.getElementById('tpl_name').value.trim();
  if (!name) return alert('Şablon adı gerekli');
  const data = {
    name,
    category: document.getElementById('tpl_category').value.trim() || null,
    subject: document.getElementById('tpl_subject').value,
    body_html: state.templateEditor ? state.templateEditor.getHTML() : '',
    body_text: state.templateEditor ? state.templateEditor.getText() : ''
  };
  try {
    if (currentTemplate) {
      await window.api.templates.update(currentTemplate.id, data);
    } else {
      await window.api.templates.add(data);
    }
    hideTemplateEditor();
    await renderTemplatesList();
    setStatus('Şablon kaydedildi');
  } catch (e) {
    alert('Hata: ' + e.message);
  }
}

// ============= v1.10: ZAMANLANMIŞ GÖNDERİM =============
let schedulePickerBound = false;
function openSchedulePicker() {
  // Compose modal'ında en az alıcı + konu var mı kontrol
  const to = document.getElementById('compose_to').value.trim();
  if (!to) return alert('Önce alıcı (Kime) alanını doldurun');

  // Default: 1 saat sonra
  const now = new Date();
  now.setMinutes(now.getMinutes() + 60);
  document.getElementById('schedule_datetime').value = formatLocalDatetime(now);

  if (!schedulePickerBound) {
    schedulePickerBound = true;
    document.querySelectorAll('.sched-preset').forEach(btn => {
      btn.onclick = () => {
        const dt = new Date();
        if (btn.dataset.mins) {
          dt.setMinutes(dt.getMinutes() + parseInt(btn.dataset.mins, 10));
        } else if (btn.dataset.tomorrow) {
          dt.setDate(dt.getDate() + 1);
          dt.setHours(parseInt(btn.dataset.tomorrow, 10), 0, 0, 0);
        } else if (btn.dataset.monday) {
          // Önümüzdeki Pazartesi (eğer bugün Pazartesi'yse 1 hafta sonra)
          const day = dt.getDay(); // 0=Sun, 1=Mon
          let daysUntil = (8 - day) % 7;
          if (daysUntil === 0) daysUntil = 7;
          dt.setDate(dt.getDate() + daysUntil);
          dt.setHours(parseInt(btn.dataset.monday, 10), 0, 0, 0);
        }
        document.getElementById('schedule_datetime').value = formatLocalDatetime(dt);
      };
    });
    document.getElementById('btnConfirmSchedule').onclick = confirmSchedule;
  }

  document.getElementById('modalSchedulePicker').classList.remove('hidden');
}

function formatLocalDatetime(d) {
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function confirmSchedule() {
  const dtVal = document.getElementById('schedule_datetime').value;
  if (!dtVal) return alert('Tarih/saat seçin');
  const scheduledFor = new Date(dtVal);
  if (scheduledFor <= new Date()) return alert('Geçmiş bir zamanı seçemezsiniz');

  // Compose form'undan veriyi al
  const accountId = parseInt(document.getElementById('compose_from').value, 10);
  const to = document.getElementById('compose_to').value.trim();
  const cc = document.getElementById('compose_cc').value.trim();
  const subject = document.getElementById('compose_subject').value.trim();
  const html = state.composeEditor ? state.composeEditor.getHTML() : '';
  const text = state.composeEditor ? state.composeEditor.getText() : '';
  if (!to) return alert('Alıcı gerekli');

  // İmza ekle (sendMail'deki gibi)
  const acc = state.accounts.find(a => a.id === accountId);
  let finalText = text, finalHtml = html;
  if (acc?.signature) {
    const sigIsHtml = /<[a-z][\s\S]*>/i.test(acc.signature);
    if (sigIsHtml) {
      finalHtml = html + '<br><br>' + acc.signature;
      const tmp = document.createElement('div');
      tmp.innerHTML = acc.signature;
      finalText = text + '\n\n' + (tmp.innerText || tmp.textContent || '');
    } else {
      finalHtml = html + '<br><br>' + acc.signature.replace(/\n/g, '<br>');
      finalText = text + '\n\n' + acc.signature;
    }
  }

  // Attachments → JSON-serileştirilebilir hale getir
  const attachments = state.composeAttachments.map(a => ({
    filename: a.name,
    content: { type: 'Buffer', data: Array.from(a.bytes) },
    contentType: a.type
  }));

  try {
    const r = await window.api.scheduled.add({
      account_id: accountId,
      to_addrs: to,
      cc_addrs: cc || null,
      subject,
      body_html: finalHtml,
      body_text: finalText,
      attachments,
      scheduled_for: scheduledFor.toISOString()
    });
    if (!r.ok) throw new Error(r.error);

    document.getElementById('modalSchedulePicker').classList.add('hidden');
    document.getElementById('modalCompose').classList.add('hidden');
    state.composeAttachments = [];
    renderAttachmentList();
    if (state.composeEditor) state.composeEditor.clear();

    const whenStr = scheduledFor.toLocaleString('tr-TR');
    setStatus(`✓ Mesaj zamanlandı: ${whenStr}`);
  } catch (e) {
    alert('Zamanlama hatası: ' + e.message);
  }
}

let scheduledManagerBound = false;
async function openScheduledManager() {
  await renderScheduledList();
  if (!scheduledManagerBound) {
    scheduledManagerBound = true;
    document.getElementById('schedFilter').onchange = renderScheduledList;
  }
  document.getElementById('modalScheduled').classList.remove('hidden');
}

async function renderScheduledList() {
  const filter = document.getElementById('schedFilter').value;
  const items = await window.api.scheduled.list(filter || undefined);
  const list = document.getElementById('scheduledList');
  if (!items.length) {
    list.innerHTML = `<div class="empty-state">${filter ? 'Bu durumda mesaj yok' : 'Henüz zamanlanmış mesaj yok'}</div>`;
    return;
  }
  list.innerHTML = items.map(s => {
    const acc = state.accounts.find(a => a.id === s.account_id);
    const when = s.scheduled_for ? new Date(s.scheduled_for).toLocaleString('tr-TR') : '?';
    const sentWhen = s.sent_at ? new Date(s.sent_at).toLocaleString('tr-TR') : '';
    let statusBadge = '';
    let statusColor = '';
    switch (s.status) {
      case 'pending':   statusBadge = '⏳ Bekliyor';     statusColor = 'var(--accent)'; break;
      case 'sending':   statusBadge = '📤 Gönderiliyor'; statusColor = 'var(--accent)'; break;
      case 'sent':      statusBadge = '✓ Gönderildi';   statusColor = 'var(--success)'; break;
      case 'failed':    statusBadge = '❌ Başarısız';    statusColor = 'var(--danger)'; break;
      case 'cancelled': statusBadge = '🚫 İptal';        statusColor = 'var(--muted)'; break;
      default:          statusBadge = s.status;
    }
    return `
      <div class="rule-item">
        <div class="rule-info">
          <div class="rule-name" style="display:flex;align-items:center;gap:8px;">
            <span style="color:${statusColor};font-size:11px;font-weight:600;">${statusBadge}</span>
            ${escapeHtml(s.subject || '(konusuz)')}
          </div>
          <div class="rule-meta">
            ${acc ? escapeHtml(acc.email) + ' → ' : ''}${escapeHtml(s.to_addrs)} · 
            <strong>Zamanlanmış:</strong> ${when}
            ${sentWhen ? ` · <strong>Gönderildi:</strong> ${sentWhen}` : ''}
            ${s.error ? `<br><span style="color:var(--danger);">⚠ ${escapeHtml(s.error.slice(0,200))}</span>` : ''}
          </div>
        </div>
        ${s.status === 'pending' || s.status === 'sending'
          ? `<button class="btn btn-ghost" data-cancel-sched="${s.id}" style="color:var(--danger);">İptal</button>`
          : `<button class="btn btn-ghost" data-delete-sched="${s.id}" style="color:var(--danger);">Sil</button>`}
      </div>
    `;
  }).join('');

  list.querySelectorAll('[data-cancel-sched]').forEach(el => {
    el.onclick = async () => {
      if (!confirm('Bu zamanlanmış mesajı iptal etmek istediğinize emin misiniz?')) return;
      await window.api.scheduled.cancel(parseInt(el.dataset.cancelSched, 10));
      await renderScheduledList();
    };
  });
  list.querySelectorAll('[data-delete-sched]').forEach(el => {
    el.onclick = async () => {
      if (!confirm('Bu kaydı listeden silmek istediğinize emin misiniz?')) return;
      await window.api.scheduled.delete(parseInt(el.dataset.deleteSched, 10));
      await renderScheduledList();
    };
  });
}

// "Zamanlanmış mesaj gönderildi" event
if (window.api.scheduled && window.api.scheduled.onSent) {
  window.api.scheduled.onSent((data) => {
    setStatus(`✓ Zamanlanmış mesaj gönderildi: "${data.subject || '(konusuz)'}" → ${data.to}`);
  });
}

// ============= v1.11: NOTLAR (Lotus Notes benzeri) =============
let currentNoteId = null;
let notesEditor = null;
let notesUIBound = false;
let notesDirty = false;

async function openNotes() {
  document.getElementById('modalNotes').classList.remove('hidden');
  if (!notesUIBound) {
    notesUIBound = true;
    bindNotesUI();
  }
  await refreshNotesCategories();
  await renderNotesList();
}

function bindNotesUI() {
  document.getElementById('btnNewNote').onclick = createNewNote;
  document.getElementById('notesSearchInput').oninput = debounce(renderNotesList, 200);
  document.getElementById('notesCategoryFilter').onchange = renderNotesList;
  document.getElementById('notesShowArchived').onchange = renderNotesList;

  // Editor controls
  document.getElementById('btnSaveNote').onclick = saveCurrentNote;
  document.getElementById('btnDeleteNote').onclick = deleteCurrentNote;
  document.getElementById('btnPinNote').onclick = togglePinCurrentNote;
  document.getElementById('btnArchiveNote').onclick = toggleArchiveCurrentNote;

  // Dirty tracking
  ['note_title', 'note_category', 'note_tags', 'note_color'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => { notesDirty = true; });
  });
}

async function refreshNotesCategories() {
  const sel = document.getElementById('notesCategoryFilter');
  const cats = await window.api.notes.listCategories();
  const current = sel.value;
  sel.innerHTML = '<option value="">Tüm Kategoriler</option>' +
    cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  sel.value = current || '';
}

async function renderNotesList() {
  const search = document.getElementById('notesSearchInput').value.trim();
  const category = document.getElementById('notesCategoryFilter').value || undefined;
  const showArchived = document.getElementById('notesShowArchived').checked;
  const opts = { archived: showArchived ? undefined : false };
  if (search) opts.search = search;
  if (category) opts.category = category;
  const notes = await window.api.notes.list(opts);
  const list = document.getElementById('notesList');
  if (!notes.length) {
    list.innerHTML = '<div class="empty-state" style="padding:30px;">Not bulunamadı</div>';
    return;
  }
  list.innerHTML = notes.map(n => {
    const updated = n.updated_at ? new Date(n.updated_at).toLocaleString('tr-TR') :
                    n.created_at ? new Date(n.created_at).toLocaleString('tr-TR') : '';
    return `
      <div class="note-item ${n.is_pinned ? 'pinned' : ''} ${n.is_archived ? 'archived' : ''} ${currentNoteId === n.id ? 'active' : ''}"
           data-id="${n.id}" style="border-left:4px solid ${n.color || '#3498db'};">
        <div class="note-item-header">
          <span class="note-item-title">${n.is_pinned ? '📌 ' : ''}${escapeHtml(n.title)}</span>
          ${n.is_archived ? '<span class="note-archived-badge">Arşivli</span>' : ''}
        </div>
        ${n.category ? `<div class="note-item-cat">🏷 ${escapeHtml(n.category)}</div>` : ''}
        <div class="note-item-preview">${escapeHtml((n.preview || '').replace(/\s+/g, ' ').slice(0, 100))}</div>
        <div class="note-item-date">${updated}</div>
      </div>
    `;
  }).join('');

  list.querySelectorAll('.note-item').forEach(el => {
    el.onclick = () => loadNoteIntoEditor(parseInt(el.dataset.id, 10));
  });
}

async function loadNoteIntoEditor(id) {
  if (notesDirty && !confirm('Kayıtsız değişiklikler var. Yine de geçilsin mi?')) return;
  const note = await window.api.notes.get(id);
  if (!note) return;
  currentNoteId = id;
  document.getElementById('notesEmpty').classList.add('hidden');
  document.getElementById('notesEditor').classList.remove('hidden');

  document.getElementById('note_title').value = note.title || '';
  document.getElementById('note_category').value = note.category || '';
  document.getElementById('note_tags').value = note.tags || '';
  document.getElementById('note_color').value = note.color || '#3498db';

  if (!notesEditor && typeof RichEditor !== 'undefined') {
    notesEditor = new RichEditor('note_content_editor', {
      placeholder: 'Notunuzu buraya yazın...'
    });
    // Dirty tracking - editor içeriği için
    const contentEl = document.querySelector('#note_content_editor .rte-content');
    if (contentEl) contentEl.addEventListener('input', () => { notesDirty = true; });
  }
  if (notesEditor) notesEditor.setHTML(note.content_html || '');

  // Pin/Archive durumu butonlara yansıt
  document.getElementById('btnPinNote').classList.toggle('btn-primary', !!note.is_pinned);
  document.getElementById('btnPinNote').classList.toggle('btn-ghost', !note.is_pinned);
  document.getElementById('btnArchiveNote').classList.toggle('btn-primary', !!note.is_archived);
  document.getElementById('btnArchiveNote').classList.toggle('btn-ghost', !note.is_archived);

  const meta = note.updated_at
    ? `Güncellendi: ${new Date(note.updated_at).toLocaleString('tr-TR')}`
    : `Oluşturuldu: ${new Date(note.created_at).toLocaleString('tr-TR')}`;
  document.getElementById('note_status_meta').textContent = meta;
  notesDirty = false;

  // Aktif item'ı vurgula
  document.querySelectorAll('.note-item').forEach(el => el.classList.remove('active'));
  document.querySelector(`.note-item[data-id="${id}"]`)?.classList.add('active');
}

async function createNewNote() {
  if (notesDirty && !confirm('Kayıtsız değişiklikler var. Yine de yeni not açılsın mı?')) return;
  const r = await window.api.notes.add({
    title: 'Yeni Not',
    content_html: '',
    color: '#3498db'
  });
  if (r.ok) {
    await refreshNotesCategories();
    await renderNotesList();
    await loadNoteIntoEditor(r.id);
    setTimeout(() => {
      const titleInput = document.getElementById('note_title');
      titleInput.focus();
      titleInput.select();
    }, 100);
  }
}

async function saveCurrentNote() {
  if (!currentNoteId) return;
  const title = document.getElementById('note_title').value.trim() || 'Başlıksız';
  const category = document.getElementById('note_category').value.trim() || null;
  const tags = document.getElementById('note_tags').value.trim() || null;
  const color = document.getElementById('note_color').value;
  const content_html = notesEditor ? notesEditor.getHTML() : '';
  const content_text = notesEditor ? notesEditor.getText() : '';
  await window.api.notes.update(currentNoteId, {
    title, category, tags, color, content_html, content_text
  });
  notesDirty = false;
  await refreshNotesCategories();
  await renderNotesList();
  setStatus('✓ Not kaydedildi');
  document.getElementById('note_status_meta').textContent =
    `Güncellendi: ${new Date().toLocaleString('tr-TR')}`;
}

async function deleteCurrentNote() {
  if (!currentNoteId) return;
  if (!confirm('Bu notu silmek istediğinizden emin misiniz?')) return;
  await window.api.notes.delete(currentNoteId);
  currentNoteId = null;
  notesDirty = false;
  document.getElementById('notesEditor').classList.add('hidden');
  document.getElementById('notesEmpty').classList.remove('hidden');
  await refreshNotesCategories();
  await renderNotesList();
  setStatus('Not silindi');
}

async function togglePinCurrentNote() {
  if (!currentNoteId) return;
  const note = await window.api.notes.get(currentNoteId);
  if (!note) return;
  await window.api.notes.update(currentNoteId, { is_pinned: !note.is_pinned });
  await loadNoteIntoEditor(currentNoteId);
  await renderNotesList();
}

async function toggleArchiveCurrentNote() {
  if (!currentNoteId) return;
  const note = await window.api.notes.get(currentNoteId);
  if (!note) return;
  await window.api.notes.update(currentNoteId, { is_archived: !note.is_archived });
  await loadNoteIntoEditor(currentNoteId);
  await renderNotesList();
}

// v1.11: Mesajdan Not Oluştur (sağ tık menüden)
async function createNoteFromMessage(msg) {
  if (!msg) return;
  const fromName = msg.from_name || msg.from_addr || '?';
  const date = msg.date ? new Date(msg.date).toLocaleString('tr-TR') : '';
  const title = msg.subject || '(Konusuz)';

  // Mesaj içeriğinden HTML oluştur
  const bodyHtml = msg.body_html || (msg.body_text
    ? `<pre style="white-space:pre-wrap;">${escapeHtml(msg.body_text)}</pre>`
    : '<em>İçerik yok</em>');

  const noteHtml = `
    <div style="border-left:3px solid var(--primary);padding:8px 12px;background:#0001;border-radius:4px;margin-bottom:12px;">
      <div><strong>📧 Gönderen:</strong> ${escapeHtml(fromName)}</div>
      <div><strong>📅 Tarih:</strong> ${escapeHtml(date)}</div>
      <div><strong>📌 Konu:</strong> ${escapeHtml(title)}</div>
    </div>
    ${bodyHtml}
    <p><br></p>
    <p><em>Notlarınızı buraya ekleyebilirsiniz...</em></p>
  `;
  const noteText = `Gönderen: ${fromName}\nTarih: ${date}\nKonu: ${title}\n\n${msg.body_text || ''}`;

  const r = await window.api.notes.add({
    title: '📧 ' + title.slice(0, 80),
    content_html: noteHtml,
    content_text: noteText,
    category: 'Maillerden',
    color: '#9b59b6',
    related_message_id: msg.id
  });
  if (r.ok) {
    setStatus('✓ Not oluşturuldu - Notlar penceresinde görünür');
    // Notes modal'ını aç ve bu notu seçili yap
    await openNotes();
    setTimeout(() => loadNoteIntoEditor(r.id), 200);
  }
}

// debounce helper (eğer yoksa)
function debounce(fn, wait) {
  let t;
  return function(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

// ============= v1.11.1: In-app banner (bildirim garantisi) =============
function showInAppNotification(data) {
  const container = document.getElementById('inAppNotifContainer');
  if (!container) return;
  const banner = document.createElement('div');
  banner.className = 'in-app-notif';
  banner.innerHTML = `
    <div class="in-app-notif-icon">📨</div>
    <div class="in-app-notif-body">
      <div class="in-app-notif-title">${escapeHtml(data.title || 'Bildirim')}</div>
      <div class="in-app-notif-text">${escapeHtml((data.body || '').slice(0, 200))}</div>
    </div>
    <button class="in-app-notif-close" title="Kapat">×</button>
  `;
  container.appendChild(banner);
  // Animasyonu tetikle
  setTimeout(() => banner.classList.add('show'), 10);

  const closeBtn = banner.querySelector('.in-app-notif-close');
  closeBtn.onclick = (ev) => {
    ev.stopPropagation();
    removeBanner();
  };

  banner.onclick = () => {
    if (data.messageId) {
      // Mesajı aç
      openMessage(data.messageId).catch(() => {});
    }
    removeBanner();
  };

  function removeBanner() {
    banner.classList.remove('show');
    setTimeout(() => banner.remove(), 300);
  }

  // 6 saniye sonra otomatik kapat
  setTimeout(removeBanner, 6000);
}

// IPC handler bağla (init dışında, doğrudan sayfa yüklenirken)
if (window.api && window.api.on) {
  window.api.on('inapp-notification', (data) => {
    showInAppNotification(data);
  });
}

// ============= v1.12: Attachment Security UI =============
async function setupAttachmentChips(msg) {
  const senderEmail = msg.from_addr || '';
  const cfg = await window.api.config.get();
  const vtAutoScan = !!(cfg.virustotalApiKey && cfg.virustotalAutoScan !== false);

  const chips = document.querySelectorAll('#attachmentChipsContainer .attachment-chip');
  for (const chip of chips) {
    const attId = parseInt(chip.dataset.attId, 10);
    const filename = chip.dataset.filename;
    const analysis = await window.api.security.analyzeAttachment(filename, senderEmail);
    const senderTrusted = senderEmail ? await window.api.security.isTrustedSender(senderEmail) : false;

    chip.classList.remove('att-pending');
    chip.classList.add(`att-risk-${analysis.risk}`);
    chip.dataset.risk = analysis.risk;
    chip.dataset.warning = analysis.warning || '';
    chip.dataset.canOpen = analysis.canOpen ? '1' : '0';
    chip.dataset.requireConfirm = analysis.requireConfirmation ? '1' : '0';
    chip.dataset.senderTrusted = senderTrusted ? '1' : '0';
    chip.dataset.category = analysis.category;

    let icon = '📎';
    if (analysis.risk === 'critical') icon = '🚫';
    else if (analysis.risk === 'high') icon = '⚠️';
    else if (analysis.risk === 'medium') icon = '⚠';
    chip.title = analysis.warning || `Risk: ${analysis.risk}`;

    const sizeText = chip.querySelector('span')?.textContent || '';
    chip.innerHTML = `
      <span class="att-main">${icon} ${escapeHtml(filename)}</span>
      <span class="att-size" style="color:var(--muted);margin-left:6px;">${sizeText}</span>
      <span class="att-vt-badge" data-att-id="${attId}"></span>
    `;

    chip.onclick = (e) => {
      e.stopPropagation();
      handleAttachmentClick(attId, filename, analysis, senderTrusted, senderEmail);
    };

    chip.oncontextmenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      showAttachmentContextMenu(e, attId, filename, analysis, senderTrusted, senderEmail);
    };

    // v1.13: Otomatik VT scan (kritik veya orta+ risk + autoscan açık)
    const shouldAutoScan = vtAutoScan && (
      analysis.risk === 'critical' ||
      analysis.risk === 'high' ||
      analysis.risk === 'medium'
    );
    if (shouldAutoScan) {
      // Async, UI'yı bloklamadan
      scanAttachmentWithVT(attId, chip).catch(() => {});
    }
  }
}

// ============= v1.13: VirusTotal Scan UI =============
async function scanAttachmentWithVT(attachmentId, chipEl) {
  const badgeEl = chipEl ? chipEl.querySelector('.att-vt-badge') : null;
  if (badgeEl) {
    badgeEl.innerHTML = `<span class="vt-badge vt-loading" title="VirusTotal taranıyor...">⏳ VT</span>`;
  }
  const r = await window.api.virustotal.scan(attachmentId);
  if (!badgeEl) return r;

  if (!r.ok) {
    if (r.noKey) {
      badgeEl.innerHTML = '';
      return r;
    }
    badgeEl.innerHTML = `<span class="vt-badge vt-error" title="${escapeHtml(r.error || 'hata')}">! VT</span>`;
    return r;
  }

  if (!r.found) {
    badgeEl.innerHTML = `<span class="vt-badge vt-unknown" title="VirusTotal veritabanında yok">? VT</span>`;
    return r;
  }

  // Sonuç var
  let cls = 'vt-clean';
  let label = '✓';
  if (r.verdict === 'malicious') { cls = 'vt-malicious'; label = '🚨'; }
  else if (r.verdict === 'suspicious') { cls = 'vt-suspicious'; label = '⚠'; }
  else if (r.verdict === 'low_risk') { cls = 'vt-lowrisk'; label = '⚠'; }

  const text = `${label} ${r.malicious}/${r.total}`;
  const tip = `VirusTotal:\n${r.malicious} antivirüs zararlı dedi\n${r.suspicious} şüpheli\n${r.harmless} temiz\n${r.undetected} algılayamadı\nToplam: ${r.total} motor`;
  badgeEl.innerHTML = `<span class="vt-badge ${cls}" title="${escapeHtml(tip)}">${escapeHtml(text)}</span>`;

  // Eğer malicious bulundu ve chip kritik değilse, chip'i kritik seviyeye çıkar
  if (r.verdict === 'malicious' && chipEl) {
    chipEl.classList.remove('att-risk-safe', 'att-risk-low', 'att-risk-medium', 'att-risk-high');
    chipEl.classList.add('att-risk-critical');
    chipEl.dataset.risk = 'critical';
    chipEl.dataset.canOpen = '0';
    chipEl.dataset.warning = `🚨 VirusTotal: ${r.malicious}/${r.total} antivirüs zararlı yazılım tespit etti! ASLA AÇMAYIN.`;
  }

  return r;
}

async function handleAttachmentClick(attId, filename, analysis, senderTrusted, senderEmail) {
  // v1.13: VT sonucunu dialog'a ekleyebilmek için chip'ten oku
  const chip = document.querySelector(`.attachment-chip[data-att-id="${attId}"]`);
  let vtSummary = '';
  if (chip) {
    const badge = chip.querySelector('.att-vt-badge');
    if (badge && badge.title) {
      vtSummary = '\n\n--- VirusTotal ---\n' + badge.title;
    }
  }

  // Kritik tehdit (executable, çift uzantı, script) - kesinlikle açma
  if (analysis.risk === 'critical') {
    const ok = confirm(
      `🚫 BU EK ÇOK TEHLİKELİ — VARSAYILAN OLARAK AÇILMAYACAK\n\n` +
      `Dosya: ${filename}\n` +
      `Gönderici: ${senderEmail || 'bilinmiyor'} ${senderTrusted ? '(güvenilir listede)' : '(TANIMIYOR)'}\n\n` +
      `${analysis.warning}${vtSummary}\n\n` +
      `Yine de yalnızca DOSYAYI DİSKE KAYDETMEK ister misiniz? (açmak için ayrıca tıklamanız gerekecek)\n\n` +
      `İptal etmenizi şiddetle öneririm.`
    );
    if (ok) {
      const r = await window.api.attachments.save(attId);
      if (r && r.ok) {
        setStatus(`Ek diske kaydedildi: ${r.path} - LÜTFEN ANTİVİRÜS İLE TARAYIN!`);
      } else if (!r?.canceled) {
        setStatus('Kaydetme başarısız: ' + (r?.error || 'bilinmeyen hata'), 'error');
      }
    }
    return;
  }

  // Yüksek/orta risk - dolgun uyarılı onay
  if (analysis.requireConfirmation) {
    let prompt = `⚠️ EK DOSYA UYARISI\n\n`;
    prompt += `Dosya: ${filename}\n`;
    prompt += `Risk: ${analysis.risk.toUpperCase()}\n`;
    prompt += `Gönderici: ${senderEmail || 'bilinmiyor'}\n`;
    prompt += `Güvenilir liste: ${senderTrusted ? '✓ EVET' : '✗ HAYIR (TANIMIYOR)'}\n`;
    if (analysis.warning) prompt += `\n${analysis.warning}\n`;
    prompt += vtSummary;
    if (!senderTrusted) {
      prompt += `\n\n❗ Bu kişiden daha önce mail almadınız. Tanımadığınız kişilerden gelen ek dosyaları açmamanız önerilir.`;
    }
    prompt += `\n\nAçmak istediğinize emin misiniz?`;
    if (!confirm(prompt)) return;
  }

  // Açma
  const r = await window.api.attachments.open(attId);
  if (r && r.ok) {
    setStatus(`Ek açıldı: ${filename}`);
  } else {
    setStatus('Ek açılamadı: ' + (r?.error || 'bilinmeyen hata'), 'error');
  }
}

function showAttachmentContextMenu(e, attId, filename, analysis, senderTrusted, senderEmail) {
  const items = [
    {
      label: '💾 Diske Kaydet',
      action: async () => {
        const r = await window.api.attachments.save(attId);
        if (r?.ok) setStatus(`Kaydedildi: ${r.path}`);
        else if (!r?.canceled) setStatus('Hata: ' + (r?.error || ''), 'error');
      }
    },
    {
      label: '🦠 VirusTotal ile Tara',
      action: async () => {
        const chip = document.querySelector(`.attachment-chip[data-att-id="${attId}"]`);
        const r = await scanAttachmentWithVT(attId, chip);
        if (!r) return;
        if (!r.ok) {
          if (r.noKey) {
            alert('VirusTotal API anahtarı tanımlı değil.\n\nAyarlar > VirusTotal Tarama bölümünden ücretsiz bir anahtar ekleyebilirsiniz.\n\nAnahtar al: virustotal.com/gui/join-us');
          } else {
            alert('VirusTotal hatası: ' + (r.error || 'bilinmeyen'));
          }
          return;
        }
        if (!r.found) {
          alert(`Dosya VirusTotal veritabanında bulunamadı.\n\nSHA-256: ${r.sha256}\n\nBu dosya daha önce VT'ye sunulmamış. Bilinmeyen bir dosya - dikkatli olun.`);
          return;
        }
        let msg = `🦠 VirusTotal Sonucu\n\n`;
        msg += `Dosya: ${filename}\n`;
        msg += `SHA-256: ${r.sha256}\n`;
        if (r.typeDescription) msg += `Tür: ${r.typeDescription}\n`;
        msg += `\nKarar: ${r.verdict.toUpperCase()}\n\n`;
        msg += `🚨 Zararlı: ${r.malicious}\n`;
        msg += `⚠ Şüpheli: ${r.suspicious}\n`;
        msg += `✓ Temiz: ${r.harmless}\n`;
        msg += `? Algılayamadı: ${r.undetected}\n`;
        msg += `Toplam motor: ${r.total}\n`;
        if (r.lastAnalysisDate) msg += `\nSon tarama: ${new Date(r.lastAnalysisDate * 1000).toLocaleString('tr-TR')}`;
        if (r.fromCache) msg += `\n(Önbellekten - ${new Date(r.cachedAt).toLocaleString('tr-TR')})`;
        if (r.malicious >= 3) msg += `\n\n🚨 BU DOSYA BÜYÜK İHTİMALLE ZARARLI! AÇMAYIN!`;
        else if (r.malicious >= 1 || r.suspicious >= 1) msg += `\n\n⚠ Bu dosya şüpheli. Açmadan önce iyice düşünün.`;
        else msg += `\n\n✓ Hiçbir motor zararlı bulmadı (ama yine de dikkatli olun).`;
        alert(msg);
      }
    }
  ];
  if (analysis.canOpen || analysis.risk !== 'critical') {
    items.unshift({
      label: '📂 Aç (varsayılan uygulama)',
      action: () => handleAttachmentClick(attId, filename, analysis, senderTrusted, senderEmail)
    });
  }
  const menu = document.getElementById('contextMenu');
  if (!menu) return;
  menu.innerHTML = items.map((it, i) =>
    `<div class="ctx-item" data-i="${i}">${escapeHtml(it.label)}</div>`
  ).join('');
  menu.style.left = e.clientX + 'px';
  menu.style.top = e.clientY + 'px';
  menu.classList.remove('hidden');
  menu.querySelectorAll('.ctx-item').forEach((el, i) => {
    el.onclick = (ev) => {
      ev.stopPropagation();
      menu.classList.add('hidden');
      items[i].action();
    };
  });
  setTimeout(() => {
    document.addEventListener('click', () => menu.classList.add('hidden'), { once: true });
  }, 50);
}

// ============= v1.12: Güvenilir Göndericiler =============
async function openTrustedSenders() {
  document.getElementById('modalTrustedSenders').classList.remove('hidden');
  document.getElementById('btnAddTrustedSender').onclick = addTrustedSenderManual;
  await renderTrustedSendersList();
}

async function renderTrustedSendersList() {
  const list = await window.api.security.listTrustedSenders();
  const el = document.getElementById('trustedSendersList');
  if (!list.length) {
    el.innerHTML = '<div class="empty-state" style="padding:20px;">Henüz güvenilir gönderici yok. Mail aldıkça otomatik eklenir.</div>';
    return;
  }
  el.innerHTML = list.map(s => `
    <div class="trusted-row">
      <div class="trusted-info">
        <div class="trusted-email">${escapeHtml(s.email)} ${s.manually_added ? '<span class="badge-manual">manuel</span>' : ''}</div>
        ${s.name ? `<div class="trusted-name">${escapeHtml(s.name)}</div>` : ''}
        <div class="trusted-meta">
          ${s.message_count} mesaj · İlk: ${new Date(s.first_seen).toLocaleDateString('tr-TR')} · Son: ${new Date(s.last_seen).toLocaleDateString('tr-TR')}
        </div>
      </div>
      <button class="btn btn-ghost btn-sm" data-email="${escapeHtml(s.email)}">Çıkar</button>
    </div>
  `).join('');
  el.querySelectorAll('button[data-email]').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm(`"${btn.dataset.email}" güvenilir listeden çıkarılsın mı?`)) return;
      await window.api.security.removeTrustedSender(btn.dataset.email);
      await renderTrustedSendersList();
    };
  });
}

async function addTrustedSenderManual() {
  const email = document.getElementById('ts_email').value.trim();
  const name = document.getElementById('ts_name').value.trim();
  if (!email || !email.includes('@')) {
    alert('Geçerli bir email adresi girin');
    return;
  }
  const r = await window.api.security.addTrustedSender(email, name || null);
  if (r.ok) {
    document.getElementById('ts_email').value = '';
    document.getElementById('ts_name').value = '';
    await renderTrustedSendersList();
    setStatus(`✓ "${email}" güvenilir listeye eklendi`);
  }
}

// ============= v1.13: VirusTotal Settings UI =============
function bindVirusTotalSettings() {
  const keyEl = document.getElementById('vt_apiKey');
  const statusEl = document.getElementById('vt_keyStatus');
  const btnTest = document.getElementById('btnVtTestKey');
  const btnToggle = document.getElementById('btnVtToggleVisibility');
  const btnClear = document.getElementById('btnVtClearCache');
  const lnkJoin = document.getElementById('lnkVtJoin');

  if (!keyEl || keyEl.dataset.bound) return;
  keyEl.dataset.bound = '1';

  // Anahtar değiştiğinde otomatik kaydet
  keyEl.addEventListener('change', async () => {
    const v = keyEl.value.trim();
    await window.api.config.updatePrefs({ virustotalApiKey: v });
    statusEl.textContent = v ? 'Kayıtlı (Test ile doğrulayın)' : 'Boş - VT entegrasyonu devre dışı';
    statusEl.style.color = v ? 'var(--text-2)' : 'var(--muted)';
    flashSettingsSavedIndicator();
  });

  btnTest.onclick = async () => {
    const apiKey = keyEl.value.trim();
    if (!apiKey) {
      statusEl.textContent = 'Önce bir API anahtarı girin';
      statusEl.style.color = 'var(--danger)';
      return;
    }
    statusEl.textContent = '⏳ Test ediliyor...';
    statusEl.style.color = 'var(--muted)';
    const r = await window.api.virustotal.testKey(apiKey);
    if (r.ok) {
      // Kaydet
      await window.api.config.updatePrefs({ virustotalApiKey: apiKey });
      let txt = `✓ Geçerli anahtar`;
      if (r.user) txt += ` (${r.user})`;
      if (r.quotas) {
        const dq = r.quotas.api_requests_daily;
        if (dq) txt += ` · Günlük: ${dq.user.used}/${dq.user.allowed}`;
      }
      statusEl.textContent = txt;
      statusEl.style.color = '#2ecc71';
    } else {
      statusEl.textContent = '✗ ' + (r.error || 'Doğrulama başarısız');
      statusEl.style.color = 'var(--danger)';
    }
  };

  btnToggle.onclick = () => {
    keyEl.type = keyEl.type === 'password' ? 'text' : 'password';
  };

  btnClear.onclick = async () => {
    if (!confirm('VirusTotal tarama önbelleği temizlensin mi?\n\n(Bir sonraki taramada tekrar VT\'ye sorgu atılır)')) return;
    const r = await window.api.virustotal.clearCache();
    if (r.ok) setStatus('✓ VT önbelleği temizlendi');
  };

  if (lnkJoin) {
    lnkJoin.onclick = (e) => {
      e.preventDefault();
      window.api.app.openExternal('https://www.virustotal.com/gui/join-us');
    };
  }
}

// ============= v1.13.1: Settings save indicator flash =============
let _saveFlashTimeout = null;
function flashSettingsSavedIndicator() {
  const el = document.getElementById('settingsSaveIndicator');
  if (!el) return;
  el.textContent = '✓ Kaydedildi';
  el.style.color = '#2ecc71';
  el.style.fontWeight = '700';
  el.classList.add('save-flash');
  if (_saveFlashTimeout) clearTimeout(_saveFlashTimeout);
  _saveFlashTimeout = setTimeout(() => {
    el.textContent = '✓ Tüm değişiklikler otomatik kaydedilir';
    el.style.color = 'var(--text-2)';
    el.style.fontWeight = 'normal';
    el.classList.remove('save-flash');
  }, 2200);
}

// ============= v1.14: Bayesian Spam Filter UI =============
function bindBayesSettings() {
  const btnRefresh = document.getElementById('btnBayesRefresh');
  const btnReset = document.getElementById('btnBayesReset');
  if (btnRefresh && !btnRefresh.dataset.bound) {
    btnRefresh.dataset.bound = '1';
    btnRefresh.onclick = refreshBayesStats;
  }
  if (btnReset && !btnReset.dataset.bound) {
    btnReset.dataset.bound = '1';
    btnReset.onclick = async () => {
      const r = await window.api.bayes.stats();
      const total = (r.totalSpamMsgs || 0) + (r.totalHamMsgs || 0);
      if (!confirm(
        `Bayesian filtrenin TÜM eğitim verisi silinecek.\n\n` +
        `${r.totalTokens || 0} token, ${r.totalSpamMsgs || 0} spam, ${r.totalHamMsgs || 0} ham mesaj öğrenmesi sıfırlanır.\n\n` +
        `Bu işlem GERİ ALINAMAZ. Emin misiniz?`
      )) return;
      await window.api.bayes.reset();
      flashSettingsSavedIndicator();
      setStatus('✓ Bayesian filtre sıfırlandı');
      await refreshBayesStats();
    };
  }
}

async function refreshBayesStats() {
  const r = await window.api.bayes.stats();
  const elTokens = document.getElementById('bayes_tokens');
  const elSpam = document.getElementById('bayes_spam_count');
  const elHam = document.getElementById('bayes_ham_count');
  const elStatus = document.getElementById('bayes_status');
  if (!elTokens) return;

  elTokens.textContent = (r.totalTokens || 0).toLocaleString('tr-TR');
  elSpam.textContent = (r.totalSpamMsgs || 0).toLocaleString('tr-TR');
  elHam.textContent = (r.totalHamMsgs || 0).toLocaleString('tr-TR');

  if (r.isReady) {
    elStatus.textContent = '🟢 AKTİF';
    elStatus.style.color = '#2ecc71';
  } else {
    const spamNeeded = Math.max(0, 5 - (r.totalSpamMsgs || 0));
    const hamNeeded = Math.max(0, 5 - (r.totalHamMsgs || 0));
    elStatus.innerHTML = `🟡 Eğitim<br><span style="font-size:10px;font-weight:400;">${spamNeeded} spam + ${hamNeeded} ham daha</span>`;
    elStatus.style.color = '#f39c12';
  }
}

// ============= v1.15: URL Reputation - Body Link Intercept =============
async function setupBodyLinks() {
  const body = document.querySelector('.msg-view-body');
  if (!body) return;
  const links = body.querySelectorAll('a[href]');
  if (!links.length) return;

  for (const link of links) {
    const href = link.getAttribute('href') || '';
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) continue;
    if (!/^https?:/i.test(href)) continue;

    // Click intercept
    link.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleLinkClick(href, link);
    }, true);

    // Asenkron analiz + badge ekle
    analyzeAndBadgeLink(link, href);
  }
}

async function analyzeAndBadgeLink(linkEl, url) {
  const r = await window.api.url.analyze(url);
  if (!r || !r.ok) return;

  // Badge oluştur
  let badge = linkEl.querySelector('.url-rep-badge');
  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'url-rep-badge';
    linkEl.appendChild(badge);
  }

  let icon = '✓', cls = 'url-safe', tip = 'Güvenli görünüyor';
  if (r.risk === 'critical') { icon = '🚫'; cls = 'url-critical'; tip = 'TEHLİKELİ - phishing/malware'; }
  else if (r.risk === 'high') { icon = '⚠'; cls = 'url-high'; tip = 'Yüksek risk'; }
  else if (r.risk === 'medium') { icon = '⚠'; cls = 'url-medium'; tip = 'Şüpheli'; }
  else if (r.risk === 'low') { icon = '?'; cls = 'url-low'; tip = 'Düşük risk - dikkat'; }

  badge.className = `url-rep-badge ${cls}`;
  badge.textContent = ` ${icon}`;
  badge.title = `${tip}\n\n${r.host || ''}${r.reasons && r.reasons.length ? '\n\n• ' + r.reasons.join('\n• ') : ''}`;

  // Link'in kendisine de risk class'ı ekle
  linkEl.classList.remove('url-link-safe', 'url-link-low', 'url-link-medium', 'url-link-high', 'url-link-critical');
  linkEl.classList.add(`url-link-${r.risk}`);
  linkEl.dataset.urlRisk = r.risk;
  linkEl.dataset.urlAnalysis = JSON.stringify(r);
}

async function handleLinkClick(url, linkEl) {
  // Önceki analizi cache'ten al, yoksa yeni
  let analysis = null;
  if (linkEl && linkEl.dataset.urlAnalysis) {
    try { analysis = JSON.parse(linkEl.dataset.urlAnalysis); } catch (_) {}
  }
  if (!analysis) {
    setStatus('🔍 Link analiz ediliyor...');
    const r = await window.api.url.analyze(url);
    analysis = r && r.ok ? r : { risk: 'unknown', reasons: ['Analiz yapılamadı'] };
  }

  // Risk seviyesine göre dialog
  const risk = analysis.risk || 'safe';

  // Safe → uyarısız aç (sessiz)
  if (risk === 'safe') {
    window.api.url.openExternal(url);
    return;
  }

  // Low → kısa info aç
  if (risk === 'low') {
    setStatus(`Link açılıyor (düşük risk: ${analysis.host || 'host'})`);
    window.api.url.openExternal(url);
    return;
  }

  // Medium / High / Critical → uyarı dialog
  const icon = risk === 'critical' ? '🚨' : (risk === 'high' ? '⚠️' : '⚠');
  const title = risk === 'critical' ? 'TEHLİKELİ BAĞLANTI' :
                risk === 'high' ? 'YÜKSEK RİSKLİ BAĞLANTI' :
                'ŞÜPHELİ BAĞLANTI';

  let msg = `${icon} ${title}\n\n`;
  msg += `URL: ${url}\n`;
  msg += `Host: ${analysis.host || '?'}\n`;
  msg += `Risk: ${risk.toUpperCase()}\n\n`;

  if (analysis.reasons && analysis.reasons.length) {
    msg += 'Sebepler:\n';
    for (const r of analysis.reasons) msg += `  • ${r}\n`;
    msg += '\n';
  }

  if (analysis.vt && analysis.vt.found) {
    msg += `🦠 VirusTotal: ${analysis.vt.malicious} zararlı / ${analysis.vt.suspicious} şüpheli (${analysis.vt.total} motor)\n\n`;
  }

  if (risk === 'critical') {
    msg += '🚨 BU BAĞLANTIYI AÇMANIZI ŞİDDETLE TAVSİYE ETMİYORUZ.\n';
    msg += 'Phishing veya zararlı yazılım yüklemesi olabilir.\n\n';
    msg += '[Tamam] = RİSKİ BİLEREK AÇ\n[İptal] = Açma (önerilen)';
  } else if (risk === 'high') {
    msg += '⚠ Bu bağlantı yüksek risk taşıyor. Kişisel bilgilerinizi vermeyin, indirmeyin.\n\n';
    msg += '[Tamam] = Aç\n[İptal] = Açma';
  } else {
    msg += 'Bu bağlantı şüpheli. Devam etmek istediğinize emin misiniz?\n\n';
    msg += '[Tamam] = Aç\n[İptal] = Açma';
  }

  if (confirm(msg)) {
    window.api.url.openExternal(url);
    setStatus(`Link açıldı (kullanıcı onayı ile): ${analysis.host}`);
  } else {
    setStatus('Link açma iptal edildi (kullanıcı tarafından)');
  }
}

// ============= v1.16: Adres Defteri (Contacts) =============
let currentContactId = null;
let contactsUIBound = false;

async function openContacts() {
  document.getElementById('modalContacts').classList.remove('hidden');
  if (!contactsUIBound) {
    contactsUIBound = true;
    bindContactsUI();
  }
  await renderGroupsList();
  await renderContactsList();
}

function bindContactsUI() {
  document.getElementById('btnNewContact').onclick = createNewContact;
  document.getElementById('contactsSearchInput').oninput = debounce(renderContactsList, 200);
  document.getElementById('contactsSortSelect').onchange = renderContactsList;
  document.getElementById('contactsFavOnly').onchange = renderContactsList;

  document.getElementById('btnContactSave').onclick = saveCurrentContact;
  document.getElementById('btnContactDelete').onclick = deleteCurrentContact;
  document.getElementById('btnContactFav').onclick = toggleFavCurrentContact;
  document.getElementById('btnContactCompose').onclick = composeToCurrentContact;

  // v1.26: Import/Export
  document.getElementById('btnContactsImport').onclick = importContactsFromFile;
  document.getElementById('btnContactsExport').onclick = (e) => {
    e.stopPropagation();
    document.getElementById('contactsExportMenu').classList.toggle('hidden');
  };
  document.querySelectorAll('#contactsExportMenu .dropdown-item').forEach(item => {
    item.onclick = (e) => {
      e.stopPropagation();
      document.getElementById('contactsExportMenu').classList.add('hidden');
      exportContactsToFile(item.dataset.format);
    };
  });
  // Dışa tıklayınca menüyü kapat
  document.addEventListener('click', () => {
    document.getElementById('contactsExportMenu')?.classList.add('hidden');
  });

  // v1.34: Yeni Grup oluştur
  const btnNewGrp = document.getElementById('btnNewGroup');
  if (btnNewGrp) btnNewGrp.onclick = createNewGroup;
}

async function renderContactsList() {
  const search = document.getElementById('contactsSearchInput').value.trim();
  const sortBy = document.getElementById('contactsSortSelect').value;
  const favOnly = document.getElementById('contactsFavOnly').checked;

  // v1.34: Grup filtresi
  let list;
  if (groupsState.selectedGroupId) {
    list = await window.api.groups.members(groupsState.selectedGroupId);
    // İstemci tarafında arama filtresi (üyelerde)
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.organization || '').toLowerCase().includes(q)
      );
    }
    if (favOnly) list = list.filter(c => c.is_favorite);
  } else {
    list = await window.api.contacts.list({ search, sortBy, favoritesOnly: favOnly });
  }
  const stats = await window.api.contacts.stats();
  const grpInfo = groupsState.selectedGroupId
    ? `(Grup: ${list.length} kişi)`
    : `(${stats.total} toplam, ${stats.favorites} sık)`;
  document.getElementById('contactsCount').textContent = grpInfo;

  const el = document.getElementById('contactsList');
  if (!list.length) {
    el.innerHTML = '<div class="empty-state" style="padding:30px;">Kişi bulunamadı</div>';
    return;
  }

  el.innerHTML = list.map(c => {
    const initial = (c.name || c.email).trim().charAt(0).toUpperCase();
    const colorIdx = (c.email.charCodeAt(0) + c.email.charCodeAt(1)) % 8;
    const colors = ['#3498db', '#9b59b6', '#e74c3c', '#f39c12', '#2ecc71', '#1abc9c', '#e67e22', '#34495e'];
    return `
      <div class="contact-item ${currentContactId === c.id ? 'active' : ''}" data-id="${c.id}">
        <div class="contact-avatar" style="background:${colors[colorIdx]};">${escapeHtml(initial)}</div>
        <div class="contact-info">
          <div class="contact-name">${c.is_favorite ? '⭐ ' : ''}${escapeHtml(c.name || c.email.split('@')[0])}</div>
          <div class="contact-email">${escapeHtml(c.email)}</div>
          ${c.organization ? `<div class="contact-org">${escapeHtml(c.organization)}</div>` : ''}
        </div>
        ${c.use_count > 1 ? `<div class="contact-usecount" title="Kullanım sayısı">${c.use_count}</div>` : ''}
      </div>
    `;
  }).join('');

  el.querySelectorAll('.contact-item').forEach(item => {
    item.onclick = () => loadContactIntoDetail(parseInt(item.dataset.id, 10));
  });
}

async function loadContactIntoDetail(id) {
  const c = await window.api.contacts.get(id);
  if (!c) return;
  currentContactId = id;
  document.getElementById('contactsEmpty').classList.add('hidden');
  document.getElementById('contactsDetail').classList.remove('hidden');

  document.getElementById('contactDetailHeader').textContent = c.name || c.email;
  document.getElementById('ct_name').value = c.name || '';
  document.getElementById('ct_email').value = c.email || '';
  document.getElementById('ct_organization').value = c.organization || '';
  document.getElementById('ct_phone').value = c.phone || '';
  document.getElementById('ct_tags').value = c.tags || '';
  document.getElementById('ct_notes').value = c.notes || '';

  const favBtn = document.getElementById('btnContactFav');
  favBtn.classList.toggle('btn-primary', !!c.is_favorite);
  favBtn.classList.toggle('btn-ghost', !c.is_favorite);

  let meta = `Kullanım: ${c.use_count || 0} kez`;
  if (c.last_used) meta += ` · Son: ${new Date(c.last_used).toLocaleString('tr-TR')}`;
  if (c.created_at) meta += ` · Eklendi: ${new Date(c.created_at).toLocaleDateString('tr-TR')}`;
  meta += ` · Kaynak: ${c.source === 'auto' ? 'otomatik' : 'manuel'}`;
  document.getElementById('ct_meta').textContent = meta;

  document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('active'));
  document.querySelector(`.contact-item[data-id="${id}"]`)?.classList.add('active');

  // v1.34: Üye olduğu gruplar
  await refreshContactGroupsBadges(id);
  const btnAdd = document.getElementById('btnAddToGroup');
  if (btnAdd) {
    btnAdd.onclick = () => showAddToGroupDialog(id);
  }
}

async function createNewContact() {
  const r = await window.api.contacts.add({
    email: 'yeni@example.com',
    name: 'Yeni Kişi',
    source: 'manual'
  });
  if (r.ok) {
    await renderContactsList();
    await loadContactIntoDetail(r.id);
    setTimeout(() => {
      const emailEl = document.getElementById('ct_email');
      emailEl.focus();
      emailEl.select();
    }, 100);
  } else {
    alert('Eklenemedi: ' + (r.error || ''));
  }
}

async function saveCurrentContact() {
  if (!currentContactId) return;
  const email = document.getElementById('ct_email').value.trim();
  if (!email || !email.includes('@')) {
    alert('Geçerli bir e-posta adresi girin');
    return;
  }
  const updates = {
    email,
    name: document.getElementById('ct_name').value.trim(),
    organization: document.getElementById('ct_organization').value.trim(),
    phone: document.getElementById('ct_phone').value.trim(),
    tags: document.getElementById('ct_tags').value.trim(),
    notes: document.getElementById('ct_notes').value
  };
  const r = await window.api.contacts.update(currentContactId, updates);
  if (r.ok) {
    setStatus('✓ Kişi kaydedildi');
    await renderContactsList();
    await loadContactIntoDetail(currentContactId);
  } else {
    alert('Kayıt hatası: ' + (r.error || ''));
  }
}

async function deleteCurrentContact() {
  if (!currentContactId) return;
  const c = await window.api.contacts.get(currentContactId);
  if (!confirm(`"${c.name || c.email}" silinsin mi?`)) return;
  await window.api.contacts.delete(currentContactId);
  currentContactId = null;
  document.getElementById('contactsDetail').classList.add('hidden');
  document.getElementById('contactsEmpty').classList.remove('hidden');
  await renderContactsList();
  setStatus('Kişi silindi');
}

async function toggleFavCurrentContact() {
  if (!currentContactId) return;
  const c = await window.api.contacts.get(currentContactId);
  await window.api.contacts.update(currentContactId, { is_favorite: !c.is_favorite });
  await loadContactIntoDetail(currentContactId);
  await renderContactsList();
}

async function composeToCurrentContact() {
  if (!currentContactId) return;
  const c = await window.api.contacts.get(currentContactId);
  if (!c) return;
  document.getElementById('modalContacts').classList.add('hidden');
  const recipient = c.name ? `${c.name} <${c.email}>` : c.email;
  openCompose({ to: recipient });
}

// ============= v1.16: Compose Autocomplete =============
class RecipientAutocomplete {
  constructor(inputEl) {
    this.input = inputEl;
    this.dropdown = null;
    this.items = [];
    this.activeIdx = -1;
    this.startPos = 0;
    this.lastQuery = '';

    this.input.addEventListener('input', () => this.onInput());
    this.input.addEventListener('keydown', (e) => this.onKeydown(e));
    this.input.addEventListener('blur', () => setTimeout(() => this.hide(), 200));
  }

  async onInput() {
    const value = this.input.value;
    const cursor = this.input.selectionStart;
    const before = value.slice(0, cursor);
    // Son separator'dan sonraki kısmı al
    const lastSep = Math.max(before.lastIndexOf(','), before.lastIndexOf(';'));
    const token = before.slice(lastSep + 1).trim();
    this.startPos = lastSep + 1;

    if (token.length < 2) { this.hide(); return; }
    if (token === this.lastQuery) return;
    this.lastQuery = token;

    const results = await window.api.contacts.search(token, 8);
    this.show(results);
  }

  show(items) {
    this.items = items || [];
    this.activeIdx = this.items.length > 0 ? 0 : -1;
    if (!this.dropdown) {
      this.dropdown = document.createElement('div');
      this.dropdown.className = 'recipient-autocomplete';
      document.body.appendChild(this.dropdown);
    }
    if (!this.items.length) { this.hide(); return; }

    this.dropdown.innerHTML = this.items.map((c, i) => {
      const initial = (c.name || c.email).charAt(0).toUpperCase();
      return `
        <div class="rac-item ${i === this.activeIdx ? 'active' : ''}" data-idx="${i}">
          <div class="rac-avatar">${escapeHtml(initial)}</div>
          <div class="rac-info">
            <div class="rac-name">${c.is_favorite ? '⭐ ' : ''}${escapeHtml(c.name || c.email.split('@')[0])}</div>
            <div class="rac-email">${escapeHtml(c.email)}${c.organization ? ' · ' + escapeHtml(c.organization) : ''}</div>
          </div>
          ${c.use_count > 1 ? `<span class="rac-uses">${c.use_count}×</span>` : ''}
        </div>
      `;
    }).join('');

    const rect = this.input.getBoundingClientRect();
    this.dropdown.style.top = (rect.bottom + window.scrollY + 2) + 'px';
    this.dropdown.style.left = (rect.left + window.scrollX) + 'px';
    this.dropdown.style.minWidth = rect.width + 'px';
    this.dropdown.classList.add('show');

    this.dropdown.querySelectorAll('.rac-item').forEach(el => {
      el.onmousedown = (e) => {
        e.preventDefault();
        const idx = parseInt(el.dataset.idx, 10);
        this.select(this.items[idx]);
      };
    });
  }

  hide() {
    if (this.dropdown) this.dropdown.classList.remove('show');
    this.items = [];
    this.activeIdx = -1;
  }

  onKeydown(e) {
    if (!this.items.length || !this.dropdown || !this.dropdown.classList.contains('show')) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.activeIdx = (this.activeIdx + 1) % this.items.length;
      this._renderActive();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.activeIdx = (this.activeIdx - 1 + this.items.length) % this.items.length;
      this._renderActive();
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (this.activeIdx >= 0) {
        e.preventDefault();
        this.select(this.items[this.activeIdx]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.hide();
    }
  }

  _renderActive() {
    if (!this.dropdown) return;
    this.dropdown.querySelectorAll('.rac-item').forEach((el, i) => {
      el.classList.toggle('active', i === this.activeIdx);
    });
  }

  select(c) {
    const value = this.input.value;
    const cursor = this.input.selectionStart;
    const before = value.slice(0, this.startPos);
    const after = value.slice(cursor);

    const formatted = c.name ? `${c.name} <${c.email}>` : c.email;
    const beforeTrimmed = before.replace(/[\s,;]*$/, '');
    const sep = beforeTrimmed ? ', ' : '';
    const newValue = beforeTrimmed + sep + formatted + ', ' + after.replace(/^[\s,;]+/, '');

    this.input.value = newValue;
    const newCursor = beforeTrimmed.length + sep.length + formatted.length + 2;
    this.input.setSelectionRange(newCursor, newCursor);
    this.input.focus();

    this.lastQuery = '';
    this.hide();
  }
}

function attachAutocompleteToCompose() {
  ['compose_to', 'compose_cc'].forEach(id => {
    const el = document.getElementById(id);
    if (el && !el.dataset.acBound) {
      el.dataset.acBound = '1';
      new RecipientAutocomplete(el);
    }
  });
}

// ============= v1.18: Görevler / To-Do (Lotus Notes Tasks) =============
let currentTaskId = null;
let currentTaskFilter = 'open';
let tasksUIBound = false;

async function openTasks() {
  document.getElementById('modalTasks').classList.remove('hidden');
  if (!tasksUIBound) {
    tasksUIBound = true;
    bindTasksUI();
  }
  await refreshTaskFilterCounts();
  await renderTasksList();
}

function bindTasksUI() {
  document.getElementById('btnNewTask').onclick = createNewTask;
  document.getElementById('tasksSearchInput').oninput = debounce(renderTasksList, 200);

  // Filtre tıklaması
  document.querySelectorAll('.task-filter').forEach(el => {
    el.onclick = () => {
      document.querySelectorAll('.task-filter').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
      currentTaskFilter = el.dataset.filter;
      renderTasksList();
    };
  });

  // Detay form değişiklikleri otomatik kaydedilsin (debounced)
  const autoFields = ['task_title', 'task_description', 'task_priority', 'task_status',
                      'task_due_date', 'task_reminder_at', 'task_category', 'task_tags', 'task_color'];
  for (const id of autoFields) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.addEventListener('change', debounce(saveCurrentTask, 300));
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.addEventListener('blur', () => saveCurrentTask());
    }
  }

  // Tamamla checkbox
  const checkEl = document.getElementById('task_completed_check');
  if (checkEl) {
    checkEl.onchange = async () => {
      if (!currentTaskId) return;
      if (checkEl.checked) await window.api.tasks.complete(currentTaskId);
      else await window.api.tasks.uncomplete(currentTaskId);
      await refreshTaskFilterCounts();
      await refreshTasksBadge();
      await renderTasksList();
      await loadTaskIntoDetail(currentTaskId);
    };
  }

  document.getElementById('btnDeleteTask').onclick = deleteCurrentTask;
}

async function refreshTaskFilterCounts() {
  const filters = ['open', 'today', 'tomorrow', 'thisWeek', 'overdue', 'highPriority', 'completed', 'all'];
  for (const f of filters) {
    try {
      const list = await window.api.tasks.list({ filter: f });
      const el = document.getElementById('tf_' + f);
      if (el) el.textContent = list.length;
    } catch (_) {}
  }
  // Header counter
  try {
    const stats = await window.api.tasks.stats();
    const headerEl = document.getElementById('tasksHeaderCount');
    if (headerEl && stats) {
      headerEl.textContent = `(${stats.open || 0} açık · ${stats.completed || 0} tamamlanmış)`;
    }
  } catch (_) {}
}

async function renderTasksList() {
  const search = document.getElementById('tasksSearchInput').value.trim();
  const list = await window.api.tasks.list({ filter: currentTaskFilter, search });

  const el = document.getElementById('tasksList');
  if (!list.length) {
    el.innerHTML = '<div class="empty-state" style="padding:40px;">Görev yok</div>';
    return;
  }

  const now = Date.now();
  el.innerHTML = list.map(t => {
    const isCompleted = t.status === 'completed' || t.status === 'cancelled';
    const dueDate = t.due_date ? new Date(t.due_date) : null;
    let dueText = '', dueClass = '';
    if (dueDate) {
      const diffMs = dueDate.getTime() - now;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (!isCompleted && diffMs < 0) {
        dueClass = 'task-overdue';
        dueText = `🔴 ${Math.abs(diffDays)} gün gecikti`;
      } else if (diffDays === 0) {
        dueClass = 'task-today';
        dueText = `📅 Bugün ${dueDate.toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}`;
      } else if (diffDays === 1) {
        dueClass = 'task-tomorrow';
        dueText = '⏭ Yarın';
      } else if (diffDays > 0 && diffDays <= 7) {
        dueText = `📆 ${diffDays} gün sonra`;
      } else {
        dueText = dueDate.toLocaleDateString('tr-TR');
      }
    }

    let priorityIcon = '➡', priorityClass = 'priority-normal';
    if (t.priority === 'urgent') { priorityIcon = '🔥'; priorityClass = 'priority-urgent'; }
    else if (t.priority === 'high') { priorityIcon = '⬆'; priorityClass = 'priority-high'; }
    else if (t.priority === 'low') { priorityIcon = '⬇'; priorityClass = 'priority-low'; }

    const reminder = t.reminder_at ? '⏰' : '';
    const fromMail = t.related_message_id ? '📧' : '';

    return `
      <div class="task-item ${currentTaskId === t.id ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${dueClass}"
           data-id="${t.id}" style="border-left:4px solid ${t.color || '#3498db'};">
        <div class="task-check-col">
          <input type="checkbox" class="task-check" data-id="${t.id}" ${isCompleted ? 'checked' : ''} onclick="event.stopPropagation();">
        </div>
        <div class="task-info">
          <div class="task-row-1">
            <span class="${priorityClass}">${priorityIcon}</span>
            <span class="task-title-text ${isCompleted ? 'strike' : ''}">${escapeHtml(t.title)}</span>
            ${reminder} ${fromMail}
          </div>
          <div class="task-row-2">
            ${t.category ? `<span class="task-cat">🏷 ${escapeHtml(t.category)}</span>` : ''}
            ${dueText ? `<span class="task-due">${dueText}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Click handlers
  el.querySelectorAll('.task-item').forEach(item => {
    item.onclick = () => loadTaskIntoDetail(parseInt(item.dataset.id, 10));
  });
  el.querySelectorAll('.task-check').forEach(cb => {
    cb.onchange = async () => {
      const id = parseInt(cb.dataset.id, 10);
      if (cb.checked) await window.api.tasks.complete(id);
      else await window.api.tasks.uncomplete(id);
      await refreshTaskFilterCounts();
      await refreshTasksBadge();
      await renderTasksList();
      if (currentTaskId === id) await loadTaskIntoDetail(id);
    };
  });
}

async function loadTaskIntoDetail(id) {
  const t = await window.api.tasks.get(id);
  if (!t) return;
  currentTaskId = id;

  document.getElementById('tasksEmpty').classList.add('hidden');
  document.getElementById('tasksDetail').classList.remove('hidden');

  document.getElementById('task_title').value = t.title || '';
  document.getElementById('task_description').value = t.description || '';
  document.getElementById('task_priority').value = t.priority || 'normal';
  document.getElementById('task_status').value = t.status || 'pending';
  document.getElementById('task_category').value = t.category || '';
  document.getElementById('task_tags').value = t.tags || '';
  document.getElementById('task_color').value = t.color || '#3498db';
  document.getElementById('task_due_date').value = t.due_date ? toLocalDateTimeInput(t.due_date) : '';
  document.getElementById('task_reminder_at').value = t.reminder_at ? toLocalDateTimeInput(t.reminder_at) : '';
  document.getElementById('task_completed_check').checked = (t.status === 'completed');

  // İlişkili mesaj/contact bilgisi
  let relations = '';
  if (t.related_message_id) {
    relations += `📧 Bağlı mesaj #${t.related_message_id} `;
  }
  if (t.created_at) relations += ` · Oluşturuldu: ${new Date(t.created_at).toLocaleString('tr-TR')}`;
  if (t.completed_at) relations += ` · Tamamlandı: ${new Date(t.completed_at).toLocaleString('tr-TR')}`;
  document.getElementById('task_relations').textContent = relations;

  // Aktif item'ı vurgula
  document.querySelectorAll('.task-item').forEach(el => el.classList.remove('active'));
  document.querySelector(`.task-item[data-id="${id}"]`)?.classList.add('active');
}

function toLocalDateTimeInput(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}

function fromLocalDateTimeInput(localStr) {
  if (!localStr) return null;
  return new Date(localStr).toISOString();
}

async function createNewTask() {
  const r = await window.api.tasks.add({
    title: 'Yeni Görev',
    priority: 'normal',
    status: 'pending'
  });
  if (r.ok) {
    await refreshTaskFilterCounts();
    await refreshTasksBadge();
    await renderTasksList();
    await loadTaskIntoDetail(r.id);
    setTimeout(() => {
      const titleEl = document.getElementById('task_title');
      titleEl.focus();
      titleEl.select();
    }, 100);
  }
}

async function saveCurrentTask() {
  if (!currentTaskId) return;
  const updates = {
    title: document.getElementById('task_title').value.trim() || 'Başlıksız',
    description: document.getElementById('task_description').value || null,
    priority: document.getElementById('task_priority').value,
    status: document.getElementById('task_status').value,
    category: document.getElementById('task_category').value.trim() || null,
    tags: document.getElementById('task_tags').value.trim() || null,
    color: document.getElementById('task_color').value,
    due_date: fromLocalDateTimeInput(document.getElementById('task_due_date').value),
    reminder_at: fromLocalDateTimeInput(document.getElementById('task_reminder_at').value)
  };
  // Eğer reminder değiştirildiyse reminder_sent'i sıfırla (tekrar bildirilsin)
  updates.reminder_sent = updates.reminder_at ? 0 : 0;
  // Status completed ise completed_at güncelle
  if (updates.status === 'completed') {
    const t = await window.api.tasks.get(currentTaskId);
    if (t && !t.completed_at) updates.completed_at = new Date().toISOString();
  } else {
    updates.completed_at = null;
  }
  await window.api.tasks.update(currentTaskId, updates);
  await refreshTaskFilterCounts();
  await refreshTasksBadge();
  await renderTasksList();
}

async function deleteCurrentTask() {
  if (!currentTaskId) return;
  if (!confirm('Bu görev silinsin mi?')) return;
  await window.api.tasks.delete(currentTaskId);
  currentTaskId = null;
  document.getElementById('tasksDetail').classList.add('hidden');
  document.getElementById('tasksEmpty').classList.remove('hidden');
  await refreshTaskFilterCounts();
  await refreshTasksBadge();
  await renderTasksList();
  setStatus('Görev silindi');
}

// Toolbar'daki açık görev sayacı
async function refreshTasksBadge() {
  try {
    const stats = await window.api.tasks.stats();
    const badge = document.getElementById('tasksBadge');
    if (!badge) return;
    if (stats && stats.overdue > 0) {
      badge.textContent = String(stats.overdue);
      badge.classList.remove('hidden');
      badge.classList.add('overdue');
    } else if (stats && stats.todayCount > 0) {
      badge.textContent = String(stats.todayCount);
      badge.classList.remove('hidden', 'overdue');
    } else {
      badge.classList.add('hidden');
    }
  } catch (_) {}
}

// Mailden görev oluştur (sağ tık menüden)
async function createTaskFromMessage(msg) {
  if (!msg) return;
  const subject = msg.subject || '(Konusuz)';
  const fromName = msg.from_name || msg.from_addr || '?';
  const desc = `📧 ${fromName} <${msg.from_addr || ''}>\n📅 ${msg.date ? new Date(msg.date).toLocaleString('tr-TR') : ''}\n📌 ${subject}\n\n${(msg.body_text || '').slice(0, 500)}${msg.body_text && msg.body_text.length > 500 ? '...' : ''}`;
  const r = await window.api.tasks.add({
    title: '📧 ' + subject.slice(0, 100),
    description: desc,
    priority: 'normal',
    status: 'pending',
    category: 'Maillerden',
    color: '#9b59b6',
    related_message_id: msg.id
  });
  if (r.ok) {
    await refreshTasksBadge();
    setStatus('✓ Görev oluşturuldu - Görevler penceresinde');
    await openTasks();
    setTimeout(() => loadTaskIntoDetail(r.id), 200);
  }
}

// Task reminder bildirim listener
if (window.api && window.api.on) {
  window.api.on('task:reminder', () => {
    refreshTasksBadge();
  });
}

// ============= v1.21: Komut Paleti (Ctrl+K) =============
const cmdPaletteState = {
  commands: [],
  filtered: [],
  activeIdx: 0,
  bound: false
};

function buildCommandList() {
  const cmds = [
    { id: 'compose', label: 'Yeni Mesaj', icon: '✉', shortcut: 'Ctrl+N',
      action: () => openCompose(), category: 'Mesaj' },
    { id: 'sync', label: 'Senkronize Et (tüm hesaplar)', icon: '🔄', shortcut: 'F5',
      action: () => syncAll(), category: 'Mesaj' },
    { id: 'search', label: 'Arama yap', icon: '🔍', shortcut: 'Ctrl+F',
      action: () => { const sb = document.getElementById('searchBox'); if (sb) { sb.focus(); sb.select(); } }, category: 'Mesaj' },
    { id: 'unified-inbox', label: 'Birleşik Gelen Kutusu', icon: '📥',
      action: () => { const b = document.getElementById('btnUnifiedInbox'); if (b) b.click(); }, category: 'Mesaj' },
    { id: 'mark-all-read', label: 'Klasördeki tümünü okundu işaretle', icon: '✓✓',
      action: () => markAllRead(), category: 'Mesaj' },

    { id: 'contacts', label: 'Adres Defteri', icon: '👥',
      action: () => openContacts(), category: 'Modül' },
    { id: 'contacts-import', label: 'Kişileri içe aktar (vCard/CSV)', icon: '📥',
      action: () => importContactsFromFile(), category: 'Modül' },
    { id: 'contacts-export-vcf', label: 'Kişileri dışa aktar (vCard)', icon: '📤',
      action: () => exportContactsToFile('vcard'), category: 'Modül' },
    { id: 'contacts-export-csv', label: 'Kişileri dışa aktar (CSV)', icon: '📤',
      action: () => exportContactsToFile('csv'), category: 'Modül' },
    { id: 'notes', label: 'Notlar (Lotus Notes tarzı)', icon: '📓',
      action: () => openNotes(), category: 'Modül' },
    { id: 'tasks', label: 'Görevler / To-Do', icon: '✅',
      action: () => openTasks(), category: 'Modül' },
    { id: 'archive', label: 'Arşiv (eski mesajlar)', icon: '📦',
      action: () => openArchive(), category: 'Modül' },
    { id: 'archive-old', label: 'Eski mesajları toplu arşivle', icon: '📥',
      action: () => openArchiveOldDialog(), category: 'Modül' },
    { id: 'calendar', label: 'Takvim', icon: '📅',
      action: () => openCalendar(), category: 'Modül' },
    { id: 'autocategorize-all', label: 'Tüm etiketsiz mailleri otomatik kategorize et', icon: '🏷',
      action: async () => {
        const r = await window.api.autoCategorize.all({ onlyUntagged: true });
        if (r.ok) {
          setStatus(`✓ ${r.categorized} mail kategorize edildi (${r.scanned} tarandı, ${r.totalLabels} etiket)`);
          if (state.selectedFolder) await loadMessages();
        } else alert('Hata: ' + r.error);
      }, category: 'Modül' },
    { id: 'pgp', label: 'PGP Anahtar Yönetimi', icon: '🔐',
      action: () => openPGP(), category: 'Modül' },
    { id: 'templates', label: 'Şablonlar', icon: '📝',
      action: () => { const b = document.getElementById('btnTemplates'); if (b) b.click(); }, category: 'Modül' },
    { id: 'rules', label: 'Filtre Kuralları', icon: '🔧',
      action: () => { const b = document.getElementById('btnRules'); if (b) b.click(); }, category: 'Modül' },
    { id: 'trusted', label: 'Güvenilir Göndericiler', icon: '🛡',
      action: () => openTrustedSenders(), category: 'Modül' },

    { id: 'add-account', label: 'Yeni Mail Hesabı Ekle', icon: '➕',
      action: () => openAccountModal(), category: 'Hesap' },
    { id: 'settings', label: 'Ayarlar', icon: '⚙', shortcut: 'Ctrl+,',
      action: () => openSettings(), category: 'Hesap' },

    { id: 'backup', label: 'Yedekleme - Şifreli Dosya Oluştur', icon: '💾',
      action: () => doBackup(), category: 'Bakım' },
    { id: 'restore', label: 'Geri Yükle - Yedek Dosyasından', icon: '📥',
      action: () => doRestore(), category: 'Bakım' },
    { id: 'sync-history', label: 'Senkronizasyon İlerleme Penceresi', icon: '📊',
      action: () => { document.getElementById('modalSyncProgress').classList.remove('hidden'); }, category: 'Bakım' },
    { id: 'lock-app', label: 'Şimdi Kilitle (master şifre gerekli)', icon: '🔒',
      action: async () => {
        if (confirm('Uygulama hemen kilitlensin mi?')) await window.api.security.lockApp();
      }, category: 'Bakım' },

    { id: 'kb-help', label: 'Klavye Kısayolları Yardımı', icon: '⌨', shortcut: 'Ctrl+/',
      action: () => document.getElementById('modalKeyboardHelp').classList.remove('hidden'), category: 'Yardım' },
    { id: 'about', label: 'Hakkında', icon: 'ℹ',
      action: () => { const b = document.getElementById('btnAbout'); if (b) b.click(); }, category: 'Yardım' }
  ];

  // Mevcut mesaj seçili ise mesaj eylemlerini de ekle
  if (state.selectedMessage) {
    cmds.unshift(
      { id: 'reply', label: 'Bu mesajı cevapla', icon: '↩', shortcut: 'R',
        action: () => openCompose({ replyTo: state.selectedMessage }), category: 'Mevcut Mesaj' },
      { id: 'reply-all', label: 'Bu mesajı tümüne cevapla', icon: '↩↩', shortcut: 'A',
        action: () => openCompose({ replyTo: state.selectedMessage, replyAll: true }), category: 'Mevcut Mesaj' },
      { id: 'forward', label: 'Bu mesajı ilet', icon: '↪', shortcut: 'F',
        action: () => openCompose({ forward: state.selectedMessage }), category: 'Mevcut Mesaj' },
      { id: 'delete-msg', label: 'Bu mesajı sil', icon: '🗑', shortcut: 'Delete',
        action: () => deleteCurrentMessage(), category: 'Mevcut Mesaj' },
      { id: 'task-from-msg', label: 'Bu mesajdan görev oluştur', icon: '✅',
        action: () => createTaskFromMessage(state.selectedMessage), category: 'Mevcut Mesaj' },
      { id: 'event-from-msg', label: 'Bu mesajdan etkinlik oluştur', icon: '📅',
        action: () => createEventFromMessage(state.selectedMessage), category: 'Mevcut Mesaj' },
      { id: 'note-from-msg', label: 'Bu mesajdan not oluştur', icon: '📓',
        action: () => createNoteFromMessage(state.selectedMessage), category: 'Mevcut Mesaj' }
    );
  }

  // Hesap geçişi komutları
  if (state.accounts && state.accounts.length) {
    state.accounts.forEach((acc, i) => {
      if (i < 9) {
        cmds.push({
          id: 'select-acc-' + acc.id,
          label: `Hesaba geç: ${acc.display_name}`,
          icon: '📧',
          shortcut: 'Ctrl+' + (i + 1),
          action: () => selectAccount(acc.id),
          category: 'Hesap Geçişi'
        });
      }
    });
  }

  return cmds;
}

function openCommandPalette() {
  const modal = document.getElementById('modalCommandPalette');
  const input = document.getElementById('cmdPaletteInput');

  cmdPaletteState.commands = buildCommandList();
  cmdPaletteState.filtered = cmdPaletteState.commands;
  cmdPaletteState.activeIdx = 0;

  if (!cmdPaletteState.bound) {
    cmdPaletteState.bound = true;
    bindCommandPalette();
  }

  modal.classList.remove('hidden');
  input.value = '';
  setTimeout(() => input.focus(), 30);
  renderCommandPaletteResults();
}

function bindCommandPalette() {
  const input = document.getElementById('cmdPaletteInput');
  const modal = document.getElementById('modalCommandPalette');

  input.addEventListener('input', () => {
    cmdPaletteState.filtered = filterCommands(cmdPaletteState.commands, input.value);
    cmdPaletteState.activeIdx = 0;
    renderCommandPaletteResults();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      cmdPaletteState.activeIdx = Math.min(cmdPaletteState.filtered.length - 1, cmdPaletteState.activeIdx + 1);
      renderCommandPaletteResults();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      cmdPaletteState.activeIdx = Math.max(0, cmdPaletteState.activeIdx - 1);
      renderCommandPaletteResults();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = cmdPaletteState.filtered[cmdPaletteState.activeIdx];
      if (cmd) executeCommand(cmd);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      modal.classList.add('hidden');
    }
  });

  // Modalın dışına tıklayınca kapat
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });
}

function executeCommand(cmd) {
  document.getElementById('modalCommandPalette').classList.add('hidden');
  setTimeout(() => {
    try { cmd.action(); }
    catch (e) { console.warn('Komut hatası:', e); setStatus('Komut çalıştırılamadı: ' + e.message, 'error'); }
  }, 50);
}

function filterCommands(commands, query) {
  if (!query || !query.trim()) return commands;
  const q = query.toLowerCase().trim();

  // Basit fuzzy: her karakter sırayla geçiyor mu? + substring bonusu
  const scored = commands.map(c => {
    const label = c.label.toLowerCase();
    const cat = (c.category || '').toLowerCase();
    let score = 0;
    if (label.includes(q)) score += 100;
    if (label.startsWith(q)) score += 50;
    if (cat.includes(q)) score += 20;
    // Fuzzy karakter eşleme
    let qi = 0;
    for (let i = 0; i < label.length && qi < q.length; i++) {
      if (label[i] === q[qi]) { score += 1; qi++; }
    }
    if (qi < q.length) {
      // Bütün karakterler bulunamadıysa
      // category'de de bak
      qi = 0;
      for (let i = 0; i < cat.length && qi < q.length; i++) {
        if (cat[i] === q[qi]) { score += 0.5; qi++; }
      }
      if (qi < q.length) score = 0;
    }
    return { cmd: c, score };
  });

  return scored
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(x => x.cmd);
}

function renderCommandPaletteResults() {
  const el = document.getElementById('cmdPaletteResults');
  const cmds = cmdPaletteState.filtered;

  if (!cmds.length) {
    el.innerHTML = '<div class="cmd-empty">Komut bulunamadı</div>';
    return;
  }

  // Kategoriye göre grupla
  const byCategory = {};
  cmds.forEach(c => {
    const cat = c.category || 'Diğer';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(c);
  });

  let html = '';
  let runningIdx = 0;
  for (const [cat, list] of Object.entries(byCategory)) {
    html += `<div class="cmd-category">${escapeHtml(cat)}</div>`;
    for (const c of list) {
      const isActive = runningIdx === cmdPaletteState.activeIdx;
      html += `
        <div class="cmd-item ${isActive ? 'active' : ''}" data-idx="${runningIdx}">
          <span class="cmd-icon">${c.icon || '·'}</span>
          <span class="cmd-label">${escapeHtml(c.label)}</span>
          ${c.shortcut ? `<span class="cmd-shortcut">${escapeHtml(c.shortcut)}</span>` : ''}
        </div>
      `;
      runningIdx++;
    }
  }

  el.innerHTML = html;

  // Click handlers
  el.querySelectorAll('.cmd-item').forEach(item => {
    item.onmousedown = (e) => {
      e.preventDefault();
      const idx = parseInt(item.dataset.idx, 10);
      const cmd = cmdPaletteState.filtered[idx];
      if (cmd) executeCommand(cmd);
    };
    item.onmouseenter = () => {
      const idx = parseInt(item.dataset.idx, 10);
      cmdPaletteState.activeIdx = idx;
      // Aktif sınıfını güncelle (re-render değil, performance)
      el.querySelectorAll('.cmd-item').forEach(x => x.classList.remove('active'));
      item.classList.add('active');
    };
  });

  // Aktif olanı görünür yap
  const activeEl = el.querySelector('.cmd-item.active');
  if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
}

// ============= v1.22: Yazım Denetimi =============
async function loadSpellSettings() {
  try {
    const info = await window.api.spell.getInfo();

    document.getElementById('settings_spell_enabled').checked = info.enabled;

    const langCheckboxes = {
      'spell_lang_tr': 'tr',
      'spell_lang_en': 'en-US',
      'spell_lang_de': 'de',
      'spell_lang_fr': 'fr'
    };
    for (const [domId, langCode] of Object.entries(langCheckboxes)) {
      const el = document.getElementById(domId);
      if (el) {
        el.checked = info.current.includes(langCode);
        // Desteklenmiyorsa disable
        if (!info.available.includes(langCode)) {
          el.disabled = true;
          el.parentElement.style.opacity = '0.4';
          el.parentElement.title = 'Bu dil bu sistemde desteklenmiyor';
        }
      }
    }

    // Status
    const statusEl = document.getElementById('spell_lang_status');
    if (statusEl) {
      const supported = info.available.length;
      statusEl.textContent = `${info.current.length} dil aktif · sistemde ${supported} dil mevcut · birden çok dil seçilirse hepsi aynı anda kontrol edilir`;
    }

    // Custom dictionary listesi
    renderCustomDict(info.customWords || []);

    // Event listener'lar (sadece bir kez bağla)
    if (!state.spellBound) {
      state.spellBound = true;
      bindSpellSettings();
    }
  } catch (e) {
    console.warn('Spell settings yükleme hatası:', e);
  }
}

function bindSpellSettings() {
  document.getElementById('settings_spell_enabled').addEventListener('change', async (e) => {
    await window.api.spell.setEnabled(e.target.checked);
    flashSettingsSavedIndicator();
    setStatus('Yazım denetimi ' + (e.target.checked ? 'açık' : 'kapalı'));
  });

  const langIds = ['spell_lang_tr', 'spell_lang_en', 'spell_lang_de', 'spell_lang_fr'];
  for (const id of langIds) {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', applySpellLanguages);
    }
  }
}

async function applySpellLanguages() {
  const langs = [];
  if (document.getElementById('spell_lang_tr').checked) langs.push('tr');
  if (document.getElementById('spell_lang_en').checked) langs.push('en-US');
  if (document.getElementById('spell_lang_de').checked) langs.push('de');
  if (document.getElementById('spell_lang_fr').checked) langs.push('fr');
  const r = await window.api.spell.setLanguages(langs);
  if (r && r.ok) {
    flashSettingsSavedIndicator();
    setStatus(`✓ ${r.applied.length} dil aktif`);
  } else {
    setStatus('Dil değişikliği başarısız', 'error');
  }
  // Re-render status
  await loadSpellSettings();
}

function renderCustomDict(words) {
  const el = document.getElementById('customDictList');
  if (!el) return;
  if (!words.length) {
    el.innerHTML = '<span class="empty-dict">Sözlüğünüze henüz kelime eklemediniz</span>';
    return;
  }
  el.innerHTML = words.map(w => `
    <span class="dict-word" data-word="${escapeHtml(w)}" title="Tıkla: kaldır">
      ${escapeHtml(w)} <span class="dict-remove">×</span>
    </span>
  `).join('');

  el.querySelectorAll('.dict-word').forEach(elem => {
    elem.onclick = async () => {
      const word = elem.dataset.word;
      if (!confirm(`"${word}" özel sözlükten kaldırılsın mı?`)) return;
      await window.api.spell.removeWord(word);
      await loadSpellSettings();
      setStatus('"' + word + '" kaldırıldı');
    };
  });
}

// ============= v1.23: Lock Screen + Güvenlik =============

/**
 * Lock screen göster, kullanıcı şifre girene kadar Promise'i resolve etme
 */
async function checkLockScreen() {
  let status;
  try {
    status = await window.api.security.status();
  } catch (e) {
    return; // güvenlik IPC yoksa atla
  }
  if (!status.hasMasterPassword || status.unlocked) return;

  return new Promise((resolve) => {
    showLockScreen(resolve, status);
  });
}

function showLockScreen(onUnlock, initialStatus) {
  const modal = document.getElementById('modalLockScreen');
  modal.classList.remove('hidden');
  modal.style.zIndex = 99999;

  const has2FA = initialStatus && initialStatus.has2FA;
  const pwInput = document.getElementById('lock_password');
  const tfaWrap = document.getElementById('lock_2fa_wrap');
  const recWrap = document.getElementById('lock_recovery_wrap');
  const errEl = document.getElementById('lock_error');
  const lockoutEl = document.getElementById('lock_lockout');

  // Reset
  document.getElementById('lock_password').value = '';
  document.getElementById('lock_2fa_code').value = '';
  document.getElementById('lock_recovery_code').value = '';
  errEl.classList.add('hidden');
  lockoutEl.classList.add('hidden');

  if (has2FA) {
    tfaWrap.classList.remove('hidden');
    recWrap.classList.add('hidden');
  } else {
    tfaWrap.classList.add('hidden');
    recWrap.classList.add('hidden');
  }

  setTimeout(() => pwInput.focus(), 100);

  // Recovery code toggle
  document.getElementById('lock_use_recovery').onclick = (e) => {
    e.preventDefault();
    tfaWrap.classList.add('hidden');
    recWrap.classList.remove('hidden');
    document.getElementById('lock_recovery_code').focus();
  };
  document.getElementById('lock_use_2fa_back').onclick = (e) => {
    e.preventDefault();
    recWrap.classList.add('hidden');
    tfaWrap.classList.remove('hidden');
    document.getElementById('lock_2fa_code').focus();
  };

  // Form submit
  const form = document.getElementById('lockForm');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const password = pwInput.value;
    const totpCode = document.getElementById('lock_2fa_code').value.trim();
    const recoveryCode = document.getElementById('lock_recovery_code').value.trim();

    if (!password) {
      errEl.textContent = 'Şifre girin';
      errEl.classList.remove('hidden');
      return;
    }

    const result = await window.api.security.verifyMasterPassword({
      password, totpCode, recoveryCode
    });

    if (result.ok) {
      modal.classList.add('hidden');
      if (result.recoveryUsed && result.unusedRecoveryCodes < 3) {
        setTimeout(() => alert(`⚠ Sadece ${result.unusedRecoveryCodes} recovery code kaldı. Ayarlar > Güvenlik bölümünden yenilerini üretmenizi öneririz.`), 800);
      }
      onUnlock();
      return;
    }

    if (result.lockedUntil && result.lockedUntil > Date.now()) {
      // Lockout - countdown göster
      lockoutEl.classList.remove('hidden');
      errEl.classList.add('hidden');
      const tick = () => {
        const remaining = Math.max(0, result.lockedUntil - Date.now());
        if (remaining <= 0) {
          lockoutEl.classList.add('hidden');
          return;
        }
        const sec = Math.ceil(remaining / 1000);
        const min = Math.floor(sec / 60);
        const s = sec % 60;
        lockoutEl.textContent = `🔒 ${result.error} ${min}:${String(s).padStart(2, '0')}`;
        setTimeout(tick, 1000);
      };
      tick();
      return;
    }

    errEl.textContent = result.error + (result.remaining !== undefined ? ` (${result.remaining} deneme hakkı kaldı)` : '');
    errEl.classList.remove('hidden');
    if (result.need2FA) {
      tfaWrap.classList.remove('hidden');
      document.getElementById('lock_2fa_code').focus();
    } else {
      pwInput.select();
    }
  };
}

// Locked event - app çalışırken kilitlendi
if (window.api && window.api.on) {
  window.api.on('security:locked', () => {
    location.reload();  // Yeniden yükle, init lock screen'i göstersin
  });
}

// ============= Settings - Güvenlik =============
async function refreshSecuritySettings() {
  try {
    const status = await window.api.security.status();
    const summary = document.getElementById('sec_state_summary');
    const noPw = document.getElementById('sec_no_password');
    const hasPw = document.getElementById('sec_has_password');
    const tfaOff = document.getElementById('sec_2fa_off');
    const tfaOn = document.getElementById('sec_2fa_on');

    if (!status.hasMasterPassword) {
      summary.innerHTML = '🔓 <strong>Ana şifre belirlenmemiş</strong> - Uygulama açılışta şifre sormaz';
      summary.className = 'sec-summary sec-warn';
      noPw.classList.remove('hidden');
      hasPw.classList.add('hidden');
    } else {
      noPw.classList.add('hidden');
      hasPw.classList.remove('hidden');
      if (status.has2FA) {
        summary.innerHTML = '🔐 <strong>Ana şifre + 2FA aktif</strong> - En yüksek güvenlik';
        summary.className = 'sec-summary sec-ok';
        tfaOff.classList.add('hidden');
        tfaOn.classList.remove('hidden');
        document.getElementById('sec_recovery_count').textContent = String(status.unusedRecoveryCodes || 0);
      } else {
        summary.innerHTML = '🔒 <strong>Ana şifre aktif</strong> - 2FA önerilir';
        summary.className = 'sec-summary sec-mid';
        tfaOff.classList.remove('hidden');
        tfaOn.classList.add('hidden');
      }
    }

    if (!state.securityBound) {
      state.securityBound = true;
      bindSecuritySettings();
    }
  } catch (e) {
    console.warn('Security status hatası:', e);
  }
}

function bindSecuritySettings() {
  document.getElementById('btnSetMasterPassword').onclick = async () => {
    const pw = await promptForPassword('Yeni Ana Şifre Belirle', 'En az 6 karakter olmalı', true);
    if (!pw) return;
    const r = await window.api.security.setMasterPassword({ newPassword: pw });
    if (r.ok) {
      setStatus('✓ Ana şifre belirlendi');
      await refreshSecuritySettings();
      await refreshIdleLockState();
    } else {
      alert('Hata: ' + r.error);
    }
  };

  document.getElementById('btnChangeMasterPassword').onclick = async () => {
    const current = await promptForPassword('Şifre Değiştirme', 'Mevcut ana şifrenizi girin');
    if (!current) return;
    const newPw = await promptForPassword('Yeni Şifre', 'Yeni ana şifrenizi girin (en az 6 karakter)', true);
    if (!newPw) return;
    const r = await window.api.security.setMasterPassword({ newPassword: newPw, currentPassword: current });
    if (r.ok) setStatus('✓ Şifre değiştirildi');
    else alert('Hata: ' + r.error);
  };

  document.getElementById('btnRemoveMasterPassword').onclick = async () => {
    if (!confirm('Ana şifre kaldırılacak. 2FA ve recovery code\'lar da silinecek. Devam edilsin mi?')) return;
    const current = await promptForPassword('Onay', 'Mevcut ana şifrenizi girin');
    if (!current) return;
    const r = await window.api.security.removeMasterPassword(current);
    if (r.ok) {
      setStatus('Ana şifre kaldırıldı');
      await refreshSecuritySettings();
      await refreshIdleLockState();
    } else {
      alert('Hata: ' + r.error);
    }
  };

  document.getElementById('btnLockNow').onclick = async () => {
    if (!confirm('Uygulama hemen kilitlensin mi? Tekrar açmak için ana şifrenizi gireceksiniz.')) return;
    await window.api.security.lockApp();
  };

  document.getElementById('btnEnable2FA').onclick = open2FASetup;

  document.getElementById('btnDisable2FA').onclick = async () => {
    if (!confirm('2FA kapatılacak. Recovery code\'lar da silinecek. Devam?')) return;
    const current = await promptForPassword('Onay', 'Mevcut ana şifrenizi girin');
    if (!current) return;
    const r = await window.api.security.disable2FA(current);
    if (r.ok) {
      setStatus('2FA kapatıldı');
      await refreshSecuritySettings();
    } else {
      alert('Hata: ' + r.error);
    }
  };

  document.getElementById('btnRegenRecovery').onclick = async () => {
    if (!confirm('Yeni recovery code\'lar üretilecek. Eski kodlar geçersiz olacak. Devam?')) return;
    const current = await promptForPassword('Onay', 'Mevcut ana şifrenizi girin');
    if (!current) return;
    const r = await window.api.security.regenerateRecoveryCodes(current);
    if (r.ok) {
      showRecoveryCodes(r.recoveryCodes);
      await refreshSecuritySettings();
    } else {
      alert('Hata: ' + r.error);
    }
  };
}

function promptForPassword(title, message, isNew = false) {
  return new Promise((resolve) => {
    const pw = prompt(`${title}\n\n${message}`);
    resolve(pw);
  });
}

async function open2FASetup() {
  // Kullanıcı email seç (ilk hesap)
  const email = state.accounts && state.accounts[0] ? state.accounts[0].email : 'user@codega.com.tr';
  const r = await window.api.security.start2FASetup({ email });
  if (!r.ok) { alert('Hata: ' + r.error); return; }

  document.getElementById('2fa_qr_img').src = r.qrDataUrl || '';
  document.getElementById('2fa_secret_text').textContent = r.secret;
  document.getElementById('2fa_verify_code').value = '';
  document.getElementById('2fa_setup_error').classList.add('hidden');
  document.getElementById('2fa_step1').classList.remove('hidden');
  document.getElementById('2fa_step2_codes').classList.add('hidden');

  document.getElementById('modal2FASetup').classList.remove('hidden');
  setTimeout(() => document.getElementById('2fa_verify_code').focus(), 100);

  if (!state.tfaSetupBound) {
    state.tfaSetupBound = true;
    document.getElementById('btn2FAVerify').onclick = async () => {
      const code = document.getElementById('2fa_verify_code').value.trim();
      if (!/^\d{6}$/.test(code)) {
        alert('6 haneli kod girin');
        return;
      }
      const cr = await window.api.security.confirm2FASetup({ code });
      if (!cr.ok) {
        const errEl = document.getElementById('2fa_setup_error');
        errEl.textContent = cr.error;
        errEl.classList.remove('hidden');
        return;
      }
      // Recovery codes göster
      document.getElementById('2fa_step1').classList.add('hidden');
      document.getElementById('2fa_step2_codes').classList.remove('hidden');
      renderRecoveryCodesInModal(cr.recoveryCodes);
    };
    document.getElementById('btn2FADone').onclick = async () => {
      document.getElementById('modal2FASetup').classList.add('hidden');
      await refreshSecuritySettings();
    };
  }
}

function renderRecoveryCodesInModal(codes) {
  const grid = document.getElementById('2fa_recovery_codes_list');
  grid.innerHTML = codes.map(c => `<div class="recovery-code">${escapeHtml(c)}</div>`).join('');
  document.getElementById('btnCopyRecoveryCodes').onclick = () => {
    navigator.clipboard.writeText(codes.join('\n'));
    setStatus('✓ Recovery code\'lar kopyalandı');
  };
  document.getElementById('btnPrintRecoveryCodes').onclick = () => {
    const w = window.open('', '_blank', 'width=600,height=600');
    w.document.write(`
      <html><head><title>CODEGA Mail - Recovery Codes</title>
      <style>body{font-family:sans-serif;padding:30px;}
      h1{font-size:18px;}
      .codes{font-family:monospace;font-size:18px;line-height:2.2;}
      .warn{background:#fff3cd;padding:10px;border-left:4px solid #ffc107;margin-bottom:14px;}
      </style></head>
      <body>
      <h1>🔐 CODEGA Mail - Recovery Codes</h1>
      <div class="warn">⚠ Her kod yalnızca BİR KEZ kullanılabilir. Güvenli bir yere saklayın.</div>
      <p>Tarih: ${new Date().toLocaleString('tr-TR')}</p>
      <div class="codes">${codes.map(c => '• ' + c).join('<br>')}</div>
      </body></html>
    `);
    setTimeout(() => w.print(), 500);
  };
}

function showRecoveryCodes(codes) {
  // Yeniden üretilen kodlar - aynı modali kullan
  document.getElementById('2fa_step1').classList.add('hidden');
  document.getElementById('2fa_step2_codes').classList.remove('hidden');
  document.getElementById('modal2FASetup').classList.remove('hidden');
  renderRecoveryCodesInModal(codes);
}

// ============= v1.24: Mesaj Arşivleme =============
let archiveCurrentAccountFilter = null;
let archiveUIBound = false;

async function archiveMessageFromList(message) {
  if (!message) return;
  const r = await window.api.archive.archive(message.id);
  if (r.ok) {
    setStatus('📦 Mesaj arşivlendi');
    await loadMessages();
    await loadAccounts();
  } else {
    alert('Hata: ' + r.error);
  }
}

async function openArchive() {
  document.getElementById('modalArchive').classList.remove('hidden');
  if (!archiveUIBound) {
    archiveUIBound = true;
    bindArchiveUI();
  }
  await renderArchiveView();
}

function bindArchiveUI() {
  document.getElementById('archiveSearchInput').oninput = debounce(renderArchiveView, 200);
  document.getElementById('btnArchiveOldDialog').onclick = openArchiveOldDialog;
  document.getElementById('btnArchiveOldExecute').onclick = executeArchiveOld;
}

async function renderArchiveView() {
  const search = document.getElementById('archiveSearchInput').value.trim();
  const stats = await window.api.archive.stats();
  const headerEl = document.getElementById('archiveHeaderCount');
  if (headerEl) {
    const sizeMB = (stats.totalSize / (1024 * 1024)).toFixed(1);
    headerEl.textContent = `(${stats.total} mesaj · ${sizeMB} MB)`;
  }

  // Hesap filtreleri (sol)
  const filtersEl = document.getElementById('archiveAccountFilters');
  let filtersHtml = `
    <div class="archive-filter ${!archiveCurrentAccountFilter ? 'active' : ''}" data-acc-id="">
      📂 Tümü <span class="archive-filter-count">${stats.total}</span>
    </div>
  `;
  for (const acc of stats.byAccount || []) {
    if (acc.count === 0) continue;
    filtersHtml += `
      <div class="archive-filter ${archiveCurrentAccountFilter === acc.id ? 'active' : ''}" data-acc-id="${acc.id}">
        📧 ${escapeHtml(acc.display_name)} <span class="archive-filter-count">${acc.count}</span>
      </div>
    `;
  }
  filtersEl.innerHTML = filtersHtml;
  filtersEl.querySelectorAll('.archive-filter').forEach(el => {
    el.onclick = () => {
      const accId = el.dataset.accId;
      archiveCurrentAccountFilter = accId ? parseInt(accId, 10) : null;
      renderArchiveView();
    };
  });

  // Özet panel
  const summary = document.getElementById('archiveSummary');
  if (summary) {
    let html = '';
    if (stats.oldestArchived) {
      html += `<div>📅 En eski: ${new Date(stats.oldestArchived).toLocaleDateString('tr-TR')}</div>`;
    }
    if (stats.lastArchivedAt) {
      html += `<div style="margin-top:4px;">⏱ Son işlem: ${new Date(stats.lastArchivedAt).toLocaleDateString('tr-TR')}</div>`;
    }
    summary.innerHTML = html || 'Henüz arşivlenmiş mesaj yok';
  }

  // Mesaj listesi
  const list = await window.api.archive.list({
    accountId: archiveCurrentAccountFilter,
    search,
    limit: 500
  });
  const listEl = document.getElementById('archiveList');
  if (!list.length) {
    listEl.innerHTML = '<div class="empty-state" style="padding:50px;font-size:13px;">Arşivde mesaj yok</div>';
    return;
  }

  listEl.innerHTML = list.map(m => `
    <div class="archive-item" data-id="${m.id}">
      <div class="archive-item-header">
        <span class="archive-item-from">${escapeHtml(m.from_name || m.from_addr || '')}</span>
        <span class="archive-item-date">${formatDate(m.date)}</span>
      </div>
      <div class="archive-item-subject">${m.is_important ? '⭐ ' : ''}${m.has_attachments ? '📎 ' : ''}${escapeHtml(m.subject || '(Konusuz)')}</div>
      <div class="archive-item-meta">
        <span class="archive-item-account">${escapeHtml(m.account_name || '')}</span>
        <span class="archive-item-folder">${escapeHtml(m.folder_name || '')}</span>
        <span class="archive-item-archived-at">📦 ${m.archived_at ? new Date(m.archived_at).toLocaleDateString('tr-TR') : ''}</span>
        <button class="btn btn-ghost archive-unarchive-btn" data-id="${m.id}" title="Arşivden çıkar">↩ Geri Al</button>
      </div>
    </div>
  `).join('');

  listEl.querySelectorAll('.archive-unarchive-btn').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id, 10);
      const r = await window.api.archive.unarchive(id);
      if (r.ok) {
        setStatus('✓ Arşivden çıkarıldı');
        await renderArchiveView();
        await loadAccounts();
      }
    };
  });
}

function openArchiveOldDialog() {
  // Hesap dropdown doldur
  const accSel = document.getElementById('archiveOldAccount');
  accSel.innerHTML = '<option value="">Tüm hesaplar</option>' +
    (state.accounts || []).map(a => `<option value="${a.id}">${escapeHtml(a.display_name)} - ${escapeHtml(a.email)}</option>`).join('');
  document.getElementById('archiveOldResult').classList.add('hidden');
  document.getElementById('modalArchiveOld').classList.remove('hidden');
}

async function executeArchiveOld() {
  const months = parseInt(document.getElementById('archiveOldMonths').value, 10);
  const accountId = document.getElementById('archiveOldAccount').value;
  const preserveImportant = document.getElementById('archiveOldPreserveImportant').checked;

  const btn = document.getElementById('btnArchiveOldExecute');
  btn.disabled = true;
  btn.textContent = '⏳ Arşivleniyor...';

  try {
    const r = await window.api.archive.archiveOld({
      months,
      accountId: accountId ? parseInt(accountId, 10) : undefined,
      preserveImportant
    });
    const resultEl = document.getElementById('archiveOldResult');
    if (r.ok) {
      const beforeStr = new Date(r.beforeDate).toLocaleDateString('tr-TR');
      resultEl.innerHTML = `✅ <strong>${r.count}</strong> mesaj arşivlendi (${beforeStr} öncesi)`;
      resultEl.classList.remove('hidden');
      setStatus(`📦 ${r.count} mesaj arşivlendi`);
      await loadMessages();
      await loadAccounts();
      await renderArchiveView();
      // 2 saniye sonra modal kapat
      setTimeout(() => document.getElementById('modalArchiveOld').classList.add('hidden'), 2000);
    } else {
      resultEl.innerHTML = '❌ Hata: ' + r.error;
      resultEl.classList.remove('hidden');
      resultEl.style.background = 'rgba(231,76,60,0.1)';
      resultEl.style.color = 'var(--danger)';
    }
  } finally {
    btn.disabled = false;
    btn.textContent = '📥 Arşivle';
  }
}

// Otomatik arşivleme bildirimi
if (window.api && window.api.on) {
  window.api.on('archive:auto-done', (data) => {
    setStatus(`📦 Otomatik arşivleme: ${data.count} eski mesaj arşivlendi (${data.months} ay öncesi)`);
    loadMessages().catch(() => {});
    loadAccounts().catch(() => {});
  });
}

// Klavye kısayolu: E (Gmail tarzı arşivleme)

// ============= v1.25: PGP / OpenPGP =============
let pgpUIBound = false;

async function openPGP() {
  document.getElementById('modalPGP').classList.remove('hidden');
  if (!pgpUIBound) {
    pgpUIBound = true;
    bindPGPUI();
  }
  await renderPgpKeys();
  await renderPgpContacts();
}

function bindPGPUI() {
  // Tab switching
  document.querySelectorAll('.pgp-tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.pgp-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      document.querySelectorAll('.pgp-pane').forEach(p => p.classList.add('hidden'));
      const paneId = 'pgpPane' + target.charAt(0).toUpperCase() + target.slice(1);
      document.getElementById(paneId)?.classList.remove('hidden');
    };
  });

  document.getElementById('btnGenPgpKey').onclick = openPgpGenerateDialog;
  document.getElementById('btnImportPgpContact').onclick = openPgpImportDialog;
  document.getElementById('btnPgpGenSubmit').onclick = submitPgpGenerate;
  document.getElementById('btnPgpImportSubmit').onclick = submitPgpImport;
  document.getElementById('btnPgpExportCopy').onclick = () => {
    navigator.clipboard.writeText(document.getElementById('pgp_export_text').value);
    setStatus('✓ Public key kopyalandı');
  };
  document.getElementById('btnPgpDecryptSubmit').onclick = submitPgpDecrypt;
}

async function renderPgpKeys() {
  const keys = await window.api.pgp.listKeys();
  const el = document.getElementById('pgpMyKeysList');
  if (!keys.length) {
    el.innerHTML = '<div class="empty-state" style="padding:30px;">Henüz anahtarınız yok. "+ Yeni Anahtar Üret" ile başlayın.</div>';
    return;
  }
  el.innerHTML = keys.map(k => `
    <div class="pgp-key-card ${k.is_default ? 'default' : ''}">
      <div class="pgp-key-header">
        <span class="pgp-key-icon">🗝</span>
        <div class="pgp-key-info">
          <div class="pgp-key-name">${k.is_default ? '⭐ ' : ''}${escapeHtml(k.name || k.email)} <small style="color:var(--muted);">${escapeHtml(k.email)}</small></div>
          <div class="pgp-key-fp" title="Fingerprint">${escapeHtml(formatFingerprint(k.fingerprint))}</div>
        </div>
      </div>
      <div class="pgp-key-actions">
        ${!k.is_default ? `<button class="btn btn-ghost" data-action="default" data-id="${k.id}">⭐ Varsayılan Yap</button>` : ''}
        <button class="btn" data-action="export" data-id="${k.id}">📤 Public Key Paylaş</button>
        <button class="btn btn-ghost" data-action="delete" data-id="${k.id}" style="color:var(--danger);">🗑 Sil</button>
      </div>
    </div>
  `).join('');

  el.querySelectorAll('[data-action]').forEach(btn => {
    btn.onclick = async () => {
      const action = btn.dataset.action;
      const id = parseInt(btn.dataset.id, 10);
      if (action === 'default') {
        await window.api.pgp.setDefault(id);
        await renderPgpKeys();
      } else if (action === 'export') {
        const r = await window.api.pgp.exportPublicKey(id);
        if (r.ok) {
          document.getElementById('pgp_export_text').value = r.publicKey;
          document.getElementById('modalPgpExport').classList.remove('hidden');
        }
      } else if (action === 'delete') {
        if (!confirm('Bu anahtar silinsin mi? Bu işlem geri alınamaz! Bu anahtarla şifrelenmiş tüm mailleriniz açılamaz hale gelir.')) return;
        await window.api.pgp.deleteKey(id);
        await renderPgpKeys();
        setStatus('Anahtar silindi');
      }
    };
  });
}

async function renderPgpContacts() {
  const contacts = await window.api.pgp.listContacts();
  const el = document.getElementById('pgpContactsList');
  if (!contacts.length) {
    el.innerHTML = '<div class="empty-state" style="padding:30px;">Henüz kişi public key\'i yok. Karşı taraf size kendi public key\'ini gönderdiğinde "+ Public Key İçe Aktar" ile ekleyin.</div>';
    return;
  }
  el.innerHTML = contacts.map(c => `
    <div class="pgp-key-card">
      <div class="pgp-key-header">
        <span class="pgp-key-icon">👤</span>
        <div class="pgp-key-info">
          <div class="pgp-key-name">${escapeHtml(c.name || c.email)} <small style="color:var(--muted);">${escapeHtml(c.email)}</small></div>
          <div class="pgp-key-fp" title="Fingerprint">${escapeHtml(formatFingerprint(c.fingerprint))}</div>
          <div style="margin-top:4px;font-size:11px;">
            Güven: <select class="pgp-trust" data-id="${c.id}" style="font-size:11px;padding:2px 6px;">
              <option value="unverified" ${c.trust_level === 'unverified' ? 'selected' : ''}>❓ Doğrulanmamış</option>
              <option value="verified" ${c.trust_level === 'verified' ? 'selected' : ''}>✅ Doğrulanmış</option>
              <option value="trusted" ${c.trust_level === 'trusted' ? 'selected' : ''}>⭐ Güvenilir</option>
            </select>
          </div>
        </div>
      </div>
      <div class="pgp-key-actions">
        <button class="btn btn-ghost" data-action="delete-contact" data-id="${c.id}" style="color:var(--danger);">🗑 Sil</button>
      </div>
    </div>
  `).join('');

  el.querySelectorAll('.pgp-trust').forEach(sel => {
    sel.onchange = async () => {
      await window.api.pgp.setContactTrust({ id: parseInt(sel.dataset.id, 10), level: sel.value });
      setStatus('Güven seviyesi güncellendi');
    };
  });
  el.querySelectorAll('[data-action="delete-contact"]').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Bu kişinin public key\'i silinsin mi?')) return;
      await window.api.pgp.deleteContact(parseInt(btn.dataset.id, 10));
      await renderPgpContacts();
    };
  });
}

function formatFingerprint(fp) {
  if (!fp) return '';
  // 4 karakterlik gruplar halinde formatla
  return fp.match(/.{1,4}/g).join(' ');
}

function openPgpGenerateDialog() {
  document.getElementById('pgp_gen_name').value = state.accounts && state.accounts[0] ? state.accounts[0].display_name : '';
  document.getElementById('pgp_gen_email').value = state.accounts && state.accounts[0] ? state.accounts[0].email : '';
  document.getElementById('pgp_gen_passphrase').value = '';
  document.getElementById('pgp_gen_passphrase2').value = '';
  document.getElementById('pgp_gen_progress').classList.add('hidden');
  document.getElementById('pgp_gen_error').classList.add('hidden');
  document.getElementById('btnPgpGenSubmit').disabled = false;
  document.getElementById('modalPgpGenerate').classList.remove('hidden');
}

async function submitPgpGenerate() {
  const name = document.getElementById('pgp_gen_name').value.trim();
  const email = document.getElementById('pgp_gen_email').value.trim();
  const pass1 = document.getElementById('pgp_gen_passphrase').value;
  const pass2 = document.getElementById('pgp_gen_passphrase2').value;
  const errEl = document.getElementById('pgp_gen_error');
  const progEl = document.getElementById('pgp_gen_progress');
  const btn = document.getElementById('btnPgpGenSubmit');

  errEl.classList.add('hidden');

  if (!email || !email.includes('@')) {
    errEl.textContent = 'Geçerli bir email girin';
    errEl.classList.remove('hidden'); return;
  }
  if (pass1.length < 8) {
    errEl.textContent = 'Passphrase en az 8 karakter olmalı';
    errEl.classList.remove('hidden'); return;
  }
  if (pass1 !== pass2) {
    errEl.textContent = 'Passphrase\'ler eşleşmiyor';
    errEl.classList.remove('hidden'); return;
  }

  progEl.classList.remove('hidden');
  btn.disabled = true;

  try {
    const r = await window.api.pgp.generateKey({ name, email, passphrase: pass1 });
    if (!r.ok) {
      errEl.textContent = r.error;
      errEl.classList.remove('hidden');
      progEl.classList.add('hidden');
      btn.disabled = false;
      return;
    }
    document.getElementById('modalPgpGenerate').classList.add('hidden');
    setStatus('✓ Anahtar üretildi: ' + r.fingerprint.slice(0, 16) + '...');
    await renderPgpKeys();
  } catch (e) {
    errEl.textContent = e.message;
    errEl.classList.remove('hidden');
    progEl.classList.add('hidden');
    btn.disabled = false;
  }
}

function openPgpImportDialog() {
  document.getElementById('pgp_import_armored').value = '';
  document.getElementById('pgp_import_error').classList.add('hidden');
  document.getElementById('modalPgpImport').classList.remove('hidden');
}

async function submitPgpImport() {
  const armored = document.getElementById('pgp_import_armored').value.trim();
  const errEl = document.getElementById('pgp_import_error');
  errEl.classList.add('hidden');

  if (!armored.includes('-----BEGIN PGP PUBLIC KEY BLOCK-----')) {
    errEl.textContent = 'PGP PUBLIC KEY BLOCK ile başlayan geçerli bir public key yapıştırın';
    errEl.classList.remove('hidden');
    return;
  }

  const r = await window.api.pgp.importContact({ armoredKey: armored });
  if (!r.ok) {
    errEl.textContent = r.error;
    errEl.classList.remove('hidden');
    return;
  }
  document.getElementById('modalPgpImport').classList.add('hidden');
  setStatus(`✓ ${r.email} public key'i içe aktarıldı`);
  await renderPgpContacts();
}

// ============= Compose'da PGP toggle =============
async function refreshComposeEncryptToggle() {
  const toggle = document.getElementById('composePgpEncryptToggle');
  if (!toggle) return;
  const toEl = document.getElementById('compose_to');
  if (!toEl) return;
  const toValue = toEl.value;
  // Adresleri parse et
  const emails = parseEmailAddresses(toValue);
  if (!emails.length) {
    toggle.classList.add('hidden');
    return;
  }
  // Tüm alıcıların public key'i var mı?
  let allHaveKeys = true;
  for (const e of emails) {
    const has = await window.api.pgp.hasContact(e);
    if (!has) { allHaveKeys = false; break; }
  }
  if (allHaveKeys) {
    toggle.classList.remove('hidden');
    toggle.title = `Tüm ${emails.length} alıcının PGP anahtarı mevcut`;
  } else {
    toggle.classList.add('hidden');
    document.getElementById('compose_pgp_encrypt').checked = false;
  }
}

function parseEmailAddresses(str) {
  if (!str) return [];
  const parts = str.split(/[,;]/).map(s => s.trim()).filter(Boolean);
  const emails = [];
  for (const p of parts) {
    const m = p.match(/<([^>]+)>/) || p.match(/^\s*([^\s,;]+@[^\s,;]+)\s*$/);
    if (m) emails.push((m[1] || m[0]).trim().toLowerCase());
  }
  return emails;
}

// Compose To input'una listener bağla
function bindComposeEncryptListener() {
  const toEl = document.getElementById('compose_to');
  if (!toEl || toEl.dataset.pgpBound) return;
  toEl.dataset.pgpBound = '1';
  toEl.addEventListener('input', debounce(refreshComposeEncryptToggle, 300));
  toEl.addEventListener('blur', refreshComposeEncryptToggle);
}

// ============= Mesaj görüntüleme: PGP detect =============
async function checkAndShowPgpStatus(message) {
  // body_text içinde PGP MESSAGE BLOCK var mı kontrol et
  const body = message.body_text || '';
  const det = await window.api.pgp.detectInBody(body);

  // Eski badge varsa kaldır
  const existing = document.getElementById('pgpStatusBadge');
  if (existing) existing.remove();

  if (!det || !det.type) return;

  const detailContainer = document.querySelector('.message-detail-content, #messageBody, .message-body')
    || document.body;

  const badge = document.createElement('div');
  badge.id = 'pgpStatusBadge';
  badge.className = 'pgp-status-badge';

  if (det.type === 'encrypted') {
    badge.innerHTML = `🔐 <strong>Bu mesaj PGP ile şifrelenmiş</strong> · <button class="btn btn-primary" id="btnPgpDecryptOpen" style="margin-left:10px;">🔓 Aç</button>`;
    badge.style.background = 'rgba(52,152,219,0.15)';
    badge.style.borderColor = 'rgba(52,152,219,0.5)';
  } else if (det.type === 'signed') {
    badge.innerHTML = '✍ <strong>Bu mesaj PGP ile imzalanmış</strong> · İçeriği Görüntüle/Doğrula menüsü';
    badge.style.background = 'rgba(46,204,113,0.15)';
  }

  // Mesaj başına yerleştir
  const firstChild = detailContainer.firstChild;
  if (firstChild) detailContainer.insertBefore(badge, firstChild);
  else detailContainer.appendChild(badge);

  if (det.type === 'encrypted') {
    setTimeout(() => {
      const btn = document.getElementById('btnPgpDecryptOpen');
      if (btn) btn.onclick = () => openPgpDecryptDialog(message);
    }, 50);
  }
}

async function openPgpDecryptDialog(message) {
  const keys = await window.api.pgp.listKeys();
  const sel = document.getElementById('pgp_decrypt_key');
  const privateKeys = keys.filter(k => k.has_private);
  if (!privateKeys.length) {
    alert('Şifre çözmek için bir private key gerekli. Önce Toolbar > 🔐 PGP\'den anahtar üretin.');
    return;
  }
  sel.innerHTML = privateKeys.map(k =>
    `<option value="${k.id}" ${k.is_default ? 'selected' : ''}>${escapeHtml(k.name || k.email)} (${k.fingerprint.slice(0, 8)}...)</option>`
  ).join('');
  document.getElementById('pgp_decrypt_passphrase').value = '';
  document.getElementById('pgp_decrypt_error').classList.add('hidden');
  document.getElementById('pgp_decrypt_result').classList.add('hidden');
  document.getElementById('modalPgpDecrypt').classList.remove('hidden');
  document.getElementById('modalPgpDecrypt').dataset.messageId = message.id;
  document.getElementById('modalPgpDecrypt').dataset.senderEmail = message.from_addr || '';
  document.getElementById('modalPgpDecrypt').dataset.bodyText = message.body_text || '';
  setTimeout(() => document.getElementById('pgp_decrypt_passphrase').focus(), 100);
}

async function submitPgpDecrypt() {
  const modal = document.getElementById('modalPgpDecrypt');
  const keyId = parseInt(document.getElementById('pgp_decrypt_key').value, 10);
  const passphrase = document.getElementById('pgp_decrypt_passphrase').value;
  const senderEmail = modal.dataset.senderEmail;
  const bodyText = modal.dataset.bodyText;
  const errEl = document.getElementById('pgp_decrypt_error');
  const resEl = document.getElementById('pgp_decrypt_result');

  errEl.classList.add('hidden');
  resEl.classList.add('hidden');

  // body_text'ten PGP block'unu çıkar
  const blockMatch = bodyText.match(/-----BEGIN PGP MESSAGE-----[\s\S]*?-----END PGP MESSAGE-----/);
  if (!blockMatch) {
    errEl.textContent = 'PGP MESSAGE bloğu bulunamadı';
    errEl.classList.remove('hidden');
    return;
  }

  const r = await window.api.pgp.decrypt({
    armoredMessage: blockMatch[0],
    keyId,
    passphrase,
    senderEmail
  });

  if (!r.ok) {
    errEl.textContent = r.error;
    errEl.classList.remove('hidden');
    return;
  }

  // Sonucu göster
  document.getElementById('pgp_decrypt_text').textContent = r.decryptedText;
  const sigEl = document.getElementById('pgp_decrypt_signature_info');
  if (r.verified) {
    if (r.verified.ok) {
      sigEl.innerHTML = `✅ <strong>İmza doğrulandı</strong> - Key ID: ${r.verified.keyId}`;
      sigEl.style.background = 'rgba(46,204,113,0.15)';
      sigEl.style.color = '#2ecc71';
    } else {
      sigEl.innerHTML = `⚠ <strong>İmza doğrulanamadı</strong> - ${r.verified.error}`;
      sigEl.style.background = 'rgba(231,76,60,0.15)';
      sigEl.style.color = 'var(--danger)';
    }
    sigEl.classList.remove('hidden');
  } else {
    sigEl.classList.add('hidden');
  }
  resEl.classList.remove('hidden');
}

// Komut paletine ekle

// ============= v1.26: Contacts Import/Export =============
async function exportContactsToFile(format) {
  setStatus('📤 Dışa aktarılıyor...');
  const r = await window.api.contacts.export(format);
  if (r.canceled) { setStatus('İptal edildi'); return; }
  if (r.ok) {
    setStatus(`✓ ${r.count} kişi dışa aktarıldı: ${r.path}`);
    alert(`✓ ${r.count} kişi başarıyla dışa aktarıldı.\n\nKonum:\n${r.path}\n\nBu dosyayı Outlook, Apple Contacts, Google Contacts veya başka bir mail uygulamasına içe aktarabilirsiniz.`);
  } else {
    alert('Hata: ' + r.error);
  }
}

async function importContactsFromFile() {
  const r = await window.api.contacts.import();
  if (r.canceled) return;
  if (!r.ok) {
    alert('İçe aktarma hatası:\n' + r.error);
    return;
  }
  const msg = `İçe aktarma tamamlandı:\n\n` +
              `📊 Toplam: ${r.total} kişi\n` +
              `➕ Eklendi: ${r.added}\n` +
              `🔄 Güncellendi: ${r.updated} (eksik alanlar dolduruldu)\n` +
              `⏭ Atlandı: ${r.skipped} (zaten dolu)\n\n` +
              `Kaynak: ${r.path}`;
  alert(msg);
  setStatus(`✓ ${r.added} yeni + ${r.updated} güncellenmiş kişi`);
  await renderContactsList();
}

// ============= v1.27: Takvim / Events =============
const calState = {
  currentMonth: new Date(),
  selectedDate: new Date(),
  currentEventId: null,
  bound: false
};

async function openCalendar() {
  document.getElementById('modalCalendar').classList.remove('hidden');
  if (!calState.bound) {
    calState.bound = true;
    bindCalendarUI();
  }
  await renderCalendarMonth();
  await renderCalendarDayDetail();
}

function bindCalendarUI() {
  document.getElementById('btnCalToday').onclick = () => {
    calState.currentMonth = new Date();
    calState.selectedDate = new Date();
    renderCalendarMonth();
    renderCalendarDayDetail();
  };
  document.getElementById('btnCalPrev').onclick = () => {
    calState.currentMonth.setMonth(calState.currentMonth.getMonth() - 1);
    renderCalendarMonth();
  };
  document.getElementById('btnCalNext').onclick = () => {
    calState.currentMonth.setMonth(calState.currentMonth.getMonth() + 1);
    renderCalendarMonth();
  };
  document.getElementById('btnNewEvent').onclick = createNewEvent;
  document.getElementById('btnSaveEvent').onclick = saveCurrentEvent;
  document.getElementById('btnDeleteEvent').onclick = deleteCurrentEvent;
  document.getElementById('btnExportEventIcs').onclick = async () => {
    if (!calState.currentEventId) return;
    const r = await window.api.events.exportIcs(calState.currentEventId);
    if (r.canceled) return;
    if (r.ok) {
      setStatus('✓ .ics dosyası kaydedildi: ' + r.path);
      alert('✓ Etkinlik dışa aktarıldı.\n\nKonum:\n' + r.path);
    } else alert('Hata: ' + r.error);
  };
}

const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                   'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

async function renderCalendarMonth() {
  const month = calState.currentMonth;
  const year = month.getFullYear();
  const monthIdx = month.getMonth();
  document.getElementById('calMonthLabel').textContent = `${TR_MONTHS[monthIdx]} ${year}`;

  // Ayın başı ve sonu
  const firstDay = new Date(year, monthIdx, 1);
  const lastDay = new Date(year, monthIdx + 1, 0);
  // Pazartesi başlangıçlı haftalık layout: 0=Pazar, 1=Pazartesi
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;
  const totalDays = lastDay.getDate();

  // Bu ay için tüm event'ler
  const monthStart = new Date(year, monthIdx, 1).toISOString();
  const monthEnd = new Date(year, monthIdx + 1, 0, 23, 59, 59).toISOString();
  const events = await window.api.events.list({ from: monthStart, to: monthEnd });

  // Tarihe göre grupla (yyyy-mm-dd anahtarı)
  const eventsByDay = {};
  for (const ev of events) {
    const key = (ev.start_at || '').slice(0, 10);
    if (!eventsByDay[key]) eventsByDay[key] = [];
    eventsByDay[key].push(ev);
  }

  // Stats - header
  const stats = await window.api.events.stats();
  document.getElementById('calHeaderCount').textContent =
    `(Bugün ${stats.todayCount} · Bu hafta ${stats.weekCount} · Toplam ${stats.total})`;

  // Grid çiz
  const grid = document.getElementById('calMonthGrid');
  let html = '';
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const selectedStr = calState.selectedDate.toISOString().slice(0, 10);

  // Önceki ayın günleri
  for (let i = 0; i < startOffset; i++) {
    html += '<div class="cal-cell cal-cell-other"></div>';
  }
  // Bu ayın günleri
  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(year, monthIdx, d);
    const dateStr = dateObj.toISOString().slice(0, 10);
    const dayEvents = eventsByDay[dateStr] || [];
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === selectedStr;
    const cls = ['cal-cell'];
    if (isToday) cls.push('cal-cell-today');
    if (isSelected) cls.push('cal-cell-selected');

    let evHtml = '';
    const visibleEvents = dayEvents.slice(0, 3);
    for (const ev of visibleEvents) {
      evHtml += `<div class="cal-event-pill" style="background:${ev.color || '#3498db'};" title="${escapeHtml(ev.title)}">${escapeHtml(ev.title)}</div>`;
    }
    if (dayEvents.length > 3) {
      evHtml += `<div class="cal-event-more">+${dayEvents.length - 3} daha</div>`;
    }

    html += `
      <div class="${cls.join(' ')}" data-date="${dateStr}">
        <div class="cal-cell-num">${d}</div>
        ${evHtml}
      </div>`;
  }
  grid.innerHTML = html;

  // Click handler
  grid.querySelectorAll('.cal-cell[data-date]').forEach(cell => {
    cell.onclick = async () => {
      const dateStr = cell.dataset.date;
      calState.selectedDate = new Date(dateStr);
      await renderCalendarMonth();
      await renderCalendarDayDetail();
    };
  });
}

async function renderCalendarDayDetail() {
  const date = calState.selectedDate;
  const dateStr = date.toISOString().slice(0, 10);
  const header = document.getElementById('calDayHeader');
  const dayName = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][date.getDay()];
  header.textContent = `${date.getDate()} ${TR_MONTHS[date.getMonth()]} ${date.getFullYear()} - ${dayName}`;

  // O günün etkinlikleri
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
  const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();
  const events = await window.api.events.list({ from: dayStart, to: dayEnd });

  const evList = document.getElementById('calDayEvents');
  if (!events.length) {
    evList.innerHTML = '<div class="empty-state" style="padding:20px;">Bu güne etkinlik yok</div>';
  } else {
    evList.innerHTML = events.map(ev => {
      const startTime = ev.all_day ? 'Tüm gün' : new Date(ev.start_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="cal-day-event" data-id="${ev.id}" style="border-left:4px solid ${ev.color || '#3498db'};">
          <div class="cal-day-event-time">${startTime}</div>
          <div class="cal-day-event-info">
            <div class="cal-day-event-title">${escapeHtml(ev.title)}</div>
            ${ev.location ? `<div class="cal-day-event-loc">📍 ${escapeHtml(ev.location)}</div>` : ''}
            ${ev.reminder_at ? '<span class="cal-reminder-badge">⏰</span>' : ''}
          </div>
        </div>
      `;
    }).join('');
    evList.querySelectorAll('.cal-day-event').forEach(el => {
      el.onclick = () => loadEventIntoDetail(parseInt(el.dataset.id, 10));
    });
  }

  // Form gizle (etkinlik tıklayınca açılır)
  document.getElementById('calEventForm').classList.add('hidden');
  calState.currentEventId = null;
}

async function loadEventIntoDetail(id) {
  const ev = await window.api.events.get(id);
  if (!ev) return;
  calState.currentEventId = id;
  document.getElementById('calEventForm').classList.remove('hidden');

  document.getElementById('ev_title').value = ev.title || '';
  document.getElementById('ev_description').value = ev.description || '';
  document.getElementById('ev_location').value = ev.location || '';
  document.getElementById('ev_color').value = ev.color || '#3498db';
  document.getElementById('ev_attendees').value = ev.attendees || '';
  document.getElementById('ev_all_day').checked = !!ev.all_day;

  document.getElementById('ev_start_at').value = ev.start_at ? toLocalDateTimeInput(ev.start_at) : '';
  document.getElementById('ev_end_at').value = ev.end_at ? toLocalDateTimeInput(ev.end_at) : '';
  document.getElementById('ev_reminder_at').value = ev.reminder_at ? toLocalDateTimeInput(ev.reminder_at) : '';

  let meta = `Oluşturuldu: ${ev.created_at ? new Date(ev.created_at).toLocaleString('tr-TR') : '-'}`;
  if (ev.related_message_id) meta += ` · Bağlı mesaj #${ev.related_message_id}`;
  if (ev.uid) meta += ` · UID: ${ev.uid.slice(0, 30)}`;
  document.getElementById('ev_meta').textContent = meta;
}

function createNewEvent() {
  const date = calState.selectedDate;
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0);
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10, 0);
  document.getElementById('calEventForm').classList.remove('hidden');
  calState.currentEventId = null;

  document.getElementById('ev_title').value = 'Yeni Etkinlik';
  document.getElementById('ev_description').value = '';
  document.getElementById('ev_location').value = '';
  document.getElementById('ev_color').value = '#3498db';
  document.getElementById('ev_attendees').value = '';
  document.getElementById('ev_all_day').checked = false;
  document.getElementById('ev_start_at').value = toLocalDateTimeInput(start.toISOString());
  document.getElementById('ev_end_at').value = toLocalDateTimeInput(end.toISOString());
  document.getElementById('ev_reminder_at').value = '';
  document.getElementById('ev_meta').textContent = 'Yeni etkinlik';

  setTimeout(() => {
    const t = document.getElementById('ev_title');
    t.focus();
    t.select();
  }, 100);
}

async function saveCurrentEvent() {
  const data = {
    title: document.getElementById('ev_title').value.trim() || 'Başlıksız',
    description: document.getElementById('ev_description').value || null,
    location: document.getElementById('ev_location').value.trim() || null,
    color: document.getElementById('ev_color').value,
    attendees: document.getElementById('ev_attendees').value.trim() || null,
    all_day: document.getElementById('ev_all_day').checked,
    start_at: fromLocalDateTimeInput(document.getElementById('ev_start_at').value),
    end_at: fromLocalDateTimeInput(document.getElementById('ev_end_at').value),
    reminder_at: fromLocalDateTimeInput(document.getElementById('ev_reminder_at').value),
    reminder_sent: 0
  };
  if (!data.start_at) {
    alert('Başlangıç tarihi gerekli');
    return;
  }

  let r;
  if (calState.currentEventId) {
    r = await window.api.events.update(calState.currentEventId, data);
  } else {
    r = await window.api.events.add(data);
    if (r.ok) calState.currentEventId = r.id;
  }
  if (r.ok) {
    setStatus('✓ Etkinlik kaydedildi');
    await renderCalendarMonth();
    await renderCalendarDayDetail();
  } else {
    alert('Hata: ' + r.error);
  }
}

async function deleteCurrentEvent() {
  if (!calState.currentEventId) return;
  if (!confirm('Bu etkinlik silinsin mi?')) return;
  await window.api.events.delete(calState.currentEventId);
  calState.currentEventId = null;
  document.getElementById('calEventForm').classList.add('hidden');
  await renderCalendarMonth();
  await renderCalendarDayDetail();
  setStatus('Etkinlik silindi');
}

// ============= Mailden Etkinlik Oluştur =============
async function createEventFromMessage(message) {
  if (!message) return;

  // Önce body'de .ics eki var mı diye bak
  const bodyText = (message.body_text || message.body_html || '');
  let icalEvent = null;

  if (bodyText.includes('BEGIN:VCALENDAR') && bodyText.includes('BEGIN:VEVENT')) {
    const r = await window.api.events.parseICal(bodyText);
    if (r.ok && r.events.length) icalEvent = r.events[0];
  }

  // .ics yoksa body'den tarih tahmini
  let guessedStart = null;
  if (!icalEvent) {
    const fullText = (message.subject || '') + '\n' + bodyText;
    const r = await window.api.events.guessFromText(fullText);
    guessedStart = r.dateTime;
  }

  // Modali doldur
  document.getElementById('evfm_source').textContent = `Kaynak: ${message.from_name || message.from_addr || ''} - "${message.subject || ''}"`;

  if (icalEvent) {
    document.getElementById('evfm_title').value = icalEvent.title || message.subject || '';
    document.getElementById('evfm_start').value = icalEvent.start_at ? toLocalDateTimeInput(icalEvent.start_at) : '';
    document.getElementById('evfm_end').value = icalEvent.end_at ? toLocalDateTimeInput(icalEvent.end_at) : '';
    document.getElementById('evfm_description').value = icalEvent.description ||
      (icalEvent.location ? `📍 ${icalEvent.location}\n\n` : '') + (bodyText.slice(0, 500));
    document.getElementById('evfm_ical_notice').classList.remove('hidden');
  } else {
    document.getElementById('evfm_title').value = message.subject || 'Yeni Etkinlik';
    if (guessedStart) {
      document.getElementById('evfm_start').value = toLocalDateTimeInput(guessedStart);
      const end = new Date(new Date(guessedStart).getTime() + 60 * 60 * 1000);
      document.getElementById('evfm_end').value = toLocalDateTimeInput(end.toISOString());
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      document.getElementById('evfm_start').value = toLocalDateTimeInput(tomorrow.toISOString());
      const end = new Date(tomorrow.getTime() + 60 * 60 * 1000);
      document.getElementById('evfm_end').value = toLocalDateTimeInput(end.toISOString());
    }
    const fromName = message.from_name || message.from_addr || '';
    document.getElementById('evfm_description').value =
      `📧 ${fromName} <${message.from_addr || ''}>\n` +
      `📅 ${message.date ? new Date(message.date).toLocaleString('tr-TR') : ''}\n\n` +
      bodyText.slice(0, 500);
    document.getElementById('evfm_ical_notice').classList.add('hidden');
  }
  document.getElementById('evfm_remind').value = '30';

  // Submit handler
  document.getElementById('btnEvfmCreate').onclick = async () => {
    const title = document.getElementById('evfm_title').value.trim() || 'Başlıksız';
    const startStr = document.getElementById('evfm_start').value;
    const endStr = document.getElementById('evfm_end').value;
    const description = document.getElementById('evfm_description').value;
    const remindMinutes = parseInt(document.getElementById('evfm_remind').value, 10);

    if (!startStr) { alert('Başlangıç tarihi gerekli'); return; }
    const start_at = fromLocalDateTimeInput(startStr);
    const end_at = fromLocalDateTimeInput(endStr);
    let reminder_at = null;
    if (remindMinutes && start_at) {
      const remDate = new Date(new Date(start_at).getTime() - remindMinutes * 60 * 1000);
      reminder_at = remDate.toISOString();
    }
    const r = await window.api.events.add({
      title,
      description,
      start_at,
      end_at,
      reminder_at,
      color: '#9b59b6',
      attendees: icalEvent?.attendees || message.from_addr || '',
      related_message_id: message.id,
      uid: icalEvent?.uid
    });
    if (r.ok) {
      document.getElementById('modalEventFromMail').classList.add('hidden');
      setStatus('✓ Etkinlik oluşturuldu');
      // Takvimi aç
      setTimeout(() => openCalendar(), 200);
    } else {
      alert('Hata: ' + r.error);
    }
  };

  document.getElementById('modalEventFromMail').classList.remove('hidden');
}

// Event reminder bildirim listener
if (window.api && window.api.on) {
  window.api.on('event:reminder', () => {
    // Sessizce - notification sistemi zaten gösterdi
  });
}

// ============= v1.28: Boşta Kalma Kilidi (Idle Lock) =============
const idleLock = {
  timer: null,
  timeoutMs: 0,
  enabled: false,
  hasMasterPassword: false,
  installedListeners: false,
  // Yüksek-frekanslı event'leri throttle etmek için son aktivite zamanı
  lastActivity: Date.now(),
  // 1 saniyeden sıkça reset etme
  throttleMs: 1000
};

async function refreshIdleLockState() {
  try {
    const cfg = await window.api.config.get();
    const secStatus = await window.api.security.status();

    idleLock.enabled = !!cfg.autoLockEnabled;
    idleLock.timeoutMs = (cfg.autoLockMinutes || 15) * 60 * 1000;
    idleLock.hasMasterPassword = !!secStatus.hasMasterPassword;

    // Master password yoksa veya kapalıysa timer'ı durdur
    if (!idleLock.enabled || !idleLock.hasMasterPassword) {
      stopIdleTimer();
      return;
    }

    // Listener'ları bir defa kur
    if (!idleLock.installedListeners) {
      installIdleListeners();
      idleLock.installedListeners = true;
    }

    // Timer'ı başlat / yenile
    resetIdleTimer();
  } catch (e) {
    console.warn('Idle lock state refresh hatası:', e.message);
  }
}

function installIdleListeners() {
  const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'wheel', 'click'];
  for (const ev of events) {
    document.addEventListener(ev, onUserActivity, { passive: true, capture: true });
  }
  // Sekme/pencere odak değişikliklerinde de aktivite say
  window.addEventListener('focus', onUserActivity, { passive: true });
  // Sekme görünmez olduğunda timer çalışmaya devam etmeli (setTimeout sayesinde)
}

function onUserActivity() {
  const now = Date.now();
  // Throttle
  if (now - idleLock.lastActivity < idleLock.throttleMs) return;
  idleLock.lastActivity = now;
  resetIdleTimer();
}

function stopIdleTimer() {
  if (idleLock.timer) {
    clearTimeout(idleLock.timer);
    idleLock.timer = null;
  }
}

function resetIdleTimer() {
  stopIdleTimer();
  if (!idleLock.enabled || !idleLock.hasMasterPassword || !idleLock.timeoutMs) return;
  idleLock.timer = setTimeout(triggerAutoLock, idleLock.timeoutMs);
}

async function triggerAutoLock() {
  // Lock screen zaten görünüyorsa atla
  const lockScreen = document.getElementById('lockScreen');
  if (lockScreen && !lockScreen.classList.contains('hidden')) return;

  // Hızlı durum kontrol (kullanıcı bu süre içinde master pw kaldırmış olabilir)
  try {
    const secStatus = await window.api.security.status();
    if (!secStatus.hasMasterPassword) return;

    setStatus('🔒 Boşta kalmadan dolayı kilitlendi');
    await window.api.security.lockApp();
  } catch (e) {
    console.warn('Auto-lock hatası:', e.message);
  }
}

// Settings güncellendiğinde idle state'i yenile
async function onPrefsChanged() {
  await refreshIdleLockState();
}

// security:locked event'ini dinle (kilit açıldıysa timer'ı sıfırla)
if (window.api && window.api.on) {
  window.api.on('security:locked', () => {
    stopIdleTimer();
  });
}

// İlk yüklemede idle monitor başlat
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(refreshIdleLockState, 1500);
});

// ============= v1.29: Otomatik Kategorize =============
async function autoCategorizeMessageManual(message) {
  if (!message) return;
  const r = await window.api.autoCategorize.single(message.id);
  if (r.ok) {
    if (r.added && r.added.length) {
      setStatus(`🏷 Eklendi: ${r.added.join(', ')}`);
    } else {
      setStatus('Bu mail için uygun kategori bulunamadı (manuel etiketleyin)');
    }
    if (state.selectedFolder) await loadMessages();
  } else {
    alert('Hata: ' + r.error);
  }
}

// Komut paletine ekle - Otomatik Kategorize

// ============= v1.30: Tema + Görünüm Özelleştirme =============
const themeState = {
  theme: 'dark',
  accentColor: null,
  logoDataUrl: null,
  bgImageDataUrl: null,
  bgImageOpacity: 6,
  systemMql: null
};

async function applyAppearanceFromConfig() {
  try {
    const cfg = await window.api.config.get();
    themeState.theme = cfg.theme || 'dark';
    themeState.accentColor = cfg.accentColor || null;
    themeState.logoDataUrl = cfg.logoDataUrl || null;
    themeState.bgImageDataUrl = cfg.bgImageDataUrl || null;
    themeState.bgImageOpacity = typeof cfg.bgImageOpacity === 'number' ? cfg.bgImageOpacity : 6;

    applyTheme(themeState.theme);
    applyAccentColor(themeState.accentColor);
    applyLogo(themeState.logoDataUrl);
    applyBgImage(themeState.bgImageDataUrl, themeState.bgImageOpacity);
  } catch (e) {
    console.warn('Görünüm uygulanamadı:', e.message);
  }
}

function applyTheme(theme) {
  const html = document.documentElement;
  html.classList.remove('theme-light', 'theme-dark');

  let effective = theme;
  if (theme === 'system') {
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    effective = prefersLight ? 'light' : 'dark';

    // System tema değişimini dinle
    if (!themeState.systemMql) {
      themeState.systemMql = window.matchMedia('(prefers-color-scheme: light)');
      themeState.systemMql.addEventListener('change', () => {
        if (themeState.theme === 'system') applyTheme('system');
      });
    }
  }

  if (effective === 'light') html.classList.add('theme-light');
  else html.classList.add('theme-dark');
}

function applyAccentColor(color) {
  const html = document.documentElement;
  if (!color) {
    html.style.removeProperty('--primary');
    html.style.removeProperty('--primary-hi');
    html.style.removeProperty('--primary-text');
    return;
  }
  html.style.setProperty('--primary', color);
  // Hover için biraz açık/koyu varyant
  html.style.setProperty('--primary-hi', shadeColor(color, isLightTheme() ? -15 : 15));
  // Primary text rengi: arkaplana göre kontrast
  html.style.setProperty('--primary-text', isColorLight(color) ? '#1a1a1a' : '#ffffff');
}

function applyLogo(dataUrl) {
  const img = document.getElementById('customLogoImg');
  const icon = document.getElementById('brandIcon');
  const text = document.getElementById('brandText');
  if (!img) return;
  if (dataUrl) {
    img.src = dataUrl;
    img.classList.remove('hidden');
    if (icon) icon.style.display = 'none';
    if (text) text.style.display = 'none';
  } else {
    img.src = '';
    img.classList.add('hidden');
    if (icon) icon.style.display = '';
    if (text) text.style.display = '';
  }
}

function applyBgImage(dataUrl, opacityPercent) {
  const layer = document.getElementById('bgImageLayer');
  if (!layer) return;
  if (dataUrl) {
    layer.style.backgroundImage = `url("${dataUrl}")`;
    layer.style.opacity = (opacityPercent / 100).toFixed(2);
    layer.style.display = 'block';
  } else {
    layer.style.backgroundImage = '';
    layer.style.display = 'none';
  }
}

// Renk yardımcıları
function isLightTheme() {
  return document.documentElement.classList.contains('theme-light');
}
function isColorLight(hex) {
  const c = hex.replace('#', '');
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
}
function shadeColor(hex, percent) {
  let R = parseInt(hex.slice(1, 3), 16);
  let G = parseInt(hex.slice(3, 5), 16);
  let B = parseInt(hex.slice(5, 7), 16);
  R = Math.min(255, Math.max(0, Math.round(R * (100 + percent) / 100)));
  G = Math.min(255, Math.max(0, Math.round(G * (100 + percent) / 100)));
  B = Math.min(255, Math.max(0, Math.round(B * (100 + percent) / 100)));
  return '#' + [R, G, B].map(x => x.toString(16).padStart(2, '0')).join('');
}

// Settings UI binding
function bindAppearanceSettings() {
  // Tema kartları
  document.querySelectorAll('.theme-card').forEach(card => {
    if (card.dataset.bound) return;
    card.dataset.bound = '1';
    card.onclick = async () => {
      const theme = card.dataset.theme;
      themeState.theme = theme;
      applyTheme(theme);
      // Accent rengi yeniden uygula (tema değişince hover varyantı yeniden hesaplanır)
      applyAccentColor(themeState.accentColor);
      await window.api.config.updatePrefs({ theme });
      refreshAppearanceUIState();
      flashSettingsSavedIndicator();
    };
  });

  // Accent renkler
  document.querySelectorAll('.accent-color-swatch').forEach(sw => {
    if (sw.dataset.bound) return;
    sw.dataset.bound = '1';
    sw.onclick = async () => {
      const color = sw.dataset.color;
      themeState.accentColor = color;
      applyAccentColor(color);
      await window.api.config.updatePrefs({ accentColor: color });
      refreshAppearanceUIState();
      flashSettingsSavedIndicator();
    };
  });

  // Logo upload
  const btnUploadLogo = document.getElementById('btnUploadLogo');
  if (btnUploadLogo && !btnUploadLogo.dataset.bound) {
    btnUploadLogo.dataset.bound = '1';
    btnUploadLogo.onclick = async () => {
      const r = await window.api.branding.uploadLogo();
      if (r.canceled) return;
      if (!r.ok) { alert('Hata: ' + r.error); return; }
      themeState.logoDataUrl = r.dataUrl;
      applyLogo(r.dataUrl);
      refreshAppearanceUIState();
      setStatus('✓ Logo yüklendi');
    };
  }
  const btnRemoveLogo = document.getElementById('btnRemoveLogo');
  if (btnRemoveLogo && !btnRemoveLogo.dataset.bound) {
    btnRemoveLogo.dataset.bound = '1';
    btnRemoveLogo.onclick = async () => {
      await window.api.branding.removeLogo();
      themeState.logoDataUrl = null;
      applyLogo(null);
      refreshAppearanceUIState();
      setStatus('Logo kaldırıldı');
    };
  }

  // Bg upload
  const btnUploadBg = document.getElementById('btnUploadBg');
  if (btnUploadBg && !btnUploadBg.dataset.bound) {
    btnUploadBg.dataset.bound = '1';
    btnUploadBg.onclick = async () => {
      const r = await window.api.branding.uploadBgImage();
      if (r.canceled) return;
      if (!r.ok) { alert('Hata: ' + r.error); return; }
      themeState.bgImageDataUrl = r.dataUrl;
      applyBgImage(r.dataUrl, themeState.bgImageOpacity);
      refreshAppearanceUIState();
      setStatus('✓ Arka plan resmi yüklendi');
    };
  }
  const btnRemoveBg = document.getElementById('btnRemoveBg');
  if (btnRemoveBg && !btnRemoveBg.dataset.bound) {
    btnRemoveBg.dataset.bound = '1';
    btnRemoveBg.onclick = async () => {
      await window.api.branding.removeBgImage();
      themeState.bgImageDataUrl = null;
      applyBgImage(null);
      refreshAppearanceUIState();
      setStatus('Arka plan kaldırıldı');
    };
  }
  // Opacity slider
  const opRange = document.getElementById('bgOpacityRange');
  if (opRange && !opRange.dataset.bound) {
    opRange.dataset.bound = '1';
    opRange.oninput = async () => {
      const val = parseInt(opRange.value, 10);
      themeState.bgImageOpacity = val;
      document.getElementById('bgOpacityLabel').textContent = val + '%';
      applyBgImage(themeState.bgImageDataUrl, val);
    };
    opRange.onchange = async () => {
      await window.api.config.updatePrefs({ bgImageOpacity: themeState.bgImageOpacity });
      flashSettingsSavedIndicator();
    };
  }
}

function refreshAppearanceUIState() {
  // Tema kart aktif
  document.querySelectorAll('.theme-card').forEach(c => {
    c.classList.toggle('active', c.dataset.theme === themeState.theme);
  });
  // Accent swatch aktif
  document.querySelectorAll('.accent-color-swatch').forEach(s => {
    s.classList.toggle('active', s.dataset.color === themeState.accentColor);
  });
  // Logo preview
  const lp = document.getElementById('logoPreview');
  const lpImg = document.getElementById('logoPreviewImg');
  if (lp && lpImg) {
    if (themeState.logoDataUrl) {
      lpImg.src = themeState.logoDataUrl;
      lp.classList.remove('hidden');
    } else {
      lp.classList.add('hidden');
    }
  }
  // Bg preview
  const bp = document.getElementById('bgImagePreview');
  const bpImg = document.getElementById('bgImagePreviewImg');
  if (bp && bpImg) {
    if (themeState.bgImageDataUrl) {
      bpImg.src = themeState.bgImageDataUrl;
      bp.classList.remove('hidden');
    } else {
      bp.classList.add('hidden');
    }
  }
  // Opacity
  const opRange = document.getElementById('bgOpacityRange');
  const opLabel = document.getElementById('bgOpacityLabel');
  if (opRange) opRange.value = String(themeState.bgImageOpacity);
  if (opLabel) opLabel.textContent = themeState.bgImageOpacity + '%';
}

// Settings açılınca bind + state yenile
async function refreshAppearanceSettings() {
  bindAppearanceSettings();
  // Config'i state'e yükle
  const cfg = await window.api.config.get();
  themeState.theme = cfg.theme || 'dark';
  themeState.accentColor = cfg.accentColor || null;
  themeState.logoDataUrl = cfg.logoDataUrl || null;
  themeState.bgImageDataUrl = cfg.bgImageDataUrl || null;
  themeState.bgImageOpacity = typeof cfg.bgImageOpacity === 'number' ? cfg.bgImageOpacity : 6;
  refreshAppearanceUIState();
}

// İlk yüklemede temayı uygula
window.addEventListener('DOMContentLoaded', () => {
  applyAppearanceFromConfig();
});

// ============= v1.31: Layout Çeşitleri =============
const layoutState = {
  layout: 'right',   // 'right' | 'bottom' | 'off'
  density: 'comfortable',  // 'comfortable' | 'compact'
  bound: false
};

async function applyLayoutFromConfig() {
  try {
    const cfg = await window.api.config.get();
    layoutState.layout = cfg.layout || 'right';
    layoutState.density = cfg.density || 'comfortable';
    applyLayout(layoutState.layout);
    applyDensity(layoutState.density);
  } catch (e) { console.warn('Layout uygulanamadı:', e.message); }
}

function applyLayout(layout) {
  const html = document.documentElement;
  html.classList.remove('layout-right', 'layout-bottom', 'layout-off');
  html.classList.add('layout-' + layout);

  // Sade modda overlay'i kapat
  const view = document.querySelector('.pane-view');
  if (view && layout !== 'off') {
    view.classList.remove('show-overlay');
    const closeBtn = document.getElementById('msgOverlayCloseBtn');
    if (closeBtn) closeBtn.remove();
  }
}

function applyDensity(density) {
  const html = document.documentElement;
  html.classList.remove('density-comfortable', 'density-compact');
  html.classList.add('density-' + density);
}

// Sade modda mesaj görüntüleme: pane-view'i overlay olarak göster
function ensureMsgOverlayUI() {
  if (layoutState.layout !== 'off') return;
  const view = document.querySelector('.pane-view');
  if (!view) return;
  view.classList.add('show-overlay');

  if (!document.getElementById('msgOverlayCloseBtn')) {
    const close = document.createElement('button');
    close.id = 'msgOverlayCloseBtn';
    close.className = 'msg-overlay-close';
    close.innerHTML = '✕';
    close.title = 'Kapat (Esc)';
    close.onclick = closeMsgOverlay;
    view.appendChild(close);
  }
}

function closeMsgOverlay() {
  const view = document.querySelector('.pane-view');
  if (view) view.classList.remove('show-overlay');
  const btn = document.getElementById('msgOverlayCloseBtn');
  if (btn) btn.remove();
}

// ESC ile sade-mod overlay'i kapat
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && layoutState.layout === 'off') {
    const view = document.querySelector('.pane-view');
    if (view && view.classList.contains('show-overlay')) {
      e.stopPropagation();
      closeMsgOverlay();
    }
  }
}, true);

// Settings UI binding
function bindLayoutSettings() {
  // Layout kartları
  document.querySelectorAll('.layout-card').forEach(card => {
    if (card.dataset.bound) return;
    card.dataset.bound = '1';
    card.onclick = async () => {
      const layout = card.dataset.layout;
      layoutState.layout = layout;
      applyLayout(layout);
      await window.api.config.updatePrefs({ layout });
      refreshLayoutUIState();
      flashSettingsSavedIndicator();
    };
  });
  // Density butonları
  document.querySelectorAll('[data-density]').forEach(btn => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.onclick = async () => {
      const density = btn.dataset.density;
      layoutState.density = density;
      applyDensity(density);
      await window.api.config.updatePrefs({ density });
      refreshLayoutUIState();
      flashSettingsSavedIndicator();
    };
  });
}

function refreshLayoutUIState() {
  document.querySelectorAll('.layout-card').forEach(c => {
    c.classList.toggle('active', c.dataset.layout === layoutState.layout);
  });
  document.querySelectorAll('[data-density]').forEach(b => {
    b.classList.toggle('active', b.dataset.density === layoutState.density);
  });
}

async function refreshLayoutSettings() {
  bindLayoutSettings();
  const cfg = await window.api.config.get();
  layoutState.layout = cfg.layout || 'right';
  layoutState.density = cfg.density || 'comfortable';
  refreshLayoutUIState();
}

// İlk yüklemede uygula
window.addEventListener('DOMContentLoaded', () => {
  applyLayoutFromConfig();
});

// ============= v1.32: Popup mesaj penceresinden gelen compose actions =============
if (window.api && window.api.on) {
  window.api.on('compose-action-from-popup', (payload) => {
    const data = payload && payload.data ? payload.data : {};
    if (data.replyTo) {
      openCompose({ replyTo: data.replyTo, replyAll: !!data.replyAll });
    } else if (data.forwardOf) {
      openCompose({ forward: data.forwardOf });
    } else {
      openCompose();
    }
  });
}

// ============= v1.33: Çoklu Seçim + Sürükle Bırak =============
function toggleMultiSelect(id) {
  if (state.multiSelectIds.has(id)) {
    state.multiSelectIds.delete(id);
  } else {
    state.multiSelectIds.add(id);
  }
  updateMultiSelectVisuals();
  updateMultiSelectIndicator();
  state.lastSelectedId = id;
}

function rangeMultiSelect(fromId, toId) {
  const ids = (state.messages || []).map(m => m.id);
  const fromIdx = ids.indexOf(fromId);
  const toIdx = ids.indexOf(toId);
  if (fromIdx === -1 || toIdx === -1) return;
  const start = Math.min(fromIdx, toIdx);
  const end = Math.max(fromIdx, toIdx);
  for (let i = start; i <= end; i++) state.multiSelectIds.add(ids[i]);
  updateMultiSelectVisuals();
  updateMultiSelectIndicator();
}

function clearMultiSelect() {
  state.multiSelectIds.clear();
  updateMultiSelectVisuals();
  updateMultiSelectIndicator();
}

function updateMultiSelectVisuals() {
  document.querySelectorAll('.message-item').forEach(el => {
    const id = parseInt(el.dataset.id, 10);
    el.classList.toggle('multi-selected', state.multiSelectIds.has(id));
  });
}

function updateMultiSelectIndicator() {
  let bar = document.getElementById('multiSelectBar');
  const count = state.multiSelectIds.size;
  if (count <= 1) {
    if (bar) bar.remove();
    return;
  }
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'multiSelectBar';
    bar.className = 'multi-select-bar';
    document.body.appendChild(bar);
  }
  bar.innerHTML = `
    <span style="font-weight:600;">📌 ${count} mesaj seçili</span>
    <button class="btn btn-ghost" id="msbDeselect">Seçimi Kaldır</button>
    <button class="btn" id="msbMarkRead">✓ Okundu İşaretle</button>
    <button class="btn btn-ghost" id="msbDelete" style="color:var(--danger);">🗑 Sil</button>
    <span style="font-size:11px;color:var(--muted);margin-left:auto;">💡 Bir klasöre sürükleyin</span>
  `;
  document.getElementById('msbDeselect').onclick = clearMultiSelect;
  document.getElementById('msbMarkRead').onclick = async () => {
    for (const id of state.multiSelectIds) {
      try { await window.api.messages.markRead(id, true); } catch (_) {}
    }
    clearMultiSelect();
    await loadAccounts();
    await loadMessages();
  };
  document.getElementById('msbDelete').onclick = async () => {
    if (!confirm(`${state.multiSelectIds.size} mesaj silinsin mi?`)) return;
    for (const id of state.multiSelectIds) {
      try { await window.api.messages.delete(id); } catch (_) {}
    }
    setStatus(`✓ ${state.multiSelectIds.size} mesaj silindi`);
    clearMultiSelect();
    await loadAccounts();
    await loadMessages();
  };
}

// Klasör değişince çoklu seçimi temizle
const _origLoadMessages = typeof loadMessages === 'function' ? loadMessages : null;

// ============= v1.34: Kişi Grupları + Toplu Mail =============
const groupsState = {
  selectedGroupId: null,
  bound: false
};

async function renderGroupsList() {
  const groups = await window.api.groups.list();
  const el = document.getElementById('groupsList');
  if (!el) return;

  let html = `
    <div class="group-item ${!groupsState.selectedGroupId ? 'active' : ''}" data-group-id="">
      <span class="group-icon" style="color:var(--text-2);">📋</span>
      <span class="group-name">Tüm Kişiler</span>
    </div>
  `;
  for (const g of groups) {
    html += `
      <div class="group-item ${groupsState.selectedGroupId === g.id ? 'active' : ''}" data-group-id="${g.id}">
        <span class="group-icon" style="color:${escapeHtml(g.color)};">●</span>
        <span class="group-name">${escapeHtml(g.name)}</span>
        <span class="group-count">${g.member_count}</span>
      </div>
    `;
  }
  el.innerHTML = html;

  el.querySelectorAll('.group-item').forEach(item => {
    item.onclick = () => {
      const gid = item.dataset.groupId;
      groupsState.selectedGroupId = gid ? parseInt(gid, 10) : null;
      renderGroupsList();
      renderContactsList();
    };
    item.oncontextmenu = (e) => {
      e.preventDefault();
      const gid = item.dataset.groupId;
      if (!gid) return;  // "Tüm Kişiler" sağ tık menüsü yok
      showGroupContextMenu(e, parseInt(gid, 10));
    };
  });
}

function showGroupContextMenu(event, groupId) {
  // Mevcut showContextMenu var mı kontrol
  const items = [
    { label: '📨 Bu Gruba Mail Gönder', action: () => composeToGroup(groupId, 'bcc') },
    { label: '✏ Grubu Düzenle', action: () => editGroup(groupId) },
    { divider: true },
    { label: '🗑 Grubu Sil', danger: true, action: () => deleteGroupConfirm(groupId) }
  ];
  showContextMenu(event, items);
}

async function createNewGroup() {
  const name = prompt('Grup adı:');
  if (!name || !name.trim()) return;
  const r = await window.api.groups.add({ name: name.trim() });
  if (r.ok) {
    setStatus(`✓ Grup oluşturuldu: ${name}`);
    await renderGroupsList();
    groupsState.selectedGroupId = r.id;
    await renderGroupsList();
    await renderContactsList();
  } else {
    alert('Hata: ' + r.error);
  }
}

async function editGroup(groupId) {
  const g = await window.api.groups.get(groupId);
  if (!g) return;
  const newName = prompt('Yeni grup adı:', g.name);
  if (!newName || !newName.trim() || newName === g.name) return;
  const r = await window.api.groups.update(groupId, { name: newName.trim() });
  if (r.ok) {
    setStatus('Grup güncellendi');
    await renderGroupsList();
  }
}

async function deleteGroupConfirm(groupId) {
  const g = await window.api.groups.get(groupId);
  if (!g) return;
  if (!confirm(`"${g.name}" grubu silinsin mi?\n\nNot: Gruptaki kişiler silinmez, sadece gruplama kaldırılır.`)) return;
  await window.api.groups.delete(groupId);
  setStatus('Grup silindi');
  if (groupsState.selectedGroupId === groupId) groupsState.selectedGroupId = null;
  await renderGroupsList();
  await renderContactsList();
}

/**
 * Bir gruba mail göndermek için Compose'u aç
 * @param {number} groupId
 * @param {string} target - 'to' | 'cc' | 'bcc' (default 'bcc' - gizlilik için)
 */
async function composeToGroup(groupId, target = 'bcc') {
  const emails = await window.api.groups.emails(groupId);
  if (!emails.length) {
    alert('Bu grupta email adresi olan kişi yok');
    return;
  }
  const g = await window.api.groups.get(groupId);
  // Compose'u aç
  openCompose();
  // Hedef alanı doldur
  setTimeout(() => {
    const emailList = emails.map(e => e.name ? `"${e.name}" <${e.email}>` : e.email).join(', ');
    if (target === 'bcc') {
      // Bcc alanını göster
      document.getElementById('composeBccGroup')?.classList.remove('hidden');
      const bccEl = document.getElementById('compose_bcc');
      if (bccEl) {
        bccEl.value = bccEl.value ? bccEl.value + ', ' + emailList : emailList;
      }
    } else if (target === 'cc') {
      const ccEl = document.getElementById('compose_cc');
      if (ccEl) ccEl.value = ccEl.value ? ccEl.value + ', ' + emailList : emailList;
    } else {
      const toEl = document.getElementById('compose_to');
      if (toEl) toEl.value = toEl.value ? toEl.value + ', ' + emailList : emailList;
    }
    // Subject'i grup adı ile prefix'le
    const subjEl = document.getElementById('compose_subject');
    if (subjEl && !subjEl.value && g) subjEl.value = `[${g.name}] `;
    setStatus(`✓ ${emails.length} alıcı eklendi (${g?.name || 'Grup'} - ${target.toUpperCase()})`);
  }, 100);
}

// Adres Defteri kişi detayında "Bu kişi şu gruplarda" ve "+ Gruba ekle" butonu
async function refreshContactGroupsBadges(contactId) {
  const containerId = 'contactGroupsBadges';
  let container = document.getElementById(containerId);
  if (!container) return;
  const groups = await window.api.groups.contactGroups(contactId);
  if (!groups.length) {
    container.innerHTML = '<small style="color:var(--muted);">Hiçbir grupta değil</small>';
    return;
  }
  container.innerHTML = groups.map(g =>
    `<span class="group-badge" style="background:${escapeHtml(g.color)}20;color:${escapeHtml(g.color)};border:1px solid ${escapeHtml(g.color)}40;" data-gid="${g.id}">
       👥 ${escapeHtml(g.name)}
       <button class="group-badge-remove" data-cid="${contactId}" data-gid="${g.id}" title="Bu gruptan çıkar">×</button>
     </span>`
  ).join('');
  container.querySelectorAll('.group-badge-remove').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const cid = parseInt(btn.dataset.cid, 10);
      const gid = parseInt(btn.dataset.gid, 10);
      await window.api.groups.removeMember(gid, cid);
      setStatus('Gruptan çıkarıldı');
      await refreshContactGroupsBadges(cid);
      await renderGroupsList();
    };
  });
}

async function showAddToGroupDialog(contactId) {
  const groups = await window.api.groups.list();
  if (!groups.length) {
    if (confirm('Henüz grup yok. Yeni grup oluşturayım mı?')) {
      await createNewGroup();
      // Yeni oluşturulduysa eklemek için yine sor (basit MVP)
    }
    return;
  }
  // Dropdown menü göster
  const items = groups.map(g => ({
    label: `👥 ${g.name} (${g.member_count})`,
    action: async () => {
      await window.api.groups.addMember(g.id, contactId);
      setStatus(`✓ "${g.name}" grubuna eklendi`);
      await refreshContactGroupsBadges(contactId);
      await renderGroupsList();
    }
  }));
  items.push({ divider: true });
  items.push({ label: '+ Yeni grup oluştur ve ekle', action: async () => {
    const name = prompt('Yeni grup adı:');
    if (!name || !name.trim()) return;
    const r = await window.api.groups.add({ name: name.trim() });
    if (r.ok) {
      await window.api.groups.addMember(r.id, contactId);
      setStatus(`✓ "${name}" grubu oluşturuldu ve kişi eklendi`);
      await refreshContactGroupsBadges(contactId);
      await renderGroupsList();
    }
  }});
  // Show menu at the button position
  const btn = document.getElementById('btnAddToGroup');
  const rect = btn ? btn.getBoundingClientRect() : { left: 100, bottom: 100 };
  showContextMenu({ preventDefault: () => {}, stopPropagation: () => {},
                    clientX: rect.left, clientY: rect.bottom + 4 }, items);
}

// Compose'da "+ Grup" butonu için handler
document.addEventListener('click', async (e) => {
  if (e.target.classList?.contains('compose-group-pick')) {
    e.preventDefault();
    const target = e.target.dataset.target || 'to';
    const groups = await window.api.groups.list();
    if (!groups.length) {
      alert('Henüz grup yok. Adres Defteri\'nde grup oluşturun.');
      return;
    }
    const items = groups.map(g => ({
      label: `👥 ${g.name} (${g.member_count} kişi)`,
      action: async () => {
        const emails = await window.api.groups.emails(g.id);
        if (!emails.length) {
          alert('Bu grupta email adresi olan kişi yok');
          return;
        }
        const list = emails.map(em => em.name ? `"${em.name}" <${em.email}>` : em.email).join(', ');
        let elId = 'compose_to';
        if (target === 'cc') elId = 'compose_cc';
        else if (target === 'bcc') {
          elId = 'compose_bcc';
          document.getElementById('composeBccGroup')?.classList.remove('hidden');
        }
        const inp = document.getElementById(elId);
        if (inp) inp.value = inp.value ? inp.value + ', ' + list : list;
        setStatus(`✓ ${emails.length} kişi eklendi (${g.name})`);
      }
    }));
    const rect = e.target.getBoundingClientRect();
    showContextMenu({ preventDefault: () => {}, stopPropagation: () => {},
                      clientX: rect.left, clientY: rect.bottom + 4 }, items);
  }
  if (e.target.id === 'composeBccToggle') {
    e.preventDefault();
    document.getElementById('composeBccGroup')?.classList.toggle('hidden');
  }
});
