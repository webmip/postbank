import { Collection, Request } from '../types';
import schema from '../schemas/collection-schema.json';

interface PostmanRequest {
  name: string;
  request: {
    method: string;
    header: Array<{ key: string; value: string; type: string }>;
    url: {
      raw: string;
      protocol: string;
      host: string[];
      path: string[];
      query?: Array<{ key: string; value: string }>;
    };
    body?: {
      mode: string;
      raw?: string;
    };
  };
}

interface PostmanCollection {
  info: {
    _postman_id: string;
    name: string;
    schema: string;
  };
  item: PostmanRequest[];
}

export function validatePostmanCollection(collection: any): boolean {
  if (!collection?.info?.name || !Array.isArray(collection.item)) {
    return false;
  }

  // Basic schema validation
  try {
    // Validate required fields
    if (!collection.info.name || !Array.isArray(collection.item)) {
      return false;
    }

    // Validate items
    for (const item of collection.item) {
      if (!item.name || !item.request) {
        return false;
      }

      const request = item.request;
      if (!request.method || !request.url) {
        return false;
      }

      // Validate method
      const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
      if (!validMethods.includes(request.method)) {
        return false;
      }

      // Validate URL
      if (typeof request.url === 'object' && !request.url.raw) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Schema validation error:', error);
    return false;
  }
}

export function processPostmanItems(items: any[]): Request[] {
  const requests: Request[] = [];
  
  const processItem = (item: any) => {
    if (item.request) {
      requests.push(processPostmanRequest(item));
    }
    if (Array.isArray(item.item)) {
      item.item.forEach(processItem);
    }
  };
  
  items.forEach(processItem);
  return requests;
}

function processPostmanRequest(item: any): Request {
  const request = item.request;
  return {
    id: crypto.randomUUID(),
    name: item.name,
    method: request.method as Request['method'],
    url: request.url.raw || request.url,
    headers: (request.header || []).reduce((acc: any, h: any) => ({
      ...acc,
      [h.key]: { value: h.value, enabled: true },
    }), {}),
    body: request.body?.raw || '',
  };
}

export function exportToPostmanFormat(collection: Collection): string {
  const postmanCollection: PostmanCollection = {
    info: {
      _postman_id: collection.id,
      name: collection.name,
      schema: schema.$id
    },
    item: collection.requests.map(request => ({
      name: request.name,
      request: {
        method: request.method,
        header: Object.entries(request.headers)
          .filter(([_, value]) => value.enabled)
          .map(([key, value]) => ({
            key,
            value: value.value,
            type: 'text'
          })),
        url: parseUrl(request.url),
        ...(request.body ? {
          body: {
            mode: 'raw',
            raw: request.body
          }
        } : {})
      }
    }))
  };

  return JSON.stringify(postmanCollection, null, 2);
}

function parseUrl(url: string) {
  try {
    const parsed = new URL(url);
    return {
      raw: url,
      protocol: parsed.protocol.replace(':', ''),
      host: parsed.hostname.split('.'),
      path: parsed.pathname.split('/').filter(Boolean),
      query: Array.from(parsed.searchParams.entries()).map(([key, value]) => ({
        key,
        value
      }))
    };
  } catch (e) {
    // Fallback for invalid URLs
    return {
      raw: url,
      protocol: 'http',
      host: ['example.com'],
      path: url.split('/').filter(Boolean)
    };
  }
}