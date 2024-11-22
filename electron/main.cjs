const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: path.join(__dirname, '../build/icon.png')
  });

  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
};

ipcMain.handle('make-request', async (_, { method, url, headers, body }) => {
  try {
    const startTime = Date.now();
    
    const response = await axios({
      method: method.toLowerCase(),
      url,
      headers,
      data: method !== 'GET' ? body : undefined,
      validateStatus: () => true
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
    console.error('Request error:', error);
    
    if (error.response) {
      return {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data,
        time: 0,
        size: 0
      };
    }
    
    return {
      status: 0,
      statusText: error.message || 'Network Error',
      headers: {},
      data: {
        error: 'Request Error',
        message: error.message
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