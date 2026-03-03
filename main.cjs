const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { startBackend } = require('./backend.cjs');
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
    title: "מערכת גביית פורים",
    icon: path.join(__dirname, 'public/icon.ico') // Optional
  });

  win.loadURL('http://localhost:3000');
}

app.whenReady().then(() => {
  const isDev = process.env.NODE_ENV === 'development';
  const dbPath = isDev 
    ? path.join(__dirname, 'purim_collection.db')
    : path.join(app.getPath('userData'), 'purim_collection.db');

  startBackend(3000, dbPath);
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
