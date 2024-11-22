import React, { useState } from 'react';
import { Upload, ChevronDown, ChevronRight, History, FolderOpen, Bookmark, Trash2 } from 'lucide-react';
import { useStore } from '../store';
import { formatDistanceToNow } from 'date-fns';
import { Request } from '../types';

export default function Sidebar() {
  const { 
    collections, 
    importPostmanCollection, 
    deleteCollection, 
    setActiveRequest, 
    history, 
    savedRequests, 
    deleteSavedRequest 
  } = useStore();
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'collections' | 'history' | 'saved'>('collections');
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());

  const handleImport = async () => {
    setImportError(null);
    setIsImporting(true);
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        setIsImporting(false);
        return;
      }

      try {
        if (!file.type && !file.name.endsWith('.json')) {
          throw new Error('Please select a JSON file');
        }

        const text = await file.text();
        await importPostmanCollection(text);
        setImportError(null);
      } catch (error) {
        setImportError(error instanceof Error ? error.message : 'Failed to import collection');
      } finally {
        setIsImporting(false);
      }
    };

    input.click();
  };

  const toggleCollection = (collectionId: string) => {
    setExpandedCollections(prev => {
      const next = new Set(prev);
      if (next.has(collectionId)) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
      }
      return next;
    });
  };

  const handleDeleteCollection = async (collectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this collection?')) {
      await deleteCollection(collectionId);
    }
  };

  const handleDeleteSavedRequest = async (requestId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this saved request?')) {
      await deleteSavedRequest(requestId);
    }
  };

  const handleSelectRequest = (request: Request) => {
    setActiveRequest({
      ...request,
      id: crypto.randomUUID() // Generar nuevo ID para evitar conflictos
    });
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-800">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={handleImport}
          disabled={isImporting}
          className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Upload size={16} />
          Import Collection
        </button>
        {importError && (
          <div className="mt-2 text-sm text-red-500 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-md">
            {importError}
          </div>
        )}
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'collections'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('collections')}
        >
          <div className="flex items-center gap-2">
            <FolderOpen size={16} />
            Colls
          </div>
        </button>
        <button
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('history')}
        >
          <div className="flex items-center gap-2">
            <History size={16} />
            Hist
          </div>
        </button>
        <button
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'saved'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('saved')}
        >
          <div className="flex items-center gap-2">
            <Bookmark size={16} />
            Saved
          </div>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'collections' && (
          <div className="p-2">
            {collections.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <p className="mb-2">No collections imported</p>
                <p className="text-sm">Import a Postman collection to get started</p>
              </div>
            ) : (
              collections.map((collection) => (
                <div key={collection.id} className="mb-2">
                  <div
                    onClick={() => toggleCollection(collection.id)}
                    className="group flex items-center gap-2 px-2 py-1.5 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded cursor-pointer"
                  >
                    {expandedCollections.has(collection.id) ? (
                      <ChevronDown size={16} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-400" />
                    )}
                    <span className="flex-1">{collection.name}</span>
                    <button
                      onClick={(e) => handleDeleteCollection(collection.id, e)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete collection"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {expandedCollections.has(collection.id) && (
                    <div className="ml-4">
                      {collection.requests.map((request) => (
                        <div
                          key={request.id}
                          onClick={() => handleSelectRequest(request)}
                          className="px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded flex items-center gap-2"
                        >
                          <span className={`
                            inline-block px-2 py-0.5 rounded text-xs font-medium
                            ${request.method === 'GET' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}
                            ${request.method === 'POST' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}
                            ${request.method === 'PUT' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}
                            ${request.method === 'DELETE' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}
                            ${request.method === 'PATCH' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}
                          `}>
                            {request.method}
                          </span>
                          <span className="truncate text-gray-700 dark:text-gray-300">{request.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-2">
            {history.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No request history
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectRequest({
                    ...item.request,
                    id: crypto.randomUUID(),
                    name: item.request.url
                  })}
                  className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer rounded"
                >
                  <div className="flex items-center gap-2">
                    <span className={`
                      px-2 py-0.5 rounded text-xs font-medium
                      ${item.response.status < 400 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}
                    `}>
                      {item.request.method} {item.response.status}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate">{item.request.url}</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {formatDistanceToNow(item.timestamp)} ago
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="p-2">
            {savedRequests.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <p className="mb-2">No saved requests</p>
                <p className="text-sm">Use the Save button to save your requests</p>
              </div>
            ) : (
              savedRequests.map((saved) => (
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
                          px-2 py-0.5 rounded text-xs font-medium
                          ${saved.request.method === 'GET' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}
                          ${saved.request.method === 'POST' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}
                          ${saved.request.method === 'PUT' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}
                          ${saved.request.method === 'DELETE' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}
                          ${saved.request.method === 'PATCH' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}
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
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}