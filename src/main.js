const { app, BrowserWindow, ipcMain, dialog, safeStorage, shell, Tray, Menu, Notification, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

const Database = require('./db/database');
const MailService = require('./services/mail');
const BackupService = require('./services/backup');
const Crypto = require('./services/crypto');
const Config = require('./services/config');

// ============= Otomatik Güncelleme - autoUpdater config =============
log.transports.file.level = 'info';
autoUpdater.logger = log;
autoUpdater.autoDownload = false;          // kullanıcı onaylasın
autoUpdater.autoInstallOnAppQuit = true;
let updateState = { stage: 'idle', version: null, percent: 0, error: null, releaseNotes: null };

let mainWindow;
let tray;
let db;
let crypto;
let mailService;
let backupService;
let appConfig;
let isQuitting = false;
let backgroundSyncTimer = null;
let isBackgroundSyncing = false;
// v1.39: var ile hoisting - TDZ tamamen engellensin (bazı kullanıcılarda v1.38 build'i let ile sorun yaşadı)
var scheduledTimer = null;
var processingScheduled = false;

// IPC handler safe-register helper (duplicate kayıtları engeller)
function safeIpcHandle(channel, handler) {
  try { ipcMain.removeHandler(channel); } catch (_) {}
  ipcMain.handle(channel, handler);
}

// Windows'ta bildirimlerin uygulama adıyla gruplanması için zorunlu
app.setAppUserModelId('tr.com.codega.mail');

// Tek instance kuralı - ikinci başlatma mevcut pencereyi açar
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    showWindow();
  });
}

// Komut satırı argümanları
const startedHidden = process.argv.includes('--hidden');

// =====================================================================
// Hata logu
// =====================================================================
function logError(stage, err) {
  try {
    const logDir = app.getPath('userData');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const logPath = path.join(logDir, 'error.log');
    const line = `[${new Date().toISOString()}] [${stage}] ${err.stack || err.message || err}\n`;
    fs.appendFileSync(logPath, line, 'utf8');
    return logPath;
  } catch (_) { return null; }
}

process.on('uncaughtException', (err) => {
  const logPath = logError('uncaughtException', err);
  try {
    dialog.showErrorBox('CODEGA Mail - Beklenmeyen Hata',
      `${err.message}\n\nDetaylar log'a yazıldı:\n${logPath || '(log yazılamadı)'}`);
  } catch (_) {}
});

process.on('unhandledRejection', (err) => logError('unhandledRejection', err));

// =====================================================================
// Pencere
// =====================================================================
function getIconPath() {
  const candidates = [
    path.join(__dirname, 'ui', 'icon.png'),
    path.join(__dirname, 'ui', 'icon.ico')
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function createWindow() {
  const iconPath = getIconPath();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 600,
    title: 'CODEGA Mail',
    backgroundColor: '#1e1e2e',
    icon: iconPath || undefined,
    show: !startedHidden && !appConfig.get('startMinimized'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'ui', 'index.html'));
  mainWindow.setMenuBarVisibility(false);

  // v1.22: Yazım denetimi - dilleri ayarla, custom sözlükten yükle
  setupSpellChecker();

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('render-process-gone', (_, details) => {
    logError('render-process-gone', new Error(JSON.stringify(details)));
  });

  // v1.22: Yazım denetimi sağ tık menüsü (öneriler + sözlüğe ekle)
  mainWindow.webContents.on('context-menu', (_event, params) => {
    if (!params.misspelledWord) return;
    const enabled = appConfig.get('spellCheckEnabled') !== false;
    if (!enabled) return;
    const { Menu, MenuItem } = require('electron');
    const menu = new Menu();
    const suggestions = (params.dictionarySuggestions || []).slice(0, 6);
    if (!suggestions.length) {
      menu.append(new MenuItem({ label: '(öneri yok)', enabled: false }));
    } else {
      for (const s of suggestions) {
        menu.append(new MenuItem({
          label: s,
          click: () => mainWindow.webContents.replaceMisspelling(s)
        }));
      }
    }
    menu.append(new MenuItem({ type: 'separator' }));
    menu.append(new MenuItem({
      label: `"${params.misspelledWord}" Sözlüğe Ekle`,
      click: () => {
        try {
          mainWindow.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord);
          db.addCustomDictionaryWord(params.misspelledWord);
          db.save();
        } catch (e) { console.warn('Sözlük ekleme hatası:', e.message); }
      }
    }));
    menu.popup({ window: mainWindow });
  });

  // Kapat tuşuna basıldığında: tepsiye küçült (config açıksa)
  mainWindow.on('close', (e) => {
    if (!isQuitting && appConfig.get('closeToTray') !== false) {
      e.preventDefault();
      mainWindow.hide();
      // İlk kapatmada hatırlatma toast'u
      if (!appConfig.get('trayHintShown')) {
        showNotification(
          'CODEGA Mail tepside çalışmaya devam ediyor',
          'Yeni mailler için arka planda kontrol edilecek. Çıkmak için tepsi simgesine sağ tıklayın.',
          null, true
        );
        appConfig.set('trayHintShown', true);
      }
    }
  });
}

function showWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow();
    return;
  }
  if (mainWindow.isMinimized()) mainWindow.restore();
  if (!mainWindow.isVisible()) mainWindow.show();
  mainWindow.focus();
}

// =====================================================================
// DB
// =====================================================================
async function initializeDatabase() {
  const dataPath = appConfig.getDataPath();
  const dbPath = path.join(dataPath, 'codega-mail.db');
  db = await Database.open(dbPath);
  backupService = new BackupService(dbPath);
  if (mailService) {
    mailService.setDb(db);
  } else {
    mailService = new MailService(db, crypto);
  }
}

// =====================================================================
// Sistem Tepsisi
// =====================================================================
function createTray() {
  const iconPath = getIconPath();
  if (!iconPath) {
    console.warn('Tepsi simgesi bulunamadı, tepsi devre dışı');
    return;
  }

  // Windows tepsi 16x16/24x24 ister, Electron otomatik küçültür ama kalitesi için elimle
  let img = nativeImage.createFromPath(iconPath);
  if (process.platform === 'win32' && !img.isEmpty()) {
    img = img.resize({ width: 16, height: 16 });
  } else if (process.platform === 'darwin' && !img.isEmpty()) {
    img = img.resize({ width: 18, height: 18 });
    // macOS'te menü çubuğu için template image (otomatik renk değişimi)
    img.setTemplateImage(true);
  }

  tray = new Tray(img);
  tray.setToolTip('CODEGA Mail');

  // Çift tık veya tek tık → pencereyi aç/gizle
  tray.on('click', () => {
    if (mainWindow && mainWindow.isVisible() && mainWindow.isFocused()) {
      mainWindow.hide();
    } else {
      showWindow();
    }
  });
  tray.on('double-click', () => showWindow());

  rebuildTrayMenu();
}

function rebuildTrayMenu(unread = 0) {
  if (!tray) return;
  const menu = Menu.buildFromTemplate([
    { label: '✉ CODEGA Mail', enabled: false },
    { label: unread > 0 ? `📬 ${unread} okunmamış mesaj` : '✓ Tüm mesajlar okundu', enabled: false },
    { type: 'separator' },
    { label: 'Pencereyi Göster', click: showWindow },
    { label: '↻ Tümünü Senkronize Et', click: () => runBackgroundSync(true) },
    { label: '✎ Yeni Mesaj', click: () => {
      showWindow();
      if (mainWindow) mainWindow.webContents.send('open-compose');
    }},
    { label: '⚙ Ayarlar', click: () => {
      showWindow();
      if (mainWindow) mainWindow.webContents.send('open-settings');
    }},
    { type: 'separator' },
    { label: '🚪 Çıkış', click: () => {
      isQuitting = true;
      app.quit();
    }}
  ]);
  tray.setContextMenu(menu);
  tray.setToolTip(`CODEGA Mail${unread > 0 ? ' · ' + unread + ' okunmamış' : ''}`);
}

function updateTray() {
  if (!tray || !db) return;
  // Güncelleme bekliyorsa güncelleme-farkındalı menüyü kullan
  if (updateState && (updateState.stage === 'available' || updateState.stage === 'downloaded')) {
    rebuildTrayMenuWithUpdate();
    return;
  }
  try {
    // Spam olmayan + okunmamış inbox mesajları
    const row = db.prepare(`
      SELECT COUNT(*) AS c FROM messages m
      JOIN folders f ON m.folder_id = f.id
      WHERE m.is_read = 0 AND m.is_spam = 0
        AND (f.special_use = '\\Inbox' OR f.special_use IS NULL OR f.special_use = '')
    `).get();
    const unread = (row && row.c) || 0;
    rebuildTrayMenu(unread);
  } catch (e) {
    console.warn('Tepsi güncellenemedi:', e.message);
  }
}

// =====================================================================
// Bildirimler
// =====================================================================
function showNotification(title, body, messageId = null, silent = false) {
  if (appConfig.get('notificationsEnabled') === false) {
    console.warn('[NOTIF] notificationsEnabled config = false');
    return { ok: false, reason: 'disabled_by_user' };
  }

  const iconPath = getIconPath();
  const titleStr = String(title || '');
  const bodyStr = String(body || '');
  console.log('[NOTIF] Bildirim gönderiliyor:', { title: titleStr, body: bodyStr });

  const layers = [];

  // KATMAN 1 - node-notifier (SnoreToast)
  try {
    const notifier = require('node-notifier');
    notifier.notify({
      title: titleStr,
      message: bodyStr,
      icon: iconPath || undefined,
      sound: !silent,
      appID: 'tr.com.codega.mail',
      wait: false
    }, (err, response) => {
      if (err) console.warn('[NOTIF] node-notifier err:', err.message);
      else if (response === 'activate') {
        showWindow();
        if (messageId && mainWindow) mainWindow.webContents.send('open-message', messageId);
      }
    });
    layers.push('snoretoast');
  } catch (e) { console.warn('[NOTIF] SnoreToast başarısız:', e.message); }

  // KATMAN 2 - Electron Notification API
  try {
    if (Notification.isSupported()) {
      const n = new Notification({ title: titleStr, body: bodyStr, icon: iconPath || undefined, silent: !!silent });
      n.on('click', () => {
        showWindow();
        if (messageId && mainWindow) mainWindow.webContents.send('open-message', messageId);
      });
      n.show();
      layers.push('electron');
    }
  } catch (e) { console.warn('[NOTIF] Electron başarısız:', e.message); }

  // KATMAN 3 - Tray balloon (HER ZAMAN paralel)
  try {
    if (process.platform === 'win32' && tray && tray.displayBalloon) {
      tray.displayBalloon({
        title: titleStr,
        content: bodyStr,
        icon: iconPath || undefined,
        noSound: !!silent
      });
      layers.push('tray_balloon');
    }
  } catch (e) { console.warn('[NOTIF] Tray balloon başarısız:', e.message); }

  // KATMAN 4 - Renderer'a in-app banner gönder (pencere açıksa garantili görünür)
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('inapp-notification', {
        title: titleStr,
        body: bodyStr,
        messageId: messageId || null
      });
      layers.push('inapp_banner');
    }
  } catch (e) { console.warn('[NOTIF] In-app banner başarısız:', e.message); }

  console.log('[NOTIF] Tetiklenen katmanlar:', layers);
  return {
    ok: layers.length > 0,
    layers,
    primaryLayer: layers[0] || null
  };
}

// =====================================================================
// Arka Plan Senkronizasyonu
// =====================================================================
function setupBackgroundSync() {
  if (backgroundSyncTimer) {
    clearInterval(backgroundSyncTimer);
    backgroundSyncTimer = null;
  }
  const minutes = parseInt(appConfig.get('backgroundSyncMinutes'), 10);
  if (!minutes || minutes <= 0) return;
  backgroundSyncTimer = setInterval(() => runBackgroundSync(false), minutes * 60 * 1000);
}

