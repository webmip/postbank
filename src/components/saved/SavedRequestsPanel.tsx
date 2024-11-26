import React from 'react';
import { Trash2 } from 'lucide-react';
import { useStore } from '../../store';

export default function SavedRequestsPanel() {
  const { savedRequests, deleteSavedRequest, setActiveRequest } = useStore();

  const handleDeleteSavedRequest = async (requestId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this saved request?')) {
      await deleteSavedRequest(requestId);
    }
  };

  const handleSelectRequest = (request: any) => {
    setActiveRequest(request);
  };

  if (savedRequests.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <p className="mb-2">No saved requests</p>
        <p className="text-sm">Use the Save button to save your requests</p>
      </div>
    );
  }

  return (
    <div className="p-2">
      {savedRequests.map((saved) => (
        <div
          key={saved.id}
          className="group px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded"
        >
          <div className="flex items-center justify-between">
            <div
              className="flex-1 cursor-pointer"
              onClick={() => handleSelectRequest(saved.request)}
            >
              <div className="flex items-center gap-2">
                <span className={`
                  px-3 py-1 rounded-full text-xs font-medium shadow-sm transition-all
                  ${saved.request.method === 'GET' && 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800'}
                  ${saved.request.method === 'POST' && 'text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'}
                  ${saved.request.method === 'PUT' && 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800'}
                  ${saved.request.method === 'DELETE' && 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800'}
                  ${saved.request.method === 'PATCH' && 'text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800'}
                `}>
                  {saved.request.method}
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{saved.name}</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate">
                {saved.request.url}
              </div>
            </div>
            <button
              onClick={(e) => handleDeleteSavedRequest(saved.id, e)}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              title="Delete saved request"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}