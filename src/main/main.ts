import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { exchangeAuthCode, loadStoredTokens, refreshAccessToken } from './services/auth';
import { uploadBulkReviews, submitSingleReview } from './services/review';
import { AuthCodePayload, BulkUploadPayload, ReviewRequestPayload } from '../types/ipc';

const isDev = process.env.NODE_ENV === 'development';
const devServerUrl = process.env.VITE_DEV_SERVER_URL;
const preloadPath = isDev
  ? path.join(__dirname, 'preload.ts')
  : path.join(__dirname, 'preload.js');

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
      preload: preloadPath,
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

function registerIpcHandlers() {
  ipcMain.handle('auth:exchange', (_, payload: AuthCodePayload) =>
    exchangeAuthCode(payload.code, payload.config),
  );

  ipcMain.handle('auth:refresh', (_, config) => refreshAccessToken(config));
  ipcMain.handle('auth:load', () => loadStoredTokens());

  ipcMain.handle('review:submit', (_, payload: ReviewRequestPayload) =>
    submitSingleReview(payload.input, payload.config),
  );

  ipcMain.handle('review:bulk', (_, payload: BulkUploadPayload) =>
    uploadBulkReviews(payload.fileName, payload.fileBuffer, payload.config),
  );
}

app.whenReady().then(() => {
  registerIpcHandlers();
  void createWindow();
});

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
