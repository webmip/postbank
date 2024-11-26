import React, { useState } from 'react';
import { Code, RefreshCw } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { generateCode, supportedLanguages } from '../utils/codeGenerator';
import { Request } from '../types';
import Editor from '@monaco-editor/react';

interface CodeGeneratorProps {
  request: Request;
}

export default function CodeGenerator({ request }: CodeGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(supportedLanguages[0]);
  const [code, setCode] = useState(() => generateCode(request, selectedLanguage as any));

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    setCode(generateCode(request, language as any));
  };

  const handleRefresh = () => {
    setCode(generateCode(request, selectedLanguage as any));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      alert('Code copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
        title="Generate Code"
      >
        <Code size={16} />
        Code
      </button>

      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Generate Code
            </Dialog.Title>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <select
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 dark:text-gray-300"
                >
                  {supportedLanguages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang.toUpperCase()}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleRefresh}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                  title="Refresh code with latest changes"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>

                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                >
                  Copy to Clipboard
                </button>
              </div>

              <div className="h-96 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                <Editor
                  height="100%"
                  language={selectedLanguage === 'curl' ? 'shell' : selectedLanguage}
                  value={code}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: 'on'
                  }}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Dialog.Close asChild>
                <button className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  Close
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}