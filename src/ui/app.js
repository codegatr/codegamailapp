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
  signatureEditor: null    // v1.6: zengin editör imza
};

document.addEventListener('DOMContentLoaded', init);

async function init() {
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

  await loadAccounts();
  await updateStorageInfo();
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
  document.getElementById('btnBackup').onclick = doBackup;
  document.getElementById('btnRestore').onclick = doRestore;
  document.getElementById('btnSettings').onclick = openSettings;
  document.getElementById('btnSpamRules').onclick = openSpamRules;
  document.getElementById('btnNewFolder').onclick = openNewFolder;
  document.getElementById('btnAbout').onclick = openAbout;
  document.getElementById('btnRules').onclick = openRules;
}

function bindModals() {
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.onclick = () => document.getElementById(btn.dataset.close).classList.add('hidden');
  });
}

function bindKeyboard() {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); openCompose(); }
    else if (e.key === 'F5') { e.preventDefault(); syncAll(); }
    else if (e.key === 'Delete' && state.selectedMessage) {
      if (confirm('Bu mesajı silmek istediğinizden emin misiniz?')) deleteCurrentMessage();
    } else if (e.key === 'Escape') hideContextMenu();
  });
  document.addEventListener('click', hideContextMenu);
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
    ['settings_start_minimized', 'startMinimized', 'checkbox']
  ];
  for (const [domId, key, type] of prefIds) {
    const el = document.getElementById(domId);
    if (!el) continue;
    el.addEventListener('change', async () => {
      const value = type === 'checkbox' ? el.checked
                   : type === 'number' ? parseInt(el.value, 10)
                   : el.value;
      await window.api.config.updatePrefs({ [key]: value });
      setStatus('Ayar kaydedildi');
    });
  }

  document.getElementById('btnTestNotif').onclick = async () => {
    await window.api.config.testNotification();
    setStatus('Test bildirimi gönderildi - sağ alt köşeyi kontrol edin');
  };
}

async function openSettings() {
  const cfg = await window.api.config.get();
  document.getElementById('settingsPath').value = cfg.dataPath;
  document.getElementById('appVersion').textContent = cfg.version || '1.2.0';

  // v1.2: Bildirim tercihlerini yükle
  document.getElementById('settings_notifications').checked = cfg.notificationsEnabled !== false;
  document.getElementById('settings_sync_interval').value = String(cfg.backgroundSyncMinutes || 0);
  document.getElementById('settings_close_to_tray').checked = cfg.closeToTray !== false;
  document.getElementById('settings_auto_start').checked = !!cfg.autoStart;
  document.getElementById('settings_start_minimized').checked = !!cfg.startMinimized;
  // v1.3: Güncelleme tercihi
  const autoUpdEl = document.getElementById('settings_auto_update');
  if (autoUpdEl) autoUpdEl.checked = cfg.autoUpdateCheck !== false;

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
  emailInput.addEventListener('input', updateProviderHint);
  emailInput.addEventListener('blur', () => {
    const email = emailInput.value.trim();
    const usernameField = document.getElementById('acc_in_username');
    if (email.includes('@') && !usernameField.value) usernameField.value = email;
  });

  document.getElementById('acc_protocol').onchange = (e) => {
    const isPop3 = e.target.value === 'pop3';
    const provider = state.detectedProvider;
    const portField = document.getElementById('acc_in_port');
    if (isPop3) {
      portField.value = (provider && provider.pop3) ? provider.pop3.port : 995;
      if (provider && provider.pop3) document.getElementById('acc_in_host').value = provider.pop3.host;
    } else {
      portField.value = (provider && provider.imap) ? provider.imap.port : 993;
      if (provider && provider.imap) document.getElementById('acc_in_host').value = provider.imap.host;
    }
    document.getElementById('pop3OptionsWrap').style.display = isPop3 ? 'flex' : 'none';
  };

  document.getElementById('btnWizardNext').onclick = wizardNext;
  document.getElementById('btnWizardBack').onclick = wizardBack;
  document.getElementById('btnTestAccount').onclick = testAccount;
  document.getElementById('btnSaveAccount').onclick = saveAccount;
}

