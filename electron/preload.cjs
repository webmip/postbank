const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script executing');

contextBridge.exposeInMainWorld('api', {
  makeRequest: async (options) => {
    console.log('makeRequest called in preload:', options);
    try {
      const result = await ipcRenderer.invoke('make-request', options);
      console.log('makeRequest result:', result);
      return result;
    } catch (error) {
      console.error('makeRequest error in preload:', error);
      throw error;
    }
  }
});