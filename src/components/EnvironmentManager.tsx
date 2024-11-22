import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Plus, Trash2 } from 'lucide-react';
import { useStore } from '../store';
import { Environment, Variable } from '../types';

interface EnvironmentManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EnvironmentManager({ isOpen, onClose }: EnvironmentManagerProps) {
  const { environments, activeEnvironment, saveEnvironment, deleteEnvironment, setActiveEnvironment } = useStore();
  const [selectedEnv, setSelectedEnv] = useState<Environment | null>(null);
  const [newEnvName, setNewEnvName] = useState('');
  const [variables, setVariables] = useState<Variable[]>([]);

  const handleSelectEnvironment = (env: Environment) => {
    setSelectedEnv(env);
    setVariables([...env.variables]);
  };

  const handleAddVariable = () => {
    setVariables([...variables, { key: '', value: '', enabled: true }]);
  };

  const handleRemoveVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const handleUpdateVariable = (index: number, field: keyof Variable, value: string | boolean) => {
    const newVariables = [...variables];
    newVariables[index] = { ...newVariables[index], [field]: value };
    setVariables(newVariables);
  };

  const handleSave = async () => {
    if (selectedEnv) {
      const updatedEnv: Environment = {
        ...selectedEnv,
        variables: variables.filter(v => v.key && v.value),
      };
      await saveEnvironment(updatedEnv);
      if (activeEnvironment?.id === updatedEnv.id) {
        setActiveEnvironment(updatedEnv);
      }
    } else if (newEnvName) {
      const newEnv: Environment = {
        id: crypto.randomUUID(),
        name: newEnvName,
        variables: variables.filter(v => v.key && v.value),
      };
      await saveEnvironment(newEnv);
      setNewEnvName('');
    }
    setSelectedEnv(null);
    setVariables([]);
  };

  const handleDelete = async () => {
    if (selectedEnv && window.confirm('Are you sure you want to delete this environment?')) {
      await deleteEnvironment(selectedEnv.id);
      setSelectedEnv(null);
      setVariables([]);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Environment Variables
          </Dialog.Title>

          <div className="flex gap-6 flex-1 min-h-0">
            {/* Environments List */}
            <div className="w-64 border-r border-gray-200 dark:border-gray-700 pr-4 overflow-y-auto">
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="New Environment Name"
                  value={newEnvName}
                  onChange={(e) => setNewEnvName(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                />
                {environments.map((env) => (
                  <div
                    key={env.id}
                    onClick={() => handleSelectEnvironment(env)}
                    className={`px-3 py-2 rounded-md cursor-pointer text-sm ${
                      selectedEnv?.id === env.id
                        ? 'bg-primary text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {env.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Variables Editor */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <button
                    onClick={handleAddVariable}
                    className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add Variable
                  </button>
                  {selectedEnv && (
                    <button
                      onClick={handleDelete}
                      className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 rounded-md transition-colors flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Delete Environment
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-[auto,1fr,1fr,auto] gap-2">
                  <div className="px-2 py-1 text-sm font-medium text-gray-600 dark:text-gray-400">Enable</div>
                  <div className="px-2 py-1 text-sm font-medium text-gray-600 dark:text-gray-400">Key</div>
                  <div className="px-2 py-1 text-sm font-medium text-gray-600 dark:text-gray-400">Value</div>
                  <div className="w-8"></div>

                  {variables.map((variable, index) => (
                    <React.Fragment key={index}>
                      <div className="px-2 py-1">
                        <input
                          type="checkbox"
                          checked={variable.enabled}
                          onChange={(e) => handleUpdateVariable(index, 'enabled', e.target.checked)}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                      </div>
                      <input
                        type="text"
                        value={variable.key}
                        onChange={(e) => handleUpdateVariable(index, 'key', e.target.value)}
                        placeholder="Variable name"
                        className="px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-md text-sm dark:bg-gray-700 dark:text-white"
                      />
                      <input
                        type="text"
                        value={variable.value}
                        onChange={(e) => handleUpdateVariable(index, 'value', e.target.value)}
                        placeholder="Variable value"
                        className="px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-md text-sm dark:bg-gray-700 dark:text-white"
                      />
                      <button
                        onClick={() => handleRemoveVariable(index)}
                        className="px-2 text-gray-400 hover:text-red-500"
                      >
                        ×
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Dialog.Close asChild>
              <button className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                Cancel
              </button>
            </Dialog.Close>
            <button
              onClick={handleSave}
              disabled={(!selectedEnv && !newEnvName) || variables.length === 0}
              className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}