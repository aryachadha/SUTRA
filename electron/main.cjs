const { app, BrowserWindow, ipcMain, shell, Notification } = require('electron');
const path = require('path');
const { createApplicationMenu } = require('./menu.cjs');

let mainWindow = null;
let serverProcess = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function startBackendServer() {
  try {
    // Attempt to require and start backend if packaged or not running
    const { startServer } = require('../server/app.js');
    serverProcess = startServer(3001);
    console.log('[Electron] Embedded SUTRA API server started on port 3001');
  } catch (err) {
    console.error('[Electron] Failed to start embedded server:', err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 880,
    minWidth: 1080,
    minHeight: 700,
    title: 'SUTRA — Smart Urban Taskforce & Resource Alliance',
    backgroundColor: '#0f172a',
    titleBarStyle: 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  createApplicationMenu(mainWindow);

  // External link handler
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist-vite/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('app:version', () => app.getVersion());

ipcMain.on('app:notify', (_event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({
      title: title || 'SUTRA Alert',
      body: body || '',
      silent: false,
    }).show();
  }
});

app.whenReady().then(() => {
  startBackendServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess && serverProcess.close) {
    serverProcess.close();
  }
});
