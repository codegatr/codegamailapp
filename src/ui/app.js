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
  document.getElementById('btnQuickSteps').onclick = openQuickSteps;
  document.getElementById('btnDashboard').onclick = openDashboard;
  document.getElementById('btnDashRefresh').onclick = refreshDashboard;
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
    signature: state.signatureEditor ? state.signatureEditor.getHTML() : '',
    // v1.38: Şablon tabanlı imza verisi (varsa)
    signature_data: sigBuilderState && sigBuilderState._lastApplied
      ? JSON.stringify({
          templateId: sigBuilderState._lastApplied.templateId,
          data: sigBuilderState._lastApplied.data
        })
      : undefined,
    // v1.42: OAuth2 hesabı oluşturuluyorsa
    auth_type: window._oauthPending ? `oauth2_${window._oauthPending.provider}` : 'password',
    oauth_access_token: window._oauthPending?.accessToken || undefined,
    oauth_refresh_token: window._oauthPending?.refreshToken || undefined,
    oauth_expires_at: window._oauthPending?.expiresAt || undefined
  };
}

function validateAccount(a, isEdit) {
  if (!a.display_name) return 'Görünen ad gerekli';
  if (!a.email) return 'E-posta gerekli';
  if (!a.in_host) return 'Gelen sunucu gerekli';
  if (!a.in_username) return 'Kullanıcı adı gerekli';
  // v1.42: OAuth2 hesaplarında şifre zorunlu değil
  if (!isEdit && !a.in_password && a.auth_type !== 'oauth2_microsoft' && a.auth_type !== 'oauth2_google') return 'Şifre gerekli';
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
    { label: '🔧 Bu Mailden Kural Oluştur', action: () => createRuleFromMessage(message) },
    { label: '⚡ Quick Step Çalıştır...', action: (e) => showQuickStepsForMessage(message, e) },
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
  // v1.41: Sidebar kategorilerini de yenile
  if (typeof renderSidebarCategories === 'function') {
    renderSidebarCategories().catch(() => {});
  }
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
  // v1.41: Kategori seçimini de temizle
  if (typeof catSidebarState !== 'undefined' && catSidebarState.selectedCategoryId) {
    catSidebarState.selectedCategoryId = null;
    if (typeof renderSidebarCategories === 'function') renderSidebarCategories();
  }
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
    // v1.43: Gönderici avatarı (renkli daire + ilk harf)
    const senderEmail = (m.from_addr || '').toLowerCase();
    const senderName = m.from_name || senderEmail.split('@')[0] || '?';
    const initial = senderName.trim().charAt(0).toUpperCase() || '?';
    const avatarColors = ['#3498db', '#9b59b6', '#e74c3c', '#f39c12', '#2ecc71', '#1abc9c', '#e67e22', '#34495e', '#16a085', '#27ae60', '#2980b9', '#8e44ad'];
    let hash = 0;
    for (let i = 0; i < senderEmail.length; i++) hash = senderEmail.charCodeAt(i) + ((hash << 5) - hash);
    const avatarColor = avatarColors[Math.abs(hash) % avatarColors.length];

    return `
      <div class="message-item ${m.is_read ? '' : 'unread'} ${m.is_spam ? 'is-spam' : ''} ${m.is_important ? 'is-important' : ''} ${state.selectedMessage?.id === m.id ? 'active' : ''}"
           data-id="${m.id}">
        <div class="msg-avatar" style="background:${avatarColor};" title="${escapeHtml(senderEmail)}">${escapeHtml(initial)}</div>
        <div class="msg-content">
          <div class="msg-line1">
            <span class="msg-from">${importantStar}${accBadge}${escapeHtml(fromDisplay)}${threadCount}</span>
            <span class="msg-date">${date}</span>
          </div>
          <div class="msg-subject">${spamBadge}${scoreBadge}${escapeHtml(m.subject || '(Konu yok)')}</div>
          ${catDots}
          <div class="msg-preview">
            <span class="msg-flags">${m.snoozed_until ? '<span class="flag-snoozed" title="Ertelenmiş">💤</span>' : ''}${m.has_attachments ? '<span class="flag-attach">📎</span>' : ''}${m.request_read_receipt ? (m.read_receipt_received ? '<span class="flag-mdn-ok" title="Okundu">📬</span>' : '<span class="flag-mdn-pending" title="Okundu onayı istendi">📬</span>') : ''}</span>
            ${escapeHtml((m.preview || '').replace(/\s+/g, ' ').slice(0, 100))}
          </div>
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

  // v1.47: Read receipt (MDN) banner
  let mdnBanner = '';
  const policyState = window._mdnPolicyState || { policy: 'ask', ignored: [] };
  const senderEmail = (msg.from_addr || '').toLowerCase();
  const isIgnored = policyState.ignored.includes(senderEmail);
  if (msg.requested_read_receipt && !msg.mdn_responded && policyState.policy !== 'never' && !isIgnored) {
    if (policyState.policy === 'always') {
      // Otomatik gönder (sessizce)
      window.api.readReceipt.send(msg.id).then(r => {
        if (r.ok) setStatus('📬 Okundu onayı otomatik gönderildi');
      });
      mdnBanner = `<div class="mdn-banner mdn-sent">📬 Bu mailin göndericisi okundu onayı istemişti — politikanız gereği <strong>otomatik gönderildi</strong>.</div>`;
    } else {
      // Sor
      mdnBanner = `<div class="mdn-banner">
        <div class="mdn-banner-text">
          📬 <strong>${escapeHtml(msg.from_name || msg.from_addr || 'Gönderici')}</strong> okundu onayı istiyor.
          <small>Onay yollarsanız mailin görüntülendiğini bilecekler.</small>
        </div>
        <div class="mdn-banner-actions">
          <button class="btn btn-primary btn-sm" id="btnMdnSend">✓ Gönder</button>
          <button class="btn btn-sm" id="btnMdnDismiss">✕ Reddet</button>
          <button class="btn btn-ghost btn-sm" id="btnMdnIgnore">🔇 Bu kişiye asla sorma</button>
        </div>
      </div>`;
    }
  } else if (msg.mdn_responded) {
    mdnBanner = '';  // Yanıt verildi, banner gizle
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
      <div class="msg-view-meta-grid">
        <div class="msg-sender-block">
          <div class="msg-sender-avatar" style="background:${(() => {
            const colors = ['#3498db','#9b59b6','#e74c3c','#f39c12','#2ecc71','#1abc9c','#e67e22','#34495e'];
            const e = (msg.from_addr || '').toLowerCase();
            let h = 0;
            for (let i = 0; i < e.length; i++) h = e.charCodeAt(i) + ((h << 5) - h);
            return colors[Math.abs(h) % colors.length];
          })()};">${escapeHtml((msg.from_name || msg.from_addr || '?').charAt(0).toUpperCase())}</div>
          <div class="msg-sender-info">
            <div class="msg-sender-name"><strong>${escapeHtml(msg.from_name || msg.from_addr || '')}</strong></div>
            ${msg.from_name ? `<div class="msg-sender-email">&lt;${escapeHtml(msg.from_addr || '')}&gt;</div>` : ''}
            <div class="msg-sender-meta">
              <span>Kime: ${toDisplay}</span>
              ${ccDisplay ? `<span>CC: ${ccDisplay}</span>` : ''}
            </div>
          </div>
          <div class="msg-date-block">${date}</div>
        </div>
      </div>
    </div>
    ${spamBanner}
    ${mdnBanner}
    ${securityBanner}
    ${(() => {
      // v1.46: Read receipt isteği var mı banner'ı
      const requested = msg.requested_read_receipt || msg.mdn_requested;
      const responded = msg.mdn_responded;
      if (!requested || responded) return '';
      // Yapılandırma kontrolü ihmal - basit olarak banner göster
      return `
        <div class="mdn-banner" id="mdnBanner">
          <span style="font-size:18px;">📬</span>
          <div style="flex:1;">
            <strong>Bu mailin göndericisi okundu onayı istiyor</strong>
            <div style="font-size:11px;opacity:0.8;margin-top:2px;">
              Onayı gönderirseniz <code>${escapeHtml(msg.read_receipt_to || msg.from_addr || '')}</code> bu maili açtığınızı öğrenecek.
            </div>
          </div>
          <button class="btn btn-primary" id="btnSendMDN">✓ Gönder</button>
          <button class="btn btn-ghost" id="btnRejectMDN">🗑 Reddet</button>
          <button class="btn btn-ghost" id="btnIgnoreMDN" title="Bu kişi bir daha onay isterse otomatik gizle">🔇 Asla sorma</button>
        </div>
      `;
    })()}
    <div class="msg-view-actions msg-view-actions-outlook">
      <button class="btn" id="btnReply" title="Yanıtla (R)"><span style="font-size:16px;">↩</span> Yanıtla</button>
      <button class="btn" id="btnReplyAll" title="Tümünü Yanıtla"><span style="font-size:16px;">↩↩</span> Tümünü</button>
      <button class="btn" id="btnForward" title="İlet (F)"><span style="font-size:16px;">→</span> İlet</button>
      <div class="msg-actions-sep"></div>
      <button class="btn btn-ghost" id="btnArchiveMsg" title="Arşivle (E)"><span style="font-size:14px;">📦</span></button>
      <button class="btn btn-ghost" id="btnToggleImportant" title="Önemli işaretle">${msg.is_important ? '<span style="color:#f5a623;">⭐</span>' : '☆'}</button>
      <button class="btn btn-ghost" id="btnToggleRead" title="${msg.is_read ? 'Okunmadı işaretle' : 'Okundu işaretle'}">${msg.is_read ? '📨' : '✉'}</button>
      ${msg.is_spam
        ? '<button class="btn btn-ghost" id="btnNotSpam" title="Spam değil">✓ Spam değil</button>'
        : '<button class="btn btn-ghost" id="btnMarkSpam" title="Spam olarak işaretle">🛡</button>'}
      <button class="btn btn-ghost" id="btnSnoozeMsg" title="Maili ertele (H)">💤</button>
      <button class="btn btn-ghost" id="btnOpenInWindow" title="Yeni pencerede aç">🪟</button>
      <div class="msg-actions-sep"></div>
      <button class="btn btn-ghost" id="btnDelete" title="Sil (Del)" style="color:var(--danger);"><span style="font-size:14px;">🗑</span></button>
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
  // v1.43: Yeni Outlook tarzı butonlar
  document.getElementById('btnReplyAll').onclick = () => openCompose({ replyTo: msg, replyAll: true });
  document.getElementById('btnArchiveMsg').onclick = async () => {
    const r = await window.api.archive.archive(msg.id);
    if (r.ok) { setStatus('📦 Arşivlendi'); state.selectedMessage = null; document.getElementById('messageView').innerHTML = '<div class="empty-state">Okumak için bir mesaj seçin</div>'; await loadAccounts(); await loadMessages(); }
  };
  document.getElementById('btnToggleImportant').onclick = async () => {
    await window.api.messages.markImportant(msg.id, !msg.is_important);
    setStatus(msg.is_important ? '☆ Önemli kaldırıldı' : '⭐ Önemli işaretlendi');
    msg.is_important = !msg.is_important;
    renderMessageView(msg);
    await loadMessages();
  };
  document.getElementById('btnToggleRead').onclick = async () => {
    await window.api.messages.markRead(msg.id, !msg.is_read);
    msg.is_read = !msg.is_read;
    setStatus(msg.is_read ? '✓ Okundu' : '📨 Okunmadı');
    renderMessageView(msg);
    await loadAccounts(); await loadMessages();
  };
  document.getElementById('btnOpenInWindow').onclick = () => window.api.messages.openInWindow(msg.id);
  // v1.52: Snooze
  const btnSnoozeMsg = document.getElementById('btnSnoozeMsg');
  if (btnSnoozeMsg) btnSnoozeMsg.onclick = () => openSnoozeModal(msg);

  // v1.47: MDN banner butonları
  const btnMdnSend = document.getElementById('btnMdnSend');
  const btnMdnDismiss = document.getElementById('btnMdnDismiss');
  const btnMdnIgnore = document.getElementById('btnMdnIgnore');
  if (btnMdnSend) btnMdnSend.onclick = async () => {
    btnMdnSend.disabled = true;
    btnMdnSend.textContent = 'Gönderiliyor...';
    const r = await window.api.readReceipt.send(msg.id);
    if (r.ok) {
      setStatus('📬 Okundu onayı gönderildi');
      msg.mdn_responded = 1;
      renderMessageView(msg);
    } else {
      alert('Hata: ' + r.error);
      btnMdnSend.disabled = false;
      btnMdnSend.textContent = '✓ Gönder';
    }
  };
  if (btnMdnDismiss) btnMdnDismiss.onclick = async () => {
    await window.api.readReceipt.dismiss(msg.id);
    msg.mdn_responded = 1;
    renderMessageView(msg);
    setStatus('📬 Okundu onayı reddedildi');
  };
  if (btnMdnIgnore) btnMdnIgnore.onclick = async () => {
    if (confirm(`${msg.from_addr} adresinden gelen okundu onayı isteklerine bir daha sorulmasın mı?`)) {
      await window.api.readReceipt.ignoreSender((msg.from_addr || '').toLowerCase());
      await window.api.readReceipt.dismiss(msg.id);
      window._mdnPolicyState = await window.api.readReceipt.getPolicy();
      msg.mdn_responded = 1;
      renderMessageView(msg);
      setStatus('🔇 Bu gönderici yok sayıldı');
    }
  };

  // v1.46: MDN banner butonları
  const btnSendMDN = document.getElementById('btnSendMDN');
  if (btnSendMDN) {
    btnSendMDN.onclick = async () => {
      btnSendMDN.disabled = true;
      btnSendMDN.textContent = '...';
      const r = await window.api.readReceipt.send(msg.id);
      if (r.ok) {
        setStatus('✓ Okundu onayı gönderildi');
        document.getElementById('mdnBanner').remove();
        msg.mdn_responded = 1;
      } else {
        alert('Onay gönderilemedi: ' + r.error);
        btnSendMDN.disabled = false;
        btnSendMDN.textContent = '✓ Gönder';
      }
    };
  }
  const btnRejectMDN = document.getElementById('btnRejectMDN');
  if (btnRejectMDN) {
    btnRejectMDN.onclick = async () => {
      await window.api.readReceipt.markResponded(msg.id);
      msg.mdn_responded = 1;
      document.getElementById('mdnBanner').remove();
      setStatus('Onay reddedildi');
    };
  }
  const btnIgnoreMDN = document.getElementById('btnIgnoreMDN');
  if (btnIgnoreMDN) {
    btnIgnoreMDN.onclick = async () => {
      await window.api.readReceipt.ignore(msg.from_addr || '');
      await window.api.readReceipt.markResponded(msg.id);
      msg.mdn_responded = 1;
      document.getElementById('mdnBanner').remove();
      setStatus('Bu gönderici için bir daha sorulmayacak');
    };
  }
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

  // v1.46: Read receipt default
  (async () => {
    try {
      const cfg = await window.api.config.get();
      const cb = document.getElementById('compose_request_receipt');
      if (cb) cb.checked = !!cfg.readReceiptRequestDefault;
    } catch (_) {}
  })();

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
      attachments: attachments.length ? attachments : undefined,
      requestReadReceipt: document.getElementById('compose_request_receipt')?.checked || false
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
    { id: 'rules', label: 'Mail Kuralları (Filtreler)', icon: '⚙',
      action: () => openRules(), category: 'Modül' },
    { id: 'quick-steps', label: 'Quick Steps yönetimi', icon: '⚡',
      action: () => openQuickSteps(), category: 'Modül' },
    { id: 'advanced-search', label: 'Gelişmiş Arama', icon: '🔍',
      action: () => openAdvancedSearch(), category: 'Modül' },
    { id: 'signature-builder', label: 'İmza Şablonu Oluştur', icon: '🎨',
      action: () => { openSettings(); setTimeout(() => openSignatureBuilder(), 300); }, category: 'Modül' },
    { id: 'oauth-setup', label: 'OAuth2 Kurulumu (Microsoft/Google)', icon: '🔐',
      action: () => openOAuth2Setup(), category: 'Modül' },
    { id: 'dashboard', label: 'Gösterge Paneli', icon: '📊',
      action: () => openDashboard(), category: 'Modül' },
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
  // v1.48: Menübar img'i de senkronize et
  const img2 = document.getElementById('customLogoImg2');
  const icon2 = document.getElementById('brandIcon2');

  if (dataUrl) {
    if (img) {
      img.src = dataUrl;
      img.style.display = '';
      img.classList.remove('hidden');
    }
    if (icon) icon.style.display = 'none';
    if (text) text.style.display = 'none';
    // Menübar
    if (img2) {
      img2.src = dataUrl;
      img2.classList.remove('hidden');
      img2.style.display = '';
    }
    if (icon2) icon2.style.display = 'none';
  } else {
    if (img) {
      img.src = '';
      img.classList.add('hidden');
      img.style.display = 'none';
    }
    if (icon) icon.style.display = '';
    if (text) text.style.display = '';
    if (img2) {
      img2.src = '';
      img2.classList.add('hidden');
    }
    if (icon2) icon2.style.display = '';
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

// ============= v1.35: Mail Kuralları =============
const rulesState = {
  bound: false,
  editingRuleId: null,
  // Editör state
  conditions: [],
  actions: []
};

const CONDITION_TYPES = [
  { value: 'fromContains', label: 'Gönderen içerir', needsValue: true, placeholder: 'trendyol.com veya isim' },
  { value: 'fromEquals', label: 'Gönderen tam eşleşir', needsValue: true, placeholder: 'noreply@trendyol.com' },
  { value: 'subjectContains', label: 'Konu içerir', needsValue: true, placeholder: 'sipariş, fatura...' },
  { value: 'subjectEquals', label: 'Konu tam eşleşir', needsValue: true, placeholder: '' },
  { value: 'bodyContains', label: 'İçerik içerir', needsValue: true, placeholder: 'kelime' },
  { value: 'toContains', label: 'Alıcı içerir', needsValue: true, placeholder: '' },
  { value: 'hasAttachment', label: 'Eki var', needsValue: false },
  { value: 'noAttachment', label: 'Eki yok', needsValue: false },
  { value: 'isSpam', label: 'Spam olarak işaretlenmiş', needsValue: false },
  { value: 'sizeGreaterThan', label: 'Boyutu büyük', needsValue: true, placeholder: 'KB cinsinden, örn: 1000' }
];

const ACTION_TYPES = [
  { value: 'moveToFolder', label: '📁 Klasöre taşı', needsFolder: true },
  { value: 'addCategory', label: '🏷 Kategori ekle', needsCategory: true },
  { value: 'markRead', label: '✓ Okundu işaretle' },
  { value: 'markImportant', label: '⭐ Önemli işaretle' },
  { value: 'markSpam', label: '🚫 Spam olarak işaretle' },
  { value: 'archive', label: '📦 Arşivle' },
  { value: 'delete', label: '🗑 Sil' }
];

async function openRules() {
  document.getElementById('modalRules').classList.remove('hidden');
  if (!rulesState.bound) {
    rulesState.bound = true;
    bindRulesUI();
  }
  await renderRulesList();
}

function bindRulesUI() {
  document.getElementById('btnNewRule').onclick = () => openRuleEditor(null);
  document.getElementById('btnAddCondition').onclick = () => addConditionRow();
  document.getElementById('btnAddAction').onclick = () => addActionRow();
  document.getElementById('btnSaveRule').onclick = saveCurrentRule;
  document.getElementById('btnApplyAllRules').onclick = applyAllRules;
}

async function renderRulesList() {
  const rules = await window.api.rules.list();
  const accounts = await window.api.accounts.list();
  const accountById = {};
  for (const a of accounts) accountById[a.id] = a;

  const headerEl = document.getElementById('rulesHeaderCount');
  if (headerEl) {
    const enabled = rules.filter(r => r.enabled).length;
    headerEl.textContent = `(${enabled} aktif / ${rules.length} toplam)`;
  }

  const el = document.getElementById('rulesList');
  if (!rules.length) {
    el.innerHTML = `
      <div class="empty-state" style="padding:50px;font-size:13px;">
        Henüz kural yok. <strong>+ Yeni Kural</strong> ile ilkini oluşturun.
        <br><br>
        <small>Örnekler:</small><br>
        <small>• "Trendyol mailleri Alışveriş klasörüne taşı"</small><br>
        <small>• "Eki olan ve büyük (1MB+) mailleri otomatik önemli işaretle"</small><br>
        <small>• "info@spam.com'dan gelen tüm mailleri sil"</small>
      </div>
    `;
    return;
  }

  el.innerHTML = rules.map(r => {
    const conditions = JSON.parse(r.conditions || '[]');
    const actions = JSON.parse(r.actions || '[]');
    const accLabel = r.account_id
      ? `📧 ${accountById[r.account_id]?.display_name || 'Hesap #' + r.account_id}`
      : '📧 Tüm hesaplar';

    let condHtml = conditions.map(c => `<span class="rule-pill">${escapeHtml(describeRuleCondition(c))}</span>`).join(' ');
    return `
      <div class="rule-card ${r.enabled ? '' : 'disabled'}" data-id="${r.id}">
        <div class="rule-header">
          <label class="rule-toggle">
            <input type="checkbox" ${r.enabled ? 'checked' : ''} data-toggle-id="${r.id}">
          </label>
          <strong class="rule-name">${escapeHtml(r.name)}</strong>
          <span class="rule-meta">${accLabel} ${r.run_count > 0 ? `· ${r.run_count}× çalıştı` : ''}</span>
          <div style="flex:1;"></div>
          <button class="btn btn-ghost" data-edit-id="${r.id}">✏</button>
          <button class="btn btn-ghost" data-delete-id="${r.id}" style="color:var(--danger);">🗑</button>
        </div>
        <div class="rule-body">
          <div class="rule-row">
            <span class="rule-label">${r.match_type === 'any' ? 'Herhangi biri uymalı:' : 'Tümü uymalı:'}</span>
            ${condHtml}
          </div>
          <div class="rule-row">
            <span class="rule-label">Eylemler:</span>
            ${actions.map(a => `<span class="rule-pill rule-pill-action">${escapeHtml(describeRuleAction(a))}</span>`).join(' ')}
          </div>
          ${r.stop_processing ? '<small style="color:var(--warn);">⏹ Bu kuraldan sonra alttakileri çalıştırmaz</small>' : ''}
        </div>
      </div>
    `;
  }).join('');

  el.querySelectorAll('[data-toggle-id]').forEach(cb => {
    cb.onchange = async () => {
      const id = parseInt(cb.dataset.toggleId, 10);
      await window.api.rules.toggle(id, cb.checked);
      setStatus(cb.checked ? '✓ Kural aktifleştirildi' : 'Kural devre dışı');
      await renderRulesList();
    };
  });
  el.querySelectorAll('[data-edit-id]').forEach(btn => {
    btn.onclick = () => openRuleEditor(parseInt(btn.dataset.editId, 10));
  });
  el.querySelectorAll('[data-delete-id]').forEach(btn => {
    btn.onclick = async () => {
      const id = parseInt(btn.dataset.deleteId, 10);
      if (!confirm('Bu kural silinsin mi? Mevcut maillere etkisi yok, sadece bundan sonraki yeni mailler etkilenmez.')) return;
      await window.api.rules.delete(id);
      setStatus('Kural silindi');
      await renderRulesList();
    };
  });
}

function describeRuleCondition(c) {
  const map = {
    fromContains: 'Gönderen içerir',
    fromEquals: 'Gönderen tam eşleşir',
    subjectContains: 'Konu içerir',
    subjectEquals: 'Konu tam eşleşir',
    bodyContains: 'İçerik içerir',
    toContains: 'Alıcı içerir',
    hasAttachment: '📎 Eki var',
    noAttachment: 'Eki yok',
    isSpam: '🚫 Spam',
    sizeGreaterThan: 'Boyut > KB'
  };
  const label = map[c.type] || c.type;
  if (c.type === 'hasAttachment' || c.type === 'noAttachment' || c.type === 'isSpam') return label;
  return `${label}: "${c.value || ''}"`;
}

function describeRuleAction(a) {
  switch (a.type) {
    case 'moveToFolder': return `📁 Klasöre taşı (#${a.folderId})`;
    case 'addCategory': return `🏷 Kategori ekle (#${a.categoryId})`;
    case 'markRead': return '✓ Okundu işaretle';
    case 'markImportant': return '⭐ Önemli işaretle';
    case 'markSpam': return '🚫 Spam';
    case 'archive': return '📦 Arşivle';
    case 'delete': return '🗑 Sil';
    default: return a.type;
  }
}

