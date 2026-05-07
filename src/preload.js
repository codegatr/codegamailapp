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
    delete: (id) => ipcRenderer.invoke('folders:delete', id)
  },
  messages: {
    list: (folderId, opts) => ipcRenderer.invoke('messages:list', folderId, opts),
    get: (id) => ipcRenderer.invoke('messages:get', id),
    markRead: (id, isRead) => ipcRenderer.invoke('messages:markRead', id, isRead),
    delete: (id) => ipcRenderer.invoke('messages:delete', id),
    move: (id, folderId) => ipcRenderer.invoke('messages:move', id, folderId),
    markSpam: (id) => ipcRenderer.invoke('messages:markSpam', id),
    markNotSpam: (id) => ipcRenderer.invoke('messages:markNotSpam', id)
  },
  spam: {
    list: (accountId) => ipcRenderer.invoke('spam:list', accountId),
    add: (rule) => ipcRenderer.invoke('spam:add', rule),
    delete: (id) => ipcRenderer.invoke('spam:delete', id)
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
  // Tepsiden gelen olaylara abone olma
  on: (channel, cb) => {
    const allowed = ['open-compose', 'open-message', 'open-settings', 'background-sync-done'];
    if (!allowed.includes(channel)) return () => {};
    const listener = (_, data) => cb(data);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  }
});
