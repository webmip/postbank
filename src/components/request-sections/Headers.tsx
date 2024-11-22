import React from 'react';

const DEFAULT_HEADERS = [
  { key: 'Accept', value: 'application/json, text/plain, */*', enabled: true },
  { key: 'Accept-Encoding', value: 'gzip, deflate, br', enabled: true },
  { key: 'Accept-Language', value: 'en-US,en;q=0.9', enabled: true },
  { key: 'Cache-Control', value: 'no-cache', enabled: true },
  { key: 'Connection', value: 'keep-alive', enabled: true },
  { key: 'Content-Type', value: 'application/json', enabled: true },
  { key: 'Host', value: '', enabled: false },
  { key: 'Origin', value: '', enabled: false },
  { key: 'Referer', value: '', enabled: false },
  { key: 'User-Agent', value: 'API-Client/1.0', enabled: true },
];

interface HeadersProps {
  headers: Record<string, { value: string; enabled: boolean }>;
  onChange: (headers: Record<string, { value: string; enabled: boolean }>) => void;
}

export default function Headers({ headers, onChange }: HeadersProps) {
  const [headersList, setHeadersList] = React.useState(() => {
    const existingHeaders = Object.entries(headers).map(([key, value]) => ({
      key,
      value: typeof value === 'string' ? value : value.value,
      enabled: typeof value === 'string' ? true : value.enabled,
    }));

    const defaultHeaders = DEFAULT_HEADERS.filter(
      header => !headers[header.key]
    );

    return [...existingHeaders, ...defaultHeaders];
  });

  const updateHeaders = (newHeaders: typeof headersList) => {
    setHeadersList(newHeaders);
    const headersObject = newHeaders.reduce((acc, header) => ({
      ...acc,
      [header.key]: { value: header.value, enabled: header.enabled }
    }), {});
    onChange(headersObject);
  };

  const addNewHeader = () => {
    updateHeaders([
      ...headersList,
      { key: '', value: '', enabled: true }
    ]);
  };

  const removeHeader = (index: number) => {
    const newHeaders = [...headersList];
    newHeaders.splice(index, 1);
    updateHeaders(newHeaders);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">Headers</h3>
        <button
          onClick={addNewHeader}
          className="px-2 py-1 text-sm text-blue-600 hover:text-blue-700"
        >
          + Add header
        </button>
      </div>

      <div className="grid grid-cols-[auto,1fr,1fr,auto] gap-2">
        <div className="px-2 py-1 text-sm font-medium text-gray-600">Enable</div>
        <div className="px-2 py-1 text-sm font-medium text-gray-600">Key</div>
        <div className="px-2 py-1 text-sm font-medium text-gray-600">Value</div>
        <div className="w-8"></div>

        {headersList.map((header, index) => (
          <React.Fragment key={index}>
            <div className="px-2 py-1">
              <input
                type="checkbox"
                checked={header.enabled}
                onChange={(e) => {
                  const newHeaders = [...headersList];
                  newHeaders[index].enabled = e.target.checked;
                  updateHeaders(newHeaders);
                }}
                className="rounded border-gray-300"
              />
            </div>
            <input
              type="text"
              value={header.key}
              onChange={(e) => {
                const newHeaders = [...headersList];
                newHeaders[index].key = e.target.value;
                updateHeaders(newHeaders);
              }}
              placeholder="Header name"
              className="px-2 py-1 border border-gray-200 rounded-md text-sm"
            />
            <input
              type="text"
              value={header.value}
              onChange={(e) => {
                const newHeaders = [...headersList];
                newHeaders[index].value = e.target.value;
                updateHeaders(newHeaders);
              }}
              placeholder="Header value"
              className="px-2 py-1 border border-gray-200 rounded-md text-sm"
            />
            <button
              onClick={() => removeHeader(index)}
              className="px-2 text-gray-400 hover:text-red-500"
            >
              ×
            </button>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}