async function openRuleEditor(ruleId) {
  rulesState.editingRuleId = ruleId;
  rulesState.conditions = [];
  rulesState.actions = [];

  // Hesaplar dropdown
  const accounts = await window.api.accounts.list();
  const accSel = document.getElementById('re_account');
  accSel.innerHTML = '<option value="">— Tüm hesaplar —</option>' +
    accounts.map(a => `<option value="${a.id}">${escapeHtml(a.display_name)} - ${escapeHtml(a.email)}</option>`).join('');

  if (ruleId) {
    const r = await window.api.rules.get(ruleId);
    if (r) {
      document.getElementById('ruleEditorTitle').textContent = '✏ Kuralı Düzenle';
      document.getElementById('re_name').value = r.name || '';
      document.getElementById('re_account').value = r.account_id || '';
      document.getElementById('re_match_type').value = r.match_type || 'all';
      document.getElementById('re_stop_processing').checked = !!r.stop_processing;
      document.getElementById('re_enabled').checked = !!r.enabled;
      try {
        rulesState.conditions = JSON.parse(r.conditions || '[]');
        rulesState.actions = JSON.parse(r.actions || '[]');
      } catch (_) {}
    }
  } else {
    document.getElementById('ruleEditorTitle').textContent = '+ Yeni Kural';
    document.getElementById('re_name').value = '';
    document.getElementById('re_account').value = '';
    document.getElementById('re_match_type').value = 'all';
    document.getElementById('re_stop_processing').checked = false;
    document.getElementById('re_enabled').checked = true;
    // Default 1 koşul + 1 eylem
    rulesState.conditions = [{ type: 'fromContains', value: '' }];
    rulesState.actions = [{ type: 'moveToFolder', folderId: null }];
  }

  await renderConditionsAndActions();
  document.getElementById('modalRuleEditor').classList.remove('hidden');
}

async function renderConditionsAndActions() {
  const condEl = document.getElementById('re_conditions');
  condEl.innerHTML = '';
  rulesState.conditions.forEach((c, idx) => condEl.appendChild(buildConditionRow(c, idx)));

  const actEl = document.getElementById('re_actions');
  actEl.innerHTML = '';
  for (let i = 0; i < rulesState.actions.length; i++) {
    actEl.appendChild(await buildActionRow(rulesState.actions[i], i));
  }
}

function buildConditionRow(cond, idx) {
  const row = document.createElement('div');
  row.className = 'rule-row-editor';
  const def = CONDITION_TYPES.find(t => t.value === cond.type) || CONDITION_TYPES[0];

  row.innerHTML = `
    <select class="re-cond-type" data-idx="${idx}">
      ${CONDITION_TYPES.map(t => `<option value="${t.value}" ${t.value === cond.type ? 'selected' : ''}>${escapeHtml(t.label)}</option>`).join('')}
    </select>
    <input type="text" class="re-cond-value" data-idx="${idx}"
           placeholder="${escapeHtml(def.placeholder || '')}"
           value="${escapeHtml(cond.value || '')}"
           ${def.needsValue ? '' : 'style="display:none;"'}>
    <button class="btn btn-ghost re-cond-remove" data-idx="${idx}" style="color:var(--danger);">🗑</button>
  `;

  row.querySelector('.re-cond-type').onchange = (e) => {
    rulesState.conditions[idx].type = e.target.value;
    rulesState.conditions[idx].value = ''; // Reset value
    renderConditionsAndActions();
  };
  row.querySelector('.re-cond-value').oninput = (e) => {
    rulesState.conditions[idx].value = e.target.value;
  };
  row.querySelector('.re-cond-remove').onclick = () => {
    rulesState.conditions.splice(idx, 1);
    if (rulesState.conditions.length === 0) {
      rulesState.conditions.push({ type: 'fromContains', value: '' });
    }
    renderConditionsAndActions();
  };

  return row;
}

