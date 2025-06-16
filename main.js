const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');
}

const QUEUE_DIR = path.join(__dirname, 'queues');
if (!fs.existsSync(QUEUE_DIR)) fs.mkdirSync(QUEUE_DIR);

ipcMain.handle('dialog:openFiles', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Media', extensions: ['mp3', 'wav', 'ogg', 'mp4', 'mkv', 'flac', 'webm'] }]
  });
  return result.filePaths;
});

ipcMain.handle('media:convert', async (event, filePath) => {
  return filePath;
});

ipcMain.handle('prompt:name', async () => {
  return null; // stub
});

ipcMain.handle('queue:save', async (event, name, queue) => {
  const filePath = path.join(QUEUE_DIR, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(queue, null, 2));
  return true;
});

ipcMain.handle('queue:list', async () => {
  const files = fs.readdirSync(QUEUE_DIR);
  return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
});

ipcMain.handle('queue:choose', async (event, names) => {
  const { response } = await dialog.showMessageBox({
    type: 'question',
    buttons: names,
    title: 'Load Queue',
    message: 'Choose a queue to load'
  });
  return names[response];
});

ipcMain.handle('queue:load', async (event, name) => {
  const filePath = path.join(QUEUE_DIR, `${name}.json`);
  if (!fs.existsSync(filePath)) throw new Error('File not found');
  return JSON.parse(fs.readFileSync(filePath));
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
