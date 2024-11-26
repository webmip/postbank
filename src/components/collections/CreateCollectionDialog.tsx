import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useStore } from '../../store';
import { Collection, Request } from '../../types';

interface CreateCollectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateCollectionDialog({ isOpen, onClose }: CreateCollectionDialogProps) {
  const { history, saveCollection } = useStore();
  const [name, setName] = useState('');
  const [selectedRequests, setSelectedRequests] = useState<Set<number>>(new Set());

  const handleToggleRequest = (id: number) => {
    setSelectedRequests(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCreate = async () => {
    if (!name.trim()) return;

    const requests: Request[] = Array.from(selectedRequests)
      .map(id => {
        const historyItem = history.find(h => h.id === id);
        if (!historyItem) return null;
        return {
          id: crypto.randomUUID(),
          method: historyItem.request.method,
          url: historyItem.request.url,
          headers: historyItem.request.headers,
          body: historyItem.request.body,
          name: historyItem.request.url
        };
      })
      .filter((r): r is Request => r !== null);

    const collection: Collection = {
      id: crypto.randomUUID(),
      name: name.trim(),
      requests
    };

    await saveCollection(collection);
    setName('');
    setSelectedRequests(new Set());
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl">
          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Create Collection
          </Dialog.Title>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Collection Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 dark:text-gray-300"
                placeholder="Enter collection name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Requests from History
              </label>
              <div className="border border-gray-200 dark:border-gray-700 rounded-md max-h-96 overflow-y-auto">
                {history.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    No requests in history
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {history.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedRequests.has(item.id!)}
                          onChange={() => handleToggleRequest(item.id!)}
                          className="rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`
                              px-2 py-0.5 rounded-full text-xs font-medium
                              ${item.request.method === 'GET' && 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30'}
                              ${item.request.method === 'POST' && 'text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30'}
                              ${item.request.method === 'PUT' && 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30'}
                              ${item.request.method === 'DELETE' && 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30'}
                              ${item.request.method === 'PATCH' && 'text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30'}
                            `}>
                              {item.request.method}
                            </span>
                            <span className="text-sm text-gray-900 dark:text-gray-100">{item.request.url}</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Status: {item.response.status} · Size: {(item.response.size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <button className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                Cancel
              </button>
            </Dialog.Close>
            <button
              onClick={handleCreate}
              disabled={!name.trim() || selectedRequests.size === 0}
              className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Collection
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}