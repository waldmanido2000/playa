const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: () => ipcRenderer.invoke('dialog:openFiles'),
  convertMedia: (filePath) => ipcRenderer.invoke('media:convert', filePath),
  promptForName: () => ipcRenderer.invoke('prompt:name'),
  saveQueue: (name, data) => ipcRenderer.invoke('queue:save', name, data),
  getQueueNames: () => ipcRenderer.invoke('queue:list'),
  chooseQueue: (names) => ipcRenderer.invoke('queue:choose', names),
  loadQueue: (name) => ipcRenderer.invoke('queue:load', name)
});
