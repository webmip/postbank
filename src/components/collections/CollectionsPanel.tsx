import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2, Upload, Plus, Download } from 'lucide-react';
import { useStore } from '../../store';
import { Request } from '../../types';
import { exportToPostmanFormat } from '../../utils/collectionExporter';

interface CollectionsPanelProps {
  onCreateClick: () => void;
}

export default function CollectionsPanel({ onCreateClick }: CollectionsPanelProps) {
  const { collections, deleteCollection, setActiveRequest, importPostmanCollection } = useStore();
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

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

  const handleExport = async (collection: typeof collections[0], e: React.MouseEvent) => {
    e.stopPropagation();
    
    const postmanJson = exportToPostmanFormat(collection);
    const blob = new Blob([postmanJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${collection.name}.postman_collection.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  const handleSelectRequest = (request: Request) => {
    setActiveRequest({
      ...request,
      id: crypto.randomUUID()
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 space-y-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <button
            onClick={handleImport}
            disabled={isImporting}
            className="flex-1 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-md flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <Upload size={14} />
            Import
          </button>
          <button
            onClick={onCreateClick}
            className="flex-1 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md flex items-center justify-center gap-1.5 transition-colors text-sm"
          >
            <Plus size={14} />
            Create
          </button>
        </div>
        {importError && (
          <div className="text-sm text-red-500 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-md">
            {importError}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
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
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleExport(collection, e)}
                    className="p-1 text-gray-400 hover:text-primary transition-colors"
                    title="Export collection"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteCollection(collection.id, e)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete collection"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
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
                        inline-block px-3 py-1 rounded-full text-xs font-medium shadow-sm transition-all
                        ${request.method === 'GET' && 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800'}
                        ${request.method === 'POST' && 'text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'}
                        ${request.method === 'PUT' && 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800'}
                        ${request.method === 'DELETE' && 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800'}
                        ${request.method === 'PATCH' && 'text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800'}
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
    </div>
  );
}