async function buildActionRow(action, idx) {
  const row = document.createElement('div');
  row.className = 'rule-row-editor';
  const def = ACTION_TYPES.find(t => t.value === action.type) || ACTION_TYPES[0];

  let extraHtml = '';
  if (def.needsFolder) {
    // Klasör dropdown - tüm hesapların klasörleri
    const accountId = parseInt(document.getElementById('re_account').value, 10) || null;
    const accounts = await window.api.accounts.list();
    const targetAccounts = accountId ? accounts.filter(a => a.id === accountId) : accounts;
    let opts = '<option value="">— Klasör seç —</option>';
    for (const a of targetAccounts) {
      const folders = await window.api.folders.list(a.id);
      opts += `<optgroup label="${escapeHtml(a.display_name)}">`;
      for (const f of folders) {
        opts += `<option value="${f.id}" ${action.folderId === f.id ? 'selected' : ''}>${escapeHtml(f.name)}</option>`;
      }
      opts += '</optgroup>';
    }
    extraHtml = `<select class="re-action-folder" data-idx="${idx}">${opts}</select>`;
  } else if (def.needsCategory) {
    const cats = await window.api.categories.list();
    const opts = '<option value="">— Kategori seç —</option>' +
      cats.map(c => `<option value="${c.id}" ${action.categoryId === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('');
    extraHtml = `<select class="re-action-category" data-idx="${idx}">${opts}</select>`;
  }

  row.innerHTML = `
    <select class="re-action-type" data-idx="${idx}">
      ${ACTION_TYPES.map(t => `<option value="${t.value}" ${t.value === action.type ? 'selected' : ''}>${escapeHtml(t.label)}</option>`).join('')}
    </select>
    ${extraHtml}
    <button class="btn btn-ghost re-action-remove" data-idx="${idx}" style="color:var(--danger);margin-left:auto;">🗑</button>
  `;

  row.querySelector('.re-action-type').onchange = (e) => {
    rulesState.actions[idx] = { type: e.target.value };
    renderConditionsAndActions();
  };
  row.querySelector('.re-action-folder')?.addEventListener('change', (e) => {
    rulesState.actions[idx].folderId = parseInt(e.target.value, 10);
  });
  row.querySelector('.re-action-category')?.addEventListener('change', (e) => {
    rulesState.actions[idx].categoryId = parseInt(e.target.value, 10);
  });
  row.querySelector('.re-action-remove').onclick = () => {
    rulesState.actions.splice(idx, 1);
    if (rulesState.actions.length === 0) {
      rulesState.actions.push({ type: 'moveToFolder' });
    }
    renderConditionsAndActions();
  };

  return row;
}

function addConditionRow() {
  rulesState.conditions.push({ type: 'fromContains', value: '' });
  renderConditionsAndActions();
}

function addActionRow() {
  rulesState.actions.push({ type: 'markRead' });
  renderConditionsAndActions();
}

async function saveCurrentRule() {
  const name = document.getElementById('re_name').value.trim();
  if (!name) { alert('Kural adı gerekli'); return; }

  const accountId = parseInt(document.getElementById('re_account').value, 10) || null;
  const matchType = document.getElementById('re_match_type').value;
  const stopProcessing = document.getElementById('re_stop_processing').checked;
  const enabled = document.getElementById('re_enabled').checked;

  // Boş value'lu koşulları temizle
  const conditions = rulesState.conditions.filter(c => {
    const def = CONDITION_TYPES.find(t => t.value === c.type);
    if (!def) return false;
    if (def.needsValue) return c.value && c.value.trim();
    return true;
  });
  if (!conditions.length) { alert('En az bir geçerli koşul olmalı'); return; }

  // Geçersiz eylemleri temizle
  const actions = rulesState.actions.filter(a => {
    const def = ACTION_TYPES.find(t => t.value === a.type);
    if (!def) return false;
    if (def.needsFolder && !a.folderId) return false;
    if (def.needsCategory && !a.categoryId) return false;
    return true;
  });
  if (!actions.length) { alert('En az bir geçerli eylem olmalı (klasör/kategori seçilmemiş olabilir)'); return; }

  const ruleData = {
    name, account_id: accountId, match_type: matchType,
    stop_processing: stopProcessing, enabled,
    conditions, actions
  };

  let r;
  if (rulesState.editingRuleId) {
    r = await window.api.rules.update(rulesState.editingRuleId, ruleData);
  } else {
    r = await window.api.rules.add(ruleData);
  }
  if (r.ok) {
    setStatus('✓ Kural kaydedildi');
    document.getElementById('modalRuleEditor').classList.add('hidden');
    await renderRulesList();
  } else {
    alert('Hata: ' + r.error);
  }
}

async function applyAllRules() {
  if (!confirm('Tüm mevcut maillere kuralları uygula?\n\nBu işlem mailleri klasör değiştirebilir, kategori ekleyebilir vs. Geri almak için kuralı kaldırıp tekrar düzenlemek gerekir.')) return;
  const btn = document.getElementById('btnApplyAllRules');
  btn.disabled = true;
  btn.textContent = '⏳ Çalışıyor...';
  try {
    const r = await window.api.rules.applyToAll({});
    if (r.ok) {
      alert(`✅ Tamamlandı:\n\n📊 ${r.processed} mail tarandı\n✏ ${r.modified} mail değiştirildi\n⚡ ${r.totalActions} eylem uygulandı`);
      setStatus(`✓ Kurallar uygulandı: ${r.modified} mail değiştirildi`);
      if (state.selectedFolder) await loadMessages();
      await loadAccounts();
      await renderRulesList();
    } else {
      alert('Hata: ' + r.error);
    }
  } finally {
    btn.disabled = false;
    btn.textContent = '⚡ Tüm Maillere Uygula';
  }
}

/**
 * Bir mailden hızlıca kural oluştur (sender/subject otomatik dolu)
 */
function createRuleFromMessage(message) {
  if (!message) return;
  // Editör modalını aç + alanları doldur
  rulesState.editingRuleId = null;
  rulesState.conditions = [{ type: 'fromContains', value: message.from_addr || '' }];
  rulesState.actions = [{ type: 'moveToFolder', folderId: null }];

  openRuleEditor(null).then(() => {
    document.getElementById('re_name').value = `${(message.from_name || message.from_addr || 'Gönderen').slice(0, 40)} mailleri`;
    rulesState.conditions = [{ type: 'fromContains', value: message.from_addr || '' }];
    rulesState.actions = [{ type: 'moveToFolder', folderId: null }];
    renderConditionsAndActions();
  });
}

// Komut paletine ekle

// ============= v1.36: Quick Steps =============
const qsState = {
  bound: false,
  editingId: null,
  actions: []
};

const QS_ACTION_TYPES = [
  { value: 'moveToFolder', label: '📁 Klasöre taşı', needsFolder: true },
  { value: 'addCategory', label: '🏷 Kategori ekle', needsCategory: true },
  { value: 'markRead', label: '✓ Okundu işaretle' },
  { value: 'markImportant', label: '⭐ Önemli işaretle' },
  { value: 'markSpam', label: '🚫 Spam' },
  { value: 'archive', label: '📦 Arşivle' },
  { value: 'delete', label: '🗑 Sil' },
  { value: 'reply', label: '↩ Yanıtla (compose aç)' },
  { value: 'replyAll', label: '↩↩ Tümünü Yanıtla' },
  { value: 'forward', label: '→ İlet' }
];

async function openQuickSteps() {
  document.getElementById('modalQuickSteps').classList.remove('hidden');
  if (!qsState.bound) {
    qsState.bound = true;
    document.getElementById('btnNewQuickStep').onclick = () => openQuickStepEditor(null);
    document.getElementById('btnQsAddAction').onclick = qsAddAction;
    document.getElementById('btnSaveQuickStep').onclick = saveQuickStep;
  }
  await renderQuickStepsList();
}

async function renderQuickStepsList() {
  const list = await window.api.quickSteps.list();
  const el = document.getElementById('quickStepsList');
  if (!list.length) {
    el.innerHTML = `
      <div class="empty-state" style="padding:40px;font-size:13px;">
        Henüz Quick Step yok. <strong>+ Yeni Quick Step</strong> ile ilkini oluşturun.<br><br>
        <small><strong>Örnekler:</strong></small><br>
        <small>• "Müşterilere Taşı + Önemli İşaretle" - Tek tıkla 2 işlem</small><br>
        <small>• "Yanıtla + Arşivle" - Cevap verip otomatik arşive at</small><br>
        <small>• "Spam İşaretle + Sil" - Hemen kurtul</small>
      </div>
    `;
    return;
  }
  el.innerHTML = list.map(qs => {
    const actions = JSON.parse(qs.actions || '[]');
    return `
      <div class="quick-step-card">
        <div class="qs-icon" style="background:${escapeHtml(qs.color || '#3498db')};">${escapeHtml(qs.icon || '⚡')}</div>
        <div class="qs-info">
          <div class="qs-name">${escapeHtml(qs.name)}</div>
          <div class="qs-actions">
            ${actions.map(a => `<span class="qs-action-pill">${escapeHtml(describeQsAction(a))}</span>`).join(' → ')}
          </div>
          <div class="qs-meta">
            ${qs.shortcut ? `<kbd>${escapeHtml(qs.shortcut)}</kbd>` : ''}
            ${qs.show_in_toolbar ? '<span class="qs-tag">📌 Toolbar</span>' : ''}
            ${qs.run_count > 0 ? `<span style="color:var(--muted);">${qs.run_count}× kullanıldı</span>` : ''}
          </div>
        </div>
        <div class="qs-card-actions">
          <button class="btn btn-ghost" data-edit="${qs.id}">✏</button>
          <button class="btn btn-ghost" data-delete="${qs.id}" style="color:var(--danger);">🗑</button>
        </div>
      </div>
    `;
  }).join('');
  el.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => openQuickStepEditor(parseInt(b.dataset.edit, 10)));
  el.querySelectorAll('[data-delete]').forEach(b => b.onclick = async () => {
    if (!confirm('Bu Quick Step silinsin mi?')) return;
    await window.api.quickSteps.delete(parseInt(b.dataset.delete, 10));
    await renderQuickStepsList();
    await renderQuickStepsToolbar();
  });
}

function describeQsAction(a) {
  switch (a.type) {
    case 'moveToFolder': return `📁 Taşı`;
    case 'addCategory': return `🏷 Kategori`;
    case 'markRead': return '✓ Okundu';
    case 'markImportant': return '⭐ Önemli';
    case 'markSpam': return '🚫 Spam';
    case 'archive': return '📦 Arşiv';
    case 'delete': return '🗑 Sil';
    case 'reply': return '↩ Yanıtla';
    case 'replyAll': return '↩↩ Tümünü';
    case 'forward': return '→ İlet';
    default: return a.type;
  }
}

async function openQuickStepEditor(id) {
  qsState.editingId = id;
  if (id) {
    const qs = await window.api.quickSteps.get(id);
    if (qs) {
      document.getElementById('qsEditorTitle').textContent = '✏ Düzenle';
      document.getElementById('qs_name').value = qs.name || '';
      document.getElementById('qs_icon').value = qs.icon || '⚡';
      document.getElementById('qs_color').value = qs.color || '#3498db';
      document.getElementById('qs_shortcut').value = qs.shortcut || '';
      document.getElementById('qs_show_in_toolbar').checked = !!qs.show_in_toolbar;
      try { qsState.actions = JSON.parse(qs.actions || '[]'); } catch (_) { qsState.actions = []; }
    }
  } else {
    document.getElementById('qsEditorTitle').textContent = '+ Yeni Quick Step';
    document.getElementById('qs_name').value = '';
    document.getElementById('qs_icon').value = '⚡';
    document.getElementById('qs_color').value = '#3498db';
    document.getElementById('qs_shortcut').value = '';
    document.getElementById('qs_show_in_toolbar').checked = true;
    qsState.actions = [{ type: 'markImportant' }];
  }
  await renderQsActions();
  document.getElementById('modalQuickStepEditor').classList.remove('hidden');
}

async function renderQsActions() {
  const el = document.getElementById('qs_actions');
  el.innerHTML = '';
  for (let i = 0; i < qsState.actions.length; i++) {
    el.appendChild(await buildQsActionRow(qsState.actions[i], i));
  }
}

async function buildQsActionRow(action, idx) {
  const row = document.createElement('div');
  row.className = 'rule-row-editor';
  const def = QS_ACTION_TYPES.find(t => t.value === action.type) || QS_ACTION_TYPES[0];
  let extraHtml = '';
  if (def.needsFolder) {
    const accounts = await window.api.accounts.list();
    let opts = '<option value="">— Klasör seç —</option>';
    for (const a of accounts) {
      const folders = await window.api.folders.list(a.id);
      opts += `<optgroup label="${escapeHtml(a.display_name)}">`;
      for (const f of folders) {
        opts += `<option value="${f.id}" ${action.folderId === f.id ? 'selected' : ''}>${escapeHtml(f.name)}</option>`;
      }
      opts += '</optgroup>';
    }
    extraHtml = `<select class="qs-action-folder" data-idx="${idx}">${opts}</select>`;
  } else if (def.needsCategory) {
    const cats = await window.api.categories.list();
    const opts = '<option value="">— Kategori —</option>' +
      cats.map(c => `<option value="${c.id}" ${action.categoryId === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('');
    extraHtml = `<select class="qs-action-category" data-idx="${idx}">${opts}</select>`;
  }
  row.innerHTML = `
    <select class="qs-action-type" data-idx="${idx}">
      ${QS_ACTION_TYPES.map(t => `<option value="${t.value}" ${t.value === action.type ? 'selected' : ''}>${escapeHtml(t.label)}</option>`).join('')}
    </select>
    ${extraHtml}
    <button class="btn btn-ghost qs-action-remove" data-idx="${idx}" style="color:var(--danger);margin-left:auto;">🗑</button>
  `;
  row.querySelector('.qs-action-type').onchange = (e) => {
    qsState.actions[idx] = { type: e.target.value };
    renderQsActions();
  };
  row.querySelector('.qs-action-folder')?.addEventListener('change', (e) => {
    qsState.actions[idx].folderId = parseInt(e.target.value, 10);
  });
  row.querySelector('.qs-action-category')?.addEventListener('change', (e) => {
    qsState.actions[idx].categoryId = parseInt(e.target.value, 10);
  });
  row.querySelector('.qs-action-remove').onclick = () => {
    qsState.actions.splice(idx, 1);
    if (!qsState.actions.length) qsState.actions.push({ type: 'markImportant' });
    renderQsActions();
  };
  return row;
}

function qsAddAction() {
  qsState.actions.push({ type: 'markRead' });
  renderQsActions();
}

async function saveQuickStep() {
  const name = document.getElementById('qs_name').value.trim();
  if (!name) { alert('Ad gerekli'); return; }
  // Validate actions
  const validActions = qsState.actions.filter(a => {
    const def = QS_ACTION_TYPES.find(t => t.value === a.type);
    if (!def) return false;
    if (def.needsFolder && !a.folderId) return false;
    if (def.needsCategory && !a.categoryId) return false;
    return true;
  });
  if (!validActions.length) { alert('En az bir geçerli eylem gerekli'); return; }
  const data = {
    name,
    icon: document.getElementById('qs_icon').value || '⚡',
    color: document.getElementById('qs_color').value,
    shortcut: document.getElementById('qs_shortcut').value || null,
    show_in_toolbar: document.getElementById('qs_show_in_toolbar').checked,
    actions: validActions
  };
  let r;
  if (qsState.editingId) r = await window.api.quickSteps.update(qsState.editingId, data);
  else r = await window.api.quickSteps.add(data);
  if (r.ok) {
    setStatus('✓ Quick Step kaydedildi');
    document.getElementById('modalQuickStepEditor').classList.add('hidden');
    await renderQuickStepsList();
    await renderQuickStepsToolbar();
  } else {
    alert('Hata: ' + r.error);
  }
}

// Toolbar'da quick steps butonlarını render et
async function renderQuickStepsToolbar() {
  const el = document.getElementById('quickStepsBar');
  if (!el) return;
  const list = await window.api.quickSteps.list({ toolbarOnly: true });
  if (!list.length) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML = list.map(qs => `
    <button class="btn btn-ghost qs-toolbar-btn"
            data-qs-id="${qs.id}"
            title="${escapeHtml(qs.name)}${qs.shortcut ? ' (' + qs.shortcut + ')' : ''}"
            style="border-left:3px solid ${escapeHtml(qs.color || '#3498db')};">
      <span style="font-size:14px;">${escapeHtml(qs.icon || '⚡')}</span>
      <span style="font-size:11px;">${escapeHtml(qs.name.length > 15 ? qs.name.slice(0, 14) + '…' : qs.name)}</span>
    </button>
  `).join('');
  el.querySelectorAll('.qs-toolbar-btn').forEach(btn => {
    btn.onclick = () => {
      const id = parseInt(btn.dataset.qsId, 10);
      executeQuickStep(id);
    };
  });
}

// Quick Step'i seçili maile/maillere uygula
async function executeQuickStep(quickStepId) {
  // Hangi mailler? Çoklu seçim varsa onlar, yoksa selectedMessage
  let messageIds = [];
  if (state.multiSelectIds && state.multiSelectIds.size) {
    messageIds = Array.from(state.multiSelectIds);
  } else if (state.selectedMessage) {
    messageIds = [state.selectedMessage.id];
  }
  if (!messageIds.length) {
    alert('Önce bir veya daha fazla mail seçin');
    return;
  }
  if (messageIds.length > 1) {
    if (!confirm(`${messageIds.length} maile Quick Step uygulansın mı?`)) return;
  }

  const r = await window.api.quickSteps.execute(quickStepId, messageIds);
  if (!r.ok) { alert('Hata: ' + r.error); return; }

  // Renderer aksiyonu varsa (reply/forward), tek mail için çalışır
  if (r.rendererAction && messageIds.length === 1) {
    const msg = await window.api.messages.get(r.primaryMessageId);
    if (msg) {
      if (r.rendererAction.type === 'reply') openCompose({ replyTo: msg });
      else if (r.rendererAction.type === 'replyAll') openCompose({ replyTo: msg, replyAll: true });
      else if (r.rendererAction.type === 'forward') openCompose({ forward: msg });
    }
  }

  setStatus(`⚡ Quick Step uygulandı: ${r.processed} mail, ${r.totalActions} işlem`);
  clearMultiSelect();
  await loadAccounts();
  if (state.selectedFolder) await loadMessages();
}

// Sağ tık menüsünden gelen "Quick Step Çalıştır..." dialog
async function showQuickStepsForMessage(message, contextEvent) {
  const list = await window.api.quickSteps.list();
  if (!list.length) {
    alert('Henüz Quick Step yok. ⚡ Quick Steps menüsünden oluşturun.');
    return;
  }
  const items = list.map(qs => ({
    label: `${qs.icon || '⚡'} ${qs.name}${qs.shortcut ? '  ' + qs.shortcut : ''}`,
    action: () => {
      // Önce mesajı seçili duruma getir, sonra çalıştır
      state.selectedMessage = message;
      executeQuickStep(qs.id);
    }
  }));
  const ev = contextEvent || { preventDefault: () => {}, stopPropagation: () => {},
                                clientX: 200, clientY: 200 };
  showContextMenu(ev, items);
}

// Klavye kısayolları (Ctrl+Shift+1..9)
document.addEventListener('keydown', async (e) => {
  if (!e.ctrlKey || !e.shiftKey || e.altKey || e.metaKey) return;
  const num = parseInt(e.key, 10);
  if (!num || num < 1 || num > 9) return;
  const shortcut = `Ctrl+Shift+${num}`;
  const list = await window.api.quickSteps.list();
  const qs = list.find(q => q.shortcut === shortcut);
  if (!qs) return;
  e.preventDefault();
  e.stopPropagation();
  executeQuickStep(qs.id);
});

// Uygulamada başlangıçta toolbar'ı render et
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => renderQuickStepsToolbar().catch(() => {}), 800);
});

// ============= v1.37: Gelişmiş Arama =============
const searchState = {
  bound: false,
  // Aktif gelişmiş arama opts'i (null = arama yok)
  activeFilters: null,
  // Hızlı filtre chip'leri
  quickFilters: {
    hasAttachment: false,
    isUnread: false,
    isImportant: false,
    thisWeek: false
  }
};

function bindAdvancedSearchUI() {
  if (searchState.bound) return;
  searchState.bound = true;

  document.getElementById('btnAdvancedSearch').onclick = openAdvancedSearch;
  document.getElementById('btnAsSearch').onclick = executeAdvancedSearch;
  document.getElementById('btnAsClear').onclick = clearAdvancedSearchForm;

  // Tarih ön ayarlar
  document.querySelectorAll('.as-date-preset').forEach(btn => {
    btn.onclick = () => {
      const days = parseInt(btn.dataset.days, 10);
      const today = new Date();
      const from = new Date(today);
      if (days > 0) from.setDate(today.getDate() - days);
      document.getElementById('as_dateFrom').value = from.toISOString().slice(0, 10);
      document.getElementById('as_dateTo').value = today.toISOString().slice(0, 10);
    };
  });

  // Hesap → klasör cascading
  document.getElementById('as_accountId').onchange = async () => {
    const accId = parseInt(document.getElementById('as_accountId').value, 10);
    const folderSel = document.getElementById('as_folderId');
    folderSel.innerHTML = '<option value="">— Tüm klasörler —</option>';
    if (accId) {
      const folders = await window.api.folders.list(accId);
      for (const f of folders) {
        folderSel.innerHTML += `<option value="${f.id}">${escapeHtml(f.name)}</option>`;
      }
    }
  };

  // Quick filter chip'leri
  renderQuickFilterChips();
}

async function openAdvancedSearch() {
  bindAdvancedSearchUI();
  // Hesap dropdown'ını doldur
  const accSel = document.getElementById('as_accountId');
  accSel.innerHTML = '<option value="">— Tüm hesaplar —</option>';
  for (const a of state.accounts || []) {
    accSel.innerHTML += `<option value="${a.id}">${escapeHtml(a.display_name)} - ${escapeHtml(a.email)}</option>`;
  }
  // Eğer searchBox'ta metin varsa text alanına yaz
  const sb = document.getElementById('searchBox').value.trim();
  if (sb && !document.getElementById('as_text').value) {
    document.getElementById('as_text').value = sb;
  }
  document.getElementById('modalAdvancedSearch').classList.remove('hidden');
}

function clearAdvancedSearchForm() {
  ['as_text','as_from','as_to','as_subject','as_body','as_dateFrom','as_dateTo','as_minSize','as_maxSize'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  ['as_hasAttachment','as_isUnread','as_isImportant','as_isSpam','as_includeArchived'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = false;
  });
  document.getElementById('as_accountId').value = '';
  document.getElementById('as_folderId').innerHTML = '<option value="">— Tüm klasörler —</option>';
}

async function executeAdvancedSearch() {
  const opts = collectAdvancedSearchOpts();
  document.getElementById('modalAdvancedSearch').classList.add('hidden');
  searchState.activeFilters = opts;
  await applyAdvancedSearch();
}

function collectAdvancedSearchOpts() {
  const v = (id) => document.getElementById(id)?.value?.trim();
  const opts = {};
  if (v('as_text')) opts.text = v('as_text');
  if (v('as_from')) opts.from = v('as_from');
  if (v('as_to')) opts.to = v('as_to');
  if (v('as_subject')) opts.subject = v('as_subject');
  if (v('as_body')) opts.body = v('as_body');
  if (v('as_dateFrom')) opts.dateFrom = v('as_dateFrom') + 'T00:00:00';
  if (v('as_dateTo')) opts.dateTo = v('as_dateTo') + 'T23:59:59';
  const minS = parseInt(v('as_minSize'), 10);
  const maxS = parseInt(v('as_maxSize'), 10);
  if (!isNaN(minS) && minS > 0) opts.minSize = minS * 1024;
  if (!isNaN(maxS) && maxS > 0) opts.maxSize = maxS * 1024;
  if (document.getElementById('as_hasAttachment').checked) opts.hasAttachment = true;
  if (document.getElementById('as_isUnread').checked) opts.isRead = false;
  if (document.getElementById('as_isImportant').checked) opts.isImportant = true;
  if (document.getElementById('as_isSpam').checked) opts.isSpam = true;
  if (document.getElementById('as_includeArchived').checked) opts.includeArchived = true;
  const accId = parseInt(document.getElementById('as_accountId').value, 10);
  const folderId = parseInt(document.getElementById('as_folderId').value, 10);
  if (accId) opts.accountId = accId;
  if (folderId) opts.folderId = folderId;
  return opts;
}

async function applyAdvancedSearch() {
  if (!searchState.activeFilters) {
    clearAdvancedFilters();
    return;
  }
  const opts = searchState.activeFilters;
  const messages = await window.api.search.advanced(opts);
  state.messages = messages || [];
  state.selectedFolder = null; // Cross-folder mode

  // Aktif filtre çubuğunu göster
  renderActiveFiltersBar();
  // folderTitle güncelle
  document.getElementById('folderTitle').textContent = `🔍 Arama: ${messages.length} sonuç`;
  document.querySelectorAll('.folder-item.active').forEach(el => el.classList.remove('active'));
  document.getElementById('unifiedInbox')?.classList.remove('active');

  // Mesaj listesini render et
  renderSearchResults(messages);
}

function clearAdvancedFilters() {
  searchState.activeFilters = null;
  searchState.quickFilters = { hasAttachment: false, isUnread: false, isImportant: false, thisWeek: false };
  document.getElementById('searchBox').value = '';
  state.searchQuery = '';
  document.getElementById('activeFiltersBar').classList.add('hidden');
  renderQuickFilterChips();
  // Önceki klasöre dön (varsa)
  if (state.accounts && state.accounts[0]) {
    const folders = state.accounts[0].folders || [];
    const inbox = folders.find(f => f.special_use === '\\Inbox' || /inbox|gelen/i.test(f.name)) || folders[0];
    if (inbox) selectFolder(inbox.id, state.accounts[0].id);
  }
}

function renderActiveFiltersBar() {
  const bar = document.getElementById('activeFiltersBar');
  const opts = searchState.activeFilters;
  if (!opts) {
    bar.classList.add('hidden');
    return;
  }
  const chips = [];
  if (opts.text) chips.push(`Metin: "${opts.text}"`);
  if (opts.from) chips.push(`Gönderen: "${opts.from}"`);
  if (opts.to) chips.push(`Alıcı: "${opts.to}"`);
  if (opts.subject) chips.push(`Konu: "${opts.subject}"`);
  if (opts.body) chips.push(`İçerik: "${opts.body}"`);
  if (opts.hasAttachment) chips.push('📎 Eki var');
  if (opts.isRead === false) chips.push('📨 Okunmamış');
  if (opts.isImportant) chips.push('⭐ Önemli');
  if (opts.isSpam) chips.push('🚫 Spam');
  if (opts.dateFrom) chips.push(`📅 ≥ ${opts.dateFrom.slice(0, 10)}`);
  if (opts.dateTo) chips.push(`📅 ≤ ${opts.dateTo.slice(0, 10)}`);
  if (opts.minSize) chips.push(`≥ ${(opts.minSize / 1024).toFixed(0)} KB`);
  if (opts.maxSize) chips.push(`≤ ${(opts.maxSize / 1024).toFixed(0)} KB`);
  if (opts.includeArchived) chips.push('📦 Arşiv dahil');

  bar.classList.remove('hidden');
  bar.innerHTML = chips.map(c => `<span class="active-filter-chip">${escapeHtml(c)}</span>`).join('') +
    `<button class="btn btn-ghost" id="btnClearFilters" style="font-size:11px;padding:3px 10px;margin-left:auto;color:var(--danger);">✕ Filtreleri Temizle</button>`;
  document.getElementById('btnClearFilters').onclick = clearAdvancedFilters;
}

