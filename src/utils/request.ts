import axios from 'axios';
import { useStore } from '../store';

interface RequestOptions {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

declare global {
  interface Window {
    api?: {
      makeRequest: (options: RequestOptions) => Promise<any>;
    };
  }
}

const isElectron = () => {
  return window?.api?.makeRequest !== undefined;
};

export async function makeRequest(options: RequestOptions) {
  const store = useStore.getState();
  const startTime = Date.now();

  try {
    // Get client IP only if enrichLogWithIP is enabled
    const getClientIP = async () => {
      if (!store.preferences.enrichLogWithIP) {
        return undefined;
      }

      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
      } catch (error) {
        console.error('Error getting IP:', error);
        return undefined;
      }
    };

    const clientIP = await getClientIP();
    const timestamp = new Date().toLocaleString();

    // Process URL and get domain for cookies
    let domain = '';
    try {
      const urlObj = new URL(options.url);
      domain = urlObj.hostname;
    } catch (error) {
      throw new Error('Invalid URL format');
    }

    // Get cookies for the domain
    let requestHeaders = { ...options.headers };
    const cookies = store.getCookiesForDomain(domain);
    if (cookies.length > 0) {
      const cookieString = cookies
        .filter(cookie => cookie.enabled)
        .map(cookie => `${cookie.name}=${cookie.value}`)
        .join('; ');
      if (cookieString) {
        requestHeaders['Cookie'] = cookieString;
      }
    }

    // Log request details
    const requestLog = {
      timestamp,
      method: options.method,
      url: options.url,
      headers: requestHeaders,
      body: options.body,
      ...(clientIP && { ip: clientIP })
    };

    console.log('Making request:', requestLog);
    store.addRequestLog(requestLog);

    let response;
    if (isElectron()) {
      try {
        response = await window.api!.makeRequest({
          ...options,
          headers: requestHeaders
        });
      } catch (error: any) {
        throw new Error(error.message || 'Electron request failed');
      }
    } else {
      try {
        const proxyUrl = `/proxy/${options.url.replace(/^https?:\/\//, '')}`;
        response = await axios({
          method: options.method,
          url: proxyUrl,
          headers: requestHeaders,
          data: options.method !== 'GET' ? options.body : undefined,
          validateStatus: () => true,
          timeout: 30000
        });
      } catch (error: any) {
        throw new Error(error.message || 'Web request failed');
      }
    }

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
        time: Date.now() - startTime,
        size: 0
      };
    }
    
    return {
      status: 0,
      statusText: error.message || 'Unknown error occurred',
      headers: {},
      data: {
        error: 'Request Error',
        message: error.message,
        code: error.code
      },
      time: Date.now() - startTime,
      size: 0
    };
  }
}