async function runBackgroundSync(forceUiRefresh = false) {
  if (isBackgroundSyncing) return;
  if (!db || !mailService) return;

  isBackgroundSyncing = true;
  const allNew = [];

  try {
    const accounts = db.listAccounts();
    for (const acc of accounts) {
      // Sync öncesi en yüksek mesaj id'sini al
      let beforeMax = 0;
      try {
        const r = db.prepare('SELECT MAX(id) AS m FROM messages WHERE account_id = ?').get(acc.id);
        beforeMax = (r && r.m) || 0;
      } catch (_) {}

      try {
        await mailService.syncAccount(acc.id);
      } catch (e) {
        logError('background-sync:' + acc.id, e);
        continue;
      }

      // Yeni gelenleri al (spam değil)
      try {
        const newMsgs = db.prepare(`
          SELECT id, from_addr, from_name, subject, account_id
          FROM messages
          WHERE account_id = ? AND id > ? AND is_spam = 0
          ORDER BY id DESC LIMIT 5
        `).all(acc.id, beforeMax);

        for (const m of newMsgs) {
          allNew.push(Object.assign({}, m, { accountName: acc.display_name }));
        }
      } catch (e) {
        console.warn('Yeni mesajlar sorgulanamadı:', e.message);
      }
    }

    db.save();
  } finally {
    isBackgroundSyncing = false;
  }

  // v1.35: Kullanıcı kurallarını önce uygula
  if (allNew.length > 0) {
    try {
      applyRulesToNewMessages(allNew.map(m => m.id));
    } catch (e) { console.warn('Apply rules sync hook:', e.message); }
  }

  // v1.29: Yeni mailleri otomatik kategorize et (eğer açıksa)
  if (allNew.length > 0) {
    try {
      autoCategorizeNewMessages(allNew.map(m => m.id));
    } catch (e) { console.warn('Auto-categorize sync hook:', e.message); }
  }

  // Bildirim göster (1 mesaj → tek bildirim, çoklu → toplu)
  if (allNew.length === 1) {
    const m = allNew[0];
    showNotification(
      `${m.accountName} - Yeni Mesaj`,
      `${m.from_name || m.from_addr || ''}${m.from_name || m.from_addr ? ': ' : ''}${m.subject || '(Konu yok)'}`,
      m.id
    );
  } else if (allNew.length > 1) {
    const previewLines = allNew.slice(0, 3).map(m =>
      `· ${m.from_name || m.from_addr || '?'}: ${(m.subject || '').slice(0, 50)}`
    );
    if (allNew.length > 3) previewLines.push(`... ve ${allNew.length - 3} mesaj daha`);
    showNotification(
      `📬 ${allNew.length} yeni mesaj`,
      previewLines.join('\n'),
      null
    );
  }

  updateTray();

  // Pencere görünürse renderer'a haber ver
  if (mainWindow && !mainWindow.isDestroyed() &&
      (forceUiRefresh || mainWindow.isVisible())) {
    mainWindow.webContents.send('background-sync-done', { newCount: allNew.length });
  }
}

// =====================================================================
// Otomatik başlatma (Windows Run anahtarı / macOS LaunchAgent)
// =====================================================================
function applyAutoStart() {
  if (process.platform === 'linux') return; // Linux farklı, atla
  try {
    const enabled = !!appConfig.get('autoStart');
    app.setLoginItemSettings({
      openAtLogin: enabled,
      openAsHidden: !!appConfig.get('startMinimized'),
      args: appConfig.get('startMinimized') ? ['--hidden'] : []
    });
  } catch (e) {
    console.warn('Otomatik başlatma ayarlanamadı:', e.message);
  }
}

// =====================================================================
// Uygulama yaşam döngüsü
// =====================================================================
app.whenReady().then(async () => {
  try {
    crypto = new Crypto(safeStorage);
    appConfig = new Config(app.getPath('userData'));
    await initializeDatabase();
    createWindow();
    createTray();
    updateTray();
    setupBackgroundSync();
    applyAutoStart();
    setupAutoUpdater();
    scheduleAutoUpdateCheck();
    startSchedulerLoop();  // v1.10: zamanlanmış mesajlar

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
      else showWindow();
    });
  } catch (err) {
    const logPath = logError('startup', err);
    dialog.showErrorBox('CODEGA Mail Başlatılamadı',
      `Hata: ${err.message}\n\nLog: ${logPath || '(yazılamadı)'}\n\n${(err.stack || '').split('\n').slice(0, 6).join('\n')}`);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  // Tepsi varsa çıkma - tepside çalışmaya devam et
  if (process.platform !== 'darwin' && !tray) {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  if (backgroundSyncTimer) clearInterval(backgroundSyncTimer);
  try { db?.save(); } catch (e) { console.warn('DB save hatası:', e.message); }
});

// =====================================================================
// IPC: Yapılandırma
// =====================================================================
ipcMain.handle('config:get', () => ({
  dataPath: appConfig.getDataPath(),
  defaultDataPath: app.getPath('userData'),
  firstRun: appConfig.get('firstRun'),
  version: appConfig.get('version'),
  notificationsEnabled: appConfig.get('notificationsEnabled') !== false,
  backgroundSyncMinutes: appConfig.get('backgroundSyncMinutes') || 0,
  closeToTray: appConfig.get('closeToTray') !== false,
  startMinimized: !!appConfig.get('startMinimized'),
  autoStart: !!appConfig.get('autoStart'),
  autoUpdateCheck: appConfig.get('autoUpdateCheck') !== false,
  defaultProtocol: appConfig.get('defaultProtocol') || 'imap',
  spellCheckEnabled: appConfig.get('spellCheckEnabled') !== false,
  spellCheckLanguages: appConfig.get('spellCheckLanguages') || ['tr', 'en-US'],
  autoArchiveEnabled: !!appConfig.get('autoArchiveEnabled'),
  autoArchiveMonths: appConfig.get('autoArchiveMonths') || 6,
  autoLockEnabled: !!appConfig.get('autoLockEnabled'),
  autoLockMinutes: appConfig.get('autoLockMinutes') || 15,
  autoCategorizeEnabled: appConfig.get('autoCategorizeEnabled') !== false,
  theme: appConfig.get('theme') || 'dark',
  accentColor: appConfig.get('accentColor') || null,
  logoDataUrl: appConfig.get('logoDataUrl') || null,
  bgImageDataUrl: appConfig.get('bgImageDataUrl') || null,
  bgImageOpacity: typeof appConfig.get('bgImageOpacity') === 'number' ? appConfig.get('bgImageOpacity') : 6,
  layout: appConfig.get('layout') || 'right',
  density: appConfig.get('density') || 'comfortable'
}));

ipcMain.handle('config:setFirstRunDone', () => {
  appConfig.set('firstRun', false);
  return { ok: true };
});

ipcMain.handle('config:chooseDataPath', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Veri Klasörünü Seç',
    properties: ['openDirectory', 'createDirectory'],
    defaultPath: appConfig.getDataPath()
  });
  if (result.canceled || !result.filePaths.length) return { canceled: true };
  return { ok: true, path: result.filePaths[0] };
});

