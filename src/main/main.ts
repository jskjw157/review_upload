import { app, BrowserWindow } from 'electron';
import path from 'node:path';

const isDev = process.env.NODE_ENV === 'development';
const devServerUrl = process.env.VITE_DEV_SERVER_URL;

let mainWindow: BrowserWindow | null = null;

async function loadRendererContent(window: BrowserWindow) {
  if (isDev && devServerUrl) {
    await window.loadURL(devServerUrl);
    window.webContents.openDevTools({ mode: 'detach' });
    return;
  }

  const indexHtml = path.join(__dirname, '..', 'dist', 'index.html');
  await window.loadFile(indexHtml);
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      contextIsolation: true,
    },
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  await loadRendererContent(mainWindow);
}

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
