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
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'ui', 'index.html'));
  mainWindow.setMenuBarVisibility(false);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('render-process-gone', (_, details) => {
    logError('render-process-gone', new Error(JSON.stringify(details)));
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
  if (!Notification.isSupported()) return;
  if (appConfig.get('notificationsEnabled') === false) return;

  const iconPath = getIconPath();
  const n = new Notification({
    title,
    body,
    icon: iconPath || undefined,
    silent: !!silent
  });

  n.on('click', () => {
    showWindow();
    if (messageId && mainWindow) {
      mainWindow.webContents.send('open-message', messageId);
    }
  });

  n.show();
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
  autoUpdateCheck: appConfig.get('autoUpdateCheck') !== false
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
  showNotification('🔔 Test Bildirimi', 'CODEGA Mail bildirimleri çalışıyor.');
  return { ok: true };
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
  const r = await mailService.markAsSpam(messageId);
  updateTray();
  return r;
});

ipcMain.handle('messages:markNotSpam', async (_, messageId) => {
  const r = await mailService.markAsNotSpam(messageId);
  updateTray();
  return r;
});

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
// v1.7 IPC: Filtre Kuralları (Rules)
// =====================================================================
ipcMain.handle('rules:list', (_, accountId) => db.listRules(accountId));
ipcMain.handle('rules:get', (_, id) => db.getRule(id));
ipcMain.handle('rules:add', (_, rule) => ({ ok: true, id: db.addRule(rule) }));
ipcMain.handle('rules:update', (_, id, updates) => {
  db.updateRule(id, updates);
  return { ok: true };
});
ipcMain.handle('rules:delete', (_, id) => {
  db.deleteRule(id);
  return { ok: true };
});
ipcMain.handle('rules:applyNow', async (_, ruleId, accountId) => {
  // Kuralı tüm mevcut mesajlara uygula (sadece bu hesap)
  try {
    const applied = mailService._applyRulesToNewMessages(accountId, 0);
    db.save();
    return { ok: true, applied };
  } catch (e) { return { ok: false, error: e.message }; }
});

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
let scheduledTimer = null;
let processingScheduled = false;

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
  }, 30 * 1000); // 30 saniye
}

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
  for (const acc of accounts) {
    try {
      const r = await mailService.syncAccount(acc.id, (event, data) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('sync:progress', { accountId: acc.id, ...data });
        }
      });
      results.push({ accountId: acc.id, ok: true, ...r });
    } catch (err) {
      logError('sync:' + acc.id, err);
      results.push({ accountId: acc.id, ok: false, error: err.message });
    }
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
  return await mailService.sendMail(accountId, mailData);
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
