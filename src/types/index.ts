import { create } from 'zustand';

export interface Request {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
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

export interface Cookie {
  name: string;
  value: string;
  domain: string;
  enabled: boolean;
}

export interface RequestLog {
  timestamp: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  ip?: string;
}

export interface UserPreferences {
  enrichLogWithIP: boolean;
}

export interface AppState {
  collections: Collection[];
  activeRequest: Request | null;
  history: RequestHistory[];
  savedRequests: SavedRequest[];
  environments: Environment[];
  activeEnvironment: Environment | null;
  cookies: Record<string, Cookie[]>;
  requestLogs: RequestLog[];
  preferences: UserPreferences;
  loadCollections: () => Promise<void>;
  saveCollection: (collection: Collection) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  importPostmanCollection: (json: string) => Promise<void>;
  setActiveRequest: (request: Request | null) => void;
  addToHistory: (request: Omit<Request, 'id'>, response: any) => Promise<void>;
  saveRequest: (name: string, request: Request) => Promise<void>;
  deleteSavedRequest: (id: string) => Promise<void>;
  clearAllData: () => Promise<void>;
  saveEnvironment: (environment: Environment) => Promise<void>;
  deleteEnvironment: (id: string) => Promise<void>;
  setActiveEnvironment: (environment: Environment | null) => void;
  replaceVariables: (text: string) => string;
  addCookie: (domain: string, cookie: Cookie) => void;
  removeCookie: (domain: string, name: string) => void;
  getCookiesForDomain: (domain: string) => Cookie[];
  addRequestLog: (log: RequestLog) => void;
  getRequestLogs: () => RequestLog[];
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  getPreferences: () => UserPreferences;
}