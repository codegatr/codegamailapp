const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  config: {
    get: () => ipcRenderer.invoke('config:get'),
    setFirstRunDone: () => ipcRenderer.invoke('config:setFirstRunDone'),
    chooseDataPath: () => ipcRenderer.invoke('config:chooseDataPath'),
    setDataPath: (path) => ipcRenderer.invoke('config:setDataPath', path),
    updatePrefs: (prefs) => ipcRenderer.invoke('config:updatePrefs', prefs),
    testNotification: () => ipcRenderer.invoke('config:testNotification')
  },
  accounts: {
    list: () => ipcRenderer.invoke('accounts:list'),
    get: (id) => ipcRenderer.invoke('accounts:get', id),
    add: (data) => ipcRenderer.invoke('accounts:add', data),
    test: (data) => ipcRenderer.invoke('accounts:test', data),
    update: (id, data) => ipcRenderer.invoke('accounts:update', id, data),
    delete: (id) => ipcRenderer.invoke('accounts:delete', id),
    reorder: (ids) => ipcRenderer.invoke('accounts:reorder', ids)
  },
  folders: {
    list: (accountId) => ipcRenderer.invoke('folders:list', accountId),
    create: (accountId, name, onServer) => ipcRenderer.invoke('folders:create', accountId, name, onServer),
    rename: (id, name) => ipcRenderer.invoke('folders:rename', id, name),
    delete: (id) => ipcRenderer.invoke('folders:delete', id),
    empty: (id) => ipcRenderer.invoke('folders:empty', id)
  },
  messages: {
    list: (folderId, opts) => ipcRenderer.invoke('messages:list', folderId, opts),
    listUnified: (opts) => ipcRenderer.invoke('messages:listUnified', opts),
    get: (id) => ipcRenderer.invoke('messages:get', id),
    markRead: (id, isRead) => ipcRenderer.invoke('messages:markRead', id, isRead),
    markImportant: (id, isImportant) => ipcRenderer.invoke('messages:markImportant', id, isImportant),
    delete: (id) => ipcRenderer.invoke('messages:delete', id),
    move: (id, folderId) => ipcRenderer.invoke('messages:move', id, folderId),
    markSpam: (id) => ipcRenderer.invoke('messages:markSpam', id),
    markNotSpam: (id) => ipcRenderer.invoke('messages:markNotSpam', id),
    getCategories: (id) => ipcRenderer.invoke('messages:getCategories', id),
    addCategory: (id, catId) => ipcRenderer.invoke('messages:addCategory', id, catId),
    removeCategory: (id, catId) => ipcRenderer.invoke('messages:removeCategory', id, catId),
    setCategories: (id, catIds) => ipcRenderer.invoke('messages:setCategories', id, catIds),
    getThread: (threadId, accountId) => ipcRenderer.invoke('messages:getThread', threadId, accountId),
    backfillThreads: () => ipcRenderer.invoke('messages:backfillThreads')
  },
  categories: {
    list: () => ipcRenderer.invoke('categories:list'),
    get: (id) => ipcRenderer.invoke('categories:get', id),
    add: (cat) => ipcRenderer.invoke('categories:add', cat),
    update: (id, updates) => ipcRenderer.invoke('categories:update', id, updates),
    delete: (id) => ipcRenderer.invoke('categories:delete', id)
  },
  templates: {
    list: () => ipcRenderer.invoke('templates:list'),
    get: (id) => ipcRenderer.invoke('templates:get', id),
    add: (t) => ipcRenderer.invoke('templates:add', t),
    update: (id, updates) => ipcRenderer.invoke('templates:update', id, updates),
    delete: (id) => ipcRenderer.invoke('templates:delete', id),
    incrementUse: (id) => ipcRenderer.invoke('templates:incrementUse', id)
  },
  scheduled: {
    list: (status) => ipcRenderer.invoke('scheduled:list', status),
    add: (msg) => ipcRenderer.invoke('scheduled:add', msg),
    cancel: (id) => ipcRenderer.invoke('scheduled:cancel', id),
    delete: (id) => ipcRenderer.invoke('scheduled:delete', id),
    onSent: (cb) => ipcRenderer.on('scheduled:sent', (_, data) => cb(data))
  },
  notes: {
    list: (opts) => ipcRenderer.invoke('notes:list', opts),
    get: (id) => ipcRenderer.invoke('notes:get', id),
    add: (note) => ipcRenderer.invoke('notes:add', note),
    update: (id, updates) => ipcRenderer.invoke('notes:update', id, updates),
    delete: (id) => ipcRenderer.invoke('notes:delete', id),
    listCategories: () => ipcRenderer.invoke('notes:listCategories')
  },
  security: {
    analyzeAttachment: (filename, senderEmail) => ipcRenderer.invoke('security:analyzeAttachment', filename, senderEmail),
    isTrustedSender: (email) => ipcRenderer.invoke('security:isTrustedSender', email),
    listTrustedSenders: () => ipcRenderer.invoke('security:listTrustedSenders'),
    addTrustedSender: (email, name) => ipcRenderer.invoke('security:addTrustedSender', email, name),
    removeTrustedSender: (email) => ipcRenderer.invoke('security:removeTrustedSender', email)
  },
  attachments: {
    save: (id) => ipcRenderer.invoke('attachments:save', id),
    open: (id) => ipcRenderer.invoke('attachments:open', id)
  },
  spam: {
    list: (accountId) => ipcRenderer.invoke('spam:list', accountId),
    add: (rule) => ipcRenderer.invoke('spam:add', rule),
    delete: (id) => ipcRenderer.invoke('spam:delete', id)
  },
  rules: {
    list: (accountId) => ipcRenderer.invoke('rules:list', accountId),
    get: (id) => ipcRenderer.invoke('rules:get', id),
    add: (rule) => ipcRenderer.invoke('rules:add', rule),
    update: (id, updates) => ipcRenderer.invoke('rules:update', id, updates),
    delete: (id) => ipcRenderer.invoke('rules:delete', id),
    applyNow: (ruleId, accountId) => ipcRenderer.invoke('rules:applyNow', ruleId, accountId)
  },
  sync: {
    account: (id) => ipcRenderer.invoke('sync:account', id),
    all: () => ipcRenderer.invoke('sync:all'),
    onProgress: (cb) => {
      const listener = (_, data) => cb(data);
      ipcRenderer.on('sync:progress', listener);
      return () => ipcRenderer.removeListener('sync:progress', listener);
    }
  },
  mail: {
    send: (accountId, data) => ipcRenderer.invoke('mail:send', accountId, data)
  },
  backup: {
    export: () => ipcRenderer.invoke('backup:export'),
    import: () => ipcRenderer.invoke('backup:import')
  },
  app: {
    openExternal: (url) => ipcRenderer.invoke('app:openExternal', url),
    dataPath: () => ipcRenderer.invoke('app:dataPath'),
    openDataFolder: () => ipcRenderer.invoke('app:openDataFolder'),
    quit: () => ipcRenderer.invoke('app:quit')
  },
  updater: {
    status: () => ipcRenderer.invoke('updater:status'),
    check: () => ipcRenderer.invoke('updater:check'),
    download: () => ipcRenderer.invoke('updater:download'),
    install: () => ipcRenderer.invoke('updater:install'),
    appVersion: () => ipcRenderer.invoke('updater:appVersion')
  },
  // Tepsiden ve updater'dan gelen olaylara abone olma
  on: (channel, cb) => {
    const allowed = ['open-compose', 'open-message', 'open-settings', 'background-sync-done', 'update-status', 'inapp-notification'];
    if (!allowed.includes(channel)) return () => {};
    const listener = (_, data) => cb(data);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  }
});
