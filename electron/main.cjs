const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    show: false
  });

  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    win.loadURL('http://localhost:5173');
    // win.webContents.openDevTools(); // Comentado para evitar que se abran las DevTools
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  win.once('ready-to-show', () => {
    win.show();
  });

  // Manejar errores de carga
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    if (isDev) {
      // Reintentar la carga en desarrollo
      setTimeout(() => {
        console.log('Retrying to connect to dev server...');
        win.loadURL('http://localhost:5173');
      }, 1000);
    }
  });
}

ipcMain.handle('make-request', async (_, options) => {
  try {
    console.log('Making request:', options);
    const startTime = Date.now();
    
    const response = await axios({
      method: options.method,
      url: options.url,
      headers: options.headers,
      data: options.method !== 'GET' ? options.body : undefined,
      validateStatus: () => true,
      timeout: 30000 // 30 segundos de timeout
    });

    const endTime = Date.now();
    
    return {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      time: endTime - startTime,
      size: JSON.stringify(response.data).length
    };
  } catch (error) {
    console.error('Request error in main process:', error);
    throw {
      status: error.response?.status || 0,
      statusText: error.message || 'Network Error',
      headers: error.response?.headers || {},
      data: error.response?.data || {
        error: 'Request Error',
        message: error.message,
        code: error.code
      },
      time: 0,
      size: 0
    };
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});