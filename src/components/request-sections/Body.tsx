import React from 'react';
import Editor from '@monaco-editor/react';

interface BodyProps {
  body: string;
  onChange: (body: string) => void;
}

export default function Body({ body, onChange }: BodyProps) {
  const [bodyType, setBodyType] = React.useState<'none' | 'json' | 'text'>('json');

  return (
    <div className="space-y-4 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Request Body</h3>
        <select
          value={bodyType}
          onChange={(e) => setBodyType(e.target.value as 'none' | 'json' | 'text')}
          className="px-2 py-1 text-sm border border-gray-200 rounded-md"
        >
          <option value="none">None</option>
          <option value="json">JSON</option>
          <option value="text">Text</option>
        </select>
      </div>

      {bodyType !== 'none' && (
        <div className="h-[calc(100%-2.5rem)]">
          <Editor
            height="100%"
            defaultLanguage={bodyType === 'json' ? 'json' : 'plaintext'}
            value={body}
            onChange={(value) => onChange(value || '')}
            theme="light"
            options={{ 
              minimap: { enabled: false },
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on'
            }}
          />
        </div>
      )}
    </div>
  );
}