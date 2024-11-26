const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  makeRequest: async (options) => {
    try {
      return await ipcRenderer.invoke('make-request', options);
    } catch (error) {
      console.error('makeRequest error in preload:', error);
      throw error;
    }
  }
});