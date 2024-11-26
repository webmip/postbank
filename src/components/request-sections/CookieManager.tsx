import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useStore } from '../../store';
import { Cookie } from '../../types';

interface CookieManagerProps {
  url: string;
}

export default function CookieManager({ url }: CookieManagerProps) {
  const { getCookiesForDomain, addCookie, removeCookie } = useStore();
  const [newCookie, setNewCookie] = useState<Omit<Cookie, 'domain'>>({ 
    name: '', 
    value: '', 
    enabled: true 
  });
  const [currentDomain, setCurrentDomain] = useState<string>('');

  useEffect(() => {
    try {
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        const urlObj = new URL(url);
        setCurrentDomain(urlObj.hostname);
      }
    } catch (error) {
      console.error('Error parsing URL:', error);
    }
  }, [url]);

  const cookies = getCookiesForDomain(currentDomain);

  const handleAddCookie = () => {
    if (newCookie.name && newCookie.value && currentDomain) {
      addCookie(currentDomain, {
        ...newCookie,
        domain: currentDomain
      });
      setNewCookie({ name: '', value: '', enabled: true });
    }
  };

  const handleRemoveCookie = (name: string) => {
    if (currentDomain) {
      removeCookie(currentDomain, name);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Cookies</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Domain: {currentDomain || 'Enter a valid URL to manage cookies'}
          </p>
        </div>
        <button
          onClick={handleAddCookie}
          disabled={!newCookie.name || !newCookie.value || !currentDomain}
          className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Plus size={14} />
          Add Cookie
        </button>
      </div>

      <div className="grid grid-cols-[1fr,1fr,auto] gap-2">
        <input
          type="text"
          value={newCookie.name}
          onChange={(e) => setNewCookie({ ...newCookie, name: e.target.value })}
          placeholder="Cookie name"
          className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
        />
        <input
          type="text"
          value={newCookie.value}
          onChange={(e) => setNewCookie({ ...newCookie, value: e.target.value })}
          placeholder="Cookie value"
          className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
        />
        <div className="w-8"></div>
      </div>

      <div className="space-y-2">
        {cookies.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No cookies found for this domain
          </div>
        ) : (
          cookies.map((cookie, index) => (
            <div key={`${cookie.domain}-${cookie.name}-${index}`} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
              <input
                type="checkbox"
                checked={cookie.enabled}
                onChange={() => {
                  addCookie(currentDomain, {
                    ...cookie,
                    enabled: !cookie.enabled
                  });
                }}
                className="ml-2"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {cookie.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{cookie.value}</div>
              </div>
              <button
                onClick={() => handleRemoveCookie(cookie.name)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                title="Remove cookie"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}