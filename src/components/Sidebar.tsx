import React, { useState } from 'react';
import { History, FolderOpen, Bookmark } from 'lucide-react';
import { useStore } from '../store';
import CollectionsPanel from './collections/CollectionsPanel';
import HistoryPanel from './history/HistoryPanel';
import SavedRequestsPanel from './saved/SavedRequestsPanel';
import CreateCollectionDialog from './collections/CreateCollectionDialog';

type TabType = 'collections' | 'history' | 'saved';

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState<TabType>('collections');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-800">
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
            Collections
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
            History
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
      
      <div className="flex-1 overflow-hidden">
        {activeTab === 'collections' && (
          <CollectionsPanel 
            onCreateClick={() => setIsCreateDialogOpen(true)}
          />
        )}
        {activeTab === 'history' && <HistoryPanel />}
        {activeTab === 'saved' && <SavedRequestsPanel />}
      </div>

      <CreateCollectionDialog 
        isOpen={isCreateDialogOpen} 
        onClose={() => setIsCreateDialogOpen(false)} 
      />
    </div>
  );
}