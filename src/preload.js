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
    backfillThreads: () => ipcRenderer.invoke('messages:backfillThreads'),
    openInWindow: (id) => ipcRenderer.invoke('messages:openInWindow', id),
    requestComposeAction: (action, data) => ipcRenderer.invoke('messages:requestComposeAction', { action, data })
  },
  invokeOpenCompose: (params) => ipcRenderer.invoke('messages:requestComposeAction', { action: 'compose', data: params }),
  categories: {
    list: () => ipcRenderer.invoke('categories:list'),
    listMessages: (catId, opts) => ipcRenderer.invoke('categories:listMessages', catId, opts),
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
  virustotal: {
    scan: (attachmentId) => ipcRenderer.invoke('virustotal:scan', attachmentId),
    testKey: (apiKey) => ipcRenderer.invoke('virustotal:testKey', apiKey),
    clearCache: () => ipcRenderer.invoke('virustotal:clearCache')
  },
  bayes: {
    stats: () => ipcRenderer.invoke('bayes:stats'),
    reset: () => ipcRenderer.invoke('bayes:reset'),
    predictMessage: (messageId) => ipcRenderer.invoke('bayes:predictMessage', messageId)
  },
  url: {
    analyze: (u) => ipcRenderer.invoke('url:analyze', u),
    openExternal: (u) => ipcRenderer.invoke('url:openExternal', u),
    clearCache: () => ipcRenderer.invoke('url:clearCache')
  },
  contacts: {
    list: (opts) => ipcRenderer.invoke('contacts:list', opts),
    get: (id) => ipcRenderer.invoke('contacts:get', id),
    search: (q, limit) => ipcRenderer.invoke('contacts:search', q, limit),
    add: (c) => ipcRenderer.invoke('contacts:add', c),
    update: (id, u) => ipcRenderer.invoke('contacts:update', id, u),
    delete: (id) => ipcRenderer.invoke('contacts:delete', id),
    stats: () => ipcRenderer.invoke('contacts:stats'),
    export: (format) => ipcRenderer.invoke('contacts:export', format),
    import: () => ipcRenderer.invoke('contacts:import')
  },
  groups: {
    list: () => ipcRenderer.invoke('groups:list'),
    get: (id) => ipcRenderer.invoke('groups:get', id),
    members: (id) => ipcRenderer.invoke('groups:members', id),
    emails: (id) => ipcRenderer.invoke('groups:emails', id),
    add: (g) => ipcRenderer.invoke('groups:add', g),
    update: (id, u) => ipcRenderer.invoke('groups:update', id, u),
    delete: (id) => ipcRenderer.invoke('groups:delete', id),
    addMember: (gid, cid) => ipcRenderer.invoke('groups:addMember', gid, cid),
    addMembers: (gid, cids) => ipcRenderer.invoke('groups:addMembers', gid, cids),
    removeMember: (gid, cid) => ipcRenderer.invoke('groups:removeMember', gid, cid),
    contactGroups: (cid) => ipcRenderer.invoke('groups:contactGroups', cid)
  },
  rules: {
    list: (opts) => ipcRenderer.invoke('rules:list', opts),
    get: (id) => ipcRenderer.invoke('rules:get', id),
    add: (rule) => ipcRenderer.invoke('rules:add', rule),
    update: (id, updates) => ipcRenderer.invoke('rules:update', id, updates),
    delete: (id) => ipcRenderer.invoke('rules:delete', id),
    toggle: (id, enabled) => ipcRenderer.invoke('rules:toggle', id, enabled),
    applyToAll: (opts) => ipcRenderer.invoke('rules:applyToAll', opts),
    applyToMessage: (id) => ipcRenderer.invoke('rules:applyToMessage', id)
  },
  quickSteps: {
    list: (opts) => ipcRenderer.invoke('quickSteps:list', opts),
    get: (id) => ipcRenderer.invoke('quickSteps:get', id),
    add: (qs) => ipcRenderer.invoke('quickSteps:add', qs),
    update: (id, updates) => ipcRenderer.invoke('quickSteps:update', id, updates),
    delete: (id) => ipcRenderer.invoke('quickSteps:delete', id),
    execute: (id, messageIds) => ipcRenderer.invoke('quickSteps:execute', id, messageIds)
  },
  search: {
    advanced: (opts) => ipcRenderer.invoke('search:advanced', opts),
    count: (opts) => ipcRenderer.invoke('search:advancedCount', opts)
  },
  stats: {
    overview: () => ipcRenderer.invoke('stats:overview'),
    dailyCounts: (days) => ipcRenderer.invoke('stats:dailyCounts', days),
    hourlyDistribution: () => ipcRenderer.invoke('stats:hourlyDistribution'),
    topSenders: (limit) => ipcRenderer.invoke('stats:topSenders', limit),
    categoryDistribution: () => ipcRenderer.invoke('stats:categoryDistribution'),
    accountDistribution: () => ipcRenderer.invoke('stats:accountDistribution')
  },
  readReceipt: {
    send: (messageId) => ipcRenderer.invoke('readReceipt:send', messageId),
    ignore: (senderEmail) => ipcRenderer.invoke('readReceipt:ignore', senderEmail),
    markResponded: (messageId) => ipcRenderer.invoke('readReceipt:markResponded', messageId)
  },
  oauth2: {
    isConfigured: (provider) => ipcRenderer.invoke('oauth2:isConfigured', provider),
    startFlow: (provider) => ipcRenderer.invoke('oauth2:startFlow', provider),
    refresh: (accountId) => ipcRenderer.invoke('oauth2:refresh', accountId),
    saveClientId: (provider, clientId) => ipcRenderer.invoke('oauth2:saveClientId', provider, clientId),
    getClientIds: () => ipcRenderer.invoke('oauth2:getClientIds')
  },
  readReceipt: {
    send: (messageId) => ipcRenderer.invoke('readReceipt:send', messageId),
    dismiss: (messageId) => ipcRenderer.invoke('readReceipt:dismiss', messageId),
    ignoreSender: (email) => ipcRenderer.invoke('readReceipt:ignoreSender', email),
    getPolicy: () => ipcRenderer.invoke('readReceipt:getPolicy'),
    setPolicy: (policy) => ipcRenderer.invoke('readReceipt:setPolicy', policy),
    setRequestDefault: (val) => ipcRenderer.invoke('readReceipt:setRequestDefault', val),
    removeIgnored: (email) => ipcRenderer.invoke('readReceipt:removeIgnored', email)
  },
  autoconfig: {
    detect: (email) => ipcRenderer.invoke('autoconfig:detect', email)
  },
  spell: {
    getInfo: () => ipcRenderer.invoke('spell:getInfo'),
    setLanguages: (langs) => ipcRenderer.invoke('spell:setLanguages', langs),
    setEnabled: (enabled) => ipcRenderer.invoke('spell:setEnabled', enabled),
    removeWord: (word) => ipcRenderer.invoke('spell:removeWord', word)
  },
  security: {
    status: () => ipcRenderer.invoke('security:status'),
    setMasterPassword: (params) => ipcRenderer.invoke('security:setMasterPassword', params),
    removeMasterPassword: (pw) => ipcRenderer.invoke('security:removeMasterPassword', pw),
    verifyMasterPassword: (params) => ipcRenderer.invoke('security:verifyMasterPassword', params),
    start2FASetup: (params) => ipcRenderer.invoke('security:start2FASetup', params),
    confirm2FASetup: (params) => ipcRenderer.invoke('security:confirm2FASetup', params),
    disable2FA: (pw) => ipcRenderer.invoke('security:disable2FA', pw),
    regenerateRecoveryCodes: (pw) => ipcRenderer.invoke('security:regenerateRecoveryCodes', pw),
    lockApp: () => ipcRenderer.invoke('security:lockApp')
  },
  archive: {
    stats: () => ipcRenderer.invoke('archive:stats'),
    archive: (id) => ipcRenderer.invoke('archive:message', id),
    unarchive: (id) => ipcRenderer.invoke('archive:unarchive', id),
    archiveOld: (opts) => ipcRenderer.invoke('archive:archiveOld', opts),
    list: (opts) => ipcRenderer.invoke('archive:list', opts),
    purge: (opts) => ipcRenderer.invoke('archive:purge', opts)
  },
  pgp: {
    listKeys: () => ipcRenderer.invoke('pgp:listKeys'),
    listContacts: () => ipcRenderer.invoke('pgp:listContacts'),
    generateKey: (params) => ipcRenderer.invoke('pgp:generateKey', params),
    setDefault: (id) => ipcRenderer.invoke('pgp:setDefault', id),
    deleteKey: (id) => ipcRenderer.invoke('pgp:deleteKey', id),
    exportPublicKey: (id) => ipcRenderer.invoke('pgp:exportPublicKey', id),
    importContact: (params) => ipcRenderer.invoke('pgp:importContact', params),
    deleteContact: (id) => ipcRenderer.invoke('pgp:deleteContact', id),
    setContactTrust: (params) => ipcRenderer.invoke('pgp:setContactTrust', params),
    hasContact: (email) => ipcRenderer.invoke('pgp:hasContact', email),
    encrypt: (params) => ipcRenderer.invoke('pgp:encrypt', params),
    decrypt: (params) => ipcRenderer.invoke('pgp:decrypt', params),
    detectInBody: (text) => ipcRenderer.invoke('pgp:detectInBody', text)
  },
  events: {
    list: (opts) => ipcRenderer.invoke('events:list', opts),
    get: (id) => ipcRenderer.invoke('events:get', id),
    stats: () => ipcRenderer.invoke('events:stats'),
    add: (event) => ipcRenderer.invoke('events:add', event),
    update: (id, updates) => ipcRenderer.invoke('events:update', id, updates),
    delete: (id) => ipcRenderer.invoke('events:delete', id),
    parseICal: (text) => ipcRenderer.invoke('events:parseICalText', text),
    guessFromText: (text) => ipcRenderer.invoke('events:guessFromText', text),
    exportIcs: (id) => ipcRenderer.invoke('events:exportIcs', id)
  },
  autoCategorize: {
    seedBuiltin: () => ipcRenderer.invoke('autocategorize:seedBuiltin'),
    single: (messageId) => ipcRenderer.invoke('autocategorize:single', messageId),
    all: (opts) => ipcRenderer.invoke('autocategorize:all', opts)
  },
  branding: {
    uploadLogo: () => ipcRenderer.invoke('branding:uploadLogo'),
    removeLogo: () => ipcRenderer.invoke('branding:removeLogo'),
    uploadBgImage: () => ipcRenderer.invoke('branding:uploadBgImage'),
    removeBgImage: () => ipcRenderer.invoke('branding:removeBgImage')
  },
  tasks: {
    list: (opts) => ipcRenderer.invoke('tasks:list', opts),
    get: (id) => ipcRenderer.invoke('tasks:get', id),
    add: (task) => ipcRenderer.invoke('tasks:add', task),
    update: (id, u) => ipcRenderer.invoke('tasks:update', id, u),
    complete: (id) => ipcRenderer.invoke('tasks:complete', id),
    uncomplete: (id) => ipcRenderer.invoke('tasks:uncomplete', id),
    delete: (id) => ipcRenderer.invoke('tasks:delete', id),
    stats: () => ipcRenderer.invoke('tasks:stats')
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
    const allowed = ['open-compose', 'open-message', 'open-settings', 'background-sync-done', 'update-status', 'inapp-notification', 'sync:progress', 'sync:overall', 'task:reminder', 'security:locked', 'archive:auto-done', 'event:reminder', 'compose-action-from-popup'];
    if (!allowed.includes(channel)) return () => {};
    const listener = (_, data) => cb(data);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  }
});