function renderSearchResults(messages) {
  const container = document.getElementById('messageList');
  if (!messages.length) {
    container.innerHTML = '<div class="empty-state" style="padding:40px;">Hiç sonuç bulunamadı.<br><br><small>Filtreleri gevşeterek tekrar deneyin.</small></div>';
    return;
  }
  // Mevcut renderMessages mantığını kullan ama folder bilgisi göster
  container.innerHTML = messages.map(m => {
    const date = m.date ? new Date(m.date).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '';
    const fromName = m.from_name || (m.from_addr || '').split('@')[0];
    return `
      <div class="message-item ${m.is_read ? '' : 'unread'} ${m.is_spam ? 'is-spam' : ''} ${m.is_important ? 'is-important' : ''}"
           data-id="${m.id}" data-account-id="${m.account_id}" data-folder-id="${m.folder_id}">
        <div class="message-from">
          ${m.is_important ? '<span style="color:#f5a623;">⭐</span>' : ''}
          ${escapeHtml(fromName)}
          <small style="color:var(--muted);">[${escapeHtml(m.account_name || '')} / ${escapeHtml(m.folder_name || '')}]</small>
        </div>
        <div class="message-subject">${escapeHtml(m.subject || '(Konusuz)')}</div>
        <div class="message-preview">${escapeHtml((m.preview || '').slice(0, 120))}</div>
        <div class="message-meta">
          ${m.has_attachments ? '<span title="Ek var">📎</span>' : ''}
          ${m.size ? `<span style="color:var(--muted);font-size:10px;">${(m.size/1024).toFixed(0)}KB</span>` : ''}
          <span class="message-date">${escapeHtml(date)}</span>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.message-item').forEach(el => {
    const id = parseInt(el.dataset.id, 10);
    el.onclick = () => openMessage(id);
    el.ondblclick = () => window.api.messages.openInWindow(id);
    el.oncontextmenu = async (e) => {
      const fullMsg = await window.api.messages.get(id);
      if (fullMsg) showMessageContextMenu(e, fullMsg);
    };
  });
}

// Hızlı filtre chip'leri (search box altında)
function renderQuickFilterChips() {
  const el = document.getElementById('quickFilterChips');
  if (!el) return;
  const qf = searchState.quickFilters;
  el.innerHTML = `
    <button class="quick-chip ${qf.hasAttachment ? 'active' : ''}" data-qf="hasAttachment">📎 Eki olanlar</button>
    <button class="quick-chip ${qf.isUnread ? 'active' : ''}" data-qf="isUnread">📨 Okunmamış</button>
    <button class="quick-chip ${qf.isImportant ? 'active' : ''}" data-qf="isImportant">⭐ Önemli</button>
    <button class="quick-chip ${qf.thisWeek ? 'active' : ''}" data-qf="thisWeek">📅 Bu hafta</button>
  `;
  el.querySelectorAll('.quick-chip').forEach(b => {
    b.onclick = () => {
      const key = b.dataset.qf;
      qf[key] = !qf[key];
      applyQuickFilters();
    };
  });
}

async function applyQuickFilters() {
  const qf = searchState.quickFilters;
  const anyActive = qf.hasAttachment || qf.isUnread || qf.isImportant || qf.thisWeek;
  if (!anyActive) {
    // Hepsi kapalı → reset
    searchState.activeFilters = null;
    document.getElementById('activeFiltersBar').classList.add('hidden');
    renderQuickFilterChips();
    if (state.selectedFolder) {
      const f = state.selectedFolder;
      await selectFolder(f.id, f.account_id || f.accountId);
    }
    return;
  }
  // Quick filter'leri opts'a çevir
  const opts = {};
  if (qf.hasAttachment) opts.hasAttachment = true;
  if (qf.isUnread) opts.isRead = false;
  if (qf.isImportant) opts.isImportant = true;
  if (qf.thisWeek) {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    opts.dateFrom = d.toISOString();
  }
  // Mevcut klasör bağlamını koru
  if (state.selectedFolder?.id) opts.folderId = state.selectedFolder.id;
  searchState.activeFilters = opts;
  await applyAdvancedSearch();
  renderQuickFilterChips();
}

// Search syntax parser (Gmail tarzı: from:x subject:y has:attachment)
function parseSearchSyntax(query) {
  if (!query || !query.trim()) return null;
  const opts = {};
  const remaining = [];
  // Token'lara böl (boşluk veya tırnak)
  const tokenRegex = /(\w+):"([^"]+)"|(\w+):(\S+)|"([^"]+)"|(\S+)/g;
  let m;
  while ((m = tokenRegex.exec(query)) !== null) {
    const key = (m[1] || m[3] || '').toLowerCase();
    const value = m[2] || m[4];
    const plainQ = m[5] || m[6];
    if (key && value) {
      switch (key) {
        case 'from': opts.from = value; break;
        case 'to': opts.to = value; break;
        case 'subject': opts.subject = value; break;
        case 'body': opts.body = value; break;
        case 'has':
          if (value === 'attachment' || value === 'attach') opts.hasAttachment = true;
          break;
        case 'is':
          if (value === 'unread') opts.isRead = false;
          else if (value === 'read') opts.isRead = true;
          else if (value === 'important' || value === 'starred') opts.isImportant = true;
          else if (value === 'spam') opts.isSpam = true;
          break;
        case 'before': opts.dateTo = value + 'T23:59:59'; break;
        case 'after': opts.dateFrom = value + 'T00:00:00'; break;
        case 'larger': {
          const mb = value.match(/(\d+)\s*([km]?b)?/i);
          if (mb) {
            let bytes = parseInt(mb[1], 10);
            const unit = (mb[2] || '').toLowerCase();
            if (unit === 'kb' || !unit) bytes *= 1024;
            else if (unit === 'mb') bytes *= 1024 * 1024;
            opts.minSize = bytes;
          }
          break;
        }
        case 'smaller': {
          const mb = value.match(/(\d+)\s*([km]?b)?/i);
          if (mb) {
            let bytes = parseInt(mb[1], 10);
            const unit = (mb[2] || '').toLowerCase();
            if (unit === 'kb' || !unit) bytes *= 1024;
            else if (unit === 'mb') bytes *= 1024 * 1024;
            opts.maxSize = bytes;
          }
          break;
        }
        default: remaining.push(m[0]);
      }
    } else if (plainQ) {
      remaining.push(plainQ);
    }
  }
  if (remaining.length) opts.text = remaining.join(' ');
  return Object.keys(opts).length ? opts : null;
}

// Search box'a syntax dinleyici (Enter'a basınca syntax'ı parse et)
function bindSearchSyntax() {
  const sb = document.getElementById('searchBox');
  if (!sb) return;
  sb.addEventListener('keydown', async (e) => {
    if (e.key !== 'Enter') return;
    const q = sb.value.trim();
    if (!q) {
      // Boşsa filtreyi temizle
      if (searchState.activeFilters) clearAdvancedFilters();
      return;
    }
    const parsed = parseSearchSyntax(q);
    // Eğer syntax token'ı yoksa basit text araması
    if (!parsed || (Object.keys(parsed).length === 1 && parsed.text)) {
      state.searchQuery = q;
      if (state.selectedFolder) await loadMessages();
      return;
    }
    // Syntax tokens var → gelişmiş arama
    e.preventDefault();
    searchState.activeFilters = parsed;
    await applyAdvancedSearch();
  });
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    bindAdvancedSearchUI();
    bindSearchSyntax();
    renderQuickFilterChips();
  }, 1000);
});

// ============= v1.38: İmza Şablonu Builder =============
const sigBuilderState = {
  bound: false,
  currentTemplateId: 'modern',
  data: {
    name: '', title: '', company: '', phone: '', email: '',
    website: '', address: '', logoDataUrl: '', accentColor: '#0078d4',
    linkedin: '', twitter: '', instagram: ''
  }
};

function openSignatureBuilder() {
  if (!window.SignatureTemplates) {
    alert('Şablon kütüphanesi yüklenemedi. Sayfayı yenileyin.');
    return;
  }
  document.getElementById('modalSignatureBuilder').classList.remove('hidden');
  if (!sigBuilderState.bound) {
    sigBuilderState.bound = true;
    bindSignatureBuilder();
  }

  // Mevcut hesabın signature_data'sından doldur (varsa)
  loadSigDataFromAccount();
  renderSigTemplateGallery();
  updateSigPreview();
}

function bindSignatureBuilder() {
  document.getElementById('btnSigApply').onclick = applySignatureFromBuilder;
  document.getElementById('btnSigUploadLogo').onclick = uploadSigLogo;
  document.getElementById('btnSigClearLogo').onclick = () => {
    sigBuilderState.data.logoDataUrl = '';
    document.getElementById('sigLogoPreview').innerHTML = '';
    updateSigPreview();
  };
}

function loadSigDataFromAccount() {
  const accountId = state.editingAccountId;
  if (!accountId) return;
  const acc = (state.accounts || []).find(a => a.id === accountId);
  if (!acc) return;
  let parsed = null;
  try {
    if (acc.signature_data) parsed = JSON.parse(acc.signature_data);
  } catch (_) {}

  if (parsed) {
    sigBuilderState.currentTemplateId = parsed.templateId || 'modern';
    sigBuilderState.data = Object.assign({}, sigBuilderState.data, parsed.data || {});
  } else {
    // Account default değerleri ile doldur
    sigBuilderState.data.name = acc.display_name || '';
    sigBuilderState.data.email = acc.email || '';
    sigBuilderState.currentTemplateId = 'modern';
  }

  // Form alanlarını doldur
  document.getElementById('sb_name').value = sigBuilderState.data.name || '';
  document.getElementById('sb_title').value = sigBuilderState.data.title || '';
  document.getElementById('sb_company').value = sigBuilderState.data.company || '';
  document.getElementById('sb_phone').value = sigBuilderState.data.phone || '';
  document.getElementById('sb_email').value = sigBuilderState.data.email || '';
  document.getElementById('sb_website').value = sigBuilderState.data.website || '';
  document.getElementById('sb_address').value = sigBuilderState.data.address || '';
  document.getElementById('sb_accent').value = sigBuilderState.data.accentColor || '#0078d4';
  document.getElementById('sb_linkedin').value = sigBuilderState.data.linkedin || '';
  document.getElementById('sb_twitter').value = sigBuilderState.data.twitter || '';
  document.getElementById('sb_instagram').value = sigBuilderState.data.instagram || '';

  // Logo preview
  if (sigBuilderState.data.logoDataUrl) {
    document.getElementById('sigLogoPreview').innerHTML =
      `<img src="${sigBuilderState.data.logoDataUrl}" style="max-width:80px;max-height:80px;border:1px solid var(--border);padding:4px;background:#fff;">`;
  }
}

function renderSigTemplateGallery() {
  const el = document.getElementById('sigTemplateGallery');
  if (!el) return;
  const templates = SignatureTemplates.getTemplates();
  el.innerHTML = templates.map(t => `
    <div class="sig-template-item ${t.id === sigBuilderState.currentTemplateId ? 'active' : ''}" data-tpl="${t.id}">
      <div class="sig-template-name">${escapeHtml(t.name)}</div>
      <div class="sig-template-desc">${escapeHtml(t.description)}</div>
    </div>
  `).join('');
  el.querySelectorAll('.sig-template-item').forEach(item => {
    item.onclick = () => {
      sigBuilderState.currentTemplateId = item.dataset.tpl;
      renderSigTemplateGallery();
      updateSigPreview();
    };
  });
}

// Form değişince çağrılır (oninput)
function onSigDataChange() {
  const v = (id) => document.getElementById(id)?.value || '';
  sigBuilderState.data = Object.assign({}, sigBuilderState.data, {
    name: v('sb_name'),
    title: v('sb_title'),
    company: v('sb_company'),
    phone: v('sb_phone'),
    email: v('sb_email'),
    website: v('sb_website'),
    address: v('sb_address'),
    accentColor: v('sb_accent') || '#0078d4',
    linkedin: v('sb_linkedin'),
    twitter: v('sb_twitter'),
    instagram: v('sb_instagram')
    // logoDataUrl ayrı yönetiliyor
  });
  updateSigPreview();
}
window.onSigDataChange = onSigDataChange;

function updateSigPreview() {
  const html = SignatureTemplates.render(sigBuilderState.currentTemplateId, sigBuilderState.data);
  const el = document.getElementById('sigPreviewContainer');
  if (el) el.innerHTML = html;
}

async function uploadSigLogo() {
  try {
    // branding:pickAndReadImage IPC'sini kullan (mevcut)
    const result = await window.api.branding?.pickImage?.();
    if (!result || !result.ok) {
      // Fallback: file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png,image/jpeg,image/svg+xml,image/webp';
      input.onchange = () => {
        const file = input.files[0];
        if (!file) return;
        if (file.size > 200 * 1024) { alert('Logo en fazla 200 KB olabilir'); return; }
        const reader = new FileReader();
        reader.onload = () => {
          sigBuilderState.data.logoDataUrl = reader.result;
          document.getElementById('sigLogoPreview').innerHTML =
            `<img src="${reader.result}" style="max-width:80px;max-height:80px;border:1px solid var(--border);padding:4px;background:#fff;">`;
          updateSigPreview();
        };
        reader.readAsDataURL(file);
      };
      input.click();
      return;
    }
    sigBuilderState.data.logoDataUrl = result.dataUrl;
    document.getElementById('sigLogoPreview').innerHTML =
      `<img src="${result.dataUrl}" style="max-width:80px;max-height:80px;border:1px solid var(--border);padding:4px;background:#fff;">`;
    updateSigPreview();
  } catch (e) {
    alert('Logo yüklenemedi: ' + e.message);
  }
}

async function applySignatureFromBuilder() {
  if (!sigBuilderState.data.name) {
    if (!confirm('Ad Soyad boş - yine de uygula?')) return;
  }
  const html = SignatureTemplates.render(sigBuilderState.currentTemplateId, sigBuilderState.data);

  // signatureEditor'a HTML'i koy
  if (state.signatureEditor && typeof state.signatureEditor.setHTML === 'function') {
    state.signatureEditor.setHTML(html);
  }

  // signature_data'yı state'e geçici olarak yaz - hesap kaydedilirken DB'ye gidecek
  sigBuilderState._lastApplied = {
    templateId: sigBuilderState.currentTemplateId,
    data: sigBuilderState.data,
    html
  };

  setStatus('✓ İmza şablonu uygulandı. Hesabı kaydetmeyi unutmayın.');
  document.getElementById('modalSignatureBuilder').classList.add('hidden');
}

// btnSignatureBuilder bağla (settings modal açıldığında)
document.addEventListener('click', (e) => {
  if (e.target.id === 'btnSignatureBuilder') {
    e.preventDefault();
    openSignatureBuilder();
  }
});

// Hesap kaydedilirken signature_data'yı da gönder
const _origAccountSave = window._origAccountSave;

// ============= v1.41: Sidebar Kategori Paneli =============
const catSidebarState = {
  selectedCategoryId: null,
  collapsed: false,
  bound: false
};

async function renderSidebarCategories() {
  const el = document.getElementById('sidebarCategoriesList');
  if (!el) return;
  if (catSidebarState.collapsed) { el.style.display = 'none'; return; }
  el.style.display = '';

  const cats = await window.api.categories.list();
  if (!cats.length) {
    el.innerHTML = '<div class="cat-empty">Henüz kategori yok. + ile ekle</div>';
    return;
  }

  el.innerHTML = cats.map(c => `
    <div class="sidebar-cat-item ${catSidebarState.selectedCategoryId === c.id ? 'active' : ''}"
         data-cat-id="${c.id}" title="${escapeHtml(c.name)}">
      <span class="sidebar-cat-dot" style="background:${escapeHtml(c.color || '#888')};"></span>
      <span class="sidebar-cat-name">${escapeHtml(c.name)}</span>
      ${c.unread_count > 0 ? `<span class="sidebar-cat-unread">${c.unread_count}</span>` : ''}
      ${c.message_count > 0 && !c.unread_count ? `<span class="sidebar-cat-count">${c.message_count}</span>` : ''}
    </div>
  `).join('');

  el.querySelectorAll('.sidebar-cat-item').forEach(item => {
    const catId = parseInt(item.dataset.catId, 10);
    item.onclick = () => selectSidebarCategory(catId);
    item.oncontextmenu = (e) => {
      e.preventDefault();
      showSidebarCategoryContextMenu(e, catId);
    };
  });

  if (!catSidebarState.bound) {
    catSidebarState.bound = true;
    document.getElementById('catSectionToggle').onclick = () => {
      catSidebarState.collapsed = !catSidebarState.collapsed;
      document.getElementById('catSectionToggle').textContent = catSidebarState.collapsed ? '▶' : '▼';
      renderSidebarCategories();
    };
    document.getElementById('btnSidebarNewCat').onclick = async (e) => {
      e.stopPropagation();
      await createNewSidebarCategory();
    };
  }
}

async function selectSidebarCategory(categoryId) {
  catSidebarState.selectedCategoryId = categoryId;
  // Klasör/inbox seçimini temizle
  state.selectedFolder = null;
  document.querySelectorAll('.folder-item.active').forEach(el => el.classList.remove('active'));
  document.getElementById('unifiedInbox')?.classList.remove('active');

  // Kategorinin tüm maillerini getir
  const messages = await window.api.categories.listMessages(categoryId, {});
  const cat = await window.api.categories.get(categoryId);
  state.messages = messages || [];

  document.getElementById('folderTitle').textContent = `🏷 ${cat?.name || 'Kategori'} (${messages.length})`;
  renderSearchResults(messages); // v1.37 cross-folder render kullan
  await renderSidebarCategories();
}

function showSidebarCategoryContextMenu(event, categoryId) {
  const items = [
    { label: '✏ Adını/rengini değiştir', action: () => editCategoryQuick(categoryId) },
    { label: '🏷 Kategori yöneticisini aç', action: () => openCategories() },
    { divider: true },
    { label: '🗑 Sil', danger: true, action: async () => {
      const cat = await window.api.categories.get(categoryId);
      if (!cat) return;
      if (!confirm(`"${cat.name}" kategorisi silinsin mi?\n\nMaillerden de kaldırılacak (mailler silinmez).`)) return;
      await window.api.categories.delete(categoryId);
      setStatus('Kategori silindi');
      if (catSidebarState.selectedCategoryId === categoryId) catSidebarState.selectedCategoryId = null;
      await renderSidebarCategories();
    }}
  ];
  showContextMenu(event, items);
}

async function editCategoryQuick(categoryId) {
  const cat = await window.api.categories.get(categoryId);
  if (!cat) return;
  const newName = prompt('Yeni ad:', cat.name);
  if (!newName || !newName.trim()) return;
  // Renk için basit bir prompt (color picker'a tam erişim için Categories modal'ı kullansın)
  const newColor = prompt('Renk (hex, örn #3498db):', cat.color || '#3498db');
  const updates = { name: newName.trim() };
  if (newColor && /^#[0-9a-f]{6}$/i.test(newColor)) updates.color = newColor;
  await window.api.categories.update(categoryId, updates);
  setStatus('Kategori güncellendi');
  await renderSidebarCategories();
}

async function createNewSidebarCategory() {
  const name = prompt('Yeni kategori adı:');
  if (!name || !name.trim()) return;
  const colors = ['#3498db', '#9b59b6', '#e74c3c', '#f39c12', '#2ecc71', '#1abc9c', '#e67e22', '#34495e'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const r = await window.api.categories.add({ name: name.trim(), color });
  if (r && (r.ok !== false)) {
    setStatus(`✓ "${name}" kategorisi oluşturuldu`);
    await renderSidebarCategories();
  }
}

// Klasör seçilince kategori seçimini temizle
const _origSelectFolder_v141 = window.selectFolder;
// Bu hook ile entegre etmek yerine selectFolder içinden direkt çağırıyoruz aşağıda

// loadAccounts veya init sonrası kategorileri çek
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => renderSidebarCategories().catch(() => {}), 1500);
});

// Account modal kapandığında OAuth pending temizle
document.addEventListener('click', (e) => {
  if (e.target.matches('[data-close="modalAccount"]')) {
    window._oauthPending = null;
    // Form input'ları reset
    const pwd = document.getElementById('acc_in_password');
    if (pwd) { pwd.disabled = false; pwd.placeholder = ''; }
  }
});

// ============= v1.42: OAuth2 Hızlı Bağlantı =============
async function connectViaOAuth(provider) {
  // Önce yapılandırılmış mı kontrol
  const configured = await window.api.oauth2.isConfigured(provider);
  if (!configured) {
    const providerName = provider === 'microsoft' ? 'Microsoft' : 'Google';
    if (confirm(
      `${providerName} OAuth2 henüz yapılandırılmamış.\n\n` +
      `Adım adım rehberli kurulum sihirbazını açmak ister misiniz?\n\n` +
      `(5 dakika sürer - Azure/Google'da ücretsiz uygulama kayıt edilir)`
    )) {
      openOAuth2Setup(provider);
    }
    return;
  }

  setStatus('🔐 ' + (provider === 'microsoft' ? 'Microsoft' : 'Google') + ' giriş penceresi açılıyor...');
  const result = await window.api.oauth2.startFlow(provider);
  if (!result.ok) {
    alert('Giriş başarısız: ' + result.error);
    setStatus('Giriş iptal edildi', 'error');
    return;
  }

  // Form alanlarını OAuth verisiyle doldur
  document.getElementById('acc_display_name').value = result.displayName || '';
  document.getElementById('acc_email').value = result.email || '';
  document.getElementById('acc_in_password').value = ''; // OAuth'ta şifre yok
  document.getElementById('acc_in_password').placeholder = '🔐 OAuth ile bağlandı (şifre gerekmez)';
  document.getElementById('acc_in_password').disabled = true;

  // OAuth verilerini state'e geçici sakla (kaydederken kullanılacak)
  window._oauthPending = {
    provider: provider,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    expiresAt: result.expiresAt,
    serverConfig: result.serverConfig
  };

  // Sunucu ayarlarını otomatik doldur
  if (result.serverConfig) {
    document.getElementById('acc_in_host').value = result.serverConfig.imapHost || '';
    document.getElementById('acc_in_port').value = result.serverConfig.imapPort || 993;
    document.getElementById('acc_smtp_host').value = result.serverConfig.smtpHost || '';
    document.getElementById('acc_smtp_port').value = result.serverConfig.smtpPort || 587;
    document.getElementById('acc_in_username').value = result.email || '';
    document.getElementById('acc_smtp_username').value = result.email || '';
    // Protocol kesin IMAP olsun
    const protSel = document.getElementById('acc_protocol');
    if (protSel) protSel.value = 'imap';
  }

  setStatus(`✓ ${result.email} ile giriş başarılı - ayarlar otomatik dolduruldu`);
}

