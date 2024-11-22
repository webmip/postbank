import React, { useState } from 'react';
import { Terminal, Settings } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Dialog from '@radix-ui/react-dialog';
import { useStore } from '../store';
import EnvironmentManager from './EnvironmentManager';

export default function Header() {
  const { isDark, toggleTheme } = useTheme();
  const { clearAllData, environments, activeEnvironment, setActiveEnvironment } = useStore();
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isEnvironmentOpen, setIsEnvironmentOpen] = useState(false);

  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to delete all data? This action cannot be undone.')) {
      await clearAllData();
      setIsPreferencesOpen(false);
    }
  };

  return (
    <header className="bg-gray-900 text-white px-4 py-2 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-2">
        <Terminal size={24} className="text-primary" />
        <span className="text-lg font-semibold">POSTBANK</span>
      </div>

      <div className="flex items-center gap-4">
        <select
          value={activeEnvironment?.id || ''}
          onChange={(e) => {
            const env = environments.find(env => env.id === e.target.value);
            setActiveEnvironment(env || null);
          }}
          className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">No Environment</option>
          {environments.map(env => (
            <option key={env.id} value={env.id}>{env.name}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Theme</span>
          <button
            onClick={toggleTheme}
            className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <span className="sr-only">Toggle theme</span>
            <span
              className={`${
                isDark ? 'translate-x-6 bg-primary' : 'translate-x-1 bg-white'
              } inline-block h-4 w-4 transform rounded-full transition-transform`}
            />
          </button>
        </div>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="p-1 hover:bg-gray-800 rounded-md transition-colors">
              <Settings size={20} className="text-gray-400 hover:text-gray-300" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[220px] bg-white dark:bg-gray-800 rounded-md shadow-lg p-1 z-50"
              sideOffset={5}
            >
              <DropdownMenu.Item
                className="text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-md cursor-pointer outline-none"
                onSelect={() => setIsEnvironmentOpen(true)}
              >
                Environment Variables
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-md cursor-pointer outline-none"
                onSelect={() => setIsPreferencesOpen(true)}
              >
                Preferences
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <Dialog.Root open={isPreferencesOpen} onOpenChange={setIsPreferencesOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Preferences
              </Dialog.Title>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">About</h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>Version: 1.0.0</p>
                    <p>© 2024 POSTBANK. All rights reserved.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Data Management</h3>
                  <button
                    onClick={handleClearData}
                    className="w-full px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors text-left"
                  >
                    Clear All Data
                  </button>
                </div>
              </div>

              <Dialog.Close asChild>
                <button
                  className="mt-6 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                  Close
                </button>
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <EnvironmentManager isOpen={isEnvironmentOpen} onClose={() => setIsEnvironmentOpen(false)} />
      </div>
    </header>
  );
}