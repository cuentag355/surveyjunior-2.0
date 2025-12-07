const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  windowControl: (action) => ipcRenderer.send('window-control', action),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  send: (channel, data) => {
    const validChannels = [
        'launch-profile', 'login-success', 'open-survey-tab', 
        'save-profiles', 'start-cookie-farming', 
        'open-ipqs-view', 'close-ipqs-view', 'set-proxy-and-launch',
        'open-external'
    ];
    if (validChannels.includes(channel)) ipcRenderer.send(channel, data);
  },
  
  on: (channel, func) => {
    const validChannels = [
        'profile-ready-to-launch', 'open-new-tab', 'update-available', 
        'download-progress', 'launch-error', 'farm-log', 'farm-error', 
        'detected-tunnel-link', 'network-sniff-data', 'set-profile-data', 
        'update-bookmarks', 'update-ip-info', 'update-stealth-geo', 
        'tabs-update', 'url-update', 'proxy-result-v2'
    ];
    if (validChannels.includes(channel)) {
      const subscription = (event, ...args) => func(...args);
      ipcRenderer.on(channel, subscription);
      return () => ipcRenderer.removeListener(channel, subscription);
    }
  },

  onNetworkSniff: (cb) => {
      const subscription = (event, data) => cb(data);
      ipcRenderer.on('network-sniff-data', subscription);
      return () => ipcRenderer.removeListener('network-sniff-data', subscription);
  },

  invoke: (channel, data) => {
    // LISTA COMPLETA DE PERMISOS
    const validChannels = [
        'get-profiles', 'save-profile', 'delete-profile', 
        'test-proxy-connection', 'api-login', 
        'api-register',      // <--- VITAL PARA REGISTRO
        'account-update',    // <--- VITAL PARA AJUSTES
        'get-host-info', 'get-app-path', 'mp-get-subid', 
        'get-public-ip', 'get-proxies', 'save-proxy-list', 
        'check-proxy-v2', 'translate-text',
        'admin-get-stats', 'admin-action'
    ];
    if (validChannels.includes(channel)) return ipcRenderer.invoke(channel, data);
    return Promise.reject(new Error(`Canal no permitido: ${channel}`));
  }
});