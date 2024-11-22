import React from 'react';

interface ParamsProps {
  url: string;
  onChange: (url: string) => void;
}

interface QueryParam {
  key: string;
  value: string;
  enabled: boolean;
}

export default function Params({ url, onChange }: ParamsProps) {
  const [params, setParams] = React.useState<QueryParam[]>(() => {
    const urlObj = new URL(url.startsWith('http') ? url : `http://example.com${url}`);
    return Array.from(urlObj.searchParams.entries()).map(([key, value]) => ({
      key,
      value,
      enabled: true,
    }));
  });

  const updateUrl = (newParams: QueryParam[]) => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `http://example.com${url}`);
      urlObj.search = '';
      
      newParams
        .filter(p => p.enabled && p.key)
        .forEach(p => urlObj.searchParams.append(p.key, p.value));
      
      const newUrl = url.startsWith('http') 
        ? urlObj.toString()
        : `${urlObj.pathname}${urlObj.search}`;
      
      onChange(newUrl);
    } catch (error) {
      console.error('Invalid URL:', error);
    }
  };

  const addNewParam = () => {
    setParams(prev => {
      const newParams = [...prev, { key: '', value: '', enabled: true }];
      updateUrl(newParams);
      return newParams;
    });
  };

  const removeParam = (index: number) => {
    setParams(prev => {
      const newParams = prev.filter((_, i) => i !== index);
      updateUrl(newParams);
      return newParams;
    });
  };

  const updateParam = (index: number, field: keyof QueryParam, value: string | boolean) => {
    setParams(prev => {
      const newParams = prev.map((p, i) => 
        i === index ? { ...p, [field]: value } : p
      );
      updateUrl(newParams);
      return newParams;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">Query Parameters</h3>
        <button
          onClick={addNewParam}
          className="px-2 py-1 text-sm text-blue-600 hover:text-blue-700"
        >
          + Add parameter
        </button>
      </div>

      <div className="grid grid-cols-[auto,1fr,1fr,auto] gap-2">
        <div className="px-2 py-1 text-sm font-medium text-gray-600">Enable</div>
        <div className="px-2 py-1 text-sm font-medium text-gray-600">Key</div>
        <div className="px-2 py-1 text-sm font-medium text-gray-600">Value</div>
        <div className="w-8"></div>

        {params.map((param, index) => (
          <React.Fragment key={index}>
            <div className="px-2 py-1">
              <input
                type="checkbox"
                checked={param.enabled}
                onChange={(e) => updateParam(index, 'enabled', e.target.checked)}
                className="rounded border-gray-300"
              />
            </div>
            <input
              type="text"
              value={param.key}
              onChange={(e) => updateParam(index, 'key', e.target.value)}
              placeholder="Parameter name"
              className="px-2 py-1 border border-gray-200 rounded-md text-sm"
            />
            <input
              type="text"
              value={param.value}
              onChange={(e) => updateParam(index, 'value', e.target.value)}
              placeholder="Parameter value"
              className="px-2 py-1 border border-gray-200 rounded-md text-sm"
            />
            <button
              onClick={() => removeParam(index)}
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