// Wizard butonlarını bağla
document.addEventListener('click', (e) => {
  if (e.target.closest('#btnConnectMicrosoft')) {
    e.preventDefault();
    connectViaOAuth('microsoft');
  }
  if (e.target.closest('#btnConnectGoogle')) {
    e.preventDefault();
    connectViaOAuth('google');
  }
});

// Settings'te OAuth setup butonu
document.addEventListener('click', (e) => {
  if (e.target.id === 'btnOpenOAuth2Setup') {
    e.preventDefault();
    document.getElementById('modalSettings')?.classList.add('hidden');
    setTimeout(() => openOAuth2Setup(), 200);
  }
});

// ============= v1.44: OAuth2 Setup Wizard =============
async function openOAuth2Setup(initialProvider) {
  document.getElementById('modalOAuth2Setup').classList.remove('hidden');
  await refreshOAuthSetupStatus();

  // Tab handlers
  document.querySelectorAll('.oauth-tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.oauth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderOAuthSetupContent(tab.dataset.provider);
    };
  });

  const target = initialProvider || 'microsoft';
  document.querySelectorAll('.oauth-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.provider === target);
  });
  renderOAuthSetupContent(target);
}

async function refreshOAuthSetupStatus() {
  const ids = await window.api.oauth2.getClientIds();
  document.getElementById('oauthStatusMicrosoft').innerHTML = ids.microsoft
    ? '<span style="color:var(--success);">✓ Yapılandırıldı</span>'
    : '⚪ Yapılandırılmamış';
  document.getElementById('oauthStatusGoogle').innerHTML = ids.google
    ? '<span style="color:var(--success);">✓ Yapılandırıldı</span>'
    : '⚪ Yapılandırılmamış';
}

async function renderOAuthSetupContent(provider) {
  const ids = await window.api.oauth2.getClientIds();
  const currentId = ids[provider] || '';
  const el = document.getElementById('oauthSetupContent');

  if (provider === 'microsoft') {
    el.innerHTML = `
      <h3 style="margin-top:0;">🟦 Microsoft (Outlook.com / Office 365) Kurulumu</h3>
      <p style="font-size:13px;color:var(--text-2);">
        Microsoft, 2024 Eylül'den sonra outlook.com / hotmail / live hesaplarında şifre ile IMAP girişini kapattı. Modern auth (OAuth2) için kendi uygulamanızı Azure'da ücretsiz kayıt etmeniz gerekiyor (5 dk).
      </p>

      <div class="oauth-step">
        <div class="oauth-step-num">1</div>
        <div class="oauth-step-body">
          <strong>Azure Portal'a giriş yap</strong>
          <p>Microsoft hesabınla giriş yap (her hesap çalışır):</p>
          <button class="btn btn-primary" onclick="openExternalLink('https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade')">
            🔗 Azure Portal — App registrations
          </button>
        </div>
      </div>

      <div class="oauth-step">
        <div class="oauth-step-num">2</div>
        <div class="oauth-step-body">
          <strong>"+ New registration" butonuna bas</strong>
          <p>Açılan formu doldur:</p>
          <div class="oauth-form-mock">
            <div><strong>Name:</strong> CODEGA Mail</div>
            <div><strong>Supported account types:</strong> Personal Microsoft accounts only <em>(kişisel hesap için)</em><br>
            <small style="color:var(--muted);">İş hesabı kullanıyorsan: "Accounts in any organizational directory and personal Microsoft accounts"</small></div>
            <div><strong>Redirect URI:</strong> Public client/native (mobile &amp; desktop) → <code>http://localhost:51842/callback</code></div>
          </div>
          <button class="btn">Register</button>'a bas
        </div>
      </div>

      <div class="oauth-step">
        <div class="oauth-step-num">3</div>
        <div class="oauth-step-body">
          <strong>API izinlerini ekle</strong>
          <p>Sol menüden <code>API permissions</code> > <code>+ Add a permission</code> > <code>Microsoft Graph</code> > <code>Delegated permissions</code></p>
          <p>Şu izinleri ARA ve seç:</p>
          <ul style="font-family:monospace;font-size:12px;color:var(--text);">
            <li>✅ <code>IMAP.AccessAsUser.All</code></li>
            <li>✅ <code>SMTP.Send</code></li>
            <li>✅ <code>offline_access</code></li>
            <li>✅ <code>User.Read</code> (genelde otomatik ekli)</li>
          </ul>
          <p>"Add permissions" ile kaydet.</p>
        </div>
      </div>

      <div class="oauth-step">
        <div class="oauth-step-num">4</div>
        <div class="oauth-step-body">
          <strong>Public client flow'u aç</strong>
          <p>Sol menü > <code>Authentication</code> sayfasına git. Aşağıda <em>"Allow public client flows"</em> seçeneğini bul ve <strong>Yes</strong> yap. Save'e bas.</p>
        </div>
      </div>

      <div class="oauth-step">
        <div class="oauth-step-num">5</div>
        <div class="oauth-step-body">
          <strong>Application (client) ID'yi kopyala</strong>
          <p>Sol menü > <code>Overview</code> > <strong>Application (client) ID</strong> alanını kopyala. UUID şeklinde olacak (örn: <code>12345678-1234-1234-1234-123456789012</code>).</p>
        </div>
      </div>

      <div class="oauth-step">
        <div class="oauth-step-num">6</div>
        <div class="oauth-step-body">
          <strong>Client ID'yi buraya yapıştır</strong>
          <input type="text" id="oauthMsClientId" placeholder="12345678-1234-1234-1234-123456789012"
                 value="${escapeHtml(currentId)}"
                 style="width:100%;padding:10px;font-family:monospace;font-size:12px;background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:6px;">
          <div style="display:flex;gap:8px;margin-top:10px;">
            <button class="btn btn-primary" id="btnSaveMsClientId">💾 Kaydet</button>
            ${currentId ? '<button class="btn btn-ghost" id="btnTestMsConnect">🔐 Test - Microsoft ile Bağlan</button>' : ''}
          </div>
          <small style="color:var(--muted);display:block;margin-top:8px;">
            Client ID gizli değil (public bilgi). Sadece "kim çağırıyor" demek için. Güvenlik için secret kullanmıyoruz - PKCE flow.
          </small>
        </div>
      </div>
    `;

    document.getElementById('btnSaveMsClientId').onclick = async () => {
      const id = document.getElementById('oauthMsClientId').value.trim();
      if (!id) { alert('Client ID boş olamaz'); return; }
      const r = await window.api.oauth2.saveClientId('microsoft', id);
      if (r.ok) {
        setStatus('✓ Microsoft Client ID kaydedildi');
        await refreshOAuthSetupStatus();
        renderOAuthSetupContent('microsoft'); // Test butonu eklensin
      } else { alert('Hata: ' + r.error); }
    };
    const btnTest = document.getElementById('btnTestMsConnect');
    if (btnTest) btnTest.onclick = async () => {
      document.getElementById('modalOAuth2Setup').classList.add('hidden');
      // Hesap ekleme modali açılmazsa connect direkt
      const r = await window.api.oauth2.startFlow('microsoft');
      if (r.ok) {
        alert(`✓ Test başarılı!\n\nGiriş yapan: ${r.email}\n\nArtık + Hesap > 🟦 Microsoft ile Bağlan ile gerçek hesap ekleyebilirsiniz.`);
      } else {
        alert('Test başarısız: ' + r.error);
      }
    };
  }

  if (provider === 'google') {
    el.innerHTML = `
      <h3 style="margin-top:0;">🟥 Google (Gmail) Kurulumu</h3>
      <p style="font-size:13px;color:var(--text-2);">
        Gmail için Google Cloud Console'da ücretsiz bir OAuth uygulaması kayıt etmeniz gerekiyor. Test mode'da 100 kullanıcıya kadar ücretsiz çalışır (kişisel kullanım için fazlasıyla yeterli).
      </p>

      <div class="oauth-step">
        <div class="oauth-step-num">1</div>
        <div class="oauth-step-body">
          <strong>Google Cloud Console'a giriş yap</strong>
          <button class="btn btn-primary" onclick="openExternalLink('https://console.cloud.google.com/projectcreate')">
            🔗 Yeni Proje Oluştur
          </button>
          <p>Proje adı: <code>CODEGA Mail</code> — "Create" bas.</p>
        </div>
      </div>

      <div class="oauth-step">
        <div class="oauth-step-num">2</div>
        <div class="oauth-step-body">
          <strong>OAuth Consent Screen yapılandır</strong>
          <button class="btn" onclick="openExternalLink('https://console.cloud.google.com/apis/credentials/consent')">
            🔗 OAuth Consent Screen
          </button>
          <p>User Type: <strong>External</strong> > Create</p>
          <p>App information:</p>
          <ul style="font-size:12px;">
            <li>App name: <code>CODEGA Mail</code></li>
            <li>User support email: e-postanız</li>
            <li>Developer email: e-postanız</li>
          </ul>
          <p>Save and Continue (3 sayfa boyunca, Scopes ve Test users boş bırakılabilir başta).</p>
          <p><strong>Test users</strong> sayfasına gel ve kendi Gmail adresini ekle (sadece eklediklerin giriş yapabilir).</p>
        </div>
      </div>

      <div class="oauth-step">
        <div class="oauth-step-num">3</div>
        <div class="oauth-step-body">
          <strong>OAuth Client ID oluştur</strong>
          <button class="btn" onclick="openExternalLink('https://console.cloud.google.com/apis/credentials')">
            🔗 Credentials sayfası
          </button>
          <p><code>+ Create Credentials</code> > <code>OAuth client ID</code></p>
          <div class="oauth-form-mock">
            <div><strong>Application type:</strong> Desktop app</div>
            <div><strong>Name:</strong> CODEGA Mail Desktop</div>
          </div>
          <p>Create'e bas.</p>
        </div>
      </div>

      <div class="oauth-step">
        <div class="oauth-step-num">4</div>
        <div class="oauth-step-body">
          <strong>Gmail API'sini etkinleştir</strong>
          <button class="btn" onclick="openExternalLink('https://console.cloud.google.com/apis/library/gmail.googleapis.com')">
            🔗 Gmail API'yi Etkinleştir
          </button>
          <p>"Enable" butonuna bas.</p>
        </div>
      </div>

      <div class="oauth-step">
        <div class="oauth-step-num">5</div>
        <div class="oauth-step-body">
          <strong>Client ID'yi kopyala</strong>
          <p>Credentials sayfasında oluşturduğun "OAuth 2.0 Client IDs" kaydının yanındaki ikonla Client ID'yi kopyala. <code>123456789-abcdefg.apps.googleusercontent.com</code> gibi olacak.</p>
        </div>
      </div>

      <div class="oauth-step">
        <div class="oauth-step-num">6</div>
        <div class="oauth-step-body">
          <strong>Buraya yapıştır</strong>
          <input type="text" id="oauthGoogleClientId" placeholder="123456789-abc.apps.googleusercontent.com"
                 value="${escapeHtml(currentId)}"
                 style="width:100%;padding:10px;font-family:monospace;font-size:12px;background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:6px;">
          <div style="display:flex;gap:8px;margin-top:10px;">
            <button class="btn btn-primary" id="btnSaveGoogleClientId">💾 Kaydet</button>
            ${currentId ? '<button class="btn btn-ghost" id="btnTestGoogleConnect">🔐 Test - Google ile Bağlan</button>' : ''}
          </div>
        </div>
      </div>
    `;

    document.getElementById('btnSaveGoogleClientId').onclick = async () => {
      const id = document.getElementById('oauthGoogleClientId').value.trim();
      if (!id) { alert('Client ID boş olamaz'); return; }
      const r = await window.api.oauth2.saveClientId('google', id);
      if (r.ok) {
        setStatus('✓ Google Client ID kaydedildi');
        await refreshOAuthSetupStatus();
        renderOAuthSetupContent('google');
      } else { alert('Hata: ' + r.error); }
    };
    const btnTest = document.getElementById('btnTestGoogleConnect');
    if (btnTest) btnTest.onclick = async () => {
      document.getElementById('modalOAuth2Setup').classList.add('hidden');
      const r = await window.api.oauth2.startFlow('google');
      if (r.ok) {
        alert(`✓ Test başarılı!\n\nGiriş yapan: ${r.email}\n\nArtık + Hesap > 🟥 Google ile Bağlan ile gerçek hesap ekleyebilirsiniz.`);
      } else {
        alert('Test başarısız: ' + r.error);
      }
    };
  }
}

