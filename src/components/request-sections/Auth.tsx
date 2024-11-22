import React from 'react';

interface AuthProps {
  headers: Record<string, { value: string; enabled: boolean }>;
  onHeadersChange: (headers: Record<string, { value: string; enabled: boolean }>) => void;
}

type AuthType = 'none' | 'basic' | 'bearer' | 'api-key';

interface AuthState {
  type: AuthType;
  username?: string;
  password?: string;
  token?: string;
  apiKey?: string;
  apiValue?: string;
  apiKeyLocation?: 'header' | 'query';
}

export default function Auth({ headers, onHeadersChange }: AuthProps) {
  const [auth, setAuth] = React.useState<AuthState>(() => {
    if (headers['Authorization']?.value?.startsWith('Bearer ')) {
      return {
        type: 'bearer',
        token: headers['Authorization'].value.replace('Bearer ', '')
      };
    }
    if (headers['Authorization']?.value?.startsWith('Basic ')) {
      const decoded = atob(headers['Authorization'].value.replace('Basic ', ''));
      const [username, password] = decoded.split(':');
      return { type: 'basic', username, password };
    }
    return { type: 'none' };
  });

  const updateAuth = (newAuth: AuthState) => {
    setAuth(newAuth);
    const newHeaders = { ...headers };

    // Remove any existing auth headers
    delete newHeaders['Authorization'];
    delete newHeaders['X-API-Key'];

    if (newAuth.type === 'basic' && newAuth.username && newAuth.password) {
      const encoded = btoa(`${newAuth.username}:${newAuth.password}`);
      newHeaders['Authorization'] = {
        value: `Basic ${encoded}`,
        enabled: true
      };
    }
    else if (newAuth.type === 'bearer' && newAuth.token) {
      newHeaders['Authorization'] = {
        value: `Bearer ${newAuth.token}`,
        enabled: true
      };
    }
    else if (newAuth.type === 'api-key' && newAuth.apiKey && newAuth.apiValue) {
      if (newAuth.apiKeyLocation === 'header') {
        newHeaders[newAuth.apiKey] = {
          value: newAuth.apiValue,
          enabled: true
        };
      }
    }

    onHeadersChange(newHeaders);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Authorization</h3>
        <select
          value={auth.type}
          onChange={(e) => updateAuth({ type: e.target.value as AuthType })}
          className="px-2 py-1 text-sm border border-gray-200 rounded-md"
        >
          <option value="none">No Auth</option>
          <option value="basic">Basic Auth</option>
          <option value="bearer">Bearer Token</option>
          <option value="api-key">API Key</option>
        </select>
      </div>

      {auth.type === 'basic' && (
        <div className="space-y-2">
          <input
            type="text"
            value={auth.username || ''}
            onChange={(e) => updateAuth({ ...auth, username: e.target.value })}
            placeholder="Username"
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md"
          />
          <input
            type="password"
            value={auth.password || ''}
            onChange={(e) => updateAuth({ ...auth, password: e.target.value })}
            placeholder="Password"
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md"
          />
        </div>
      )}

      {auth.type === 'bearer' && (
        <input
          type="text"
          value={auth.token || ''}
          onChange={(e) => updateAuth({ ...auth, token: e.target.value })}
          placeholder="Bearer Token"
          className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md"
        />
      )}

      {auth.type === 'api-key' && (
        <div className="space-y-2">
          <input
            type="text"
            value={auth.apiKey || ''}
            onChange={(e) => updateAuth({ ...auth, apiKey: e.target.value })}
            placeholder="Key"
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md"
          />
          <input
            type="text"
            value={auth.apiValue || ''}
            onChange={(e) => updateAuth({ ...auth, apiValue: e.target.value })}
            placeholder="Value"
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md"
          />
          <select
            value={auth.apiKeyLocation || 'header'}
            onChange={(e) => updateAuth({ ...auth, apiKeyLocation: e.target.value as 'header' | 'query' })}
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md"
          >
            <option value="header">Header</option>
            <option value="query">Query Parameter</option>
          </select>
        </div>
      )}
    </div>
  );
}