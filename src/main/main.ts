import { app, BrowserWindow } from 'electron';
import path from 'node:path';

// Provided by @electron-forge/plugin-vite for dev/prod switching
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

let mainWindow: BrowserWindow | null = null;

async function loadRendererContent(window: BrowserWindow) {
  if (process.env.NODE_ENV === 'development' && MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    await window.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    window.webContents.openDevTools({ mode: 'detach' });
    return;
  }

  const indexHtml = path.join(
    __dirname,
    '..',
    'renderer',
    MAIN_WINDOW_VITE_NAME,
    'index.html'
  );
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