// External link açıcı
async function openExternalLink(url) {
  // window.api.app.openExternal mevcut (main.js:2762)
  try {
    if (window.api.app?.openExternal) {
      await window.api.app.openExternal(url);
    } else if (window.api.url?.openExternal) {
      await window.api.url.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  } catch (e) {
    window.open(url, '_blank');
  }
}
window.openExternalLink = openExternalLink;

// Komut paletine ekle

// ============= v1.45: Gösterge Paneli =============
async function openDashboard() {
  document.getElementById('modalDashboard').classList.remove('hidden');
  await refreshDashboard();
}

async function refreshDashboard() {
  // Yükleme göstergesi
  document.getElementById('dashCards').innerHTML = '<div class="empty-state">Yükleniyor...</div>';

  const [overview, daily, hourly, senders, categories, accounts] = await Promise.all([
    window.api.stats.overview(),
    window.api.stats.dailyCounts(30),
    window.api.stats.hourlyDistribution(),
    window.api.stats.topSenders(10),
    window.api.stats.categoryDistribution(),
    window.api.stats.accountDistribution()
  ]);

  renderDashCards(overview);
  renderDailyChart(daily);
  renderHourlyChart(hourly);
  renderTopSenders(senders);
  renderCategoryChart(categories);
  renderAccountChart(accounts);
}

function renderDashCards(o) {
  const sizeMB = (o.attachSize / 1024 / 1024).toFixed(1);
  document.getElementById('dashCards').innerHTML = `
    <div class="dash-card"><div class="dash-card-num">${formatNumber(o.total)}</div><div class="dash-card-label">📬 Toplam Mail</div></div>
    <div class="dash-card dash-card-primary"><div class="dash-card-num">${formatNumber(o.unread)}</div><div class="dash-card-label">📨 Okunmamış</div></div>
    <div class="dash-card dash-card-warn"><div class="dash-card-num">${formatNumber(o.important)}</div><div class="dash-card-label">⭐ Önemli</div></div>
    <div class="dash-card dash-card-danger"><div class="dash-card-num">${formatNumber(o.spam)}</div><div class="dash-card-label">🚫 Spam</div></div>
    <div class="dash-card"><div class="dash-card-num">${formatNumber(o.today)}</div><div class="dash-card-label">📅 Bugün</div></div>
    <div class="dash-card"><div class="dash-card-num">${formatNumber(o.thisWeek)}</div><div class="dash-card-label">📅 Bu Hafta</div></div>
    <div class="dash-card"><div class="dash-card-num">${formatNumber(o.withAttachment)}</div><div class="dash-card-label">📎 Ekli Mail</div></div>
    <div class="dash-card"><div class="dash-card-num">${formatNumber(o.archived)}</div><div class="dash-card-label">📦 Arşiv</div></div>
    <div class="dash-card"><div class="dash-card-num">${sizeMB} <small>MB</small></div><div class="dash-card-label">💾 Toplam Ek</div></div>
    <div class="dash-card"><div class="dash-card-num">${o.accountCount}</div><div class="dash-card-label">📧 Hesap</div></div>
  `;
}

function formatNumber(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K';
  return String(n);
}

function renderDailyChart(daily) {
  const w = 700, h = 200, pad = { left: 35, right: 10, top: 10, bottom: 30 };
  const max = Math.max(...daily.map(d => d.count), 1);
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;
  const stepX = innerW / (daily.length - 1 || 1);

  const points = daily.map((d, i) => {
    const x = pad.left + i * stepX;
    const y = pad.top + innerH - (d.count / max) * innerH;
    return { x, y, count: d.count, day: d.day };
  });

  const linePath = points.map((p, i) => (i === 0 ? 'M' : 'L') + p.x + ',' + p.y).join(' ');
  const areaPath = linePath + ` L${points[points.length - 1].x},${pad.top + innerH} L${points[0].x},${pad.top + innerH} Z`;

  // Y ekseni grid
  let gridLines = '';
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (innerH / 4) * i;
    const val = Math.round(max - (max / 4) * i);
    gridLines += `<line x1="${pad.left}" y1="${y}" x2="${w - pad.right}" y2="${y}" stroke="var(--border)" stroke-width="0.5" stroke-dasharray="2,2"/>`;
    gridLines += `<text x="${pad.left - 5}" y="${y + 3}" text-anchor="end" fill="var(--muted)" font-size="9">${val}</text>`;
  }

  // X ekseni labels (her 5 günde bir)
  let xLabels = '';
  for (let i = 0; i < points.length; i += 5) {
    const p = points[i];
    const dateLabel = p.day.slice(5).replace('-', '/');
    xLabels += `<text x="${p.x}" y="${h - 8}" text-anchor="middle" fill="var(--muted)" font-size="9">${dateLabel}</text>`;
  }

  const dotsHtml = points.map(p =>
    `<circle cx="${p.x}" cy="${p.y}" r="3" fill="var(--primary)" stroke="var(--bg)" stroke-width="1.5">
       <title>${p.day}: ${p.count} mail</title>
     </circle>`
  ).join('');

  document.getElementById('dashDailyChart').innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:200px;">
      ${gridLines}
      <path d="${areaPath}" fill="var(--primary)" opacity="0.15"/>
      <path d="${linePath}" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linejoin="round"/>
      ${dotsHtml}
      ${xLabels}
    </svg>
  `;
}

function renderHourlyChart(hourly) {
  const w = 600, h = 180, pad = { left: 25, right: 10, top: 10, bottom: 24 };
  const max = Math.max(...hourly.map(h => h.count), 1);
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;
  const barW = innerW / 24 - 2;

  let bars = '';
  let xLabels = '';
  hourly.forEach(item => {
    const x = pad.left + (innerW / 24) * item.hour + 1;
    const barH = (item.count / max) * innerH;
    const y = pad.top + innerH - barH;
    bars += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="var(--primary)" opacity="${0.5 + (item.count / max) * 0.5}" rx="2">
              <title>${item.hour}:00 - ${item.count} mail</title>
            </rect>`;
    if (item.hour % 3 === 0) {
      xLabels += `<text x="${x + barW / 2}" y="${h - 6}" text-anchor="middle" fill="var(--muted)" font-size="9">${item.hour}</text>`;
    }
  });

  document.getElementById('dashHourlyChart').innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:180px;">
      ${bars}
      ${xLabels}
      <text x="${w/2}" y="${h - 1}" text-anchor="middle" fill="var(--muted)" font-size="9">Saat (0-23)</text>
    </svg>
  `;
}

function renderTopSenders(senders) {
  if (!senders.length) {
    document.getElementById('dashTopSenders').innerHTML = '<div class="empty-state">Veri yok</div>';
    return;
  }
  const max = Math.max(...senders.map(s => s.count), 1);
  document.getElementById('dashTopSenders').innerHTML = senders.map(s => {
    const pct = (s.count / max) * 100;
    const name = s.name || s.email || '?';
    const initial = name.trim().charAt(0).toUpperCase();
    return `
      <div class="sender-bar-row">
        <div class="sender-avatar" style="background:${avatarColorForEmail(s.email)};">${escapeHtml(initial)}</div>
        <div class="sender-info">
          <div class="sender-name" title="${escapeHtml(s.email || '')}">${escapeHtml(name.slice(0, 30))}</div>
          <div class="sender-bar"><div class="sender-bar-fill" style="width:${pct}%;"></div></div>
        </div>
        <div class="sender-count">${s.count}</div>
      </div>
    `;
  }).join('');
}

function avatarColorForEmail(email) {
  const colors = ['#3498db', '#9b59b6', '#e74c3c', '#f39c12', '#2ecc71', '#1abc9c', '#e67e22', '#34495e'];
  let hash = 0;
  const e = (email || '').toLowerCase();
  for (let i = 0; i < e.length; i++) hash = e.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function renderCategoryChart(categories) {
  const filtered = categories.filter(c => c.count > 0);
  if (!filtered.length) {
    document.getElementById('dashCategoryChart').innerHTML = '<div class="empty-state">Henüz kategorilenmiş mail yok</div>';
    return;
  }
  // Pie chart SVG
  const total = filtered.reduce((s, c) => s + c.count, 0);
  const cx = 80, cy = 80, r = 70;
  let cumAngle = -Math.PI / 2;
  let slices = '';
  let legend = '';

  filtered.forEach(c => {
    const sliceAngle = (c.count / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle);
    const y1 = cy + r * Math.sin(cumAngle);
    const x2 = cx + r * Math.cos(cumAngle + sliceAngle);
    const y2 = cy + r * Math.sin(cumAngle + sliceAngle);
    const largeArc = sliceAngle > Math.PI ? 1 : 0;
    slices += `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z"
                    fill="${c.color || '#888'}" stroke="var(--bg)" stroke-width="1.5">
                 <title>${c.name}: ${c.count} (${((c.count / total) * 100).toFixed(1)}%)</title>
               </path>`;
    cumAngle += sliceAngle;
    legend += `<div class="dash-legend-item">
      <span class="dash-legend-dot" style="background:${c.color || '#888'};"></span>
      <span class="dash-legend-name">${escapeHtml(c.name)}</span>
      <span class="dash-legend-val">${c.count}</span>
    </div>`;
  });

  document.getElementById('dashCategoryChart').innerHTML = `
    <div style="display:flex;gap:14px;align-items:center;">
      <svg viewBox="0 0 160 160" style="width:160px;height:160px;flex-shrink:0;">
        ${slices}
      </svg>
      <div class="dash-legend">${legend}</div>
    </div>
  `;
}

function renderAccountChart(accounts) {
  const filtered = accounts.filter(a => a.count > 0);
  if (!filtered.length) {
    document.getElementById('dashAccountChart').innerHTML = '<div class="empty-state">Henüz mail yok</div>';
    return;
  }
  const total = filtered.reduce((s, a) => s + a.count, 0);
  const cx = 80, cy = 80, rOuter = 70, rInner = 40;
  let cumAngle = -Math.PI / 2;
  let slices = '';
  let legend = '';
  const palette = ['#0078d4', '#9b59b6', '#e74c3c', '#f39c12', '#2ecc71', '#1abc9c', '#e67e22', '#34495e'];

  filtered.forEach((a, idx) => {
    const sliceAngle = (a.count / total) * 2 * Math.PI;
    const color = palette[idx % palette.length];
    const x1o = cx + rOuter * Math.cos(cumAngle);
    const y1o = cy + rOuter * Math.sin(cumAngle);
    const x2o = cx + rOuter * Math.cos(cumAngle + sliceAngle);
    const y2o = cy + rOuter * Math.sin(cumAngle + sliceAngle);
    const x1i = cx + rInner * Math.cos(cumAngle + sliceAngle);
    const y1i = cy + rInner * Math.sin(cumAngle + sliceAngle);
    const x2i = cx + rInner * Math.cos(cumAngle);
    const y2i = cy + rInner * Math.sin(cumAngle);
    const largeArc = sliceAngle > Math.PI ? 1 : 0;
    slices += `<path d="M${x1o},${y1o} A${rOuter},${rOuter} 0 ${largeArc},1 ${x2o},${y2o} L${x1i},${y1i} A${rInner},${rInner} 0 ${largeArc},0 ${x2i},${y2i} Z"
                    fill="${color}" stroke="var(--bg)" stroke-width="1.5">
                 <title>${a.display_name}: ${a.count} (${((a.count / total) * 100).toFixed(1)}%)</title>
               </path>`;
    cumAngle += sliceAngle;
    legend += `<div class="dash-legend-item">
      <span class="dash-legend-dot" style="background:${color};"></span>
      <span class="dash-legend-name" title="${escapeHtml(a.email)}">${escapeHtml(a.display_name)}</span>
      <span class="dash-legend-val">${a.count}</span>
    </div>`;
  });

  document.getElementById('dashAccountChart').innerHTML = `
    <div style="display:flex;gap:14px;align-items:center;">
      <svg viewBox="0 0 160 160" style="width:160px;height:160px;flex-shrink:0;">
        ${slices}
        <text x="80" y="78" text-anchor="middle" fill="var(--text)" font-size="22" font-weight="700">${total}</text>
        <text x="80" y="92" text-anchor="middle" fill="var(--muted)" font-size="9">TOPLAM</text>
      </svg>
      <div class="dash-legend">${legend}</div>
    </div>
  `;
}

// v1.47: MDN politika state'i load
async function loadMdnPolicy() {
  try {
    window._mdnPolicyState = await window.api.readReceipt.getPolicy();
  } catch (_) {
    window._mdnPolicyState = { policy: 'ask', requestDefault: false, ignored: [] };
  }
}
loadMdnPolicy();

// ============= v1.46: Outlook Tarzı Menü Çubuğu =============
const MENUS = {
  dosya: {
    label: 'Dosya',
    items: [
      { icon: '✎', label: 'Yeni Mesaj', shortcut: 'Ctrl+N', action: () => openCompose() },
      { icon: '↻', label: 'Senkronize Et', shortcut: 'F5', action: () => document.getElementById('btnSyncAll').click() },
      { sep: true },
      { section: 'Hesap & Veri' },
      { icon: '+', label: 'Yeni Hesap Ekle', action: () => document.getElementById('btnAddAccount').click() },
      { icon: '📁', label: 'Yeni Klasör', action: () => document.getElementById('btnNewFolder').click() },
      { icon: '🔐', label: 'OAuth2 Kurulum Sihirbazı', action: () => openOAuth2Setup() },
      { sep: true },
      { icon: '⬇', label: 'Yedek Al (Dışa Aktar)', action: () => { openSettings(); setTimeout(() => document.getElementById('btnSettingsBackup')?.click(), 300); } },
      { icon: '⬆', label: 'Yedekten Geri Yükle', action: () => { openSettings(); setTimeout(() => document.getElementById('btnSettingsRestore')?.click(), 300); } },
      { icon: '📥', label: 'Mail İçe Aktar (PST/MBOX/EML)', action: () => openImportModal() },
      { sep: true },
      { icon: '⚙', label: 'Ayarlar', shortcut: 'Ctrl+,', action: () => openSettings() },
      { sep: true },
      { icon: '✕', label: 'Çıkış', shortcut: 'Ctrl+Q', action: () => window.api.app?.quit?.() || window.close() }
    ]
  },
  mesaj: {
    label: 'Mesaj',
    items: [
      { icon: '↩', label: 'Yanıtla', shortcut: 'R', action: () => state.selectedMessage && openCompose({ replyTo: state.selectedMessage }), enabled: () => !!state.selectedMessage },
      { icon: '↩↩', label: 'Tümünü Yanıtla', shortcut: 'Shift+R', action: () => state.selectedMessage && openCompose({ replyTo: state.selectedMessage, replyAll: true }), enabled: () => !!state.selectedMessage },
      { icon: '→', label: 'İlet', shortcut: 'F', action: () => state.selectedMessage && openCompose({ forward: state.selectedMessage }), enabled: () => !!state.selectedMessage },
      { sep: true },
      { icon: '📦', label: 'Arşivle', shortcut: 'E', action: () => state.selectedMessage && document.getElementById('btnArchiveMsg')?.click(), enabled: () => !!state.selectedMessage },
      { icon: '🗑', label: 'Sil', shortcut: 'Del', action: deleteCurrentMessage, enabled: () => !!state.selectedMessage },
      { sep: true },
      { icon: '⭐', label: 'Önemli İşaretle', action: () => document.getElementById('btnToggleImportant')?.click(), enabled: () => !!state.selectedMessage },
      { icon: '✉', label: 'Okundu/Okunmadı', shortcut: 'Ctrl+U', action: () => document.getElementById('btnToggleRead')?.click(), enabled: () => !!state.selectedMessage },
      { icon: '🛡', label: 'Spam İşaretle', action: () => document.getElementById('btnMarkSpam')?.click(), enabled: () => !!state.selectedMessage && !state.selectedMessage.is_spam },
      { sep: true },
      { icon: '🪟', label: 'Yeni Pencerede Aç', action: () => state.selectedMessage && window.api.messages.openInWindow(state.selectedMessage.id), enabled: () => !!state.selectedMessage }
    ]
  },
  gorunum: {
    label: 'Görünüm',
    items: [
      { section: 'Yoğunluk' },
      { icon: '☰', label: 'Kompakt', action: () => setDensity('compact') },
      { icon: '☰', label: 'Normal', action: () => setDensity('normal') },
      { icon: '☰', label: 'Geniş', action: () => setDensity('wide') },
      { sep: true },
      { section: 'Düzen' },
      { icon: '⫾', label: 'Sağda Önizleme', action: () => setLayout('right') },
      { icon: '⊟', label: 'Altta Önizleme', action: () => setLayout('bottom') },
      { icon: '☐', label: 'Önizleme Kapalı', action: () => setLayout('off') },
      { sep: true },
      { section: 'Tema' },
      { icon: '☀', label: 'Açık Tema', action: () => setTheme('light') },
      { icon: '🌙', label: 'Koyu Tema', action: () => setTheme('dark') },
      { icon: '⚙', label: 'Sistem', action: () => setTheme('system') },
      { sep: true },
      { icon: '💬', label: 'Konuşma Görünümü', action: () => document.getElementById('btnConversationView').click() },
      { icon: '🔍', label: 'Gelişmiş Arama', shortcut: 'Ctrl+Shift+F', action: () => document.getElementById('btnAdvancedSearch').click() },
      { icon: '📊', label: 'Gösterge Paneli', shortcut: 'Ctrl+Shift+D', action: () => openDashboard() },
      { icon: '⌨', label: 'Komut Paleti', shortcut: 'Ctrl+K', action: () => openCommandPalette() },
      { icon: '🔔', label: 'Bildirim Paneli', shortcut: 'Ctrl+Shift+N', action: () => openNotifPanel() }
    ]
  },
  araclar: {
    label: 'Araçlar',
    items: [
      { section: 'Otomasyon' },
      { icon: '⚙', label: 'Mail Kuralları', action: () => document.getElementById('btnRules').click() },
      { icon: '⚡', label: 'Quick Steps', action: () => document.getElementById('btnQuickSteps').click() },
      { icon: '📝', label: 'Şablonlar', action: () => document.getElementById('btnTemplates').click() },
      { icon: '🎨', label: 'İmza Şablonları', action: () => { openSettings(); setTimeout(() => openSignatureBuilder?.(), 300); } },
      { icon: '⏰', label: 'Zamanlanmış Mesajlar', action: () => document.getElementById('btnScheduled').click() },
      { sep: true },
      { section: 'Güvenlik' },
      { icon: '🛡', label: 'Spam Kuralları', action: () => document.getElementById('btnSpamRules').click() },
      { icon: '✓', label: 'Güvenilir Göndericiler', action: () => document.getElementById('btnTrustedSenders').click() },
      { icon: '🔐', label: 'PGP Anahtarları', action: () => document.getElementById('btnPGP').click() },
      { sep: true },
      { section: 'Diğer Modüller' },
      { icon: '🏷', label: 'Kategoriler', action: () => document.getElementById('btnCategories').click() },
      { icon: '👥', label: 'Kişiler', action: () => document.getElementById('btnContacts').click() },
      { icon: '📅', label: 'Takvim', action: () => document.getElementById('btnCalendar').click() },
      { icon: '📓', label: 'Notlar', action: () => document.getElementById('btnNotes').click() },
      { icon: '✅', label: 'Görevler', action: () => document.getElementById('btnTasks').click() },
      { icon: '📦', label: 'Arşiv', action: () => document.getElementById('btnArchive').click() }
    ]
  },
  hesap: {
    label: 'Hesap',
    items: [] // Dinamik doldurulacak (state.accounts'tan)
  },
  yardim: {
    label: 'Yardım',
    items: [
      { icon: '⌨', label: 'Klavye Kısayolları', shortcut: 'F1', action: () => document.getElementById('modalKeyboardHelp')?.classList.remove('hidden') },
      { icon: '🚀', label: 'Güncellemeyi Kontrol Et', action: async () => {
        setStatus('🔎 Güncelleme aranıyor...');
        try {
          const r = await window.api.app?.checkForUpdates?.();
          if (!r) { alert('Güncelleme servisi yok'); return; }
          if (!r.ok) { alert('Güncelleme kontrolü başarısız:\n' + (r.error || 'Bilinmeyen hata')); setStatus('Güncelleme: hata', 'error'); return; }
          if (r.hasUpdate) {
            alert(`✓ Yeni sürüm var!\n\nMevcut: v${r.current}\nYeni: v${r.latest}\n\nİndirme arka planda başlayacak. Tamamlandığında bildirim göreceksiniz.`);
            setStatus(`Güncelleme indiriliyor: v${r.latest}`);
          } else {
            alert(`✓ Güncel sürümü kullanıyorsunuz (v${r.current}).`);
            setStatus('Güncel sürüm');
          }
        } catch (e) { alert('Hata: ' + e.message); }
      } },
      { icon: '🌐', label: 'GitHub Sayfası', action: () => openExternalLink('https://github.com/codegatr/codegamailapp') },
      { icon: '🐛', label: 'Hata Bildir', action: () => openExternalLink('https://github.com/codegatr/codegamailapp/issues/new') },
      { sep: true },
      { icon: 'ℹ', label: 'Hakkında', action: () => document.getElementById('btnAbout').click() }
    ]
  }
};

let _currentDropdown = null;

function buildHesapMenu() {
  const items = [];
  if (state.accounts && state.accounts.length) {
    items.push({ section: 'Hesaplar' });
    state.accounts.forEach(acc => {
      items.push({
        icon: acc.auth_type?.startsWith('oauth2_')
          ? (acc.auth_type === 'oauth2_microsoft' ? '🟦' : '🟥')
          : '📧',
        label: acc.display_name + ' (' + acc.email + ')',
        action: () => editAccount(acc.id)
      });
    });
    items.push({ sep: true });
  }
  items.push({ icon: '+', label: 'Yeni Hesap Ekle', action: () => document.getElementById('btnAddAccount').click() });
  items.push({ icon: '🔐', label: 'OAuth2 Kurulum Sihirbazı', action: () => openOAuth2Setup() });
  items.push({ sep: true });
  items.push({ icon: '↻', label: 'Tüm Hesapları Senkronize Et', shortcut: 'F5', action: () => document.getElementById('btnSyncAll').click() });
  return items;
}

function showDropdown(menuId, anchorEl) {
  closeDropdown();
  let menu = MENUS[menuId];
  if (!menu) return;
  if (menuId === 'hesap') menu = { ...menu, items: buildHesapMenu() };

  const container = document.getElementById('dropdownContainer');
  let html = '';
  menu.items.forEach(item => {
    if (item.sep) { html += '<div class="dropdown-separator"></div>'; return; }
    if (item.section) { html += `<div class="dropdown-section">${escapeHtml(item.section)}</div>`; return; }
    const enabled = item.enabled ? item.enabled() : true;
    const cls = enabled ? '' : 'disabled';
    const itemId = 'di_' + Math.random().toString(36).slice(2, 8);
    html += `<div class="dropdown-item ${cls}" data-itemid="${itemId}">
      <span class="dropdown-icon">${item.icon || ''}</span>
      <span class="dropdown-label">${escapeHtml(item.label)}</span>
      ${item.shortcut ? `<span class="dropdown-shortcut">${item.shortcut}</span>` : ''}
    </div>`;
    item._itemId = itemId;
  });

  container.innerHTML = html;
  container.classList.remove('hidden');

  // Position
  const rect = anchorEl.getBoundingClientRect();
  container.style.left = rect.left + 'px';
  container.style.top = rect.bottom + 'px';

  // Tüm öğelere click handler
  menu.items.forEach(item => {
    if (item.sep || item.section || !item._itemId) return;
    const enabled = item.enabled ? item.enabled() : true;
    if (!enabled) return;
    const el = container.querySelector(`[data-itemid="${item._itemId}"]`);
    if (el) {
      el.onclick = () => {
        try { item.action(); } catch (e) { console.error('Menu action failed:', e); }
        closeDropdown();
      };
    }
  });

  _currentDropdown = { menuId, anchorEl };
  // Active class
  document.querySelectorAll('.menu-item').forEach(m => m.classList.toggle('active', m.dataset.menu === menuId));
}

function closeDropdown() {
  document.getElementById('dropdownContainer')?.classList.add('hidden');
  document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
  _currentDropdown = null;
}

// Menü click handler
document.addEventListener('click', (e) => {
  const menuItem = e.target.closest('.menu-item[data-menu]');
  if (menuItem) {
    e.stopPropagation();
    const menuId = menuItem.dataset.menu;
    if (_currentDropdown?.menuId === menuId) {
      closeDropdown();
    } else {
      showDropdown(menuId, menuItem);
    }
    return; // ← KRİTİK: aşağıdaki kapatma logic'i çalışmasın
  }
  // Dropdown içine tıklandı - hiç dokunma (action handler kendi kapatır)
  if (e.target.closest('#dropdownContainer')) return;
  // Dışarı tıklama - kapat
  closeDropdown();
});

// Hover ile menü değiştirme (Outlook tarzı - menü açıkken üzerine gelinen menü açılır)
document.addEventListener('mouseover', (e) => {
  if (!_currentDropdown) return;
  const menuItem = e.target.closest('.menu-item[data-menu]');
  if (menuItem && menuItem.dataset.menu !== _currentDropdown.menuId) {
    showDropdown(menuItem.dataset.menu, menuItem);
  }
});

// Alt+harf kısayolları (Alt+D = Dosya vs)
document.addEventListener('keydown', (e) => {
  if (e.altKey && !e.ctrlKey && !e.shiftKey) {
    const map = { d: 'dosya', m: 'mesaj', g: 'gorunum', a: 'araclar', h: 'hesap', y: 'yardim' };
    const key = e.key.toLowerCase();
    if (map[key]) {
      e.preventDefault();
      const item = document.querySelector(`.menu-item[data-menu="${map[key]}"]`);
      if (item) showDropdown(map[key], item);
    }
  }
  if (e.key === 'Escape' && _currentDropdown) closeDropdown();
});

// Ctrl+, ile ayarlar
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === ',') {
    e.preventDefault();
    openSettings();
  }
});

// Status göstergesi yardımcılar
function setMenubarStatus(text, type = 'ready') {
  const dot = document.getElementById('statusDot');
  const txt = document.getElementById('statusText');
  if (txt) txt.textContent = text;
  if (dot) {
    dot.classList.remove('syncing', 'offline');
    if (type === 'syncing') dot.classList.add('syncing');
    if (type === 'offline') dot.classList.add('offline');
  }
}

// Mevcut setStatus fonksiyonu varsa onunla bütünleş - status değiştiğinde menübar de güncellesin
const _origSetStatus = window.setStatus;
if (typeof _origSetStatus === 'function') {
  window.setStatus = function(text, type) {
    try { _origSetStatus(text, type); } catch (_) {}
    if (text && text.includes('Senkronize')) setMenubarStatus(text, 'syncing');
    else if (text) setMenubarStatus(text);
  };
}

// Brand text/icon mevcut özellikten menubarına da yansıt
function syncBrandToMenubar() {
  const txt1 = document.getElementById('brandText');
  const icon1 = document.getElementById('brandIcon');
  const img1 = document.getElementById('customLogoImg');
  const txt2 = document.getElementById('brandText2');
  const icon2 = document.getElementById('brandIcon2');
  const img2 = document.getElementById('customLogoImg2');

  if (txt2 && txt1) txt2.textContent = txt1.textContent;
  if (icon2 && icon1) icon2.textContent = icon1.textContent;
  if (img2 && img1 && img1.src) {
    img2.src = img1.src;
    img2.classList.toggle('hidden', img1.classList.contains('hidden'));
    icon2?.classList.toggle('hidden', !img1.classList.contains('hidden'));
  }
}
// İlk yüklemede ve değişiklikte sync
setTimeout(syncBrandToMenubar, 500);
const brandObserver = new MutationObserver(syncBrandToMenubar);
const brandTextEl = document.getElementById('brandText');
if (brandTextEl) brandObserver.observe(brandTextEl, { childList: true, characterData: true, subtree: true });

// Yardımcılar (eğer yoksa)
function setDensity(d) {
  document.documentElement.setAttribute('data-density', d);
  try { window.api.config.set({ density: d }); } catch (_) {}
  setStatus('Yoğunluk: ' + d);
}
function setLayout(l) {
  if (typeof setLayoutMode === 'function') return setLayoutMode(l);
  // Fallback
  document.documentElement.classList.remove('layout-right', 'layout-bottom', 'layout-off');
  document.documentElement.classList.add('layout-' + l);
  try { window.api.config.set({ layout: l }); } catch (_) {}
  setStatus('Düzen: ' + l);
}
function setTheme(t) {
  if (typeof applyTheme === 'function') return applyTheme(t);
  document.documentElement.setAttribute('data-theme', t);
  try { window.api.config.set({ theme: t }); } catch (_) {}
  setStatus('Tema: ' + t);
}

function editAccount(id) {
  // Hesap düzenleme - settings içinde
  openSettings();
  setTimeout(() => {
    const tab = document.querySelector('[data-tab="accounts"]');
    if (tab) tab.click();
  }, 200);
}

// ============= v1.47: Settings - MDN Politika UI =============
async function loadMdnSettingsUI() {
  const policy = await window.api.readReceipt.getPolicy();
  document.getElementById('mdnPolicyAsk').checked = policy.policy === 'ask';
  document.getElementById('mdnPolicyAlways').checked = policy.policy === 'always';
  document.getElementById('mdnPolicyNever').checked = policy.policy === 'never';
  document.getElementById('mdnRequestDefault').checked = !!policy.requestDefault;

  const list = document.getElementById('mdnIgnoredList');
  if (policy.ignored.length === 0) {
    list.innerHTML = '<div style="color:var(--muted);font-size:11px;padding:8px;">Henüz yok sayılan gönderici yok.</div>';
  } else {
    list.innerHTML = policy.ignored.map(email => `
      <div class="mdn-ignored-item">
        <span>📧 ${escapeHtml(email)}</span>
        <button class="btn btn-ghost btn-sm" data-mdn-remove="${escapeHtml(email)}">✕ Kaldır</button>
      </div>
    `).join('');
    list.querySelectorAll('[data-mdn-remove]').forEach(btn => {
      btn.onclick = async () => {
        await window.api.readReceipt.removeIgnored(btn.dataset.mdnRemove);
        await loadMdnSettingsUI();
        await loadMdnPolicy();
      };
    });
  }
}

document.addEventListener('change', async (e) => {
  if (e.target.name === 'mdn_policy') {
    await window.api.readReceipt.setPolicy(e.target.value);
    await loadMdnPolicy();
    setStatus('Okundu onayı politikası: ' + e.target.value);
  }
  if (e.target.id === 'mdnRequestDefault') {
    await window.api.readReceipt.setRequestDefault(e.target.checked);
    setStatus('Onay iste varsayılan: ' + (e.target.checked ? 'açık' : 'kapalı'));
  }
});

// Settings açılınca MDN UI yükle
const _origOpenSettings = window.openSettings;
if (typeof _origOpenSettings === 'function') {
  window.openSettings = function() {
    const r = _origOpenSettings.apply(this, arguments);
    setTimeout(() => loadMdnSettingsUI().catch(() => {}), 200);
    return r;
  };
}

// ============= v1.50: Birleşik Bildirim Paneli =============
let _notifTab = 'recent';
let _notifAutoRefresh = null;

async function openNotifPanel() {
  const panel = document.getElementById('notifPanel');
  panel.classList.remove('hidden');
  await refreshNotifications();
  // Otomatik yenile (her 60sn)
  if (_notifAutoRefresh) clearInterval(_notifAutoRefresh);
  _notifAutoRefresh = setInterval(() => {
    if (!panel.classList.contains('hidden')) refreshNotifications();
  }, 60000);
}

function closeNotifPanel() {
  document.getElementById('notifPanel').classList.add('hidden');
  if (_notifAutoRefresh) { clearInterval(_notifAutoRefresh); _notifAutoRefresh = null; }
}

async function refreshNotifications() {
  if (_notifTab === 'recent') {
    const hours = parseInt(document.getElementById('notifHourRange').value, 10) || 24;
    const list = await window.api.notifications.recent(hours, 100);
    renderNotifList(list);
  } else {
    const accounts = await window.api.notifications.unreadByAccount();
    renderNotifAccounts(accounts);
  }
}

function renderNotifList(list) {
  const c = document.getElementById('notifList');
  if (!list || !list.length) {
    c.innerHTML = '<div class="empty-state" style="padding:30px;text-align:center;color:var(--muted);">Bu zaman aralığında yeni mail yok</div>';
    return;
  }
  c.innerHTML = list.map(m => {
    const date = m.date ? formatDate(m.date) : '';
    const fromName = m.from_name || m.from_addr || '?';
    const initial = fromName.charAt(0).toUpperCase();
    const senderEmail = (m.from_addr || '').toLowerCase();
    let hash = 0;
    for (let i = 0; i < senderEmail.length; i++) hash = senderEmail.charCodeAt(i) + ((hash << 5) - hash);
    const palette = ['#3498db','#9b59b6','#e74c3c','#f39c12','#2ecc71','#1abc9c','#e67e22','#34495e'];
    const color = palette[Math.abs(hash) % palette.length];
    const accLabel = m._account_email ? `<span class="notif-acc-tag">${escapeHtml(m._account_email)}</span>` : '';
    const flags = [];
    if (!m.is_read) flags.push('<span class="notif-flag notif-flag-unread">YENİ</span>');
    if (m.is_important) flags.push('<span class="notif-flag notif-flag-imp">⭐</span>');
    if (m.has_attachments) flags.push('<span class="notif-flag">📎</span>');
    if (m.requested_read_receipt) flags.push('<span class="notif-flag notif-flag-mdn">📬</span>');

    return `
      <div class="notif-item ${m.is_read ? '' : 'unread'}" data-msgid="${m.id}">
        <div class="notif-avatar" style="background:${color};">${escapeHtml(initial)}</div>
        <div class="notif-content">
          <div class="notif-line1">
            <span class="notif-from">${escapeHtml(fromName)}</span>
            <span class="notif-date">${date}</span>
          </div>
          <div class="notif-subj">${escapeHtml(m.subject || '(Konu yok)')}</div>
          <div class="notif-meta">
            ${accLabel}
            ${flags.join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Tıklayınca o maili aç
  c.querySelectorAll('.notif-item').forEach(el => {
    el.onclick = async () => {
      const msgId = parseInt(el.dataset.msgid, 10);
      const msg = list.find(x => x.id === msgId);
      if (!msg) return;
      // Hesap+klasörü seç, mesaj listesini yükle, mesajı aç
      const acc = state.accounts.find(a => a.id === msg.account_id);
      if (acc) {
        // Hesabı genişlet ve INBOX'a git (kabaca, doğrudan mail aç da çalışır)
        const folders = await window.api.folders.list(acc.id);
        const inbox = folders.find(f => f.name === 'INBOX' || f.special_use === '\\Inbox') || folders[0];
        if (inbox) {
          state.selectedFolder = inbox;
          state.searchQuery = '';
          await loadMessages();
        }
      }
      // Bildirim panelini kapat ve mesajı aç
      closeNotifPanel();
      const fullMsg = state.messages.find(m => m.id === msgId);
      if (fullMsg) {
        state.selectedMessage = fullMsg;
        renderMessageView(fullMsg);
        if (!fullMsg.is_read) {
          await window.api.messages.markRead(msgId, true);
          fullMsg.is_read = true;
          renderMessageList();
        }
      } else {
        // Yeni pencerede aç - belki klasör yüklü değil
        window.api.messages.openInWindow(msgId);
      }
    };
  });
}

