import axios from 'axios';

interface RequestOptions {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

export async function makeRequest(options: RequestOptions) {
  const isElectron = !!(window as any).api;
  
  if (isElectron) {
    return (window as any).api.makeRequest(options);
  }

  // Web environment - use proxy
  try {
    const startTime = Date.now();
    const proxyUrl = `/proxy/${options.url}`;
    
    const response = await axios({
      method: options.method,
      url: proxyUrl,
      headers: options.headers,
      data: options.method !== 'GET' ? options.body : undefined,
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
  } catch (error: any) {
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
        message: error.message,
        code: error.code
      },
      time: 0,
      size: 0
    };
  }
}