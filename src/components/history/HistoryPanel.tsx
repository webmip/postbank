import React, { useState, useMemo } from 'react';
import { useStore } from '../../store';
import { formatDistanceToNow } from 'date-fns';
import { Search, Filter } from 'lucide-react';
import { RequestHistory } from '../../types';

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Success', value: 'success' },
  { label: 'Error', value: 'error' }
] as const;

const METHOD_FILTERS = ['ALL', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;

export default function HistoryPanel() {
  const { history, setActiveRequest } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_FILTERS[number]['value']>('all');
  const [methodFilter, setMethodFilter] = useState<typeof METHOD_FILTERS[number]>('ALL');

  const filteredHistory = useMemo(() => {
    return history.filter((item: RequestHistory) => {
      // Search filter
      const searchLower = search.toLowerCase();
      const matchesSearch = !search || 
        item.request.url.toLowerCase().includes(searchLower) ||
        item.request.method.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'success' && item.response.status < 400) ||
        (statusFilter === 'error' && item.response.status >= 400);

      // Method filter
      const matchesMethod = methodFilter === 'ALL' || item.request.method === methodFilter;

      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [history, search, statusFilter, methodFilter]);

  const handleSelectRequest = (request: any) => {
    setActiveRequest({
      ...request,
      id: crypto.randomUUID(),
      name: request.url
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Filters Section */}
      <div className="p-4 space-y-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        {/* Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search requests..."
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 dark:text-gray-300"
          />
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-3">
          <Filter size={16} className="text-gray-400" />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 dark:text-gray-300"
          >
            {STATUS_FILTERS.map(filter => (
              <option key={filter.value} value={filter.value}>
                Status: {filter.label}
              </option>
            ))}
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value as typeof methodFilter)}
            className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 dark:text-gray-300"
          >
            {METHOD_FILTERS.map(method => (
              <option key={method} value={method}>
                Method: {method}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            No request history
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            No matching requests found
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectRequest(item.request)}
                className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-2">
                  <span className={`
                    px-3 py-1 text-xs font-medium rounded-full shadow-sm transition-all
                    ${item.request.method === 'GET' && 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800'}
                    ${item.request.method === 'POST' && 'text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'}
                    ${item.request.method === 'PUT' && 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800'}
                    ${item.request.method === 'DELETE' && 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800'}
                    ${item.request.method === 'PATCH' && 'text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800'}
                  `}>
                    {item.request.method}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    item.response.status < 400 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {item.response.status}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                    {item.request.url}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {formatDistanceToNow(item.timestamp)} ago
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}