ipcMain.handle('config:setDataPath', async (_, newPath) => {
  try {
    db?.close();
    appConfig.changeDataPath(newPath);
    await initializeDatabase();
    return { ok: true, path: newPath };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('config:updatePrefs', (_, prefs) => {
  // Tek seferde birden çok ayarı güncelle ve etkilerini uygula
  appConfig.setMany(prefs);
  if ('backgroundSyncMinutes' in prefs) setupBackgroundSync();
  if ('autoStart' in prefs || 'startMinimized' in prefs) applyAutoStart();
  return { ok: true };
});

ipcMain.handle('config:testNotification', () => {
  const supported = Notification.isSupported();
  const enabled = appConfig.get('notificationsEnabled') !== false;
  const result = showNotification('🔔 CODEGA Mail Test', 'Bildirimler çalışıyor! Bu bir test mesajıdır.');
  return {
    ok: result && result.ok === true,
    supported,
    enabled,
    layers: result.layers || [],
    primaryLayer: result.primaryLayer,
    platform: process.platform
  };
});

// =====================================================================
// IPC: Hesaplar
// =====================================================================
ipcMain.handle('accounts:list', () => db.listAccounts());

ipcMain.handle('accounts:get', (_, id) => {
  const acc = db.getAccount(id);
  if (!acc) return null;
  return {
    ...acc,
    in_password: undefined,
    smtp_password: undefined,
    has_in_password: !!acc.in_password,
    has_smtp_password: !!acc.smtp_password
  };
});

ipcMain.handle('accounts:add', async (_, accountData) => {
  const inPwEnc = crypto.encrypt(accountData.in_password);
  const smtpPwEnc = accountData.smtp_password
    ? crypto.encrypt(accountData.smtp_password) : inPwEnc;
  const id = db.addAccount({ ...accountData, in_password: inPwEnc, smtp_password: smtpPwEnc });
  return { id };
});

ipcMain.handle('accounts:test', async (_, accountData) => {
  return await mailService.testConnection(accountData);
});

ipcMain.handle('accounts:delete', (_, accountId) => {
  db.deleteAccount(accountId);
  updateTray();
  return { ok: true };
});

ipcMain.handle('accounts:update', async (_, accountId, accountData) => {
  const updates = { ...accountData };
  if (updates.in_password) updates.in_password = crypto.encrypt(updates.in_password);
  else delete updates.in_password;
  if (updates.smtp_password) updates.smtp_password = crypto.encrypt(updates.smtp_password);
  else delete updates.smtp_password;
  db.updateAccount(accountId, updates);
  return { ok: true };
});

ipcMain.handle('accounts:reorder', (_, orderedIds) => {
  orderedIds.forEach((id, idx) => db.updateAccount(id, { sort_order: idx }));
  return { ok: true };
});

// =====================================================================
// IPC: Klasörler
// =====================================================================
ipcMain.handle('folders:list', (_, accountId) => db.listFolders(accountId));
ipcMain.handle('folders:create', async (_, accountId, name, onServer) => {
  try { return await mailService.createFolder(accountId, name, !!onServer); }
  catch (err) { return { ok: false, error: err.message }; }
});
ipcMain.handle('folders:rename', (_, folderId, newName) => {
  db.renameFolder(folderId, newName);
  return { ok: true };
});
ipcMain.handle('folders:delete', (_, folderId) => {
  try { db.deleteFolder(folderId); return { ok: true }; }
  catch (err) { return { ok: false, error: err.message }; }
});

// =====================================================================
// IPC: Mesajlar
// =====================================================================
ipcMain.handle('messages:list', (_, folderId, opts = {}) => db.listMessages(folderId, opts));
ipcMain.handle('messages:get', (_, messageId) => db.getMessage(messageId));

// v1.5: Birleşik Gelen Kutusu - tüm hesapların \Inbox'larını aggregate et
ipcMain.handle('messages:listUnified', (_, opts = {}) => {
  if (!db) return { messages: [], totalUnread: 0, accountCount: 0 };
  const accounts = db.listAccounts();
  const allMessages = [];
  let totalUnread = 0;
  let inboxCount = 0;

  for (const acc of accounts) {
    let folders = [];
    try { folders = db.listFolders(acc.id); } catch (_) { continue; }
    const inbox = folders.find(f => f.special_use === '\\Inbox') || folders.find(f => /inbox|gelen/i.test(f.name));
    if (!inbox) continue;
    inboxCount++;

    try {
      const msgs = db.listMessages(inbox.id, {
        search: opts.search || undefined,
        limit: 200  // her hesaptan max 200, sonra global sıralama
      });
      const accountColor = hashHue(acc.email || acc.display_name || String(acc.id));
      for (const m of msgs) {
        if (!m.is_read && !m.is_spam) totalUnread++;
        allMessages.push(Object.assign({}, m, {
          _accountId: acc.id,
          _accountName: acc.display_name,
          _accountEmail: acc.email,
          _accountHue: accountColor,
          _folderId: inbox.id,
          _folderName: inbox.name
        }));
      }
    } catch (e) {
      console.warn('Unified inbox sorgu hatası:', acc.email, e.message);
    }
  }

  // Tarih DESC sırala (en yeni üstte)
  allMessages.sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db_ = b.date ? new Date(b.date).getTime() : 0;
    return db_ - da;
  });

  const limit = opts.limit || 300;
  return {
    messages: allMessages.slice(0, limit),
    totalUnread,
    accountCount: inboxCount,
    totalCount: allMessages.length
  };
});

// Hesap için tutarlı renk üretimi (0-360 hue)
function hashHue(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % 360;
}

ipcMain.handle('messages:markRead', async (_, messageId, isRead) => {
  db.markMessageRead(messageId, isRead);
  try { await mailService.setFlag(messageId, '\\Seen', isRead); }
  catch (e) { console.warn('Sunucu flag hatası:', e.message); }
  updateTray();
  return { ok: true };
});

ipcMain.handle('messages:delete', async (_, messageId) => {
  await mailService.deleteMessage(messageId);
  updateTray();
  return { ok: true };
});

ipcMain.handle('messages:move', async (_, messageId, targetFolderId) => {
  try {
    const r = await mailService.moveMessage(messageId, targetFolderId);
    updateTray();
    return r;
  } catch (err) { return { ok: false, error: err.message }; }
});

ipcMain.handle('messages:markSpam', async (_, messageId) => {
  // v1.14: Bayes - bu mesajı spam olarak öğret
  try {
    const BayesFilter = require('./services/bayes');
    const msg = db.getMessage(messageId);
    if (msg) {
      // Eğer önceden ham olarak öğretilmişse önce onu geri al
      // (basit yaklaşım: sadece spam ekle, double-counting kabul ediyoruz; küçük etki)
      BayesFilter.train(db, msg, true);
      db.save();
    }
  } catch (e) { console.warn('Bayes train spam:', e.message); }

  const r = await mailService.markAsSpam(messageId);
  updateTray();
  return r;
});

ipcMain.handle('messages:markNotSpam', async (_, messageId) => {
  // v1.14: Bayes - bu mesajı ham (spam değil) olarak öğret
  try {
    const BayesFilter = require('./services/bayes');
    const msg = db.getMessage(messageId);
    if (msg) {
      BayesFilter.train(db, msg, false);
      db.save();
    }
  } catch (e) { console.warn('Bayes train ham:', e.message); }

  const r = await mailService.markAsNotSpam(messageId);
  updateTray();
  return r;
});

// v1.14: Bayes IPC
ipcMain.handle('bayes:stats', () => db.bayesStats());
ipcMain.handle('bayes:reset', () => {
  db.bayesReset();
  db.save();
  return { ok: true };
});
ipcMain.handle('bayes:predictMessage', (_, messageId) => {
  try {
    const BayesFilter = require('./services/bayes');
    const msg = db.getMessage(messageId);
    if (!msg) return { ok: false, error: 'Mesaj bulunamadı' };
    return Object.assign({ ok: true }, BayesFilter.predict(db, msg));
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// v1.15: URL Reputation IPC
const UrlReputation = require('./services/url-reputation');

ipcMain.handle('url:analyze', async (_, url) => {
  if (!url || typeof url !== 'string') return { ok: false, error: 'Geçersiz URL' };

  // Cache kontrol (24h)
  const cached = db.getUrlCache(url);
  if (cached) {
    const age = Date.now() - new Date(cached.scanned_at).getTime();
    if (age < 24 * 60 * 60 * 1000) {
      try {
        const c = JSON.parse(cached.result);
        return Object.assign(c, { fromCache: true });
      } catch (_) {}
    }
  }

  const apiKey = appConfig.get('virustotalApiKey');
  const useVt = !!apiKey && appConfig.get('urlScanWithVt') !== false;

  const result = await UrlReputation.analyze(url, {
    apiKey: useVt ? apiKey.trim() : null,
    useVt
  });

  // Cache (heuristik sonuç çok hızlıdır, tekrar harcamayalım)
  try {
    db.setUrlCache(url, result);
    db.save();
  } catch (_) {}

  return Object.assign({ ok: true }, result);
});

ipcMain.handle('url:openExternal', (_, url) => {
  if (!url) return { ok: false };
  shell.openExternal(url);
  return { ok: true };
});

ipcMain.handle('url:clearCache', () => {
  try {
    db.clearUrlCache();
    db.save();
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});

// =====================================================================
// v1.16 IPC: Adres Defteri (Contacts)
// =====================================================================
ipcMain.handle('contacts:list', (_, opts) => db.listContacts(opts || {}));
ipcMain.handle('contacts:get', (_, id) => db.getContact(id));
ipcMain.handle('contacts:search', (_, query, limit) => db.searchContactsForAutocomplete(query, limit || 8));
ipcMain.handle('contacts:add', (_, contact) => {
  try {
    const id = db.addContact(contact);
    db.save();
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});
ipcMain.handle('contacts:update', (_, id, updates) => {
  try {
    db.updateContact(id, updates);
    db.save();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});
ipcMain.handle('contacts:delete', (_, id) => {
  db.deleteContact(id);
  db.save();
  return { ok: true };
});
ipcMain.handle('contacts:stats', () => db.contactsStats());

// =====================================================================
// v1.22 IPC: AutoConfig (DNS MX + Mozilla ISPDB)
// =====================================================================
const AutoConfig = require('./services/autoconfig');
ipcMain.handle('autoconfig:detect', async (_, email) => {
  try {
    const r = await AutoConfig.detect(email);
    return r ? { ok: true, ...r } : { ok: false, reason: 'not_found' };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// =====================================================================
// v1.22 IPC: Yazım Denetimi (Spell Check)
// =====================================================================
function setupSpellChecker() {
  if (!mainWindow) return;
  const session = mainWindow.webContents.session;
  const enabled = appConfig.get('spellCheckEnabled') !== false;
  const langs = appConfig.get('spellCheckLanguages') || ['tr', 'en-US'];

  try {
    session.setSpellCheckerEnabled(enabled);
    if (enabled) {
      const available = session.availableSpellCheckerLanguages || [];
      // Sadece desteklenen dilleri filtrele
      const supported = langs.filter(l => available.includes(l));
      if (supported.length) {
        session.setSpellCheckerLanguages(supported);
      } else if (available.includes('en-US')) {
        session.setSpellCheckerLanguages(['en-US']);
      }
    }
    // Custom sözlükten kelimeleri yükle
    if (db && typeof db.listCustomDictionary === 'function') {
      const words = db.listCustomDictionary();
      for (const w of words) {
        try { session.addWordToSpellCheckerDictionary(w); } catch (_) {}
      }
    }
  } catch (e) {
    console.warn('Spell checker setup hatası:', e.message);
  }
}

ipcMain.handle('spell:getInfo', () => {
  if (!mainWindow) return { available: [], current: [], enabled: false };
  const s = mainWindow.webContents.session;
  return {
    available: s.availableSpellCheckerLanguages || [],
    current: s.getSpellCheckerLanguages ? s.getSpellCheckerLanguages() : [],
    enabled: s.isSpellCheckerEnabled ? s.isSpellCheckerEnabled() : false,
    customWords: db.listCustomDictionary()
  };
});

ipcMain.handle('spell:setLanguages', (_, langs) => {
  try {
    const s = mainWindow.webContents.session;
    const available = s.availableSpellCheckerLanguages || [];
    const supported = (langs || []).filter(l => available.includes(l));
    s.setSpellCheckerLanguages(supported);
    appConfig.set('spellCheckLanguages', supported);
    return { ok: true, applied: supported };
  } catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('spell:setEnabled', (_, enabled) => {
  try {
    mainWindow.webContents.session.setSpellCheckerEnabled(!!enabled);
    appConfig.set('spellCheckEnabled', !!enabled);
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('spell:removeWord', (_, word) => {
  try {
    const s = mainWindow.webContents.session;
    if (s.removeWordFromSpellCheckerDictionary) {
      s.removeWordFromSpellCheckerDictionary(word);
    }
    db.removeCustomDictionaryWord(word);
    db.save();
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});

// =====================================================================
// v1.23 IPC: Güvenlik (Master Password + 2FA)
// =====================================================================
const Security = require('./services/security');

// Brute force protection state (in-memory)
const securityRuntime = {
  failedAttempts: 0,
  lockedUntil: 0,
  unlocked: false  // App içine girildi mi?
};

ipcMain.handle('security:status', () => ({
  hasMasterPassword: db.hasMasterPassword(),
  has2FA: db.has2FA(),
  unlocked: securityRuntime.unlocked,
  unusedRecoveryCodes: db.unusedRecoveryCodeCount(),
  failedAttempts: securityRuntime.failedAttempts,
  lockedUntil: securityRuntime.lockedUntil
}));

ipcMain.handle('security:setMasterPassword', (_, { newPassword, currentPassword }) => {
  // Eğer master password zaten varsa, mevcut şifre doğrulanmadan değiştirilemez
  if (db.hasMasterPassword()) {
    const hash = db.getSecurityMeta('mp_hash');
    const salt = db.getSecurityMeta('mp_salt');
    if (!Security.verifyPassword(currentPassword || '', hash, salt)) {
      return { ok: false, error: 'Mevcut şifre yanlış' };
    }
  }
  if (!newPassword || newPassword.length < 6) {
    return { ok: false, error: 'Şifre en az 6 karakter olmalı' };
  }
  const r = Security.hashPassword(newPassword);
  db.setSecurityMeta('mp_hash', r.hash);
  db.setSecurityMeta('mp_salt', r.salt);
  db.save();
  securityRuntime.unlocked = true;
  return { ok: true };
});

ipcMain.handle('security:removeMasterPassword', (_, currentPassword) => {
  if (!db.hasMasterPassword()) return { ok: true };
  const hash = db.getSecurityMeta('mp_hash');
  const salt = db.getSecurityMeta('mp_salt');
  if (!Security.verifyPassword(currentPassword || '', hash, salt)) {
    return { ok: false, error: 'Mevcut şifre yanlış' };
  }
  db.setSecurityMeta('mp_hash', null);
  db.setSecurityMeta('mp_salt', null);
  // 2FA'yı da kaldır
  db.setSecurityMeta('totp_secret', null);
  db.setSecurityMeta('totp_enabled', '0');
  db.exec('DELETE FROM recovery_codes');
  db.save();
  return { ok: true };
});

ipcMain.handle('security:verifyMasterPassword', (_, { password, totpCode, recoveryCode }) => {
  // Lockout kontrolü
  const now = Date.now();
  if (securityRuntime.lockedUntil > now) {
    const remainingSec = Math.ceil((securityRuntime.lockedUntil - now) / 1000);
    return { ok: false, error: `Çok fazla yanlış deneme. ${remainingSec} saniye sonra tekrar deneyin.`, lockedUntil: securityRuntime.lockedUntil };
  }

  const hash = db.getSecurityMeta('mp_hash');
  const salt = db.getSecurityMeta('mp_salt');

  if (!hash || !salt) {
    securityRuntime.unlocked = true;
    return { ok: true, noPassword: true };
  }

  // Master password doğrula
  if (!Security.verifyPassword(password || '', hash, salt)) {
    securityRuntime.failedAttempts++;
    if (securityRuntime.failedAttempts >= Security.MAX_FAILED_ATTEMPTS) {
      securityRuntime.lockedUntil = now + Security.LOCKOUT_MS;
      return { ok: false, error: 'Çok fazla yanlış deneme. 5 dakika kilitlendi.', lockedUntil: securityRuntime.lockedUntil };
    }
    return { ok: false, error: 'Şifre yanlış', remaining: Security.MAX_FAILED_ATTEMPTS - securityRuntime.failedAttempts };
  }

  // 2FA kontrolü (eğer aktifse)
  if (db.has2FA()) {
    const secret = db.getSecurityMeta('totp_secret');

    // Kullanıcı recovery kod kullanıyor olabilir
    if (recoveryCode && recoveryCode.trim()) {
      const cleaned = recoveryCode.trim().toUpperCase().replace(/\s+/g, '');
      const codeHash = Security.hashRecoveryCode(cleaned);
      if (db.consumeRecoveryCode(codeHash)) {
        db.save();
        securityRuntime.failedAttempts = 0;
        securityRuntime.unlocked = true;
        return { ok: true, recoveryUsed: true, unusedRecoveryCodes: db.unusedRecoveryCodeCount() };
      }
      return { ok: false, error: 'Recovery code geçersiz veya zaten kullanılmış' };
    }

    if (!totpCode || !Security.verifyTotpCode(secret, totpCode)) {
      securityRuntime.failedAttempts++;
      if (securityRuntime.failedAttempts >= Security.MAX_FAILED_ATTEMPTS) {
        securityRuntime.lockedUntil = now + Security.LOCKOUT_MS;
        return { ok: false, error: 'Çok fazla yanlış deneme. 5 dakika kilitlendi.', lockedUntil: securityRuntime.lockedUntil };
      }
      return { ok: false, error: '2FA kodu yanlış', need2FA: true, remaining: Security.MAX_FAILED_ATTEMPTS - securityRuntime.failedAttempts };
    }
  }

  // Başarılı
  securityRuntime.failedAttempts = 0;
  securityRuntime.unlocked = true;
  return { ok: true };
});

ipcMain.handle('security:start2FASetup', async (_, { email }) => {
  if (!db.hasMasterPassword()) {
    return { ok: false, error: '2FA için önce master şifre belirleyin' };
  }
  const secret = Security.generateTotpSecret();
  const uri = Security.buildOtpauthUri(secret, email || 'user', 'CODEGA Mail');
  // QR kod üret
  let qrDataUrl = null;
  try {
    const QRCode = require('qrcode');
    qrDataUrl = await QRCode.toDataURL(uri, { errorCorrectionLevel: 'M', margin: 1, width: 240 });
  } catch (e) {
    console.warn('QR kod üretilemedi:', e.message);
  }
  // Geçici secret - kullanıcı doğrulayana kadar kaydedilmiyor
  securityRuntime.pendingTotpSecret = secret;
  return { ok: true, secret, uri, qrDataUrl };
});

ipcMain.handle('security:confirm2FASetup', (_, { code }) => {
  const secret = securityRuntime.pendingTotpSecret;
  if (!secret) return { ok: false, error: '2FA kurulumu başlatılmamış' };
  if (!Security.verifyTotpCode(secret, code)) {
    return { ok: false, error: 'Kod yanlış. Authenticator app\'inizdeki kodu doğru girdiğinizden emin olun.' };
  }
  // Doğrulandı - kalıcı kaydet
  db.setSecurityMeta('totp_secret', secret);
  db.setSecurityMeta('totp_enabled', '1');
  // Recovery codes üret
  const codes = Security.generateRecoveryCodes(10);
  const hashes = codes.map(c => Security.hashRecoveryCode(c));
  db.storeRecoveryCodes(hashes);
  db.save();
  securityRuntime.pendingTotpSecret = null;
  return { ok: true, recoveryCodes: codes };
});

ipcMain.handle('security:disable2FA', (_, currentPassword) => {
  const hash = db.getSecurityMeta('mp_hash');
  const salt = db.getSecurityMeta('mp_salt');
  if (!Security.verifyPassword(currentPassword || '', hash, salt)) {
    return { ok: false, error: 'Mevcut şifre yanlış' };
  }
  db.setSecurityMeta('totp_secret', null);
  db.setSecurityMeta('totp_enabled', '0');
  db.exec('DELETE FROM recovery_codes');
  db.save();
  return { ok: true };
});

ipcMain.handle('security:regenerateRecoveryCodes', (_, currentPassword) => {
  const hash = db.getSecurityMeta('mp_hash');
  const salt = db.getSecurityMeta('mp_salt');
  if (!Security.verifyPassword(currentPassword || '', hash, salt)) {
    return { ok: false, error: 'Mevcut şifre yanlış' };
  }
  const codes = Security.generateRecoveryCodes(10);
  const hashes = codes.map(c => Security.hashRecoveryCode(c));
  db.storeRecoveryCodes(hashes);
  db.save();
  return { ok: true, recoveryCodes: codes };
});

ipcMain.handle('security:lockApp', () => {
  securityRuntime.unlocked = false;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('security:locked');
  }
  return { ok: true };
});

// =====================================================================
// v1.24 IPC: Mesaj Arşivleme
// =====================================================================
ipcMain.handle('archive:stats', () => db.archiveStats());

ipcMain.handle('archive:message', (_, id) => {
  try {
    db.archiveMessage(id);
    db.save();
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('archive:unarchive', (_, id) => {
  try {
    db.unarchiveMessage(id);
    db.save();
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('archive:archiveOld', (_, opts) => {
  try {
    // opts: { months: 6, accountId, folderId, preserveImportant }
    const months = opts && typeof opts.months === 'number' ? opts.months : 6;
    const beforeDate = new Date();
    beforeDate.setMonth(beforeDate.getMonth() - months);
    const count = db.archiveOldMessages({
      beforeDate: beforeDate.toISOString(),
      accountId: opts?.accountId,
      folderId: opts?.folderId,
      preserveImportant: opts?.preserveImportant !== false
    });
    db.save();
    updateTray();
    return { ok: true, count, beforeDate: beforeDate.toISOString() };
  } catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('archive:list', (_, opts) => db.listArchivedMessages(opts || {}));

ipcMain.handle('archive:purge', (_, opts) => {
  try {
    // opts: { months: 12, accountId } - X aydan önce arşivlenenler kalıcı silinir
    const months = opts && typeof opts.months === 'number' ? opts.months : 12;
    const beforeArchiveDate = new Date();
    beforeArchiveDate.setMonth(beforeArchiveDate.getMonth() - months);
    const count = db.purgeArchivedMessages({
      beforeArchiveDate: beforeArchiveDate.toISOString(),
      accountId: opts?.accountId
    });
    db.save();
    return { ok: true, count };
  } catch (e) { return { ok: false, error: e.message }; }
});

// Otomatik arşivleme - arka plan scheduler'a bağlı
async function processAutoArchive() {
  if (!appConfig.get('autoArchiveEnabled')) return;
  const months = appConfig.get('autoArchiveMonths') || 6;
  const lastRun = appConfig.get('autoArchiveLastRun') || 0;
  const now = Date.now();
  // Günde bir defadan fazla çalışmasın
  if (now - lastRun < 23 * 60 * 60 * 1000) return;
  try {
    const beforeDate = new Date();
    beforeDate.setMonth(beforeDate.getMonth() - months);
    const count = db.archiveOldMessages({
      beforeDate: beforeDate.toISOString(),
      preserveImportant: true
    });
    if (count > 0) {
      console.log(`Otomatik arşivleme: ${count} mesaj arşivlendi (${months} aydan eski)`);
      db.save();
      updateTray();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('archive:auto-done', { count, months });
      }
    }
    appConfig.set('autoArchiveLastRun', now);
  } catch (e) { console.warn('Auto-archive hatası:', e.message); }
}

// =====================================================================
// v1.25 IPC: PGP / OpenPGP
// =====================================================================
const PGPService = require('./services/pgp');

ipcMain.handle('pgp:listKeys', () => db.listPgpKeys());
ipcMain.handle('pgp:listContacts', () => db.listPgpContacts());

ipcMain.handle('pgp:generateKey', async (_, { name, email, passphrase }) => {
  try {
    if (!email || !passphrase) return { ok: false, error: 'Email ve passphrase gerekli' };
    if (passphrase.length < 8) return { ok: false, error: 'Passphrase en az 8 karakter olmalı' };
    const result = await PGPService.generateKeyPair(name, email, passphrase);
    const id = db.addPgpKey({
      email,
      name: name || email,
      fingerprint: result.fingerprint,
      key_id: result.keyId,
      public_key: result.publicKey,
      private_key: result.privateKey,
      is_default: db.listPgpKeys().length === 0 ? 1 : 0
    });
    db.save();
    return { ok: true, id, fingerprint: result.fingerprint, keyId: result.keyId };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('pgp:setDefault', (_, id) => {
  db.setDefaultPgpKey(id);
  db.save();
  return { ok: true };
});

ipcMain.handle('pgp:deleteKey', (_, id) => {
  db.deletePgpKey(id);
  db.save();
  return { ok: true };
});

ipcMain.handle('pgp:exportPublicKey', (_, id) => {
  const k = db.getPgpKey(id);
  return k ? { ok: true, publicKey: k.public_key, email: k.email, fingerprint: k.fingerprint } : { ok: false };
});

ipcMain.handle('pgp:importContact', async (_, { armoredKey }) => {
  try {
    const info = await PGPService.readPublicKey(armoredKey);
    // Email'i userIDs'den çıkar
    const userId = info.userIDs[0] || '';
    const m = userId.match(/<([^>]+)>/);
    const email = m ? m[1] : '';
    const name = m ? userId.replace(/<[^>]+>/, '').trim() : userId;
    if (!email) return { ok: false, error: 'Public key içinde email adresi bulunamadı' };
    const id = db.addPgpContact({
      email,
      name,
      fingerprint: info.fingerprint,
      key_id: info.keyId,
      public_key: armoredKey,
      trust_level: 'unverified'
    });
    db.save();
    return { ok: true, id, email, name, fingerprint: info.fingerprint };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('pgp:deleteContact', (_, id) => {
  db.deletePgpContact(id);
  db.save();
  return { ok: true };
});

ipcMain.handle('pgp:setContactTrust', (_, { id, level }) => {
  db.setPgpContactTrust(id, level);
  db.save();
  return { ok: true };
});

ipcMain.handle('pgp:hasContact', (_, email) => {
  return !!db.getPgpContactByEmail(email);
});

ipcMain.handle('pgp:encrypt', async (_, { plainText, recipientEmails, signWithKeyId, signPassphrase }) => {
  try {
    const recipientKeys = [];
    for (const em of recipientEmails) {
      const c = db.getPgpContactByEmail(em);
      if (!c) return { ok: false, error: `${em} için public key bulunamadı. Önce kişinin PGP anahtarını içe aktarın.` };
      recipientKeys.push(c.public_key);
    }
    let signingPriv = null, signingPass = '';
    if (signWithKeyId) {
      const sk = db.getPgpKey(signWithKeyId);
      if (sk && sk.private_key) {
        signingPriv = sk.private_key;
        signingPass = signPassphrase || '';
      }
    }
    const armored = await PGPService.encryptMessage(plainText, recipientKeys, signingPriv, signingPass);
    return { ok: true, armored };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('pgp:decrypt', async (_, { armoredMessage, keyId, passphrase, senderEmail }) => {
  try {
    let privKey = null;
    if (keyId) {
      const k = db.getPgpKey(keyId);
      if (k && k.private_key) privKey = k.private_key;
    }
    if (!privKey) {
      // Default key dene
      const keys = db.listPgpKeys();
      const def = keys.find(k => k.is_default && k.has_private) || keys.find(k => k.has_private);
      if (def) {
        const full = db.getPgpKey(def.id);
        privKey = full.private_key;
      }
    }
    if (!privKey) return { ok: false, error: 'Şifre çözmek için bir private key gerekli. Settings > PGP\'den anahtar üretin.' };

    let senderKeys = [];
    if (senderEmail) {
      const c = db.getPgpContactByEmail(senderEmail);
      if (c) senderKeys.push(c.public_key);
    }

    const result = await PGPService.decryptMessage(armoredMessage, privKey, passphrase || '', senderKeys);
    return { ok: true, decryptedText: result.decryptedText, verified: result.verified };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('pgp:detectInBody', (_, bodyText) => {
  return { type: PGPService.detectPgpInBody(bodyText) };
});

// =====================================================================
// v1.26 IPC: Contacts Import/Export (vCard / CSV)
// =====================================================================
const VCardService = require('./services/vcard');
const ContactsCsvService = require('./services/contacts-csv');

ipcMain.handle('contacts:export', async (_, format) => {
  const f = (format || 'vcard').toLowerCase();
  const ext = f === 'csv' ? 'csv' : 'vcf';
  const filterName = f === 'csv' ? 'CSV (Excel/Google uyumlu)' : 'vCard (Outlook/Apple uyumlu)';
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Kişileri Dışa Aktar',
    defaultPath: `codega-mail-kisiler-${new Date().toISOString().slice(0, 10)}.${ext}`,
    filters: [{ name: filterName, extensions: [ext] }]
  });
  if (result.canceled || !result.filePath) return { canceled: true };
  try {
    const contacts = db.listContacts({ sortBy: 'name' });
    if (!contacts.length) return { ok: false, error: 'Henüz kişi yok' };
    const content = (f === 'csv')
      ? ContactsCsvService.build(contacts)
      : VCardService.buildMultiple(contacts);
    fs.writeFileSync(result.filePath, content, 'utf8');
    return { ok: true, path: result.filePath, count: contacts.length };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('contacts:import', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Kişi Dosyası Seç',
    properties: ['openFile'],
    filters: [
      { name: 'vCard veya CSV', extensions: ['vcf', 'csv'] },
      { name: 'vCard', extensions: ['vcf'] },
      { name: 'CSV', extensions: ['csv'] },
      { name: 'Tüm dosyalar', extensions: ['*'] }
    ]
  });
  if (result.canceled || !result.filePaths.length) return { canceled: true };

  try {
    const path = result.filePaths[0];
    const text = fs.readFileSync(path, 'utf8');
    const ext = path.toLowerCase().split('.').pop();

    let parsed = [];
    if (ext === 'csv') {
      parsed = ContactsCsvService.parse(text);
    } else if (ext === 'vcf') {
      parsed = VCardService.parse(text);
    } else {
      // Otomatik algıla
      if (text.includes('BEGIN:VCARD')) parsed = VCardService.parse(text);
      else parsed = ContactsCsvService.parse(text);
    }

    if (!parsed.length) {
      return { ok: false, error: 'Dosyada geçerli kişi bulunamadı (email adresi olan)' };
    }

    // DB'ye ekle (varsa update, yoksa add)
    let added = 0, updated = 0, skipped = 0;
    for (const c of parsed) {
      try {
        const existing = db.getContactByEmail(c.email);
        if (existing) {
          // Sadece boş alanları güncelle
          const updates = {};
          if (!existing.name && c.name) updates.name = c.name;
          if (!existing.phone && c.phone) updates.phone = c.phone;
          if (!existing.organization && c.organization) updates.organization = c.organization;
          if (!existing.notes && c.notes) updates.notes = c.notes;
          if (!existing.tags && c.tags) updates.tags = c.tags;
          if (Object.keys(updates).length) {
            db.updateContact(existing.id, updates);
            updated++;
          } else {
            skipped++;
          }
        } else {
          db.addContact({
            email: c.email,
            name: c.name,
            phone: c.phone,
            organization: c.organization,
            notes: c.notes,
            tags: c.tags,
            is_favorite: c.is_favorite,
            source: 'imported'
          });
          added++;
        }
      } catch (e) { skipped++; }
    }
    db.save();
    return { ok: true, total: parsed.length, added, updated, skipped, path };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// =====================================================================
// v1.27 IPC: Takvim / Events
// =====================================================================
const ICalService = require('./services/ical');

ipcMain.handle('events:list', (_, opts) => db.listEvents(opts || {}));
ipcMain.handle('events:get', (_, id) => db.getEvent(id));
ipcMain.handle('events:stats', () => db.eventStats());

ipcMain.handle('events:add', (_, event) => {
  try {
    if (!event.start_at) return { ok: false, error: 'Başlangıç tarihi gerekli' };
    const id = db.addEvent(event);
    db.save();
    return { ok: true, id };
  } catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('events:update', (_, id, updates) => {
  try {
    db.updateEvent(id, updates);
    db.save();
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('events:delete', (_, id) => {
  db.deleteEvent(id);
  db.save();
  return { ok: true };
});

ipcMain.handle('events:parseICalText', (_, text) => {
  try {
    const events = ICalService.parse(text);
    return { ok: true, events };
  } catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('events:guessFromText', (_, text) => {
  return { dateTime: ICalService.guessDateTimeFromText(text) };
});

ipcMain.handle('events:exportIcs', async (_, id) => {
  const event = db.getEvent(id);
  if (!event) return { ok: false, error: 'Etkinlik bulunamadı' };
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Etkinliği Dışa Aktar',
    defaultPath: `${(event.title || 'etkinlik').slice(0, 50).replace(/[^\w\s-]/g, '')}.ics`,
    filters: [{ name: 'iCalendar (.ics)', extensions: ['ics'] }]
  });
  if (result.canceled || !result.filePath) return { canceled: true };
  try {
    const content = ICalService.buildEvent(event);
    fs.writeFileSync(result.filePath, content, 'utf8');
    return { ok: true, path: result.filePath };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

async function processDueEventReminders() {
  try {
    const due = db.getDueEventReminders();
    if (!due.length) return;
    for (const ev of due) {
      try {
        const startText = ev.start_at ? ` (${new Date(ev.start_at).toLocaleString('tr-TR')})` : '';
        const locationText = ev.location ? ` - ${ev.location}` : '';
        showNotification(
          '📅 Etkinlik Hatırlatması',
          `${ev.title}${startText}${locationText}`
        );
        db.updateEvent(ev.id, { reminder_sent: 1 });
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('event:reminder', {
            id: ev.id, title: ev.title, start_at: ev.start_at, location: ev.location
          });
        }
      } catch (e) { console.warn('Event reminder hatası:', e.message); }
    }
    db.save();
  } catch (e) { console.warn('processDueEventReminders error:', e.message); }
}

// =====================================================================
// v1.29 IPC: Otomatik Mail Kategorileme
// =====================================================================
const AutoCategorizer = require('./services/auto-categorize');

/**
 * Yerleşik kategorileri DB'de seed et (sadece eksikleri ekler)
 * @returns {object} - { seeded: ekleneN, skipped: zatenVarOlan }
 */
function seedBuiltinCategories() {
  const builtins = AutoCategorizer.getBuiltinCategories();
  const existing = db.listCategories();
  const existingNames = new Set(existing.map(c => c.name));
  let seeded = 0;
  for (const c of builtins) {
    if (!existingNames.has(c.name)) {
      db.addCategory(c);
      seeded++;
    }
  }
  if (seeded > 0) db.save();
  return { seeded, skipped: builtins.length - seeded };
}

/**
 * Tek bir mesajı kategorize et (sync sonrası kullanılır)
 * @returns {Array<string>} - eklenen kategori isimleri
 */
function autoCategorizeMessage(messageId) {
  try {
    const msg = db.getMessage(messageId);
    if (!msg) return [];
    const matchNames = AutoCategorizer.categorize(msg);
    if (!matchNames.length) return [];

    // Kategori adlarından ID'leri bul
    const allCats = db.listCategories();
    const catByName = {};
    for (const c of allCats) catByName[c.name] = c.id;

    const added = [];
    for (const name of matchNames) {
      const cid = catByName[name];
      if (cid) {
        if (db.addMessageCategory(messageId, cid)) added.push(name);
      }
    }
    return added;
  } catch (e) {
    console.warn('autoCategorizeMessage hatası:', e.message);
    return [];
  }
}

ipcMain.handle('autocategorize:seedBuiltin', () => {
  return seedBuiltinCategories();
});

ipcMain.handle('autocategorize:single', (_, messageId) => {
  const added = autoCategorizeMessage(messageId);
  db.save();
  return { ok: true, added };
});

/**
 * Tüm hesabın mesajlarını toplu kategorize et
 * - Yalnızca hiç kategorisi olmayan mesajları (henüz manuel etiketlenmemiş) hedefler
 *   (Mevcut etiketleri ezmemek için)
 */
ipcMain.handle('autocategorize:all', async (_, opts) => {
  try {
    const onlyUntagged = opts?.onlyUntagged !== false;
    const accountId = opts?.accountId;

    // Önce yerleşik kategorileri seed et
    seedBuiltinCategories();

    // Mesajları al
    let where = '1=1';
    const params = [];
    if (accountId) {
      where += ' AND m.account_id = ?';
      params.push(accountId);
    }
    if (onlyUntagged) {
      where += ' AND NOT EXISTS (SELECT 1 FROM message_categories mc WHERE mc.message_id = m.id)';
    }
    // Sadece son 5000 mesaj (performans için)
    const messages = db.prepare(`
      SELECT m.id FROM messages m
      WHERE ${where}
      ORDER BY m.id DESC LIMIT 5000
    `).all(...params);

    let categorized = 0;
    let totalLabels = 0;
    for (const m of messages) {
      const added = autoCategorizeMessage(m.id);
      if (added.length) {
        categorized++;
        totalLabels += added.length;
      }
    }
    db.save();
    return { ok: true, scanned: messages.length, categorized, totalLabels };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// Sync sonrası tetikleme: yeni gelen mesajlar otomatik kategorize edilsin
function autoCategorizeNewMessages(messageIds) {
  if (!appConfig.get('autoCategorizeEnabled')) return;
  if (!Array.isArray(messageIds) || !messageIds.length) return;
  try {
    // İlk çağrıda yerleşik kategoriler eksikse seed et
    const exists = db.listCategories();
    const builtinNames = new Set(AutoCategorizer.getBuiltinCategories().map(c => c.name));
    const seedNeeded = AutoCategorizer.getBuiltinCategories().some(c => !exists.find(e => e.name === c.name));
    if (seedNeeded) seedBuiltinCategories();

    let count = 0;
    for (const id of messageIds) {
      const added = autoCategorizeMessage(id);
      if (added.length) count++;
    }
    if (count > 0) db.save();
  } catch (e) { console.warn('autoCategorizeNewMessages error:', e.message); }
}

// =====================================================================
// v1.30 IPC: Görünüm (logo + arka plan resmi yükleme)
// =====================================================================
async function pickAndReadImage(title, maxBytes) {
  const result = await dialog.showOpenDialog(mainWindow, {
    title,
    properties: ['openFile'],
    filters: [{ name: 'Resim', extensions: ['png', 'jpg', 'jpeg', 'webp', 'svg'] }]
  });
  if (result.canceled || !result.filePaths.length) return { canceled: true };
  try {
    const filePath = result.filePaths[0];
    const stat = fs.statSync(filePath);
    if (stat.size > maxBytes) {
      return { ok: false, error: `Dosya çok büyük (${(stat.size / 1024).toFixed(0)} KB) - en fazla ${(maxBytes / 1024).toFixed(0)} KB olmalı` };
    }
    const buffer = fs.readFileSync(filePath);
    const ext = filePath.toLowerCase().split('.').pop();
    const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
              : ext === 'svg' ? 'image/svg+xml'
              : ext === 'webp' ? 'image/webp'
              : 'image/png';
    const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`;
    return { ok: true, dataUrl, size: stat.size };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

ipcMain.handle('branding:uploadLogo', async () => {
  const r = await pickAndReadImage('Logo Seç', 200 * 1024);
  if (r.canceled || !r.ok) return r;
  appConfig.set('logoDataUrl', r.dataUrl);
  return { ok: true, dataUrl: r.dataUrl };
});

ipcMain.handle('branding:removeLogo', () => {
  appConfig.set('logoDataUrl', null);
  return { ok: true };
});

ipcMain.handle('branding:uploadBgImage', async () => {
  const r = await pickAndReadImage('Arka Plan Resmi Seç', 1024 * 1024);
  if (r.canceled || !r.ok) return r;
  appConfig.set('bgImageDataUrl', r.dataUrl);
  return { ok: true, dataUrl: r.dataUrl };
});

ipcMain.handle('branding:removeBgImage', () => {
  appConfig.set('bgImageDataUrl', null);
  return { ok: true };
});

ipcMain.handle('messages:requestComposeAction', (_, { action, data }) => {
  // Popup mesaj penceresinden gelen reply/replyAll/forward isteğini ana pencereye ilet
  if (!mainWindow || mainWindow.isDestroyed()) {
    // Ana pencere kapalıysa aç
    if (typeof createWindow === 'function') createWindow();
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send('compose-action-from-popup', { action, data });
  }
  return { ok: true };
});
const messageWindows = new Map(); // messageId -> BrowserWindow

ipcMain.handle('messages:openInWindow', (_, messageId) => {
  if (!messageId) return { ok: false, error: 'Mesaj ID gerekli' };

  // Aynı mesaj zaten açıksa odakla
  const existing = messageWindows.get(messageId);
  if (existing && !existing.isDestroyed()) {
    if (existing.isMinimized()) existing.restore();
    existing.focus();
    return { ok: true, focused: true };
  }

  const iconPath = getIconPath();
  const win = new BrowserWindow({
    width: 760,
    height: 720,
    minWidth: 480,
    minHeight: 360,
    title: 'Mesaj — CODEGA Mail',
    backgroundColor: appConfig.get('theme') === 'light' ? '#ffffff' : '#1e1e2e',
    icon: iconPath || undefined,
    parent: undefined,           // bağımsız pencere - taskbar'da ayrı görünür
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.loadFile(path.join(__dirname, 'ui', 'message-window.html'),
               { search: 'id=' + encodeURIComponent(messageId) });
  win.setMenuBarVisibility(false);

  messageWindows.set(messageId, win);
  win.on('closed', () => {
    messageWindows.delete(messageId);
  });

  return { ok: true };
});

// =====================================================================
// v1.34 IPC: Kişi Grupları + Toplu Mail
// =====================================================================
ipcMain.handle('groups:list', () => db.listGroups());
ipcMain.handle('groups:get', (_, id) => db.getGroup(id));
ipcMain.handle('groups:members', (_, id) => db.listGroupMembers(id));
ipcMain.handle('groups:emails', (_, id) => db.getGroupEmails(id));

ipcMain.handle('groups:add', (_, group) => {
  try {
    if (!group.name || !group.name.trim()) return { ok: false, error: 'Grup adı gerekli' };
    const id = db.addGroup(group);
    db.save();
    return { ok: true, id };
  } catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('groups:update', (_, id, updates) => {
  try {
    db.updateGroup(id, updates);
    db.save();
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('groups:delete', (_, id) => {
  try {
    db.deleteGroup(id);
    db.save();
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('groups:addMember', (_, groupId, contactId) => {
  try {
    db.addMemberToGroup(groupId, contactId);
    db.save();
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('groups:addMembers', (_, groupId, contactIds) => {
  try {
    const added = db.addMembersToGroup(groupId, contactIds);
    db.save();
    return { ok: true, added };
  } catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('groups:removeMember', (_, groupId, contactId) => {
  try {
    db.removeMemberFromGroup(groupId, contactId);
    db.save();
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('groups:contactGroups', (_, contactId) => db.getContactGroups(contactId));

// =====================================================================
// v1.35 IPC: Mail Kuralları
// =====================================================================
const MailRulesEngine = require('./services/mail-rules');

ipcMain.handle('rules:list', (_, opts) => db.listMailRules(opts || {}));
ipcMain.handle('rules:get', (_, id) => db.getMailRule(id));

ipcMain.handle('rules:add', (_, rule) => {
  try {
    if (!rule.name || !rule.name.trim()) return { ok: false, error: 'Kural adı gerekli' };
    if (!rule.conditions || !rule.conditions.length) return { ok: false, error: 'En az bir koşul gerekli' };
    if (!rule.actions || !rule.actions.length) return { ok: false, error: 'En az bir eylem gerekli' };
    const id = db.addMailRule(rule);
    db.save();
    return { ok: true, id };
  } catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('rules:update', (_, id, updates) => {
  try {
    db.updateMailRule(id, updates);
    db.save();
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('rules:delete', (_, id) => {
  try {
    db.deleteMailRule(id);
    db.save();
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('rules:toggle', (_, id, enabled) => {
  try {
    db.updateMailRule(id, { enabled: !!enabled });
    db.save();
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});

/**
 * Tüm mevcut mailleri tara ve kuralları uygula (toplu)
 */
ipcMain.handle('rules:applyToAll', async (_, opts) => {
  try {
    const accountId = opts?.accountId;
    let where = '1=1';
    const params = [];
    if (accountId) {
      where += ' AND account_id = ?';
      params.push(accountId);
    }
    // Son 5000 mesaj limiti (performans)
    const messages = db.prepare(`
      SELECT id FROM messages WHERE ${where}
      ORDER BY id DESC LIMIT 5000
    `).all(...params);

    let processed = 0, modified = 0, totalActions = 0;
    for (const m of messages) {
      const fullMsg = db.getMessage(m.id);
      if (!fullMsg) continue;
      const result = MailRulesEngine.applyRulesToMessage(fullMsg, db);
      processed++;
      if (result.applied.length) {
        modified++;
        totalActions += result.applied.reduce((s, r) => s + r.actions.length, 0);
      }
    }
    db.save();
    return { ok: true, processed, modified, totalActions };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

/**
 * Tek bir maile kuralları uygula (test için)
 */
ipcMain.handle('rules:applyToMessage', (_, messageId) => {
  try {
    const msg = db.getMessage(messageId);
    if (!msg) return { ok: false, error: 'Mesaj bulunamadı' };
    const result = MailRulesEngine.applyRulesToMessage(msg, db);
    db.save();
    return { ok: true, applied: result.applied, stopped: result.stopped };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

/**
 * Sync sonrası yeni mailler için kuralları çalıştır
 */
function applyRulesToNewMessages(messageIds) {
  if (!Array.isArray(messageIds) || !messageIds.length) return;
  try {
    let modified = 0;
    for (const id of messageIds) {
      const msg = db.getMessage(id);
      if (!msg) continue;
      const result = MailRulesEngine.applyRulesToMessage(msg, db);
      if (result.applied.length) modified++;
    }
    if (modified > 0) {
      console.log(`Mail kuralları: ${modified} mail için uygulandı`);
      db.save();
    }
  } catch (e) { console.warn('applyRulesToNewMessages error:', e.message); }
}

// =====================================================================
// v1.36 IPC: Quick Steps
// =====================================================================
ipcMain.handle('quickSteps:list', (_, opts) => db.listQuickSteps(opts || {}));
ipcMain.handle('quickSteps:get', (_, id) => db.getQuickStep(id));

ipcMain.handle('quickSteps:add', (_, qs) => {
  try {
    if (!qs.name || !qs.name.trim()) return { ok: false, error: 'Ad gerekli' };
    if (!qs.actions || !qs.actions.length) return { ok: false, error: 'En az bir eylem gerekli' };
    const id = db.addQuickStep(qs);
    db.save();
    return { ok: true, id };
  } catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('quickSteps:update', (_, id, updates) => {
  try {
    db.updateQuickStep(id, updates);
    db.save();
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('quickSteps:delete', (_, id) => {
  try {
    db.deleteQuickStep(id);
    db.save();
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});

/**
 * Quick Step'i bir maile uygula (manuel - tek mail veya çoklu)
 * Bazı eylemler (reply/forward/newMail) renderer'da işlenir, döner.
 */
ipcMain.handle('quickSteps:execute', (_, quickStepId, messageIds) => {
  try {
    const qs = db.getQuickStep(quickStepId);
    if (!qs) return { ok: false, error: 'Quick Step bulunamadı' };
    const actions = JSON.parse(qs.actions || '[]');
    const ids = Array.isArray(messageIds) ? messageIds : [messageIds].filter(Boolean);
    if (!ids.length) return { ok: false, error: 'Mesaj ID gerekli' };

    // Renderer'a iletilecek aksiyon (reply/forward/newMail)
    const rendererAction = actions.find(a => ['reply', 'replyAll', 'forward', 'newMail'].includes(a.type));

    let processed = 0;
    let totalActions = 0;
    for (const id of ids) {
      const msg = db.getMessage(id);
      if (!msg) continue;
      // Db-side action'ları uygula
      for (const action of actions) {
        if (['reply', 'replyAll', 'forward', 'newMail'].includes(action.type)) continue; // Renderer halledecek
        try {
          MailRulesEngine.executeAction(msg, action, db);
          totalActions++;
        } catch (e) { console.warn('Quick step action hatası:', e.message); }
      }
      processed++;
    }
    db.recordQuickStepRun(quickStepId);
    db.save();

    return {
      ok: true,
      processed,
      totalActions,
      rendererAction,
      // Tek mesajda renderer aksiyonu için mesaj id'si
      primaryMessageId: ids[0]
    };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// =====================================================================
// v1.37 IPC: Gelişmiş Arama
// =====================================================================
ipcMain.handle('search:advanced', (_, opts) => {
  try {
    return db.searchMessages(opts || {});
  } catch (e) {
    console.warn('search:advanced error:', e.message);
    return [];
  }
});

ipcMain.handle('search:advancedCount', (_, opts) => {
  try {
    return db.searchMessagesCount(opts || {});
  } catch (e) {
    return 0;
  }
});

// =====================================================================
// v1.18 IPC: Görevler / To-Do
// =====================================================================
ipcMain.handle('tasks:list', (_, opts) => db.listTasks(opts || {}));
ipcMain.handle('tasks:get', (_, id) => db.getTask(id));
ipcMain.handle('tasks:add', (_, task) => {
  const id = db.addTask(task);
  db.save();
  return { ok: true, id };
});
ipcMain.handle('tasks:update', (_, id, updates) => {
  db.updateTask(id, updates);
  db.save();
  return { ok: true };
});
ipcMain.handle('tasks:complete', (_, id) => {
  db.completeTask(id);
  db.save();
  return { ok: true };
});
ipcMain.handle('tasks:uncomplete', (_, id) => {
  db.uncompleteTask(id);
  db.save();
  return { ok: true };
});
ipcMain.handle('tasks:delete', (_, id) => {
  db.deleteTask(id);
  db.save();
  return { ok: true };
});
ipcMain.handle('tasks:stats', () => db.taskStats());

// v1.18: Task reminder scheduler - mevcut scheduler loop'una eklenir
async function processDueTaskReminders() {
  try {
    const due = db.getDueTaskReminders();
    if (!due.length) return;
    for (const task of due) {
      try {
        const dueText = task.due_date
          ? ` (Bitiş: ${new Date(task.due_date).toLocaleString('tr-TR')})`
          : '';
        showNotification(
          '⏰ Görev Hatırlatması',
          `${task.title}${dueText}`
        );
        // Hatırlatıldı işaretle
        db.updateTask(task.id, { reminder_sent: 1 });
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('task:reminder', {
            id: task.id,
            title: task.title,
            due_date: task.due_date
          });
        }
      } catch (e) { console.warn('Task reminder hatası:', e.message); }
    }
    db.save();
  } catch (e) {
    console.warn('processDueTaskReminders error:', e.message);
  }
}

// =====================================================================
// IPC: Spam Kuralları
// =====================================================================
ipcMain.handle('spam:list', (_, accountId) => db.listSpamRules(accountId));
ipcMain.handle('spam:add', (_, rule) => ({ ok: true, id: db.addSpamRule(rule) }));
ipcMain.handle('spam:delete', (_, ruleId) => {
  db.deleteSpamRule(ruleId);
  return { ok: true };
});

// =====================================================================
// =====================================================================
// v1.7 IPC: (Filtre Kuralları kaldırıldı - v1.35 'rules:' namespace'i ile birleşti)
// =====================================================================

// =====================================================================
// v1.7 IPC: Çöp/Klasör Boşaltma + Önemli işaretleme
// =====================================================================
ipcMain.handle('folders:empty', (_, folderId) => {
  try {
    const count = db.emptyFolder(folderId);
    db.save();
    updateTray();
    return { ok: true, count };
  } catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('messages:markImportant', (_, messageId, isImportant) => {
  db.markMessageImportant(messageId, !!isImportant);
  return { ok: true };
});

// =====================================================================
// v1.8 IPC: Kategoriler
// =====================================================================
ipcMain.handle('categories:list', () => db.listCategories());
ipcMain.handle('categories:get', (_, id) => db.getCategory(id));
ipcMain.handle('categories:add', (_, cat) => ({ ok: true, id: db.addCategory(cat) }));
ipcMain.handle('categories:update', (_, id, updates) => {
  db.updateCategory(id, updates);
  return { ok: true };
});
ipcMain.handle('categories:delete', (_, id) => {
  db.deleteCategory(id);
  return { ok: true };
});

ipcMain.handle('messages:getCategories', (_, messageId) => db.getMessageCategories(messageId));
ipcMain.handle('messages:addCategory', (_, messageId, categoryId) => {
  db.addMessageCategory(messageId, categoryId);
  return { ok: true };
});
ipcMain.handle('messages:removeCategory', (_, messageId, categoryId) => {
  db.removeMessageCategory(messageId, categoryId);
  return { ok: true };
});
ipcMain.handle('messages:setCategories', (_, messageId, categoryIds) => {
  db.setMessageCategories(messageId, categoryIds);
  return { ok: true };
});

// =====================================================================
// v1.9 IPC: Konuşma görünümü (threading)
// =====================================================================
ipcMain.handle('messages:getThread', (_, threadId, accountId) => {
  return db.getThread(threadId, accountId);
});

ipcMain.handle('messages:backfillThreads', () => {
  try {
    const updated = db.backfillThreadIds();
    db.save();
    return { ok: true, updated };
  } catch (e) { return { ok: false, error: e.message }; }
});

// =====================================================================
// v1.10 IPC: Şablonlar
// =====================================================================
ipcMain.handle('templates:list', () => db.listTemplates());
ipcMain.handle('templates:get', (_, id) => db.getTemplate(id));
ipcMain.handle('templates:add', (_, t) => ({ ok: true, id: db.addTemplate(t) }));
ipcMain.handle('templates:update', (_, id, updates) => {
  db.updateTemplate(id, updates);
  return { ok: true };
});
ipcMain.handle('templates:delete', (_, id) => {
  db.deleteTemplate(id);
  return { ok: true };
});
ipcMain.handle('templates:incrementUse', (_, id) => {
  db.incrementTemplateUseCount(id);
  return { ok: true };
});

// =====================================================================
// v1.10 IPC: Zamanlanmış mesajlar
// =====================================================================
ipcMain.handle('scheduled:list', (_, status) => db.listScheduledMessages(status));
ipcMain.handle('scheduled:add', (_, msg) => {
  const id = db.addScheduledMessage(msg);
  db.save();
  // Yakın gelecekte (5 dk içinde) ise scheduler'ı hemen tetikle
  scheduleProcessSoon();
  return { ok: true, id };
});
ipcMain.handle('scheduled:cancel', (_, id) => {
  db.updateScheduledStatus(id, 'cancelled');
  db.save();
  return { ok: true };
});
ipcMain.handle('scheduled:delete', (_, id) => {
  db.deleteScheduledMessage(id);
  db.save();
  return { ok: true };
});

// Background scheduler - her 30 saniyede bir kontrol
// (scheduledTimer ve processingScheduled main.js başında tanımlı - TDZ engelleme)

function scheduleProcessSoon() {
  setTimeout(() => processDueScheduledMessages().catch(e => console.warn('Scheduler error:', e.message)), 1000);
}

async function processDueScheduledMessages() {
  if (processingScheduled || !db || !mailService) return;
  processingScheduled = true;
  try {
    const due = db.getDueScheduledMessages();
    for (const msg of due) {
      try {
        // Status'u sending yap (yarış koşulu engelleme)
        db.updateScheduledStatus(msg.id, 'sending');

        const attachments = msg.attachments ? JSON.parse(msg.attachments) : [];
        // Buffer'ları geri canlandır (toJSON ile string'e dönmüştü)
        const restoredAttachments = attachments.map(a => ({
          filename: a.filename,
          content: a.content && a.content.data ? Buffer.from(a.content.data) : (typeof a.content === 'string' ? Buffer.from(a.content, 'base64') : a.content),
          contentType: a.contentType
        }));

        await mailService.sendMail(msg.account_id, {
          to: msg.to_addrs,
          cc: msg.cc_addrs || undefined,
          bcc: msg.bcc_addrs || undefined,
          subject: msg.subject,
          html: msg.body_html,
          text: msg.body_text,
          attachments: restoredAttachments.length ? restoredAttachments : undefined
        });

        db.updateScheduledStatus(msg.id, 'sent');

        // Bildirim
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('scheduled:sent', { id: msg.id, subject: msg.subject, to: msg.to_addrs });
        }
        try {
          if (Notification.isSupported()) {
            new Notification({
              title: 'Zamanlanmış mesaj gönderildi',
              body: `"${(msg.subject || '(konusuz)').slice(0, 60)}" → ${msg.to_addrs}`,
              silent: false
            }).show();
          }
        } catch (_) {}
      } catch (e) {
        console.warn('Zamanlanmış mesaj gönderim hatası:', msg.id, e.message);
        db.updateScheduledStatus(msg.id, 'failed', e.message);
      }
    }
    if (due.length) db.save();
  } finally {
    processingScheduled = false;
  }
}

function startSchedulerLoop() {
  if (scheduledTimer) clearInterval(scheduledTimer);
  scheduledTimer = setInterval(() => {
    processDueScheduledMessages().catch(e => console.warn('Scheduler error:', e.message));
    processDueTaskReminders().catch(e => console.warn('Task reminder error:', e.message));
    processDueEventReminders().catch(e => console.warn('Event reminder error:', e.message));
    processAutoArchive().catch(e => console.warn('Auto-archive error:', e.message));
  }, 30 * 1000); // 30 saniye
}

// =====================================================================
// v1.11 IPC: Notlar
// =====================================================================
ipcMain.handle('notes:list', (_, opts) => db.listNotes(opts));
ipcMain.handle('notes:get', (_, id) => db.getNote(id));
ipcMain.handle('notes:add', (_, note) => {
  const id = db.addNote(note);
  db.save();
  return { ok: true, id };
});
ipcMain.handle('notes:update', (_, id, updates) => {
  db.updateNote(id, updates);
  db.save();
  return { ok: true };
});
ipcMain.handle('notes:delete', (_, id) => {
  db.deleteNote(id);
  db.save();
  return { ok: true };
});
ipcMain.handle('notes:listCategories', () => db.listNoteCategories());

// =====================================================================
// v1.12 IPC: Güvenlik (DKIM/SPF/DMARC + Trusted senders + Attachment scan)
// =====================================================================
const AttachmentSecurity = require('./services/attachment-security');

ipcMain.handle('security:analyzeAttachment', (_, filename, senderEmail) => {
  const trusted = senderEmail ? db.isTrustedSender(senderEmail) : false;
  return AttachmentSecurity.analyze(filename, trusted);
});

ipcMain.handle('security:isTrustedSender', (_, email) => db.isTrustedSender(email));
ipcMain.handle('security:listTrustedSenders', () => db.listTrustedSenders());
ipcMain.handle('security:addTrustedSender', (_, email, name) => {
  const ok = db.addTrustedSender(email, name);
  db.save();
  return { ok };
});
ipcMain.handle('security:removeTrustedSender', (_, email) => {
  db.removeTrustedSender(email);
  db.save();
  return { ok: true };
});

// =====================================================================
// v1.13 IPC: VirusTotal Entegrasyonu
// =====================================================================
const VirusTotalScanner = require('./services/virustotal');

ipcMain.handle('virustotal:scan', async (_, attachmentId) => {
  const apiKey = appConfig.get('virustotalApiKey');
  if (!apiKey || !apiKey.trim()) {
    return { ok: false, noKey: true, error: 'VirusTotal API anahtarı tanımlı değil. Ayarlar > Güvenlik bölümünden ekleyebilirsiniz.' };
  }

  const att = db.getAttachmentData(attachmentId);
  if (!att) return { ok: false, error: 'Ek bulunamadı' };

  let buf = att.data;
  if (!Buffer.isBuffer(buf)) {
    if (!buf) return { ok: false, error: 'Ek verisi yok' };
    buf = Buffer.from(buf);
  }

  const sha256 = VirusTotalScanner.computeHash(buf);

  // 24 saatlik cache
  const cached = db.getVtCache(sha256);
  if (cached) {
    const age = Date.now() - new Date(cached.scanned_at).getTime();
    if (age < 24 * 60 * 60 * 1000) {
      try {
        const cachedResult = JSON.parse(cached.result);
        return Object.assign(cachedResult, { fromCache: true, cachedAt: cached.scanned_at });
      } catch (_) {}
    }
  }

  const result = await VirusTotalScanner.scanByHash(sha256, apiKey.trim());
  result.sha256 = sha256;
  result.filename = att.filename;

  // Cache (sadece başarılı veya 404=found:false sonuçlar)
  if (result.ok && !result.rateLimited && !result.invalidKey) {
    try {
      db.setVtCache(sha256, result);
      db.save();
    } catch (_) {}
  }

  return result;
});

ipcMain.handle('virustotal:testKey', async (_, apiKey) => {
  return await VirusTotalScanner.testApiKey(apiKey);
});

ipcMain.handle('virustotal:clearCache', () => {
  try {
    db.prepare('DELETE FROM vt_scan_cache').run();
    db.save();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// v1.12: Attachment Save / Open
ipcMain.handle('attachments:save', async (_, attachmentId) => {
  const att = db.getAttachmentData(attachmentId);
  if (!att) return { ok: false, error: 'Ek bulunamadı' };

  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Eki Kaydet',
    defaultPath: att.filename || 'ek',
    buttonLabel: 'Kaydet'
  });
  if (result.canceled || !result.filePath) return { canceled: true };

  try {
    const fs = require('fs');
    let buf = att.data;
    if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf);
    fs.writeFileSync(result.filePath, buf);
    return { ok: true, path: result.filePath };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('attachments:open', async (_, attachmentId) => {
  // Geçici dizine yazıp Windows shell ile aç (kullanıcı varsayılan uygulama ile açar)
  const att = db.getAttachmentData(attachmentId);
  if (!att) return { ok: false, error: 'Ek bulunamadı' };

  try {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const tmpDir = path.join(os.tmpdir(), 'codega-mail-attachments');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    // Güvenlik: ASCII filename - Türkçe karakterler tehlikeli olmasın
    const safeName = (att.filename || 'ek').replace(/[^\w.\-]/g, '_');
    const filePath = path.join(tmpDir, `${attachmentId}_${safeName}`);
    let buf = att.data;
    if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf);
    fs.writeFileSync(filePath, buf);
    const { shell } = require('electron');
    await shell.openPath(filePath);
    return { ok: true, path: filePath };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// =====================================================================
// IPC: Senkronizasyon
// =====================================================================
ipcMain.handle('sync:account', async (_, accountId) => {
  const sender = (event, data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('sync:progress', { accountId, ...data });
    }
  };
  try {
    const result = await mailService.syncAccount(accountId, sender);
    db.save();
    updateTray();
    return { ok: true, ...result };
  } catch (err) {
    logError('sync:account', err);
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('sync:all', async () => {
  const accounts = db.listAccounts();
  const results = [];

  // v1.17: Genel başlangıç event'i
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('sync:overall', {
      stage: 'start',
      total: accounts.length,
      accounts: accounts.map(a => ({ id: a.id, displayName: a.display_name, email: a.email }))
    });
  }

  for (const acc of accounts) {
    // v1.17: Hesap başlangıç event'i
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('sync:overall', {
        stage: 'account-start',
        accountId: acc.id,
        displayName: acc.display_name,
        email: acc.email
      });
    }

    try {
      const r = await mailService.syncAccount(acc.id, (data) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('sync:progress', { accountId: acc.id, ...data });
        }
      });
      results.push({ accountId: acc.id, ok: true, ...r });

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('sync:overall', {
          stage: 'account-done',
          accountId: acc.id,
          ok: true,
          newMessages: r.newMessages || 0,
          spamMessages: r.spamMessages || 0
        });
      }
    } catch (err) {
      logError('sync:' + acc.id, err);
      results.push({ accountId: acc.id, ok: false, error: err.message });

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('sync:overall', {
          stage: 'account-done',
          accountId: acc.id,
          ok: false,
          error: err.message
        });
      }
    }
  }

  // v1.17: Genel bitiş event'i
  if (mainWindow && !mainWindow.isDestroyed()) {
    const totalNew = results.reduce((s, r) => s + (r.newMessages || 0), 0);
    const totalSpam = results.reduce((s, r) => s + (r.spamMessages || 0), 0);
    const errors = results.filter(r => !r.ok).length;
    mainWindow.webContents.send('sync:overall', {
      stage: 'all-done',
      totalNew, totalSpam, errors,
      total: accounts.length
    });
  }

  db.save();
  updateTray();
  return results;
});

// =====================================================================
// IPC: Mail Gönderme
// =====================================================================
ipcMain.handle('mail:send', async (_, accountId, mailData) => {
  // Eklerin Buffer'a dönüştürülmesi (IPC üzerinden array gelir)
  if (mailData && Array.isArray(mailData.attachments)) {
    mailData.attachments = mailData.attachments.map(a => ({
      filename: a.filename,
      content: Buffer.from(a.content || []),
      contentType: a.contentType || 'application/octet-stream'
    }));
  }
  const result = await mailService.sendMail(accountId, mailData);

  // v1.16: Gönderilen alıcıları contact olarak kaydet
  try {
    if (result && (result.ok || result.success !== false)) {
      const recips = [
        ...(mailData.to || []),
        ...(mailData.cc || []),
        ...(mailData.bcc || [])
      ];
      for (const r of recips) {
        // r "Name <email>" veya "email" formatında olabilir
        const m = String(r || '').match(/^\s*(.*?)\s*<([^>]+)>\s*$/) ||
                  String(r || '').match(/^\s*([^\s,]+@[^\s,]+)\s*$/);
        if (!m) continue;
        const email = (m[2] || m[1] || '').trim();
        const name = m[2] ? (m[1] || '').trim() : '';
        if (email && email.includes('@')) {
          db.recordContactUsage(email, name, 'auto');
        }
      }
      db.save();
    }
  } catch (e) { console.warn('Contact kayıt hatası:', e.message); }

  return result;
});

// =====================================================================
// IPC: Yedekleme
// =====================================================================
ipcMain.handle('backup:export', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Mail Yedeği Kaydet',
    defaultPath: `codega-mail-yedek-${new Date().toISOString().slice(0, 10)}.mailbackup`,
    filters: [{ name: 'CODEGA Mail Yedeği', extensions: ['mailbackup'] }]
  });
  if (result.canceled) return { canceled: true };
  try {
    db.save();
    await backupService.exportTo(result.filePath);
    return { ok: true, path: result.filePath };
  } catch (err) { return { ok: false, error: err.message }; }
});

ipcMain.handle('backup:import', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Yedekten Geri Yükle',
    filters: [{ name: 'CODEGA Mail Yedeği', extensions: ['mailbackup'] }],
    properties: ['openFile']
  });
  if (result.canceled || !result.filePaths.length) return { canceled: true };

  const confirm = await dialog.showMessageBox(mainWindow, {
    type: 'warning', buttons: ['İptal', 'Devam Et'],
    defaultId: 0, cancelId: 0,
    title: 'Yedekten Geri Yükleme',
    message: 'Mevcut tüm verileriniz silinip yedek dosyasındaki veriler yüklenecek. Devam edilsin mi?'
  });
  if (confirm.response !== 1) return { canceled: true };

  try {
    db.close();
    await backupService.importFrom(result.filePaths[0]);
    await initializeDatabase();
    updateTray();
    return { ok: true, requiresRestart: true };
  } catch (err) { return { ok: false, error: err.message }; }
});

// =====================================================================
// IPC: Yardımcılar
// =====================================================================
ipcMain.handle('app:openExternal', (_, url) => shell.openExternal(url));
ipcMain.handle('app:dataPath', () => appConfig.getDataPath());
ipcMain.handle('app:openDataFolder', () => shell.openPath(appConfig.getDataPath()));
ipcMain.handle('app:openLogFolder', () => shell.openPath(app.getPath('userData')));
ipcMain.handle('app:quit', () => { isQuitting = true; app.quit(); });

// =====================================================================
// Otomatik Güncelleme (electron-updater)
// =====================================================================
function broadcastUpdateState() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-status', updateState);
  }
  // Tepsi menüsünü güncelle
  if (tray && updateState.stage === 'available') {
    rebuildTrayMenuWithUpdate();
  }
}

function rebuildTrayMenuWithUpdate() {
  if (!tray || !db) return;
  let unread = 0;
  try {
    const row = db.prepare(`
      SELECT COUNT(*) AS c FROM messages m
      JOIN folders f ON m.folder_id = f.id
      WHERE m.is_read = 0 AND m.is_spam = 0
        AND (f.special_use = '\\Inbox' OR f.special_use IS NULL OR f.special_use = '')
    `).get();
    unread = (row && row.c) || 0;
  } catch (_) {}

  const items = [
    { label: '✉ CODEGA Mail', enabled: false },
    { label: unread > 0 ? `📬 ${unread} okunmamış mesaj` : '✓ Tüm mesajlar okundu', enabled: false }
  ];
  if (updateState.stage === 'available' || updateState.stage === 'downloaded') {
    items.push({ type: 'separator' });
    if (updateState.stage === 'downloaded') {
      items.push({ label: `🎉 v${updateState.version} hazır - Yeniden başlat`, click: () => {
        autoUpdater.quitAndInstall();
      }});
    } else {
      items.push({ label: `⬇ v${updateState.version} mevcut - Pencereyi aç`, click: showWindow });
    }
  }
  items.push({ type: 'separator' });
  items.push({ label: 'Pencereyi Göster', click: showWindow });
  items.push({ label: '↻ Tümünü Senkronize Et', click: () => runBackgroundSync(true) });
  items.push({ label: '✎ Yeni Mesaj', click: () => {
    showWindow();
    if (mainWindow) mainWindow.webContents.send('open-compose');
  }});
  items.push({ label: '⚙ Ayarlar', click: () => {
    showWindow();
    if (mainWindow) mainWindow.webContents.send('open-settings');
  }});
  items.push({ type: 'separator' });
  items.push({ label: '🚪 Çıkış', click: () => { isQuitting = true; app.quit(); }});

  tray.setContextMenu(Menu.buildFromTemplate(items));
  tray.setToolTip(`CODEGA Mail${unread > 0 ? ' · ' + unread + ' okunmamış' : ''}${updateState.stage === 'available' ? ' · Güncelleme mevcut' : ''}`);
}

function setupAutoUpdater() {
  autoUpdater.on('checking-for-update', () => {
    updateState = { ...updateState, stage: 'checking', error: null };
    broadcastUpdateState();
  });

  autoUpdater.on('update-available', (info) => {
    updateState = {
      stage: 'available',
      version: info.version,
      percent: 0,
      error: null,
      releaseNotes: typeof info.releaseNotes === 'string'
        ? info.releaseNotes
        : (Array.isArray(info.releaseNotes) ? info.releaseNotes.map(n => n.note || '').join('\n') : '')
    };
    broadcastUpdateState();
    // Bildirim göster
    showNotification(
      `🚀 Yeni sürüm mevcut: v${info.version}`,
      'CODEGA Mail için güncelleme hazır. Ayarlardan indirebilirsiniz.',
      null
    );
  });

  autoUpdater.on('update-not-available', (info) => {
    updateState = { stage: 'not-available', version: info.version, percent: 0, error: null, releaseNotes: null };
    broadcastUpdateState();
  });

  autoUpdater.on('error', (err) => {
    updateState = { ...updateState, stage: 'error', error: err.message };
    broadcastUpdateState();
    log.error('AutoUpdater error:', err);
  });

  autoUpdater.on('download-progress', (progress) => {
    updateState = { ...updateState, stage: 'downloading', percent: Math.round(progress.percent || 0) };
    broadcastUpdateState();
  });

  autoUpdater.on('update-downloaded', (info) => {
    updateState = { stage: 'downloaded', version: info.version, percent: 100, error: null, releaseNotes: null };
    broadcastUpdateState();
    showNotification(
      `✓ v${info.version} indirildi`,
      'Uygulamayı yeniden başlattığınızda yeni sürüm aktif olacak.',
      null
    );
  });
}

// İlk açılışta otomatik kontrol (config'e göre)
function scheduleAutoUpdateCheck() {
  if (!app.isPackaged) {
    log.info('Dev mode - auto-update check atlandı');
    return;
  }
  if (appConfig.get('autoUpdateCheck') === false) {
    log.info('Auto-update kullanıcı tarafından kapatılmış');
    return;
  }
  // 5 sn bekle - app yüklensin önce
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(e => log.warn('Update check error:', e.message));
  }, 5000);
  // Sonra her 4 saatte bir kontrol et
  setInterval(() => {
    if (appConfig.get('autoUpdateCheck') !== false) {
      autoUpdater.checkForUpdates().catch(e => log.warn('Update periodic check error:', e.message));
    }
  }, 4 * 60 * 60 * 1000);
}

ipcMain.handle('updater:status', () => updateState);

ipcMain.handle('updater:check', async () => {
  if (!app.isPackaged) {
    return { ok: false, error: 'Geliştirme modunda güncelleme kontrolü yapılamaz. Build edilmiş sürümde çalışır.' };
  }
  try {
    const r = await autoUpdater.checkForUpdates();
    return { ok: true, version: r?.updateInfo?.version };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('updater:download', async () => {
  try {
    await autoUpdater.downloadUpdate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('updater:install', () => {
  isQuitting = true;
  autoUpdater.quitAndInstall();
});

ipcMain.handle('updater:appVersion', () => app.getVersion());
