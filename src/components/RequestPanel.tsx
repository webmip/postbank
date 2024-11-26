import React, { useState, useEffect } from 'react';
import { Send, Save, ChevronDown, Code } from 'lucide-react';
import { useStore } from '../store';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Headers from './request-sections/Headers';
import Params from './request-sections/Params';
import Body from './request-sections/Body';
import Auth from './request-sections/Auth';
import CookieManager from './request-sections/CookieManager';
import ResponsePanel from './ResponsePanel';
import SaveRequestDialog from './SaveRequestDialog';
import CodeGenerator from './CodeGenerator';
import { makeRequest } from '../utils/request';

const METHOD_STYLES = {
  GET: 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800',
  POST: 'text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800',
  PUT: 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800',
  DELETE: 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800',
  PATCH: 'text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800',
  HEAD: 'text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800',
  OPTIONS: 'text-pink-700 dark:text-pink-400 bg-pink-100 dark:bg-pink-900/30 border border-pink-200 dark:border-pink-800'
} as const;

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] as const;
type Method = typeof METHODS[number];

const DEFAULT_HEADERS = {
  'Accept': { value: 'application/json, text/plain, */*', enabled: true },
  'Accept-Encoding': { value: 'gzip, deflate, br', enabled: true },
  'Accept-Language': { value: 'en-US,en;q=0.9', enabled: true },
  'Cache-Control': { value: 'no-cache', enabled: true },
  'Connection': { value: 'keep-alive', enabled: true },
  'Content-Type': { value: 'application/json', enabled: true },
  'User-Agent': { value: 'API-Client/1.0', enabled: true }
};

export default function RequestPanel() {
  const { activeRequest, addToHistory, saveRequest, replaceVariables } = useStore();
  const [method, setMethod] = useState<Method>(activeRequest?.method || 'GET');
  const [url, setUrl] = useState(activeRequest?.url || '');
  const [headers, setHeaders] = useState<Record<string, { value: string; enabled: boolean }>>(
    activeRequest?.headers || DEFAULT_HEADERS
  );
  const [body, setBody] = useState(activeRequest?.body || '');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'auth' | 'cookies'>('params');
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isMethodOpen, setIsMethodOpen] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState('');

  useEffect(() => {
    if (activeRequest) {
      setMethod(activeRequest.method);
      setUrl(activeRequest.url);
      setHeaders({ ...DEFAULT_HEADERS, ...activeRequest.headers });
      setBody(activeRequest.body || '');
      setResponse(null);
    }
  }, [activeRequest]);

  useEffect(() => {
    if (replaceVariables && url) {
      const resolved = replaceVariables(url);
      setResolvedUrl(resolved);
    }
  }, [url, replaceVariables]);

  const handleSend = async () => {
    try {
      setLoading(true);
      
      const finalUrl = replaceVariables ? replaceVariables(url) : url;
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        throw new Error('Invalid URL: URL must start with http:// or https://');
      }

      // Ensure we're using all enabled headers, including defaults if not overridden
      const enabledHeaders = Object.entries({ ...DEFAULT_HEADERS, ...headers })
        .filter(([_, value]) => value.enabled)
        .reduce((acc, [key, value]) => ({
          ...acc,
          [key]: replaceVariables ? replaceVariables(value.value) : value.value
        }), {});

      const resolvedBody = method !== 'GET' ? (replaceVariables ? replaceVariables(body) : body) : undefined;

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
      headers: { ...DEFAULT_HEADERS, ...headers },
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
          <div className="relative">
            <div
              onClick={() => setIsMethodOpen(!isMethodOpen)}
              className={`cursor-pointer select-none appearance-none px-4 py-1.5 font-semibold rounded-full shadow-sm transition-all hover:shadow focus:outline-none focus:ring-2 focus:ring-primary/50 ${METHOD_STYLES[method]} flex items-center gap-2`}
            >
              {method}
              <ChevronDown size={14} className={`transition-transform ${isMethodOpen ? 'rotate-180' : ''}`} />
            </div>

            {isMethodOpen && (
              <div className="absolute z-10 mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                {METHODS.map((m) => (
                  <div
                    key={m}
                    className={`px-4 py-1.5 cursor-pointer font-semibold rounded-full my-1 mx-2 transition-all hover:shadow-sm ${METHOD_STYLES[m]}`}
                    onClick={() => {
                      setMethod(m);
                      setIsMethodOpen(false);
                    }}
                  >
                    {m}
                  </div>
                ))}
              </div>
            )}
          </div>

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

          <div className="h-7 w-px bg-gray-300 dark:bg-gray-600" />

          <CodeGenerator request={{ id: 'temp', method, url, headers, body, name: url }} />
        </div>

        <div className="flex mt-4 border-b border-gray-200 dark:border-gray-700">
          {(['params', 'headers', 'body', 'auth', 'cookies'] as const).map((tab) => (
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
              {activeTab === 'cookies' && (
                <CookieManager url={url} />
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