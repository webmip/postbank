export interface Request {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers: Record<string, { value: string; enabled: boolean }>;
  body?: string;
  name: string;
  auth?: {
    type: 'none' | 'basic' | 'bearer' | 'api-key';
    username?: string;
    password?: string;
    token?: string;
    apiKey?: string;
    apiValue?: string;
    apiKeyLocation?: 'header' | 'query';
  };
}

export interface Collection {
  id: string;
  name: string;
  requests: Request[];
}

export interface Response {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  time: number;
  size: number;
}

export interface RequestHistory {
  id?: number;
  timestamp: number;
  request: Omit<Request, 'id'>;
  response: Response;
}

export interface SavedRequest {
  id: string;
  name: string;
  request: Request;
  createdAt: number;
}

export interface Variable {
  key: string;
  value: string;
  enabled: boolean;
}

export interface Environment {
  id: string;
  name: string;
  variables: Variable[];
}