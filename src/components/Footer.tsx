import React, { useState } from 'react';
import { Heart, Terminal } from 'lucide-react';
import { useStore } from '../store';
import { APP_PROPS } from '../config/props';

type RequestLogDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

function RequestLogDialog({ isOpen, onClose }: RequestLogDialogProps) {
  const { requestLogs } = useStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Requests Log</h2>
        
        <div className="space-y-4">
          {requestLogs.map((log, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {log.timestamp}
                </span>
                {log.ip && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    IP: {log.ip}
                  </span>
                )}
              </div>
              <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify({
                  method: log.method,
                  url: log.url,
                  headers: log.headers,
                  body: log.body
                }, null, 2)}
              </pre>
            </div>
          ))}

          {requestLogs.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-4">
              No requests logged yet
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function Footer() {
  const [isLogOpen, setIsLogOpen] = useState(false);

  return (
    <div className="h-8 flex items-center justify-between px-4 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <div className="flex items-center gap-1">
        <button
          onClick={() => setIsLogOpen(true)}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <Terminal size={14} />
          Request Log
        </button>
      </div>

      <div className="flex items-center gap-1">
        Made with <Heart size={12} className="fill-current text-red-500" /> by {APP_PROPS.author}
      </div>

      <div className="text-gray-400">
        v{APP_PROPS.version}
      </div>

      <RequestLogDialog isOpen={isLogOpen} onClose={() => setIsLogOpen(false)} />
    </div>
  );
}