import React from 'react';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <div className="h-8 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <span className="flex items-center gap-1">
        Made with <Heart size={12} className="fill-current text-red-500" /> by Cybersecurity
      </span>
    </div>
  );
}