function renderNotifAccounts(accounts) {
  const c = document.getElementById('notifList');
  if (!accounts || !accounts.length) {
    c.innerHTML = '<div class="empty-state" style="padding:30px;color:var(--muted);">Hesap yok</div>';
    return;
  }
  const totalUnread = accounts.reduce((s, a) => s + (a.unread || 0), 0);
  const totalToday = accounts.reduce((s, a) => s + (a.today || 0), 0);

  c.innerHTML = `
    <div class="notif-summary">
      <div class="notif-summary-card">
        <div class="notif-summary-num">${totalUnread}</div>
        <div class="notif-summary-label">📨 Toplam Okunmamış</div>
      </div>
      <div class="notif-summary-card">
        <div class="notif-summary-num">${totalToday}</div>
        <div class="notif-summary-label">📅 Son 24 Saat</div>
      </div>
    </div>
    <div class="notif-accounts">
      ${accounts.map(a => {
        const initial = (a.display_name || a.email || '?').charAt(0).toUpperCase();
        const e = (a.email || '').toLowerCase();
        let hash = 0;
        for (let i = 0; i < e.length; i++) hash = e.charCodeAt(i) + ((hash << 5) - hash);
        const palette = ['#3498db','#9b59b6','#e74c3c','#f39c12','#2ecc71','#1abc9c','#e67e22','#34495e'];
        const color = palette[Math.abs(hash) % palette.length];
        return `
          <div class="notif-acc-row" data-accid="${a.id}">
            <div class="notif-avatar" style="background:${color};">${escapeHtml(initial)}</div>
            <div class="notif-acc-info">
              <div class="notif-acc-name">${escapeHtml(a.display_name || '')}</div>
              <div class="notif-acc-email">${escapeHtml(a.email || '')}</div>
            </div>
            <div class="notif-acc-stats">
              ${a.unread > 0 ? `<span class="notif-stat-unread">${a.unread} okunmamış</span>` : '<span class="notif-stat-clean">✓ tümü okundu</span>'}
              ${a.today > 0 ? `<span class="notif-stat-today">${a.today} bugün</span>` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  c.querySelectorAll('.notif-acc-row').forEach(el => {
    el.onclick = async () => {
      const accId = parseInt(el.dataset.accid, 10);
      const folders = await window.api.folders.list(accId);
      const inbox = folders.find(f => f.name === 'INBOX' || f.special_use === '\\Inbox') || folders[0];
      if (inbox) {
        state.selectedFolder = inbox;
        await loadMessages();
        closeNotifPanel();
      }
    };
  });
}

// Toolbar 🔔 butonu + Ctrl+Shift+N
document.addEventListener('click', (e) => {
  if (e.target.closest('#btnNotifications')) {
    const panel = document.getElementById('notifPanel');
    if (panel.classList.contains('hidden')) openNotifPanel();
    else closeNotifPanel();
  }
  if (e.target.closest('#notifClose')) closeNotifPanel();
  if (e.target.closest('#notifRefresh')) refreshNotifications();
  const tab = e.target.closest('.notif-tab');
  if (tab) {
    document.querySelectorAll('.notif-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    _notifTab = tab.dataset.notifTab;
    refreshNotifications();
  }
});

document.getElementById('notifHourRange')?.addEventListener('change', refreshNotifications);

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'n') {
    e.preventDefault();
    const panel = document.getElementById('notifPanel');
    if (panel.classList.contains('hidden')) openNotifPanel();
    else closeNotifPanel();
  }
});

