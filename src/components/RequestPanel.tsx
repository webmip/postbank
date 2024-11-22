import React, { useState, useEffect } from 'react';
import { Send, Save } from 'lucide-react';
import { useStore } from '../store';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Headers from './request-sections/Headers';
import Params from './request-sections/Params';
import Body from './request-sections/Body';
import Auth from './request-sections/Auth';
import ResponsePanel from './ResponsePanel';
import SaveRequestDialog from './SaveRequestDialog';
import { makeRequest } from '../utils/request';

export default function RequestPanel() {
  const { activeRequest, addToHistory, saveRequest, replaceVariables, activeEnvironment } = useStore();
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>(activeRequest?.method || 'GET');
  const [url, setUrl] = useState(activeRequest?.url || '');
  const [headers, setHeaders] = useState<Record<string, { value: string; enabled: boolean }>>(
    activeRequest?.headers || {}
  );
  const [body, setBody] = useState(activeRequest?.body || '');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'auth'>('params');
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState('');

  // Actualizar todos los campos cuando cambia la petición activa
  useEffect(() => {
    if (activeRequest) {
      setMethod(activeRequest.method);
      setUrl(activeRequest.url);
      setHeaders(activeRequest.headers || {});
      setBody(activeRequest.body || '');
      setResponse(null); // Limpiar la respuesta anterior
    }
  }, [activeRequest]);

  // Actualizar la URL resuelta cuando cambian las variables o la URL
  useEffect(() => {
    const resolved = replaceVariables(url);
    setResolvedUrl(resolved);
  }, [url, activeEnvironment, replaceVariables]);

  const handleSend = async () => {
    try {
      setLoading(true);
      
      const finalUrl = replaceVariables(url);
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        throw new Error('Invalid URL: URL must start with http:// or https://');
      }

      const enabledHeaders = Object.entries(headers)
        .filter(([_, value]) => value.enabled)
        .reduce((acc, [key, value]) => ({
          ...acc,
          [key]: replaceVariables(value.value)
        }), {});

      const resolvedBody = method !== 'GET' ? replaceVariables(body) : undefined;

      const result = await makeRequest({
        method,
        url: finalUrl,
        headers: enabledHeaders,
        body: resolvedBody
      });

      setResponse(result);
      
      await addToHistory(
        { method, url, headers, body, name: url },
        result
      );
    } catch (error: any) {
      console.error('Request error:', error);
      setResponse({
        status: 0,
        statusText: error.message || 'Error',
        data: error,
        time: 0,
        size: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (name: string) => {
    const request = {
      id: crypto.randomUUID(),
      method,
      url,
      headers,
      body,
      name,
    };
    await saveRequest(name, request);
    setIsSaveDialogOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as typeof method)}
            className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 dark:text-gray-300"
          >
            {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <div className="flex-1 relative">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter request URL (use {{VARIABLE}} for environment variables)"
              className="w-full px-4 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 dark:text-gray-300"
            />
            {resolvedUrl !== url && (
              <div className="absolute left-0 right-0 -bottom-6 text-xs text-gray-500 dark:text-gray-400 truncate">
                Will request: {resolvedUrl}
              </div>
            )}
          </div>
          <button
            onClick={handleSend}
            disabled={loading || !url.trim()}
            className="flex items-center gap-2 px-4 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
            Send
          </button>
          <button
            onClick={() => setIsSaveDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
          >
            <Save size={16} />
            Save
          </button>
        </div>

        <div className="flex mt-4 border-b border-gray-200 dark:border-gray-700">
          {(['params', 'headers', 'body', 'auth'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="vertical">
          <Panel defaultSize={50} minSize={20}>
            <div className="h-full p-4 overflow-auto">
              {activeTab === 'params' && (
                <Params url={url} onChange={setUrl} />
              )}
              {activeTab === 'headers' && (
                <Headers headers={headers} onChange={setHeaders} />
              )}
              {activeTab === 'body' && (
                <Body body={body} onChange={setBody} />
              )}
              {activeTab === 'auth' && (
                <Auth headers={headers} onHeadersChange={setHeaders} />
              )}
            </div>
          </Panel>

          <PanelResizeHandle className="h-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" />

          <Panel defaultSize={50} minSize={20}>
            <ResponsePanel response={response} />
          </Panel>
        </PanelGroup>
      </div>

      <SaveRequestDialog
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}