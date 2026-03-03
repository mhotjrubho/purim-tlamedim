const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Add any specific desktop APIs here if needed
  // For now, the app communicates via the Express API
});
