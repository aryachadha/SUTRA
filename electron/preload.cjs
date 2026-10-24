const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('sutraDesktop', {
  isElectron: true,
  platform: process.platform,
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  openExternal: (url) => {
    // Basic safety validation: only http and https protocols
    if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
      shell.openExternal(url);
    }
  },
  showNotification: (title, body) => ipcRenderer.send('app:notify', { title, body })
});
