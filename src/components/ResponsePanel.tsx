import React, { useState } from 'react';
import { Code, Layout, FileText } from 'lucide-react';
import Editor from '@monaco-editor/react';

interface ResponsePanelProps {
  response: any;
}

export default function ResponsePanel({ response }: ResponsePanelProps) {
  const [responseTab, setResponseTab] = useState<'raw' | 'render' | 'headers'>('raw');

  const isHtmlResponse = (data: any): boolean => {
    if (typeof data === 'string' && data.trim().startsWith('<!DOCTYPE html')) {
      return true;
    }
    const contentType = response?.headers?.['content-type'] || '';
    return contentType.includes('text/html');
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderHeaders = () => {
    if (!response?.headers) return null;
    return (
      <div className="p-4 space-y-2">
        {Object.entries(response.headers).map(([key, value]) => (
          <div key={key} className="flex border-b border-gray-200 dark:border-gray-700 pb-2">
            <div className="w-1/3 font-medium text-gray-600 dark:text-gray-400">{key}</div>
            <div className="w-2/3 text-gray-800 dark:text-gray-200 break-all">{value as string}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full p-4 overflow-auto">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-gray-700">Response</div>
        {response && (
          <div className="flex items-center gap-4">
            <div className={`text-sm font-medium ${
              response.status < 400 ? 'text-green-600' : 'text-red-600'
            }`}>
              Status: {response.status} {response.statusText}
            </div>
            <div className="text-sm text-gray-500">
              Time: {response.time}ms · Size: {formatSize(response.size)}
            </div>
            <div className="flex border rounded-md overflow-hidden">
              <button
                onClick={() => setResponseTab('raw')}
                className={`px-3 py-1 text-sm flex items-center gap-1 ${
                  responseTab === 'raw'
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Code size={14} />
                Raw
              </button>
              <button
                onClick={() => setResponseTab('render')}
                className={`px-3 py-1 text-sm flex items-center gap-1 ${
                  responseTab === 'render'
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Layout size={14} />
                Render
              </button>
              <button
                onClick={() => setResponseTab('headers')}
                className={`px-3 py-1 text-sm flex items-center gap-1 ${
                  responseTab === 'headers'
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <FileText size={14} />
                Headers
              </button>
            </div>
          </div>
        )}
      </div>
      {response && (
        responseTab === 'raw' ? (
          <Editor
            height="calc(100% - 32px)"
            defaultLanguage="json"
            value={typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2)}
            theme="light"
            options={{ readOnly: true, minimap: { enabled: false } }}
          />
        ) : responseTab === 'headers' ? (
          <div className="h-[calc(100%-32px)] overflow-auto bg-white dark:bg-gray-800 border rounded-md">
            {renderHeaders()}
          </div>
        ) : (
          <div className="h-[calc(100%-32px)] overflow-auto bg-white border rounded-md">
            {isHtmlResponse(response.data) ? (
              <iframe
                srcDoc={typeof response.data === 'string' ? response.data : ''}
                className="w-full h-full"
                sandbox="allow-same-origin"
                title="Response Preview"
              />
            ) : (
              <div className="p-4 text-sm text-gray-500">
                Content cannot be rendered. Switch to Raw view to see the response.
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}