function updateProviderHint() {
  const email = document.getElementById('acc_email').value.trim();
  const hint = document.getElementById('providerHint');
  if (!email.includes('@')) { hint.innerHTML = ''; hint.className = 'provider-hint'; return; }
  const provider = detectProvider(email);
  if (provider) {
    hint.innerHTML = `<span style="color:${provider.color};">${provider.icon}</span> <strong>${provider.name}</strong> tespit edildi · ayarlar otomatik doldurulacak`;
    hint.className = 'provider-hint detected';
  } else {
    const domain = email.split('@')[1];
    if (domain) {
      hint.innerHTML = `📂 <strong>Özel sunucu</strong> · <code>mail.${escapeHtml(domain)}</code> denenecek`;
      hint.className = 'provider-hint custom';
    }
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
  const provider = detectProvider(email) || customProvider(email.split('@')[1]);
  state.detectedProvider = provider;
  document.getElementById('acc_in_username').value = email;
  document.getElementById('acc_in_host').value = provider.imap.host;
  document.getElementById('acc_in_port').value = provider.imap.port;
  document.getElementById('acc_in_secure').value = provider.imap.secure ? '1' : '0';
  document.getElementById('acc_smtp_host').value = provider.smtp.host;
  document.getElementById('acc_smtp_port').value = provider.smtp.port;
  document.getElementById('acc_smtp_secure').value = provider.smtp.secure ? '1' : '0';
  document.getElementById('acc_protocol').value = 'imap';
  document.getElementById('pop3OptionsWrap').style.display = 'none';
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
  state.selectedFolder = { id: folderId, accountId };
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
      search: state.searchQuery || undefined, limit: 300
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
    return `
      <div class="message-item ${m.is_read ? '' : 'unread'} ${m.is_spam ? 'is-spam' : ''} ${m.is_important ? 'is-important' : ''} ${state.selectedMessage?.id === m.id ? 'active' : ''}"
           data-id="${m.id}">
        <div class="msg-line1">
          <span class="msg-from">${importantStar}${accBadge}${escapeHtml(fromDisplay)}</span>
          <span class="msg-date">${date}</span>
        </div>
        <div class="msg-subject">${spamBadge}${scoreBadge}${escapeHtml(m.subject || '(Konu yok)')}</div>
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
      openMessage(id);
    };
    el.oncontextmenu = async (e) => {
      const fullMsg = await window.api.messages.get(id);
      if (fullMsg) showMessageContextMenu(e, fullMsg);
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
  renderMessageView(msg);
  document.querySelectorAll('.message-item').forEach(el => el.classList.remove('active'));
  document.querySelector(`.message-item[data-id="${id}"]`)?.classList.add('active');
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
        ${msg.attachments.map(a => `
          <span class="attachment-chip">📎 ${escapeHtml(a.filename || 'ek')}
            <span style="color:var(--muted)">${formatSize(a.size || 0)}</span>
          </span>`).join('')}
      </div>`;
  }

  let spamBanner = '';
  if (msg.is_spam) {
    spamBanner = `<div class="spam-banner">🛡 Bu mesaj <strong>spam</strong> olarak işaretlendi (puan: ${msg.spam_score}).</div>`;
  } else if (msg.spam_score >= 30) {
    spamBanner = `<div class="spam-banner warn">⚠ Bu mesaj şüpheli görünüyor (puan: ${msg.spam_score}).</div>`;
  }

  view.innerHTML = `
    <div class="msg-view-header">
      <div class="msg-view-subject">${escapeHtml(msg.subject || '(Konu yok)')}</div>
      <div class="msg-view-meta">
        <strong>Gönderen:</strong><span>${fromDisplay}</span>
        <strong>Alıcı:</strong><span>${toDisplay}</span>
        ${ccDisplay ? `<strong>CC:</strong><span>${ccDisplay}</span>` : ''}
        <strong>Tarih:</strong><span>${date}</span>
      </div>
    </div>
    ${spamBanner}
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

// ============= Senkronizasyon =============
async function syncAll() {
  if (!state.accounts.length) return setStatus('Önce bir hesap ekleyin');
  setStatus('Tüm hesaplar senkronize ediliyor…');
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

  // v1.6: editor varsa init et (modal hidden iken init zor olabilir, burada da güvence)
  if (!state.composeEditor && typeof RichEditor !== 'undefined') {
    state.composeEditor = new RichEditor('composeEditor', {
      placeholder: 'Mesajınızı yazın...'
    });
  }

  let to = '', subject = '', initialHTML = '<p><br></p>';
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
  document.getElementById('modalCompose').classList.remove('hidden');
  // Cursor en başa
  setTimeout(() => state.composeEditor?.focus(), 100);
}

async function sendMail() {
  const accountId = parseInt(document.getElementById('compose_from').value, 10);
  const to = document.getElementById('compose_to').value.trim();
  const cc = document.getElementById('compose_cc').value.trim();
  const subject = document.getElementById('compose_subject').value.trim();
  // v1.6: zengin editör'den HTML + text al
  const html = state.composeEditor ? state.composeEditor.getHTML() : '';
  const text = state.composeEditor ? state.composeEditor.getText() : '';
  if (!to) return alert('Alıcı gerekli');
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
    await window.api.mail.send(accountId, {
      to, cc: cc || undefined, subject,
      text: finalText, html: finalHtml,
      attachments: attachments.length ? attachments : undefined
    });
    document.getElementById('modalCompose').classList.add('hidden');
    setStatus('Mesaj gönderildi ✓' + (attachments.length ? ` (${attachments.length} ek)` : ''));
    state.composeAttachments = [];
    renderAttachmentList();
    if (state.composeEditor) state.composeEditor.clear();
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
  const v = await window.api.updater.appVersion();
  document.getElementById('aboutVersion').textContent = v;
  document.getElementById('aboutDataPath').textContent = cfg.dataPath;

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
      // Tüm hesapların klasörlerini doldur
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