// Toolbar badge - okunmamış sayısı
async function updateNotifBadge() {
  try {
    const accounts = await window.api.notifications.unreadByAccount();
    const total = accounts.reduce((s, a) => s + (a.unread || 0), 0);
    const badge = document.getElementById('notifBadge');
    if (!badge) return;
    if (total > 0) {
      badge.textContent = total > 99 ? '99+' : total;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  } catch (_) {}
}
setInterval(updateNotifBadge, 30000);
setTimeout(updateNotifBadge, 1500);

// Sync sonrası badge güncelle
window.api.on('background-sync-done', () => {
  updateNotifBadge();
  // Panel açıksa yenile
  const panel = document.getElementById('notifPanel');
  if (panel && !panel.classList.contains('hidden')) refreshNotifications();
});

// ============= v1.51: Outlook Tarzı Ribbon Toolbar =============
const RIBBON_ACTIONS = {
  // Yeni
  'compose': () => openCompose(),
  'new-account': () => document.getElementById('btnAddAccount').click(),
  'new-folder': () => document.getElementById('btnNewFolder').click(),
  'new-task': () => { document.getElementById('btnTasks').click(); },
  'new-category': () => document.getElementById('btnCategories').click(),
  // Mesaj
  'reply': () => state.selectedMessage && openCompose({ replyTo: state.selectedMessage }),
  'reply-all': () => state.selectedMessage && openCompose({ replyTo: state.selectedMessage, replyAll: true }),
  'forward': () => state.selectedMessage && openCompose({ forward: state.selectedMessage }),
  'delete-msg': () => deleteCurrentMessage(),
  'archive-msg': () => document.getElementById('btnArchiveMsg')?.click(),
  'mark-spam': () => document.getElementById('btnMarkSpam')?.click(),
  'toggle-read': () => document.getElementById('btnToggleRead')?.click(),
  'toggle-important': () => document.getElementById('btnToggleImportant')?.click(),
  // Sync
  'sync-all': () => document.getElementById('btnSyncAll').click(),
  'sync-current': () => document.getElementById('btnSyncAll').click(), // basit fallback
  'scheduled': () => document.getElementById('btnScheduled').click(),
  // Hesap
  'oauth-setup': () => openOAuth2Setup(),
  'settings': () => openSettings(),
  // Veri
  'backup': () => { openSettings(); setTimeout(() => document.getElementById('btnSettingsBackup')?.click(), 300); },
  'restore': () => { openSettings(); setTimeout(() => document.getElementById('btnSettingsRestore')?.click(), 300); },
  // Modüller
  'archive': () => document.getElementById('btnArchive').click(),
  'calendar': () => document.getElementById('btnCalendar').click(),
  'tasks': () => document.getElementById('btnTasks').click(),
  'notes': () => document.getElementById('btnNotes').click(),
  'contacts': () => document.getElementById('btnContacts').click(),
  // Otomasyon
  'rules': () => document.getElementById('btnRules').click(),
  'quick-steps': () => document.getElementById('btnQuickSteps').click(),
  'templates': () => document.getElementById('btnTemplates').click(),
  'categories': () => document.getElementById('btnCategories').click(),
  'signature': () => { openSettings(); setTimeout(() => openSignatureBuilder?.(), 300); },
  // Güvenlik
  'pgp': () => document.getElementById('btnPGP').click(),
  'spam-rules': () => document.getElementById('btnSpamRules').click(),
  'trusted': () => document.getElementById('btnTrustedSenders').click(),
  // Görünüm
  'layout-right': () => setLayout('right'),
  'layout-bottom': () => setLayout('bottom'),
  'layout-off': () => setLayout('off'),
  'density-compact': () => setDensity('compact'),
  'density-normal': () => setDensity('normal'),
  'density-wide': () => setDensity('wide'),
  'theme-light': () => setTheme('light'),
  'theme-dark': () => setTheme('dark'),
  'conversation': () => document.getElementById('btnConversationView').click(),
  // Paneller
  'dashboard': () => openDashboard(),
  'notifications': () => openNotifPanel(),
  'command-palette': () => openCommandPalette(),
  'advanced-search': () => document.getElementById('btnAdvancedSearch').click()
};

// Tab değiştirici
document.addEventListener('click', (e) => {
  const tab = e.target.closest('.ribbon-tab');
  if (tab) {
    const target = tab.dataset.rtab;
    document.querySelectorAll('.ribbon-tab').forEach(t => t.classList.toggle('active', t === tab));
    document.querySelectorAll('.ribbon-panel').forEach(p => p.classList.toggle('active', p.dataset.rtab === target));
    return;
  }
  // Action butonları
  const actionBtn = e.target.closest('[data-action]');
  if (actionBtn && actionBtn.dataset.action) {
    const fn = RIBBON_ACTIONS[actionBtn.dataset.action];
    if (fn) {
      try { fn(); } catch (err) { console.error('Ribbon action failed:', err); }
    }
  }
  // Collapse
  if (e.target.closest('#ribbonCollapse')) {
    document.getElementById('ribbon').classList.toggle('collapsed');
    try { window.api.config.set({ ribbonCollapsed: document.getElementById('ribbon').classList.contains('collapsed') }); } catch (_) {}
  }
});

// Ctrl+F1 ile collapse toggle
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'F1') {
    e.preventDefault();
    document.getElementById('ribbon')?.classList.toggle('collapsed');
  }
});

// Mesaj seçili değilse mesaj-gerektiren butonları disabled
function refreshRibbonState() {
  const has = !!state.selectedMessage;
  document.querySelectorAll('[data-needs-msg]').forEach(btn => {
    btn.dataset.disabled = has ? '0' : '1';
    btn.disabled = !has;
  });
}
// State değişikliklerinde otomatik (renderMessageView'in sonuna kanca)
const _origRenderMessageView = window.renderMessageView;
if (typeof _origRenderMessageView === 'function') {
  window.renderMessageView = function(msg) {
    const r = _origRenderMessageView.apply(this, arguments);
    refreshRibbonState();
    return r;
  };
}
setTimeout(refreshRibbonState, 1000);

// İlk açılışta collapse durumu yükle
(async () => {
  try {
    const cfg = await window.api.config.get();
    if (cfg.ribbonCollapsed) document.getElementById('ribbon')?.classList.add('collapsed');
  } catch (_) {}
})();

// ============= v1.52: Snooze (Erteleme) =============
let _snoozeTargetMsg = null;

function openSnoozeModal(msg) {
  _snoozeTargetMsg = msg;
  document.getElementById('modalSnooze').classList.remove('hidden');

  // Ön izleme tarihlerini hesapla
  const now = new Date();
  const fmt = (d) => d.toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });

  const h1 = new Date(now.getTime() + 60 * 60 * 1000);
  const h3 = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  document.getElementById('snooze-preview-1h').textContent = fmt(h1);
  document.getElementById('snooze-preview-3h').textContent = fmt(h3);

  // Default custom: 1 saat sonra
  const ds = new Date(now.getTime() + 60 * 60 * 1000);
  ds.setSeconds(0, 0);
  document.getElementById('snoozeCustom').value = ds.toISOString().slice(0, 16);
}

function closeSnoozeModal() {
  document.getElementById('modalSnooze').classList.add('hidden');
  _snoozeTargetMsg = null;
}

function calculateSnoozeDate(option) {
  const now = new Date();
  let d;
  switch (option) {
    case '1h': d = new Date(now.getTime() + 60 * 60 * 1000); break;
    case '3h': d = new Date(now.getTime() + 3 * 60 * 60 * 1000); break;
    case 'evening':
      d = new Date(now);
      d.setHours(18, 0, 0, 0);
      if (d <= now) d.setDate(d.getDate() + 1);
      break;
    case 'tomorrow':
      d = new Date(now);
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      break;
    case 'weekend':
      d = new Date(now);
      const dayToSat = (6 - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + dayToSat);
      d.setHours(9, 0, 0, 0);
      break;
    case 'nextweek':
      d = new Date(now);
      const dayToMon = (1 - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + dayToMon);
      d.setHours(9, 0, 0, 0);
      break;
    default: d = new Date(now.getTime() + 60 * 60 * 1000);
  }
  return d;
}

async function snoozeMessage(option, customDate) {
  if (!_snoozeTargetMsg) return;
  const date = customDate || calculateSnoozeDate(option);
  const r = await window.api.snooze.message(_snoozeTargetMsg.id, date.toISOString());
  if (r.ok) {
    setStatus(`💤 Ertelendi: ${date.toLocaleString('tr-TR')}`);
    closeSnoozeModal();
    state.selectedMessage = null;
    document.getElementById('messageView').innerHTML = '<div class="empty-state">Okumak için bir mesaj seçin</div>';
    await loadMessages();
    await refreshSnoozedCount();
  } else {
    alert('Hata: ' + r.error);
  }
}

document.addEventListener('click', (e) => {
  const opt = e.target.closest('.snooze-opt');
  if (opt && opt.dataset.snooze) {
    snoozeMessage(opt.dataset.snooze);
  }
  if (e.target.closest('#snoozeCustomConfirm')) {
    const v = document.getElementById('snoozeCustom').value;
    if (!v) { alert('Lütfen bir tarih seçin'); return; }
    const date = new Date(v);
    if (date <= new Date()) { alert('Tarih gelecekte olmalı'); return; }
    snoozeMessage(null, date);
  }
  // Sidebar Ertelenen klasörüne tıklayınca
  if (e.target.closest('#sidebarSnoozedFolder')) {
    selectSnoozedFolder();
  }
});

// Klavye: H = snooze (Outlook gibi)
document.addEventListener('keydown', (e) => {
  if (e.key === 'h' && state.selectedMessage && !e.ctrlKey && !e.altKey) {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
    e.preventDefault();
    openSnoozeModal(state.selectedMessage);
  }
});

// Sidebar - Ertelenen virtual folder
async function refreshSnoozedCount() {
  const el = document.getElementById('sidebarSnoozedFolder');
  if (!el) return;
  try {
    const count = await window.api.snooze.count();
    const badge = el.querySelector('.snoozed-count');
    if (count > 0) {
      el.classList.remove('hidden');
      if (badge) badge.textContent = count;
    } else {
      el.classList.add('hidden');
    }
  } catch (_) {}
}

async function selectSnoozedFolder() {
  state.selectedFolder = { snoozed: true };
  state.selectedMessage = null;
  document.querySelectorAll('.folder-item.active').forEach(el => el.classList.remove('active'));
  document.getElementById('unifiedInbox')?.classList.remove('active');
  document.getElementById('sidebarSnoozedFolder')?.classList.add('active');
  document.getElementById('messageView').innerHTML = '<div class="empty-state">Okumak için bir mesaj seçin</div>';

  // Listele
  state.messages = await window.api.snooze.list();
  document.getElementById('folderTitle').textContent = `💤 Ertelenmiş Mailler · ${state.messages.length}`;

  // Render - mevcut renderMessageList işine yarayacak (hesap badge, vs)
  renderMessageList();
}

// Sidebar'a HTML enjekte
function injectSnoozedSidebarFolder() {
  const ub = document.getElementById('unifiedInbox');
  if (!ub) return;
  if (document.getElementById('sidebarSnoozedFolder')) return;
  const html = `
    <div id="sidebarSnoozedFolder" class="folder-item snoozed-folder hidden">
      <span class="folder-icon">💤</span>
      <span class="folder-name">Ertelenmiş</span>
      <span class="snoozed-count">0</span>
    </div>
  `;
  ub.insertAdjacentHTML('afterend', html);
}
setTimeout(() => {
  injectSnoozedSidebarFolder();
  refreshSnoozedCount();
}, 1500);
setInterval(refreshSnoozedCount, 30000);

// Snooze matured event
window.api.on('snooze:matured', async (data) => {
  setStatus(`💤 ${data.count} ertelenmiş mail uyandı!`);
  await refreshSnoozedCount();
  await loadAccounts();
  if (state.selectedFolder && !state.selectedFolder.snoozed) {
    await loadMessages();
  }
});

// Ribbon'a snooze action
if (typeof RIBBON_ACTIONS !== 'undefined') {
  RIBBON_ACTIONS['snooze'] = () => state.selectedMessage && openSnoozeModal(state.selectedMessage);
  RIBBON_ACTIONS['view-snoozed'] = () => selectSnoozedFolder();
}

// Komut paletine ekle (basit)

// ============= v1.53: Mail Import Wizard =============
let _importState = null;

function openImportModal() {
  document.getElementById('modalImport').classList.remove('hidden');
  document.getElementById('importStep1').classList.remove('hidden');
  document.getElementById('importStep2').classList.add('hidden');
  document.getElementById('importStep3').classList.add('hidden');
  document.getElementById('importFileInfo').classList.add('hidden');
  document.getElementById('importBtnStart').classList.add('hidden');
  _importState = null;
}

document.addEventListener('click', async (e) => {
  if (e.target.closest('#importBtnPickFile')) {
    const r = await window.api.import.pickFile();
    if (r.canceled) return;
    if (r.fileType === 'unknown') {
      alert('Bu dosya tipi desteklenmiyor. Sadece .pst, .ost, .mbox, .mbx, .eml, .emlx kabul edilir.');
      return;
    }
    _importState = r;

    // Önizleme yükle
    const info = document.getElementById('importFileInfo');
    info.classList.remove('hidden');
    info.innerHTML = `
      <div class="import-info-box">
        <div><strong>Dosya:</strong> ${escapeHtml(r.fileName)}</div>
        <div><strong>Tip:</strong> ${r.fileType.toUpperCase()}</div>
        <div><strong>Boyut:</strong> ${(r.fileSize / 1024 / 1024).toFixed(1)} MB</div>
        <div id="importPreview" style="margin-top:8px;color:var(--muted);">⏳ Önizleme yükleniyor...</div>
      </div>
    `;

    const preview = await window.api.import.preview(r.filePath, r.fileType);
    const previewEl = document.getElementById('importPreview');
    if (preview.ok) {
      let html = '';
      if (preview.folderCount !== undefined) {
        html += `<div><strong>📁 Klasör:</strong> ${preview.folderCount}</div>`;
      }
      if (preview.messageCount !== undefined) {
        html += `<div><strong>📨 Mail:</strong> ${preview.messageCount}</div>`;
      }
      if (preview.folders && preview.folders.length) {
        html += `<details style="margin-top:8px;"><summary style="cursor:pointer;">Klasör listesi (ilk 20)</summary><ul style="margin:4px 0;padding-left:20px;font-size:11px;">`;
        preview.folders.forEach(f => {
          const indent = '&nbsp;'.repeat(f.depth * 2);
          html += `<li>${indent}${escapeHtml(f.name)} ${f.count > 0 ? `<span style="color:var(--muted);">(${f.count})</span>` : ''}</li>`;
        });
        html += `</ul></details>`;
      }
      previewEl.innerHTML = html;
      document.getElementById('importBtnStart').classList.remove('hidden');
    } else {
      previewEl.innerHTML = `<span style="color:var(--danger);">⚠ Önizleme alınamadı: ${preview.error}</span>`;
    }
  }

  if (e.target.closest('#importBtnStart')) {
    if (!_importState) return;
    document.getElementById('importStep1').classList.add('hidden');
    document.getElementById('importStep2').classList.remove('hidden');
    document.getElementById('importBtnStart').classList.add('hidden');

    const progEl = document.getElementById('importProgress');
    progEl.innerHTML = '<div style="color:var(--muted);">⏳ Başlatılıyor...</div>';

    const r = await window.api.import.start(_importState.filePath, _importState.fileType, {
      accountName: 'Yerel Arşiv (' + _importState.fileName + ')'
    });

    document.getElementById('importStep2').classList.add('hidden');
    document.getElementById('importStep3').classList.remove('hidden');
    if (r.ok) {
      document.getElementById('importSummary').innerHTML = `
        <div style="background:rgba(46,204,113,0.1);border-left:3px solid var(--success);padding:12px;border-radius:4px;margin-top:10px;">
          <div><strong>📁 Klasör:</strong> ${r.folders || 1}</div>
          <div><strong>📨 Mail:</strong> ${r.messages || 0}</div>
          ${r.errors ? `<div><strong>⚠ Hata:</strong> ${r.errors} mail import edilemedi</div>` : ''}
          <div style="margin-top:10px;color:var(--text-2);font-size:12px;">
            "Yerel Arşiv" hesabı altında bulabilirsiniz. Sidebar'dan erişin.
          </div>
        </div>
      `;
      // Hesap listesini yenile
      await loadAccounts();
    } else {
      document.getElementById('importSummary').innerHTML = `
        <div style="background:rgba(231,76,60,0.1);border-left:3px solid var(--danger);padding:12px;border-radius:4px;">
          <strong>⚠ İçe aktarım başarısız:</strong><br>${escapeHtml(r.error)}
        </div>
      `;
    }
  }
});

// Progress event
window.api.on('import:progress', (data) => {
  const progEl = document.getElementById('importProgress');
  if (!progEl) return;
  const stats = data.stats || data;
  progEl.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:6px;">
      <div>📁 İşlenen klasör: <strong>${stats.folders || 0}</strong></div>
      <div>📨 İçe aktarılan mail: <strong>${stats.messages || 0}</strong></div>
      ${stats.errors ? `<div style="color:var(--warn);">⚠ Hatalı: ${stats.errors}</div>` : ''}
      <div style="font-size:11px;color:var(--muted);margin-top:6px;">
        ${stats.done ? '✓ Bitti' : '⏳ Devam ediyor...'}
      </div>
    </div>
  `;
});

// Ribbon + Menu entegrasyonu
if (typeof RIBBON_ACTIONS !== 'undefined') {
  RIBBON_ACTIONS['import-mail'] = () => openImportModal();
}
