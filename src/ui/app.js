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
  templateEditor: null     // v1.10: şablon editörü
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
  await loadConversationViewState();

  // v1.10.1: Footer'da kalıcı version göstergesi
  try {
    const v = await window.api.updater.appVersion();
    const fv = document.getElementById('footerVersion');
    if (fv && v) fv.textContent = 'v' + v;
  } catch (_) {}
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
  document.getElementById('btnTrustedSenders').onclick = openTrustedSenders;
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
    ['settings_start_minimized', 'startMinimized', 'checkbox'],
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
    { label: '🏷 Kategoriler...', action: async () => {
      const currentCats = await window.api.messages.getCategories(message.id);
      const currentIds = currentCats.map(c => c.id);
      // Menüyü yeniden, biraz gecikmeli aç
      setTimeout(() => showCategorizeMenu(message.id, currentIds, e), 50);
    }},
    { label: '📓 Mesajdan Not Oluştur', action: () => createNoteFromMessage(message) },
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
